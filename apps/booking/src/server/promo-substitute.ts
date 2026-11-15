import "server-only";
import { AUTO_PREFIX, maskedToken } from "@/lib/auto-promo-token";
import { getBookingConfig } from "@/lib/booking-config-source";
import { encodeQueryValue } from "@/lib/qs";
import { REJECTION_MESSAGE, checkComboEligibility, checkRoundtripEligibility, type OrderFacts, type Rejection } from "./promo-eligibility";
import { getPromoCodes, getServerRules, type MaskSet } from "./promo-secrets";
import { checkRuleEligibility, ruleNeedsSeatMap, type SeatMapFacts } from "./rule-eligibility";
import { quotaLedgerConfigured, reserveQuota, settleQuota } from "./quota-ledger";
import { erpDirectConfigured, settleDirectDiscount } from "./settlement";
import { REJECT_MESSAGE } from "@/price-rules/engine";
import { seatMapResponseSchema } from "@/schemas/trip";
import { callApigw } from "./upstream";

/** Đường dẫn được phép mang token (nơi mã được áp): kiểm mã (POST) và đặt vé (POST). */
const SUBSTITUTABLE: Array<[string, string]> = [
  ["POST", "promotion/check-promotions"],
  ["POST", "bookings"],
];

/** Đọc đơn không được treo lâu: hết giờ/lỗi upstream → 503 chứ không phải "không đủ điều kiện". */
const ORDER_TIMEOUT_MS = 8000;

export interface PromoRequest {
  method: string;
  path: string;
  /** Chuỗi query thô gửi lên apigw (có thể bắt đầu bằng "?"). */
  search: string;
  body: string;
  authorization: string;
  mask: MaskSet;
}

/**
 * `respond`: BFF tự trả lời (không gọi apigw) — luật ghi giảm trực tiếp ERP ở bước kiểm mã.
 * `after`: chạy sau khi apigw trả lời (chốt/trả suất, ghi giảm trực tiếp ERP); trả lỗi → route trả lỗi đó thay phản hồi apigw.
 */
/** Chạy sau khi apigw trả lời; `text` = thân phản hồi (để đối chiếu tiền giảm ERP). Trả lỗi → route trả lỗi đó thay phản hồi. */
export type AfterHook = (upstreamOk: boolean, text?: string) => Promise<{ status: number; message: string } | null>;
export type PreparedPromo =
  | { ok: true; search: string; body: string; respond?: unknown; after?: AfterHook }
  | { ok: false; status: number; message: string };

const reject = (rejection: Rejection): PreparedPromo => ({ ok: false, status: 422, message: REJECTION_MESSAGE[rejection] });
const unavailable = (): PreparedPromo => ({ ok: false, status: 503, message: "Hệ thống tạm thời chưa kiểm tra được ưu đãi. Vui lòng thử lại sau ít phút." });
const HIDDEN_TYPED: PreparedPromo = { ok: false, status: 422, message: "Mã này chỉ được áp dụng tự động khi đặt chiều về từ đơn chiều đi của quý khách, không nhập tay được." };

const TOKEN_FULL = /^@auto:(\d+):([A-Za-z0-9]+)$/;
const TOKEN_ANY = /@auto:\d+(?::[A-Za-z0-9]+)?/g;
const MIN_CODE_LENGTH = 4;

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
};

/** Mọi chuỗi trong thân JSON (khoá và giá trị, đã giải mã escape); không phải JSON → cả thân. */
function jsonStrings(body: string): string[] {
  try {
    const out: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          out.push(k);
          walk(x);
        }
    };
    walk(JSON.parse(body));
    return out;
  } catch {
    return [body];
  }
}

/** Có mã ẩn nào do khách gõ (ngoài token) trong yêu cầu không — không phân biệt hoa thường, đã giải mã URL/JSON. */
export function containsTypedHiddenCode(search: string, body: string, codes: ReadonlyMap<string, string | null>): boolean {
  if (!codes.size) return false;
  const pieces = [...search.replace(/^\?/, "").split("&").flatMap((seg) => seg.split("=").map(safeDecode)), ...jsonStrings(body)];
  const hay = pieces.join("\n").replace(TOKEN_ANY, "").toLowerCase();
  for (const code of codes.keys()) if (code.length >= MIN_CODE_LENGTH && hay.includes(code)) return true;
  return false;
}

interface Facts {
  facts: OrderFacts | null;
  error: boolean;
}

