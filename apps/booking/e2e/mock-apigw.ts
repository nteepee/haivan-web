/**
 * Mock apigw + CMS + WordPress layout cho E2E (không phụ thuộc gì ngoài node:*).
 *
 * Chạy độc lập: `node e2e/mock-apigw.ts` (Playwright khởi động nó trước khi build Next, vì build
 * prerender trang tuyến bằng CMS). Dữ liệu lấy từ test/fixtures/*.json (bản ghi thật đã che thông tin cá nhân),
 * phần phụ thuộc thời gian (hạn giữ chỗ, giờ tạo đơn, hạn OTP) tính lại theo đồng hồ thật.
 *
 * Mọi request được ghi lại (method, path, query, body) để spec đối chiếu với đặc tả; request tới đường dẫn
 * chưa có handler trả 404 và bị đánh dấu `handled: false` để spec fail thay vì lặng lẽ qua.
 * Điều khiển: GET /__e2e/health · GET /__e2e/requests · POST /__e2e/reset
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APP_DIR = fileURLToPath(new URL("../", import.meta.url));
// Fixture JSON thật có hình dạng tự do; mock chỉ vá vài trường nên không mô hình hoá kiểu.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const readJson = (rel: string): Json => JSON.parse(readFileSync(`${APP_DIR}${rel}`, "utf8"));

const F = {
  places: readJson("test/fixtures/places.json"),
  trips: readJson("test/fixtures/trips.json"),
  seats: readJson("test/fixtures/seats.json"),
  booking: readJson("test/fixtures/booking.json"),
  cancel: readJson("test/fixtures/cancel.json"),
  reasons: readJson("test/fixtures/cancel_reasons.json"),
  payments: readJson("test/fixtures/info_payments.json"),
  myBookings: readJson("test/fixtures/my_bookings.json"),
  popularRoutes: readJson("src/content/popular-routes.json") as Json[],
  layout: readJson("src/content/layout-fallback.json"),
  bookingConfig: readJson("src/content/booking-config-fallback.json"),
  wpRoute: readJson("test/fixtures/wp-route.json"),
};

// Các hằng này trùng với e2e/mock-client.ts (spec không import file này vì import sẽ mở cổng).
const E2E_TOKEN_PREFIX = "e2e-token-";
const E2E_CAPTCHA_TOKEN = "e2e-captcha-token";
const E2E_OTP = "123456";
/** Host giả (TLD .invalid không bao giờ phân giải được); spec chặn điều hướng tới đây và chỉ kiểm URL. */
const FAKE_PAYMENT_HOST = "pay.vnpay.e2e.invalid";

/** Chương trình khứ hồi mẫu theo contract booking-config (mã giả: không có mã thật nào chạm hệ thống vé). */
const E2E_ROUNDTRIP_PROMO = {
  id: 1,
  type: "roundtrip",
  corridor: "hn-moc",
  direction: "ba",
  book_from: "2026-01-01",
  book_to: null,
  travel_from: null,
  travel_to: null,
  weekdays: null,
  hours: null,
  book_ahead_minutes: null,
  seats: { min: 1, max: 9 },
  per_seat_vnd: 20000,
  tiers: [],
  has_code: true,
  label: { vi: "Giảm 20k/ghế chiều về", en: "20k off per return seat" },
  badge: { vi: "Khứ hồi -20k", en: "Return -20k" },
};

/** Mã thật của chương trình mẫu (chỉ nằm ở route riêng) và bí mật dùng chung giữa Next và mock WP trong E2E. */
export const E2E_PROMO_REAL_CODE = "E2EKHUHOI";
const E2E_WP_SECRET = "e2e-wp-shared-secret";

export interface RecordedRequest {
  seq: number;
  method: string;
  path: string;
  /** Query thô, không gồm dấu "?". */
  rawQuery: string;
  query: Record<string, string>;
  headers: { authorization?: string; domain?: string; contentType?: string };
  body: unknown;
  rawBody: string;
  status: number;
  handled: boolean;
}

// ---------- trạng thái (reset giữa các test) ----------