/** Dung sai làm tròn mỗi vé giữa ERP và engine. */
const ERP_TOLERANCE_VND = 1000;

/**
 * Tiền giảm ERP (phản hồi check-promotions `codes[].{ticketCode, priceDiscount}`) so với engine theo tên ghế. Trả mô tả chỗ lệch, hoặc null nếu khớp.
 * Vé không có trong phản hồi hoặc phản hồi không đọc được → coi là khớp (client tự xử lý "không giảm đồng nào" như trước).
 */
export function erpDrift(text: string, seats: ReadonlyArray<{ no: string; code?: string }>, expected: ReadonlyMap<string, number>): string | null {
  let codes: unknown;
  try {
    codes = (JSON.parse(text) as { codes?: unknown }).codes;
  } catch {
    return null;
  }
  if (!Array.isArray(codes)) return null;
  const out: string[] = [];
  for (const c of codes as Array<{ ticketCode?: unknown; priceDiscount?: unknown }>) {
    const seat = seats.find((s) => s.code && s.code === c.ticketCode);
    if (!seat || !expected.has(seat.no)) continue;
    const got = Number.parseInt(String(c.priceDiscount ?? 0), 10) || 0;
    const want = expected.get(seat.no)!;
    if (Math.abs(got - want) > ERP_TOLERANCE_VND) out.push(`ghế ${seat.no}: ERP ${got} ≠ luật ${want}`);
  }
  return out.length ? out.join("; ") : null;
}

/** `codes[i][ticketCode]` của các vị trí mang token trong query check-promotions. */
function tokenTicketCodes(search: string): string[] {
  const pairs = search.replace(/^\?/, "").split("&").map((seg) => {
    const i = seg.indexOf("=");
    return [safeDecode(i < 0 ? seg : seg.slice(0, i)), safeDecode(i < 0 ? "" : seg.slice(i + 1))] as const;
  });
  const idx = pairs.flatMap(([k, v]) => {
    const m = /^codes\[(\d+)\]\[promotion\]$/.exec(k);
    return m && v.startsWith(AUTO_PREFIX) ? [m[1]] : [];
  });
  return idx.flatMap((i) => pairs.filter(([k]) => k === `codes[${i}][ticketCode]`).map(([, v]) => v));
}

/** Thân bookings bỏ `code` mang token ở seats[] (luật ghi giảm trực tiếp không có mã ERP); null nếu thân không đọc được. */
function stripSeatTokens(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { seats?: Array<Record<string, unknown>> };
    if (!Array.isArray(parsed.seats)) return null;
    parsed.seats = parsed.seats.map((s) => {
      if (typeof s?.code === "string" && s.code.startsWith(AUTO_PREFIX)) {
        const { code, ...rest } = s;
        void code;
        return rest;
      }
      return s;
    });
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

/** Huỷ cả đơn thành công → trả mọi suất ưu đãi của đơn đó trong sổ hạn mức. */
function releaseOnCancel(req: PromoRequest): AfterHook | undefined {
  if (req.method !== "POST" || req.path !== "cancel-booking" || !quotaLedgerConfigured()) return undefined;
  let order = "";
  try {
    order = String((JSON.parse(req.body) as { order_code?: unknown }).order_code ?? "");
  } catch {
    return undefined;
  }
  if (!/^[A-Za-z0-9]{4,40}$/.test(order)) return undefined;
  return async (ok) => {
    if (ok) await settleQuota("release", order);
    return null;
  };
}

/** Đọc đơn bằng token của khách (apigw chỉ trả đơn của chính họ). */
async function loadOrder(code: string, merchant: string, authorization: string): Promise<Facts> {
  if (!/^[A-Za-z0-9]+$/.test(code) || !/^[A-Za-z0-9_-]+$/.test(merchant)) return { facts: null, error: false };
  try {
    const res = await callApigw({ method: "GET", path: `bookings/${code}`, search: `?merchant_code=${merchant}`, authorization, timeoutMs: ORDER_TIMEOUT_MS });
    if (res.status === 404 || res.status === 403 || res.status === 422) return { facts: null, error: false };
    if (!res.ok) return { facts: null, error: true };
    const data = ((await res.json()) as { data?: Record<string, unknown> }).data;
    if (!data || typeof data !== "object") return { facts: null, error: false };
    const tickets = Array.isArray(data.tickets) ? (data.tickets as Array<Record<string, unknown>>) : [];
    const live = tickets.filter((t) => (t.status as { type?: number } | undefined)?.type !== 5);
    const first = live[0] as { departure?: { id?: unknown; lat?: unknown; lng?: unknown }; destination?: { id?: unknown; lat?: unknown; lng?: unknown }; trip?: { id?: unknown; departure_time?: unknown; product?: { name?: unknown } } } | undefined;
    const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);
    const dep = { lat: num(first?.departure?.lat), lng: num(first?.departure?.lng) };
    const dest = { lat: num(first?.destination?.lat), lng: num(first?.destination?.lng) };
    const departureTime = typeof first?.trip?.departure_time === "string" ? first.trip.departure_time : "";
    const ok = [dep.lat, dep.lng, dest.lat, dest.lng].every(Number.isFinite) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(departureTime);
    const phone = String((data.customer as { phone?: unknown } | null | undefined)?.phone ?? "").replace(/\D/g, "");
    const keys = [phone ? `phone:${phone}` : "", ...tickets.map((t) => (t.user_created as { id?: unknown } | undefined)?.id).filter((id) => id !== undefined && id !== null).map((id) => `uid:${String(id)}`)].filter(Boolean);
    return {
      error: false,
      facts: {
        code,
        paid: (data.payment as { type?: number } | null | undefined)?.type === 1,
        cancelled: (data.status as { type?: number } | undefined)?.type === 3,
        customerKeys: [...new Set(keys)],
        liveTickets: live.length,
        productName: typeof first?.trip?.product?.name === "string" && first.trip.product.name.trim() ? first.trip.product.name.trim() : null,
        trip: ok ? { dep, dest, departureTime } : null,
        merchant: typeof data.merchant_code === "string" ? data.merchant_code : merchant,
        seats: live
          .map((t) => ({ no: String((t as { name?: unknown }).name ?? (t as { number?: unknown }).number ?? ""), price: num((t as { price?: unknown }).price), code: typeof (t as { code?: unknown }).code === "string" ? String((t as { code: string }).code) : undefined }))
          .filter((s) => s.no && Number.isFinite(s.price)),
        tripId: Number.isFinite(num(first?.trip?.id)) ? num(first?.trip?.id) : null,
        departureId: Number.isFinite(num(first?.departure?.id)) ? num(first?.departure?.id) : null,
        destinationId: Number.isFinite(num(first?.destination?.id)) ? num(first?.destination?.id) : null,
      },
    };
  } catch {
    return { facts: null, error: true };
  }
}

/** Sơ đồ ghế công khai của chuyến trong đơn (hạng ghế, số chỗ xe) cho luật v2 cần; lỗi → null (luật cần sơ đồ sẽ không khớp). */
async function loadSeatMap(facts: OrderFacts | null, merchant: string): Promise<SeatMapFacts | null> {
  if (!facts?.tripId || !facts.departureId || !facts.destinationId) return null;
  try {
    const search = `?departure_id=${facts.departureId}&destination_id=${facts.destinationId}&merchant_code=${encodeURIComponent(merchant)}&numberGuest=1`;
    const res = await callApigw({ method: "GET", path: `trips/${facts.tripId}`, search, timeoutMs: ORDER_TIMEOUT_MS });
    if (!res.ok) return null;
    const parsed = seatMapResponseSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    const cells = parsed.data.data.flat(2).filter((c): c is NonNullable<typeof c> => !!c);
    return { ranks: new Map(cells.map((c) => [c.name, c.seat_rank ?? null])), vehicleSeats: cells.length || null };
  } catch {
    return null;
  }
}

interface Located {
  tokens: Array<{ promoId: number; outbound: string }>;
  currentCode: string;
  merchant: string;
  search: string;
  body: string;
  /** Hàm đổi token thành mã thật trong đúng các vị trí hợp lệ. */
  apply: (real: string) => { search: string; body: string };
}

const QUERY_TOKEN_KEY = /^codes\[\d+\]\[promotion\]$/;