interface Ticket {
  id: number;
  code: string;
  name: string;
  price: number;
  cancelled: boolean;
}
interface Order {
  code: string;
  merchantCode: string;
  tripId: number;
  status: 1 | 3;
  createdAt: number;
  customer: { name: string; phone: string; email: string | null };
  tickets: Ticket[];
  pickUp: unknown;
  dropOff: unknown;
}
interface Hold {
  merchantCode: string;
  tripId: number;
  seats: Array<{ id: number; name: string; price: number }>;
  ticketCodes: Map<number, string>;
}

let requests: RecordedRequest[] = [];
let preflights = 0;
let seq = 0;
let counter = 0;
let tokens = 0;
let orders = new Map<string, Order>();
let holds = new Map<string, Hold>();

/** Đơn có sẵn cho account.spec: chưa thanh toán, 1 vé còn huỷ được. */
function seedOrders(): Map<string, Order> {
  const seeded = new Map<string, Order>();
  seeded.set("B02E2EACCT0001", {
    code: "B02E2EACCT0001",
    merchantCode: "02",
    tripId: 41750508,
    status: 1,
    createdAt: Date.now(),
    customer: { name: "Khach Test", phone: "0900000000", email: null },
    tickets: [{ id: 505900001, code: "V02E2EACCT00001", name: "5", price: 240000, cancelled: false }],
    pickUp: { address: "Chợ Bến Thành", id: 0, coordinates: { lat: 10.7725, lng: 106.698 } },
    dropOff: { address: "Vũng Tàu", id: 0, coordinates: { lat: 10.3503681, lng: 107.0714489 } },
  });
  return seeded;
}

function reset() {
  requests = [];
  preflights = 0;
  seq = 0;
  counter = 0;
  tokens = 0;
  orders = seedOrders();
  holds = new Map();
}
reset();

// ---------- tiện ích ----------

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
/** Giờ Việt Nam (UTC+7) → các phần "DD-MM-YYYY HH:mm:ss" như backend. */
function vnParts(ms: number) {
  const d = new Date(ms + 7 * 3600_000);
  return { y: d.getUTCFullYear(), mo: pad(d.getUTCMonth() + 1), d: pad(d.getUTCDate()), h: pad(d.getUTCHours()), mi: pad(d.getUTCMinutes()), s: pad(d.getUTCSeconds()) };
}
const dmyHms = (ms: number) => {
  const p = vnParts(ms);
  return `${p.d}-${p.mo}-${p.y} ${p.h}:${p.mi}:${p.s}`;
};
const dmyHm = (ms: number) => dmyHms(ms).slice(0, 16);
const ymdHms = (ms: number) => {
  const p = vnParts(ms);
  return `${p.y}-${p.mo}-${p.d} ${p.h}:${p.mi}:${p.s}`;
};

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Ảnh 1x1 trong suốt cho ảnh xe / ô bản đồ / banner (không để trình duyệt ra ngoài lấy ảnh). */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