/** Tìm token CHỈ ở `codes[i][promotion]` (query check-promotions) hoặc `seats[i].code` (thân bookings); chỗ khác/trùng khoá → rejection. */
function locate(req: PromoRequest): Located | Rejection {
  const marker = /%40auto%3A|@auto:/gi;
  if (req.path === "promotion/check-promotions") {
    if (/@auto:/i.test(req.body)) return "not_matching";
    const raw = req.search.replace(/^\?/, "");
    const segs = raw.split("&");
    const pairs = segs.map((seg) => {
      const i = seg.indexOf("=");
      return { seg, rawKey: i < 0 ? seg : seg.slice(0, i), rawVal: i < 0 ? "" : seg.slice(i + 1) };
    });
    const tokenSegs: number[] = [];
    const tokens: Located["tokens"] = [];
    for (const [idx, p] of pairs.entries()) {
      const key = safeDecode(p.rawKey);
      const val = safeDecode(p.rawVal);
      const mentions = (p.seg.match(marker) ?? []).length || (val.includes(AUTO_PREFIX) ? 1 : 0);
      if (!mentions && !key.includes(AUTO_PREFIX)) continue;
      const m = TOKEN_FULL.exec(val);
      if (!m || !QUERY_TOKEN_KEY.test(key) || mentions !== 1) return "not_matching";
      tokenSegs.push(idx);
      tokens.push({ promoId: Number(m[1]), outbound: m[2] });
    }
    const count = (name: string) => pairs.filter((p) => safeDecode(p.rawKey) === name).length;
    if (count("bookingCode") !== 1 || count("merchant_code") !== 1) return "order_unknown";
    const value = (name: string) => safeDecode(pairs.find((p) => safeDecode(p.rawKey) === name)!.rawVal);
    return {
      tokens,
      currentCode: value("bookingCode"),
      merchant: value("merchant_code"),
      search: req.search,
      body: req.body,
      apply: (real) => ({
        search: `${req.search.startsWith("?") ? "?" : ""}${pairs.map((p, idx) => (tokenSegs.includes(idx) ? `${p.rawKey}=${encodeQueryValue(real)}` : p.seg)).join("&")}`,
        body: req.body,
      }),
    };
  }

  // POST bookings
  if (/%40auto%3A|@auto:/i.test(req.search)) return "not_matching";
  let parsed: { seats?: unknown; order_code?: unknown; merchant_code?: unknown };
  try {
    parsed = JSON.parse(req.body) as typeof parsed;
  } catch {
    return "order_unknown";
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.seats)) return "not_matching";
  const tokens: Located["tokens"] = [];
  for (const seat of parsed.seats as Array<{ code?: unknown }>) {
    const code = seat && typeof seat === "object" ? seat.code : undefined;
    if (typeof code === "string" && code.includes(AUTO_PREFIX)) {
      const m = TOKEN_FULL.exec(code);
      if (!m) return "not_matching";
      tokens.push({ promoId: Number(m[1]), outbound: m[2] });
    }
  }
  // Mọi dấu hiệu token trong thân (kể cả escape \\u0040) phải nằm đúng ở seats[i].code.
  const inStrings = jsonStrings(req.body).reduce((n, s) => n + (s.match(/@auto:/g) ?? []).length, 0);
  const inRaw = (req.body.match(/"@auto:\d+:[A-Za-z0-9]+"/g) ?? []).length;
  if (inStrings !== tokens.length || inRaw !== tokens.length) return "not_matching";
  if ((req.body.match(/"order_code"\s*:/g) ?? []).length > 1 || (req.body.match(/"merchant_code"\s*:/g) ?? []).length > 1) return "order_unknown";
  return {
    tokens,
    currentCode: typeof parsed.order_code === "string" ? parsed.order_code : "",
    merchant: typeof parsed.merchant_code === "string" ? parsed.merchant_code : "",
    search: req.search,
    body: req.body,
    apply: (real) => ({ search: req.search, body: req.body.replace(/"@auto:\d+:[A-Za-z0-9]+"/g, () => JSON.stringify(real)) }),
  };
}

/**
 * Trước khi chuyển lên apigw:
 * 1. Mã ẩn do khách GÕ TAY (ngoài token, không phân biệt hoa thường, đã giải mã) → 422: mã khứ hồi chỉ dùng được qua đường tự động.
 * 2. Token `@auto:<promoId>:<đơn chiều đi | đơn đang đặt (combo)>` chỉ được ở `codes[i][promotion]` (check-promotions) / `seats[i].code` (bookings); chỗ khác, trùng
 *    bookingCode/merchant_code, thiếu đơn chiều đi → 422 và không đổi gì.
 * 3. Kiểm điều kiện phía server (khứ hồi: tuyến/chiều/ngày giờ, đơn chiều đi cùng khách, đã trả, chưa huỷ, đúng chiều ngược, số ghế;
 *    combo: đúng đơn đang đặt, tuyến/chiều/ngày giờ/đặt trước, tổng số vé trong khoảng của chương trình) rồi mới đổi token
 *    thành mã thật bằng thay thế đúng từng byte — apigw nhận y như khi khách tự gõ mã.
 * Không có token và không có mã ẩn → trả nguyên (đường nhập mã thường không đổi).
 */