class HttpError extends Error {
  readonly status: number;
  readonly payload: unknown;
  constructor(status: number, payload: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

// ---------- dựng phản hồi từ fixture ----------

function bookingDetail(order: Order) {
  const body = clone(F.booking);
  const data = body.data;
  const template = clone(data.tickets[0]);
  const live = order.tickets.filter((t) => !t.cancelled);
  const price = live.reduce((sum, t) => sum + t.price, 0);
  data.id = 4760000 + Number(order.code.slice(-4).replace(/\D/g, "") || 1);
  data.code = order.code;
  data.status = order.status === 3 ? { type: 3, type_name: "Xử lý xong" } : { type: 1, type_name: "Chưa xếp chỗ" };
  data.price = price;
  data.merchant_code = order.merchantCode;
  data.created_at = dmyHm(order.createdAt);
  data.customer = { ...data.customer, name: order.customer.name, phone: order.customer.phone, email: order.customer.email };
  data.tickets = order.tickets.map((t, i) => {
    const ticket = clone(template);
    ticket.id = t.id;
    ticket.code = t.code;
    ticket.name = t.name;
    ticket.number = i + 1;
    ticket.price = t.cancelled ? 0 : t.price;
    ticket.trip.id = order.tripId;
    ticket.pick_up = order.pickUp;
    ticket.drop_off = order.dropOff;
    ticket.customer = { name: order.customer.name, phone: order.customer.phone, email: order.customer.email };
    ticket.status = t.cancelled ? { type: 5, type_name: "Huỷ" } : { type: 2, type_name: "Cập nhật" };
    return ticket;
  });
  return body;
}

function bookingRow(order: Order) {
  const row = clone(F.myBookings.data[0]);
  const info = row.booking.booking_info;
  const ticketTemplate = clone(row.booking.booking_ticket[0]);
  const cancelled = order.status === 3;
  info.code = order.code;
  info.status = cancelled ? 3 : 1;
  info.status_text = cancelled ? "Hủy" : "Chưa xếp chỗ";
  info.created_at = ymdHms(order.createdAt);
  info.total_money = cancelled ? 0 : order.tickets.reduce((s, t) => s + (t.cancelled ? 0 : t.price), 0);
  info.num_ticket = order.tickets.length;
  info.status_payment = 0;
  info.is_cancel = true;
  info.custmer_phone = order.customer.phone;
  info.custmer_name = order.customer.name;
  row.merchant = { ...row.merchant, id: "3", code: order.merchantCode, name: "Hải Vân Vũng Tàu" };
  row.booking.booking_ticket = order.tickets.map((t) => ({
    ...clone(ticketTemplate),
    code: t.code,
    trip_id: order.tripId,
    is_cancel: !t.cancelled,
    status: t.cancelled ? 5 : 1,
    status_text: t.cancelled ? "Huy" : "Chưa xếp chỗ",
    route: { id: 1, code: "VTA-TSN", name: "Vũng Tàu - Tân Sơn Nhất" },
  }));
  return row;
}

const customerBody = () => ({
  data: {
    id: 827708,
    name: "Khach Test",
    phone: "0900000000",
    email: null,
    address: null,
    date_of_birth: null,
    title: null,
    province: null,
    district: null,
    occupation: null,
    travel_purpose: null,
    subscribe_loyalty: 0,
    data_source: 0,
    invoice_info: null,
    account: { balance: 0, given: 0, transactions: [] },
    rank: { rank: 0, rank_code: "Thành viên", period_transaction: 0 },
  },
});

function tripsBody() {
  const body = clone(F.trips);
  body.meta = { current_page: 1, from: 1, last_page: 1, per_page: 10, to: body.data.length, total: body.data.length };
  body.data.forEach((trip: Json, i: number) => {
    // Ảnh xe thật nằm ở *.haivan.com; E2E chỉ được lấy ảnh từ mock.
    trip.car_imgs = (trip.car_imgs as string[]).map((_, n) => `${origin()}/img/car-${i}-${n}.png`);
  });
  return body;
}

function journeyBody() {
  const [first] = F.trips.data;
  const from = first.from;
  const to = first.to;
  return {
    journey: [
      { address: from.place_name, location: { lat: from.location[1], lng: from.location[0] }, place_id: from.place_id, place_name: from.place_name, place_time: "12:45" },
      { address: "Trạm giữa đường", location: { lat: 10.55, lng: 106.9 }, place_id: 9999, place_name: "Trạm giữa đường", place_time: "14:00" },
      { address: to.place_name, location: { lat: to.location[1], lng: to.location[0] }, place_id: to.place_id, place_name: to.place_name, place_time: "15:25" },
    ],
  };
}

function routeListing(route: string) {
  const entry = F.popularRoutes.find((r) => r.slug === route);
  // CMS thật trả 200 với [] cho slug không có tuyến (không phải 404).
  if (!entry) return [];
  const loc = (s: string) => {
    const [lat, lng] = s.split(",").map(Number);
    return { lat, lng };
  };
  const [startName, endName] = String(entry.name).split(" - ");
  return {
    status: "OK",
    data: {
      slug: entry.slug,
      start_place: { name: startName, slug: String(entry.slug).split("/")[0], ...loc(entry.start_location) },
      end_place: { name: endName, slug: String(entry.slug).split("/")[1], ...loc(entry.end_location) },
      wayroad: {
        name: entry.name,
        price_avg: entry.price_avg,
        run_time: entry.run_time,
        distance: entry.distance,
        img_path: null,
        meta_title: entry.meta_title,
        meta_desc: entry.meta_desc,
      },
    },
    questions_wayroad: [{ question: "Giá vé bao nhiêu?", answer: "Dữ liệu mock E2E." }],
  };
}

// ---------- định tuyến ----------

interface Ctx {
  method: string;
  path: string; // sau /api/
  query: URLSearchParams;
  body: unknown;
  authorized: boolean;
}
type Handler = (ctx: Ctx) => unknown;

const needAuth = (ctx: Ctx) => {
  if (!ctx.authorized) throw new HttpError(401, { message: "Unauthenticated." });
};
const authed = (fn: Handler): Handler => (ctx) => {
  needAuth(ctx);
  return fn(ctx);
};
const bodyRecord = (ctx: Ctx): Record<string, unknown> => {
  if (!isRecord(ctx.body)) throw new HttpError(400, { message: "Dữ liệu gửi lên không hợp lệ" });
  return ctx.body;
};
const nextCode = (prefix: string) => `${prefix}${pad(++counter, 6)}`;

function holdBooking(ctx: Ctx) {
  needAuth(ctx);
  const body = bodyRecord(ctx);
  const seats = Array.isArray(body.seats) ? (body.seats as Array<Record<string, unknown>>) : [];
  if (typeof body.trip_id !== "number" || typeof body.merchant_code !== "string" || seats.length === 0 || !seats.every((s) => typeof s.id === "number" && typeof s.price === "number")) {
    throw new HttpError(400, { message: "Dữ liệu giữ chỗ không hợp lệ" });
  }
  const orderCode = nextCode("B02E2E");
  const ticketCodes = new Map<number, string>();
  for (const s of seats) ticketCodes.set(s.id as number, nextCode("V02E2E"));
  holds.set(orderCode, {
    merchantCode: body.merchant_code,
    tripId: body.trip_id,
    seats: seats.map((s) => ({ id: s.id as number, name: String(s.name), price: s.price as number })),
    ticketCodes,
  });
  return {
    message: "Giữ chỗ thành công!",
    expire_time: dmyHms(Date.now() + 10 * 60_000),
    order_code: orderCode,
    tickets: seats.map((s) => ({ id: s.id, code: ticketCodes.get(s.id as number) })),
  };
}

function createBooking(ctx: Ctx) {
  needAuth(ctx);
  const body = bodyRecord(ctx);
  const hold = typeof body.order_code === "string" ? holds.get(body.order_code) : undefined;
  if (!hold || !Array.isArray(body.seats)) throw new HttpError(400, { message: "Đơn giữ chỗ không tồn tại hoặc đã hết hạn" });
  const customer = isRecord(body.if_customer) ? body.if_customer : {};
  const order: Order = {
    code: body.order_code as string,
    merchantCode: hold.merchantCode,
    tripId: hold.tripId,
    status: 1,
    createdAt: Date.now(),
    customer: { name: String(customer.name ?? "Khach Test"), phone: String(customer.phone ?? "0900000000"), email: typeof customer.email === "string" ? customer.email : null },
    tickets: (body.seats as Array<{ id: number }>).map((s) => {
      const seat = hold.seats.find((h) => h.id === s.id);
      if (!seat) throw new HttpError(400, { message: "Ghế không thuộc đơn giữ chỗ" });
      return { id: s.id, code: hold.ticketCodes.get(s.id) as string, name: seat.name, price: seat.price, cancelled: false };
    }),
    pickUp: body.pick_up,
    dropOff: body.drop_off,
  };
  orders.set(order.code, order);
  return bookingDetail(order);
}

function orderOf(code: string): Order {
  const order = orders.get(code);
  if (!order) throw new HttpError(404, { message: "Không tìm thấy đơn hàng" });
  return order;
}

function cancelSeat(ctx: Ctx) {
  needAuth(ctx);
  const body = bodyRecord(ctx);
  const order = orderOf(String(body.order_code));
  const ticket = order.tickets.find((t) => t.code === body.seat_code);
  if (!ticket) throw new HttpError(400, { message: "Không tìm thấy vé" });
  ticket.cancelled = true;
  if (order.tickets.every((t) => t.cancelled)) order.status = 3;
  const detail = bookingDetail(order);
  detail.data.status = order.status === 3 ? { type: 3, type_name: "Xử lý xong" } : detail.data.status;
  return detail;
}

function listBookings(ctx: Ctx) {
  needAuth(ctx);
  const tab = ctx.query.get("booking-status[0]");
  const all = [...orders.values()];
  let rows: unknown[] = [];
  if (tab === "1") rows = all.filter((o) => o.status === 1).map(bookingRow);
  else if (tab === "3") rows = [...all.filter((o) => o.status === 3).map(bookingRow), ...clone(F.myBookings.data).slice(0, 2)];
  return { data: rows, links: {}, meta: { current_page: 1, from: 1, last_page: 1, per_page: 10, to: rows.length, total: rows.length } };
}

/** URL cổng giả; `return` lặp lại return_url backend nhận được để spec đối chiếu. */
const fakePaymentUrl = (provider: string, order: string, returnUrl = "") =>
  `https://${FAKE_PAYMENT_HOST}/${provider}/pay?order=${encodeURIComponent(order)}&amount=240000&return=${encodeURIComponent(returnUrl)}`;

const API: Array<[string, RegExp, Handler]> = [
  // --- công khai ---
  ["GET", /^places$/, () => F.places],
  ["GET", /^el\/trips$/, () => tripsBody()],
  ["GET", /^trips\/\d+$/, () => clone(F.seats)],
  ["GET", /^el\/trip_detail$/, () => journeyBody()],
  ["GET", /^maps\/places$/, () => ({ data: [] })],
  [
    "GET",
    /^get-otp$/,
    ({ query }) => {
      const phone = query.get("phone") ?? "";
      if (!phone || query.get("captcha") !== E2E_CAPTCHA_TOKEN) throw new HttpError(400, { message: "Vui lòng xác nhận reCAPTCHA" });
      if (phone === "0900000404") throw new HttpError(404, { message: "Số điện thoại chưa đăng ký" });
      return { phone, email: null, expire_time: dmyHms(Date.now() + 5 * 60_000), install_app: 0, is_new: 0 };
    },
  ],
  [
    "POST",
    /^verify-otp$/,
    ({ body }) => {
      const input = isRecord(body) ? body : {};
      if (input.otp !== E2E_OTP) throw new HttpError(400, { message: "Mã OTP bạn nhập vào chưa đúng" });
      return { code: 200, status: "success", access_token: `${E2E_TOKEN_PREFIX}${++tokens}`, token_type: "Bearer", expires_in: 46656000000 };
    },
  ],
  // --- cần đăng nhập ---
  ["GET", /^customer\/customers$/, authed(() => customerBody())],
  ["GET", /^customer\/definition$/, authed(() => ({ titles: [], jobs: [], travel_purposes: [], provinces: [], districts: [], rank_evaluators: [] }))],
  ["GET", /^v4\/definition$/, authed(() => ({ data: { car_company: [], vehicle_type: [] } }))],
  ["POST", /^hold-booking$/, holdBooking],
  [
    "GET",
    /^v4\/get-bonus-service$/,
    authed(() => [
      { dvbs_id: 1, dvbs_code: "TCDON", dvbs_name: "Trung chuyển đón", dvbs_description: "Đón tận nhà" },
      { dvbs_id: 2, dvbs_code: "TCTRA", dvbs_name: "Trung chuyển trả", dvbs_description: "Trả tận nhà" },
    ]),
  ],
  [
    "POST",
    /^v4\/get-price-transit$/,
    authed((ctx) => {
      const services = isRecord(ctx.body) && Array.isArray(ctx.body.services) ? (ctx.body.services as Array<Record<string, unknown>>) : [];
      const seats = isRecord(ctx.body) && Array.isArray(ctx.body.seats) ? (ctx.body.seats as Array<Record<string, unknown>>) : [];
      return services.map((s) => ({
        dvbs_id: s.dvbs_id,
        dvbs_code: s.dvbs_code,
        dvbs_name: s.dvbs_name,
        dvbs_description: s.dvbs_description ?? "",
        dvbs_check_discount: 0,
        dvbs_text_discount: null,
        dvbs_tickets: seats.map((seat) => ({ id: seat.id, code: seat.code, price: 0 })),
      }));
    }),
  ],
  ["GET", /^(promotion|v4)\/get-promotions$/, authed(() => ({ data: [] }))],
  ["POST", /^promotion\/check-promotions$/, authed(() => ({ data: [] }))],
  ["GET", /^price-ticket$/, authed(() => ({ data: [] }))],
  ["POST", /^bookings$/, createBooking],
  ["GET", /^bookings$/, listBookings],
  ["GET", /^bookings\/([A-Za-z0-9]+)$/, authed((ctx) => bookingDetail(orderOf(ctx.path.split("/")[1])))],
  ["POST", /^v4\/hold-transit$/, authed((ctx) => ({ data: { ord_id: 1, ord_ma: String(bodyRecord(ctx).order_code), ord_phone: "0900000000", ord_ten_khach_hang: "Khach Test", transit: [] } }))],
  ["GET", /^info-payments$/, authed(() => clone(F.payments))],
  ["GET", /^info-payment-block$/, authed(() => ({ data: [], status: false }))],
  [
    "GET",
    /^payment\/vnpay$/,
    authed((ctx) => ({ url: fakePaymentUrl("vnpay", ctx.query.get("order_code") ?? "", ctx.query.get("return_url") ?? "") })),
  ],
  ["GET", /^payment\/payos$/, authed((ctx) => ({ data: { checkoutUrl: fakePaymentUrl("payos", ctx.query.get("order_code") ?? "") } }))],
  ["POST", /^update-booking\/([A-Za-z0-9]+)$/, authed((ctx) => bookingDetail(orderOf(ctx.path.split("/")[1])))],
  ["GET", /^list-reason$/, authed(() => clone(F.reasons))],
  ["POST", /^cancel-seat$/, cancelSeat],
  // --- CMS (không Authorization) ---
  ["GET", /^route-listing$/, ({ query }) => routeListing(query.get("route") ?? "")],
  ["GET", /^list-banner$/, () => ({ status: "OK", data: [{ id: 1, title: "E2E banner", img_path: "/img/banner.png", url: "/xe-khach" }] })],
];

function origin(): string {
  return `http://127.0.0.1:${port}`;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Authorization, Content-Type, Domain, X-HV-Req",
  "Access-Control-Max-Age": "600",
};

function send(res: ServerResponse, status: number, payload: unknown, type = "application/json") {
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload));
  res.writeHead(status, { ...CORS, "Content-Type": type, "Content-Length": buf.length, "Cache-Control": "no-store" });
  res.end(buf);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", origin());
  const method = req.method ?? "GET";

  if (method === "OPTIONS") {
    preflights++;
    return send(res, 204, "", "text/plain");
  }
  if (url.pathname.startsWith("/__e2e/")) {
    if (url.pathname === "/__e2e/health") return send(res, 200, { ok: true });
    if (url.pathname === "/__e2e/requests") return send(res, 200, { requests, preflights });
    if (url.pathname === "/__e2e/reset" && method === "POST") return reset(), send(res, 200, { ok: true });
    return send(res, 404, { message: "unknown control endpoint" });
  }

  const rawBody = await readBody(req);
  let body: unknown = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    body = rawBody;
  }
  const record: RecordedRequest = {
    seq: ++seq,
    method,
    path: url.pathname,
    rawQuery: url.search.slice(1),
    query: Object.fromEntries(url.searchParams),
    headers: { authorization: req.headers.authorization, domain: req.headers.domain as string | undefined, contentType: req.headers["content-type"] },
    body,
    rawBody,
    status: 0,
    handled: false,
  };
  requests.push(record);
  const finish = (status: number, payload: unknown, type?: string) => {
    record.status = status;
    send(res, status, payload, type);
  };

  try {
    // Tài sản tĩnh: ảnh xe, banner, ảnh thẻ tuyến CMS (/userfiles, /images), ô bản đồ.
    if (method === "GET" && (url.pathname.startsWith("/img/") || url.pathname.startsWith("/tiles/") || url.pathname.startsWith("/userfiles/") || url.pathname.startsWith("/images/"))) {
      record.handled = true;
      return finish(200, PNG, "image/png");
    }
    if (method === "GET" && url.pathname === "/wp-json/haivan-web/v1/layout") {
      record.handled = true;
      // Hotline khác bản dự phòng trong repo để spec chứng minh layout đến từ "WordPress" (mock).
      return finish(200, { ...clone(F.layout), hotline: "1900 E2E0" });
    }
    // Cấu hình tuyến chính + chương trình giảm giá của WP: bản seed kèm một chương trình khứ hồi mẫu (Hà Nội – Mộc Châu, chiều về giảm 20k).
    if (method === "GET" && url.pathname === "/wp-json/haivan-web/v1/booking-config") {
      record.handled = true;
      const config = clone(F.bookingConfig);
      // Hà Nội – Mộc Châu có trang tuyến hai chiều (CMS mock không biết các tuyến này; bài WP có ở mock bên dưới).
      const moc = config.corridors.find((c: Json) => c.id === "hn-moc");
      if (moc) moc.landing = { ab: "my-dinh/moc-chau", ba: "moc-chau/my-dinh" };
      return finish(200, { ...config, promos: [E2E_ROUNDTRIP_PROMO] });
    }
    // Route RIÊNG mã khuyến mãi (cần X-HV-Secret): mã thật chỉ Next (server) đọc được; không bao giờ có trong booking-config công khai.
    if (method === "GET" && url.pathname === "/wp-json/haivan-web/v1/promo-codes") {
      record.handled = true;
      return req.headers["x-hv-secret"] === E2E_WP_SECRET ? finish(200, { codes: { [String(E2E_ROUNDTRIP_PROMO.id)]: E2E_PROMO_REAL_CODE } }) : finish(403, { code: "forbidden" });
    }
    // Nội dung landing tuyến của WP: chỉ tuyến trong fixture có bài, tuyến khác 404 (Next dùng CMS + mẫu).
    const wpRoute = url.pathname.match(/^\/wp-json\/haivan-web\/v1\/route\/([^/]+\/[^/]+)$/);
    if (method === "GET" && wpRoute) {
      record.handled = true;
      if (wpRoute[1] === "my-dinh/moc-chau" || wpRoute[1] === "moc-chau/my-dinh") {
        const ab = wpRoute[1] === "my-dinh/moc-chau";
        return finish(200, {
          ...clone(F.wpRoute),
          path: wpRoute[1],
          seo_title: ab ? "Xe đi Mộc Châu từ Hà Nội (Mỹ Đình) E2E" : "Xe Mộc Châu về Hà Nội (Mỹ Đình) E2E",
          h1: ab ? "Đặt vé xe Hà Nội đi Mộc Châu" : "Đặt vé xe Mộc Châu về Hà Nội",
          reverse_route: null,
        });
      }
      return wpRoute[1] === F.wpRoute.path ? finish(200, clone(F.wpRoute)) : finish(404, { code: "rest_no_route", message: "Chưa có bài tuyến" });
    }
    const apiPath = url.pathname.startsWith("/api/") ? url.pathname.slice(5) : null;
    const route = apiPath === null ? undefined : API.find(([m, re]) => m === method && re.test(apiPath));
    if (!route || apiPath === null) return finish(404, { message: `E2E mock: chưa có handler cho ${method} ${url.pathname}` });
    record.handled = true;
    const authorization = req.headers.authorization ?? "";
    const authorized = authorization.startsWith(`Bearer ${E2E_TOKEN_PREFIX}`);
    return finish(200, route[2]({ method, path: apiPath, query: url.searchParams, body, authorized }));
  } catch (error) {
    if (error instanceof HttpError) return finish(error.status, error.payload);
    console.error("[mock-apigw]", error);
    return finish(500, { message: "E2E mock: lỗi nội bộ" });
  }
}

// ---------- khởi động ----------

const port = Number(process.env.E2E_MOCK_PORT ?? new URL(process.env.E2E_MOCK_APIGW ?? "http://127.0.0.1:4010").port ?? 4010) || 4010;
const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error("[mock-apigw] unhandled", error);
    if (!res.headersSent) send(res, 500, { message: "E2E mock: lỗi nội bộ" });
  });
});
// Chỉ loopback: mock không bao giờ nhận kết nối từ ngoài máy.
server.listen(port, "127.0.0.1", () => console.log(`[mock-apigw] http://127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => server.close(() => process.exit(0)));