export async function prepareAutoPromo(req: PromoRequest): Promise<PreparedPromo> {
  if (containsTypedHiddenCode(req.search, req.body, req.mask.codes)) return HIDDEN_TYPED;
  const hasToken = /%40auto%3A|@auto:/i.test(req.search) || /@auto:/i.test(req.body) || /\\u0040auto/i.test(req.body);
  if (!hasToken) return { ok: true, search: req.search, body: req.body, after: releaseOnCancel(req) };
  if (!SUBSTITUTABLE.some(([m, p]) => m === req.method && p === req.path)) return reject("not_matching");

  const located = locate(req);
  if (typeof located === "string") return reject(located);
  const { tokens } = located;
  if (!tokens.length) return reject("no_outbound");
  const promoIds = new Set(tokens.map((t) => t.promoId));
  const outbounds = new Set(tokens.map((t) => t.outbound));
  if (promoIds.size !== 1 || outbounds.size !== 1) return reject("not_matching");
  const promoId = tokens[0].promoId;
  if (!located.currentCode || !located.merchant) return reject("order_unknown");

  const config = await getBookingConfig();

  // Luật giá v2: số trong token là post_id của bài hv_rule (không trùng ID bài hv_promo).
  const server = await getServerRules();
  const v2 = server.rules.find((r) => r.post_id === promoId);
  if (v2) {
    const linked = !!v2.rule.who.linked_order;
    const [current, other] = await Promise.all([
      loadOrder(located.currentCode, located.merchant, req.authorization),
      linked ? loadOrder(tokens[0].outbound, located.merchant, req.authorization) : Promise.resolve<Facts>({ facts: null, error: false }),
    ]);
    if (current.error || other.error) return unavailable();
    const needsMap = server.rules.some((r) => r.rule.apply.mode === "auto" && ruleNeedsSeatMap(r.rule));
    const seatMap = needsMap ? await loadSeatMap(current.facts, located.merchant) : null;
    const ledger = quotaLedgerConfigured();
    const direct = erpDirectConfigured();
    const verdict = checkRuleEligibility({
      config,
      rules: server.rules,
      postId: promoId,
      current: current.facts,
      tokenOrder: tokens[0].outbound,
      linked: other.facts,
      seatMap,
      seats: tokens.length,
      testers: server.testers,
      // Sổ hạn mức giữ suất NGUYÊN TỬ ngay sau đây; engine không tự đếm (counters rỗng).
      counters: ledger ? {} : undefined,
      directEnabled: direct,
    });
    if (!verdict.ok) return { ok: false, status: 422, message: verdict.message };
    const rule = verdict.rule.rule;
    const facts = current.facts!;
    const isBooking = req.path === "bookings";
    // Mã ERP lấy TRƯỚC khi giữ suất: luật thiếu mã bị từ chối mà không giữ suất vô ích 20 phút.
    const erpCode = rule.apply.settlement === "erp_code" ? (await getPromoCodes()).get(String(promoId)) : undefined;
    if (rule.apply.settlement === "erp_code" && !erpCode) return reject("not_active");

    if (rule.quota) {
      const phone = facts.customerKeys.find((k) => k.startsWith("phone:"))?.slice(6) ?? "";
      const tripKey = `${facts.merchant ?? located.merchant}|${facts.tripId ?? "?"}|${facts.trip?.departureTime ?? ""}`;
      const held = await reserveQuota({ ruleId: rule.id, tripKey, phone, orderCode: facts.code, seats: Math.min(tokens.length, verdict.quotaSeats || tokens.length), limits: rule.quota });
      if (!held.ok) return held.reason === "unavailable" ? unavailable() : { ok: false, status: 422, message: REJECT_MESSAGE[held.reason].vi };
    }
    const quotaAfter: AfterHook | undefined =
      rule.quota && isBooking
        ? async (ok) => {
            await settleQuota(ok ? "commit" : "release", facts.code, rule.id);
            return null;
          }
        : undefined;

    if (rule.apply.settlement === "erp_direct") {
      // Không có mã ERP: kiểm mã → BFF trả tiền giảm engine tính; đặt vé → gỡ token, sau khi apigw nhận đơn thì ghi giảm trực tiếp ERP.
      const byNo = new Map(verdict.seats.map((s) => [s.no, s.before - s.after]));
      const tickets = (facts.seats ?? []).filter((s) => s.code && (byNo.get(s.no) ?? 0) > 0).map((s) => ({ ticketCode: s.code!, seat: s.no, discountVnd: byNo.get(s.no)! }));
      if (!isBooking) {
        const asked = tokenTicketCodes(req.search);
        const codes = tickets.filter((t) => asked.includes(t.ticketCode)).map((t) => ({ code: maskedToken(promoId), ticketCode: t.ticketCode, ticketPrice: String(facts.seats!.find((s) => s.code === t.ticketCode)?.price ?? 0), priceDiscount: t.discountVnd }));
        return { ok: true, search: req.search, body: req.body, respond: { message: verdict.rule.rule.display.label.vi, codes } };
      }
      const stripped = stripSeatTokens(req.body);
      if (stripped === null) return reject("not_matching");
      return {
        ok: true,
        search: req.search,
        body: stripped,
        after: async (ok) => {
          if (!ok) {
            await quotaAfter?.(false);
            return null;
          }
          const settled = await settleDirectDiscount({ merchant: facts.merchant ?? located.merchant, orderCode: facts.code, ruleId: rule.id, note: `WEB ${rule.id}`.slice(0, 60), tickets });
          if (!settled.ok) {
            console.error(`[settlement] ghi giảm trực tiếp ${rule.id} đơn ${facts.code} thất bại: ${settled.message}`);
            await quotaAfter?.(false);
            return { status: 502, message: "Đã giữ chỗ nhưng chưa ghi được ưu đãi vào hệ thống vé. Vui lòng gọi 1900 6763 để được hỗ trợ đúng giá ưu đãi." };
          }
          await quotaAfter?.(true);
          return null;
        },
      };
    }

    // Kiểm mã: đối chiếu tiền giảm ERP tính (theo mã) với engine. Lệch → không áp (cấu hình mã trong ERP khác luật trên web).
    const expected = new Map(verdict.seats.map((s) => [s.no, s.before - s.after]));
    const reconcile: AfterHook | undefined = isBooking
      ? quotaAfter
      : async (ok, text) => {
          if (!ok || !text) return null;
          const drift = erpDrift(text, facts.seats ?? [], expected);
          if (!drift) return null;
          console.error(`[rule-eligibility] ERP giảm khác luật ${rule.id} đơn ${facts.code}: ${drift}`);
          if (rule.quota) await settleQuota("release", facts.code, rule.id);
          return { status: 422, message: "Ưu đãi trên hệ thống vé chưa khớp với chương trình trên web. Vui lòng liên hệ 1900 6763." };
        };
    return { ok: true, ...located.apply(erpCode!), after: reconcile };
  }

  // Combo: token mang mã chính đơn đang đặt, chỉ cần đọc đơn đó. Khứ hồi: thêm đơn chiều đi trong token.
  const isCombo = config.promos.find((p) => p.id === promoId)?.type === "combo";
  const [current, outbound] = await Promise.all([
    loadOrder(located.currentCode, located.merchant, req.authorization),
    isCombo ? Promise.resolve<Facts>({ facts: null, error: false }) : loadOrder(tokens[0].outbound, located.merchant, req.authorization),
  ]);
  if (current.error || outbound.error) return unavailable();
  const verdict = isCombo
    ? checkComboEligibility({ config, promoId, current: current.facts, tokenOrder: tokens[0].outbound, seats: tokens.length })
    : checkRoundtripEligibility({ config, promoId, current: current.facts, outbound: outbound.facts, seats: tokens.length });
  if (verdict.rejection) return reject(verdict.rejection);

  const real = (await getPromoCodes()).get(String(promoId));
  if (!real) return reject("not_active");
  return { ok: true, ...located.apply(real) };
}

/**
 * Che mã thật về token `@auto:<promoId>` (mã chỉ biết từ `mask` → `@auto:0`) ở MỌI nơi trong văn bản phản hồi:
 * không phân biệt hoa thường, mã dài trước, nên mã dài chứa mã ngắn không bị cắt dở.
 */
export function maskPromoCodes(text: string, codes: ReadonlyMap<string, string | null>): string {
  if (!codes.size || !text) return text;
  const list = [...codes.keys()].filter((c) => c.length >= MIN_CODE_LENGTH).sort((a, b) => b.length - a.length);
  if (!list.length) return text;
  const re = new RegExp(list.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  return text.replace(re, (m) => maskedToken(codes.get(m.toLowerCase()) ?? 0));
}
