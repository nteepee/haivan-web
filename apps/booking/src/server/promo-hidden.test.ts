// @vitest-environment node
import { sealData } from "iron-session";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fallbackJson from "@/content/booking-config-fallback.json";
import { server } from "../../test/msw-server";
import { POST as gwPost, GET as gwGet } from "@/app/api/hv/gw/[...path]/route";
import { stringifyQuery } from "@/lib/qs";
import { SESSION_COOKIE } from "./session";
import { resetPromoSecretsForTest } from "./promo-secrets";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const ORIGIN = "http://127.0.0.1:3100";
const MOCK = "http://127.0.0.1:4010";
const WP = "http://wp.test";
const SECRET = "test-secret-test-secret-test-secret-123";
const WP_SECRET = "wp-shared-secret";
const REAL = "TESTHIDDEN1";
const PROMO_ID = 10;
const OUT = "B02OUTBOUND1";
const RET = "B02RETURN001";
const TOKEN = `@auto:${PROMO_ID}:${OUT}`;

const hnMoc = { ...fallbackJson.corridors.find((c) => c.id === "hn-moc")!, landing: { ab: "my-dinh/moc-chau", ba: "moc-chau/my-dinh" } };
const promo = (patch: Record<string, unknown> = {}) => ({
  id: PROMO_ID,
  type: "roundtrip",
  corridor: "hn-moc",
  direction: "ba",
  book_from: "2020-01-01",
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
  label: { vi: "Giảm 20k/ghế chiều về", en: "20k off" },
  badge: { vi: "Khứ hồi", en: "Return" },
  ...patch,
});

const MY_DINH = { lat: 21.0284297, lng: 105.7782687 };
const MOC_CHAU = { lat: 20.8461723, lng: 104.6415738 };
/** `GET bookings/{code}` tối thiểu: vé có toạ độ điểm đi/đến, giờ khởi hành, trạng thái; `payment.type` ≠ 0 = đã trả. */
const order = (code: string, dep: typeof MY_DINH, dest: typeof MY_DINH, time: string, opts: { paid?: boolean; tickets?: number; echo?: string; phone?: string; cancelled?: boolean; paymentType?: number } = {}) => ({
  data: {
    id: 1,
    code,
    status: { type: opts.cancelled ? 3 : 1, type_name: "x" },
    price: 400000,
    customer: { phone: opts.phone ?? "0900000000", name: "Khach" },
    payment: opts.paid ? { type: opts.paymentType ?? 1, type_name: "Đã thanh toán" } : { type: 0, type_name: "Chưa thanh toán" },
    tickets: Array.from({ length: opts.tickets ?? 2 }, (_, i) => ({
      id: i + 1,
      code: `V${code}${i}`,
      price: 200000,
      status: { type: 2, type_name: "x" },
      user_created: { id: 827708 },
      departure: { name: "d", ...dep },
      destination: { name: "e", ...dest },
      trip: { id: 1, departure_time: time },
      ...(opts.echo ? { promotion_code: opts.echo } : {}),
    })),
  },
});

const state = {
  upstream: [] as Array<{ method: string; path: string; search: string; body: string }>,
  orders: {} as Record<string, unknown>,
  promos: [promo()] as unknown[],
  secretStatus: 200,
  checkReply: undefined as unknown,
  maskKey: [] as string[],
  secretCalls: 0,
};
const envBackup = { ...process.env };

beforeEach(() => {
  Object.assign(process.env, { APIGW_URL: MOCK, PUBLIC_ORIGIN: ORIGIN, SESSION_SECRET: SECRET, WP_LAYOUT_URL: `${WP}/wp-json/haivan-web/v1/layout`, HV_WP_SHARED_SECRET: WP_SECRET });
  delete process.env.HV_LIVE_BACKEND;
  delete process.env.HV_LIVE_WRITES;
  delete process.env.E2E;
  resetPromoSecretsForTest();
  state.upstream = [];
  state.secretStatus = 200;
  state.maskKey = [];
  state.secretCalls = 0;
  state.promos = [promo()];
  state.checkReply = undefined;
  state.orders = {
    [OUT]: order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: true, tickets: 2 }),
    [RET]: order(RET, MOC_CHAU, MY_DINH, "2026-11-02 09:00:00", { tickets: 2 }),
  };
  server.use(
    http.get(`${WP}/wp-json/haivan-web/v1/booking-config`, () => HttpResponse.json({ ...fallbackJson, corridors: fallbackJson.corridors.map((c) => (c.id === "hn-moc" ? hnMoc : c)), promos: state.promos })),
    http.get(`${WP}/wp-json/haivan-web/v1/promo-codes`, ({ request }) => {
      state.secretCalls++;
      return request.headers.get("x-hv-secret") === WP_SECRET && state.secretStatus === 200
        ? HttpResponse.json({ codes: { [PROMO_ID]: REAL }, mask: state.maskKey })
        : new HttpResponse(null, { status: state.secretStatus === 200 ? 403 : state.secretStatus });
    }),
    http.get(`${MOCK}/api/bookings/:code`, ({ params }) => {
      const body = state.orders[String(params.code)];
      return body ? HttpResponse.json(body) : HttpResponse.json({ message: "Not found" }, { status: 404 });
    }),
    http.post(`${MOCK}/api/promotion/check-promotions`, async ({ request }) => {
      state.upstream.push({ method: "POST", path: "promotion/check-promotions", search: new URL(request.url).search, body: await request.text() });
      return HttpResponse.json(state.checkReply ?? { message: `Mã khuyến mại ${REAL} khả dụng`, codes: [{ code: REAL, ticketCode: "V1", ticketPrice: "200000", priceDiscount: 20000 }] });
    }),
    http.post(`${MOCK}/api/bookings`, async ({ request }) => {
      state.upstream.push({ method: "POST", path: "bookings", search: new URL(request.url).search, body: await request.text() });
      return HttpResponse.json({ data: { code: RET, note: `đã áp ${REAL}` } });
    }),
    http.post(`${MOCK}/api/cancel-seat`, async ({ request }) => {
      state.upstream.push({ method: "POST", path: "cancel-seat", search: "", body: await request.text() });
      return HttpResponse.json({});
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  process.env = { ...envBackup };
});

async function cookie() {
  return `${SESSION_COOKIE}=${await sealData({ authorization: "Bearer tok", user: { name: "A", phone: null } }, { password: SECRET })}`;
}
const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });
async function post(path: string[], init: { body?: string; search?: string }) {
  const url = `${ORIGIN}/api/hv/gw/${path.join("/")}${init.search ?? ""}`;
  const headers = { cookie: await cookie(), "content-type": "application/json", "x-hv-req": "1", origin: ORIGIN, "sec-fetch-site": "same-origin", ...(init.search ? { "x-hv-query": init.search.slice(1) } : {}) };
  return gwPost(new NextRequest(url, { method: "POST", body: init.body, headers }), ctx(path));
}

/** Query check-promotions của web cũ cho các mã `codes` (cùng hàm qs mà client dùng). */
const checkQuery = (codes: string[], booking = RET) =>
  `?${stringifyQuery({
    merchant_code: "02",
    route: "MDI-MCH",
    product: "LUXURY",
    channel: 1,
    direction: 2,
    departure_id: 1,
    destination_id: 2,
    departure_time: "2026-11-02 09:00:00",
    bookingCode: booking,
    tripCode: 1,
    adm_id: 0,
    codes: codes.map((promotion, i) => ({ promotion, ticketCode: `V${i + 1}`, ticketPrice: 200000 })),
    channel_code: "WEBHAIVAN",
  })}`;
const bookingBody = (codes: Array<string | undefined>, order = RET) =>
  JSON.stringify({ pick_up: { address: "A" }, drop_off: { address: "B" }, trip: { trip_id: 1 }, seats: codes.map((code, i) => ({ id: i + 1, ...(code ? { code } : {}), is_reward: false })), order_code: order, merchant_code: "02", note: "", is_combo: 0 });

describe("mã khứ hồi ẩn: đổi token → mã thật ở BFF", () => {
  it("check-promotions: apigw nhận ĐÚNG từng byte như khi khách tự gõ mã; phản hồi bị che về token", async () => {
    const res = await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN, TOKEN]) });
    expect(res.status).toBe(200);
    expect(state.upstream).toHaveLength(1);
    expect(state.upstream[0].search).toBe(checkQuery([REAL, REAL]));
    const text = await res.text();
    expect(text).not.toContain(REAL);
    expect(text).toContain(`@auto:${PROMO_ID}`); // codes[].code và message được che
    expect(JSON.parse(text).codes[0]).toMatchObject({ ticketCode: "V1", priceDiscount: 20000 });
  });

  it("bookings: seats[].code đổi thành mã thật, mọi byte khác giữ nguyên; phản hồi không lộ mã", async () => {
    const res = await post(["bookings"], { body: bookingBody([TOKEN, TOKEN]) });
    expect(res.status).toBe(200);
    expect(state.upstream[0].body).toBe(bookingBody([REAL, REAL]));
    expect(await res.text()).not.toContain(REAL);
  });

  it("đường nhập mã tay không đổi: mã thật do khách gõ đi thẳng, không cần điều kiện/đơn chiều đi", async () => {
    state.orders = {};
    const res = await post(["promotion", "check-promotions"], { search: checkQuery(["MYMANUAL"]) });
    expect(res.status).toBe(200);
    expect(state.upstream[0].search).toBe(checkQuery(["MYMANUAL"]));
    const book = await post(["bookings"], { body: bookingBody(["MYMANUAL", undefined]) });
    expect(book.status).toBe(200);
    expect(state.upstream[1].body).toBe(bookingBody(["MYMANUAL", undefined]));
  });

  it("GET bookings/{code} và danh sách che mã thật nếu apigw lặp lại nó", async () => {
    await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) }); // làm ấm bộ nhớ mã
    state.orders[RET] = order(RET, MOC_CHAU, MY_DINH, "2026-11-02 09:00:00", { echo: REAL });
    const res = await gwGet(new NextRequest(`${ORIGIN}/api/hv/gw/bookings/${RET}?merchant_code=02`, { headers: { cookie: await cookie(), "x-hv-req": "1", "sec-fetch-site": "same-origin" } }), ctx(["bookings", RET]));
    const text = await res.text();
    expect(text).not.toContain(REAL);
    expect(text).toContain(`@auto:${PROMO_ID}`);
  });
});

describe("điều kiện phía server trước khi đổi token (không đủ → 422, không gửi gì lên apigw)", () => {
  const expectRejected = async (res: Response, match: RegExp) => {
    expect(res.status).toBe(422);
    expect((await res.json()).message).toMatch(match);
    expect(state.upstream).toHaveLength(0);
  };
  const check = () => post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) });

  it("đơn chiều đi chưa thanh toán", async () => {
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: false });
    await expectRejected(await check(), /chưa thanh toán/);
  });

  it("đơn chiều đi không thuộc khách / không tồn tại (apigw 404 với token này)", async () => {
    delete state.orders[OUT];
    await expectRejected(await check(), /chiều đi hợp lệ|xác minh/);
  });

  it("đơn chiều đi cùng chiều (không phải chiều ngược lại)", async () => {
    state.orders[OUT] = order(OUT, MOC_CHAU, MY_DINH, "2026-10-31 07:00:00", { paid: true });
    await expectRejected(await check(), /chiều ngược/);
  });

  it("đơn chiều đi sau chuyến về", async () => {
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-11-03 07:00:00", { paid: true });
    await expectRejected(await check(), /trước hoặc bằng/);
  });

  it("số ghế về nhiều hơn số ghế đi", async () => {
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: true, tickets: 1 });
    const res = await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN, TOKEN]) });
    await expectRejected(res, /nhiều hơn số ghế/);
  });

  it("chuyến đang đặt sai chiều so với chương trình (chương trình chỉ cho chiều về ba)", async () => {
    state.promos = [promo({ direction: "ab" })];
    await expectRejected(await check(), /không áp dụng cho chuyến này/);
  });

  it("chương trình đã tắt/không có trong cấu hình, hoặc không phải khứ hồi (combo tắt)", async () => {
    state.promos = [];
    await expectRejected(await check(), /không còn áp dụng/);
    state.promos = [promo({ type: "combo" })];
    await expectRejected(await check(), /không còn áp dụng/);
  });

  it("ngoài khung ngày đi của chương trình (travel_to đã qua)", async () => {
    state.promos = [promo({ travel_to: "2026-11-01" })];
    await expectRejected(await check(), /không áp dụng cho chuyến này/);
  });

  it("token thiếu đơn chiều đi, token ở endpoint khác, hoặc nhiều chương trình trong một yêu cầu", async () => {
    await expectRejected(await post(["promotion", "check-promotions"], { search: checkQuery([`@auto:${PROMO_ID}`]) }), /không áp dụng/);
    await expectRejected(await post(["cancel-seat"], { body: JSON.stringify({ order_code: RET, seat_code: TOKEN }) }), /không áp dụng/);
    await expectRejected(await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN, `@auto:11:${OUT}`]) }), /không áp dụng/);
  });

  it("route mã riêng của WP lỗi/sai bí mật và chưa từng đọc được tập mã → ĐÓNG (503) với đường dẫn có đơn/mã, không gửi gì lên apigw", async () => {
    state.secretStatus = 500;
    const res = await check();
    expect(res.status).toBe(503);
    expect(state.upstream).toHaveLength(0);
  });

  it("đang đặt vé (POST bookings) cũng bị kiểm: đơn chiều đi chưa trả → 422, không có POST bookings lên apigw", async () => {
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: false });
    await expectRejected(await post(["bookings"], { body: bookingBody([TOKEN, TOKEN]) }), /chưa thanh toán/);
  });
});

const typed = (code: string) => post(["promotion", "check-promotions"], { search: checkQuery([code]) });

describe("mã ẩn chỉ dùng được qua đường tự động (gõ tay bị chặn)", () => {
  it("gõ thẳng mã thật (mọi kiểu hoa/thường, URL-encode, trong thân bookings, trong ghi chú) → 422, không gửi gì lên apigw", async () => {
    for (const attempt of [REAL, REAL.toLowerCase(), `${REAL[0]}${REAL.slice(1).toLowerCase()}`]) {
      const res = await typed(attempt);
      expect(res.status).toBe(422);
      expect((await res.json()).message).toMatch(/tự động/);
    }
    const encoded = await post(["promotion", "check-promotions"], { search: checkQuery(["x"]).replace("x", `%54%45%53%54${encodeURIComponent(REAL.slice(4))}`) });
    expect(encoded.status).toBe(422);
    expect((await post(["bookings"], { body: bookingBody([REAL, undefined]) })).status).toBe(422);
    expect((await post(["bookings"], { body: bookingBody([undefined]).replace('"note":""', `"note":"dùng ${REAL.toLowerCase()} nhé"`) })).status).toBe(422);
    expect(state.upstream).toHaveLength(0);
  });

  it("mã khác do khách gõ vẫn đi qua; đường tự động (token) vẫn hoạt động", async () => {
    expect((await typed("MYMANUAL")).status).toBe(200);
    expect((await typed(TOKEN)).status).toBe(200);
  });

  it("mã chỉ có trong khoá `mask` của WP (chương trình đã tắt) cũng bị chặn và bị che; mã từng thấy được giữ trong tiến trình", async () => {
    state.maskKey = ["OLDDISABLED9"];
    expect((await typed("OLDDISABLED9")).status).toBe(422);
    state.maskKey = []; // WP không còn liệt kê, nhưng tiến trình đã từng thấy
    resetCacheOnly();
    expect((await typed("olddisabled9")).status).toBe(422);
  });
});

/** Ép Next đọc lại mã từ WP bằng cách làm bộ nhớ hết hạn (không xoá tập mã từng thấy). */
function resetCacheOnly() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.now() + 6 * 60_000);
}

describe("che mã ở MỌI phản hồi gw", () => {
  it("kể cả endpoint ngoài danh sách cũ (customer/customers), không phân biệt hoa thường", async () => {
    server.use(http.get(`${MOCK}/api/customer/customers`, () => HttpResponse.json({ data: { note: `Mã ${REAL.toLowerCase()} và ${REAL}` } })));
    await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) }); // làm ấm tập mã
    const res = await gwGet(new NextRequest(`${ORIGIN}/api/hv/gw/customer/customers`, { headers: { cookie: await cookie(), "x-hv-req": "1", "sec-fetch-site": "same-origin" } }), ctx(["customer", "customers"]));
    const text = await res.text();
    expect(text).not.toMatch(new RegExp(REAL, "i"));
    expect(text).toContain(`@auto:${PROMO_ID}`);
  });
});

describe("đóng khi chưa có tập mã; cache âm", () => {
  it("WP lỗi lần đầu: 503 cho đường có đơn/mã, đường khác vẫn qua; 30 s sau lỗi không gọi lại WP", async () => {
    state.secretStatus = 500;
    server.use(http.get(`${MOCK}/api/customer/customers`, () => HttpResponse.json({ data: { name: "A" } })));
    expect((await post(["promotion", "check-promotions"], { search: checkQuery(["MYMANUAL"]) })).status).toBe(503);
    const other = await gwGet(new NextRequest(`${ORIGIN}/api/hv/gw/customer/customers`, { headers: { cookie: await cookie(), "x-hv-req": "1", "sec-fetch-site": "same-origin" } }), ctx(["customer", "customers"]));
    expect(other.status).toBe(200);
    const calls = state.secretCalls;
    await post(["promotion", "check-promotions"], { search: checkQuery(["MYMANUAL"]) });
    expect(state.secretCalls).toBe(calls); // cache âm 30 s
  });

  it("không cấu hình bí mật (tính năng tắt): không che, không chặn, không 503", async () => {
    delete process.env.HV_WP_SHARED_SECRET;
    resetPromoSecretsForTest();
    expect((await typed("ANYTHING1")).status).toBe(200);
    expect(state.secretCalls).toBe(0);
  });
});

describe("kiểm tra chặt tham số và chủ đơn", () => {
  const expectRejected = async (res: Response) => {
    expect(res.status).toBe(422);
    expect(state.upstream).toHaveLength(0);
  };

  it("bookingCode / merchant_code bị trùng khoá trong query → 422 (không để apigw đọc khác ta)", async () => {
    await expectRejected(await post(["promotion", "check-promotions"], { search: `${checkQuery([TOKEN])}&bookingCode=${OUT}` }));
    await expectRejected(await post(["promotion", "check-promotions"], { search: `${checkQuery([TOKEN])}&merchant_code=99` }));
    await expectRejected(await post(["bookings"], { body: bookingBody([TOKEN, TOKEN]).replace('"note":""', `"note":"","order_code":"${OUT}"`) }));
  });

  it("token chỉ được ở codes[i][promotion] / seats[i].code: ở khoá khác, trong ghi chú, hoặc khoá JSON → 422", async () => {
    await expectRejected(await post(["promotion", "check-promotions"], { search: `${checkQuery([TOKEN])}&note=${encodeURIComponent(TOKEN)}` }));
    await expectRejected(await post(["bookings"], { body: bookingBody([TOKEN, TOKEN]).replace('"note":""', `"note":"${TOKEN}"`) }));
    await expectRejected(await post(["bookings"], { body: bookingBody([TOKEN, undefined]).replace('"is_combo":0', `"is_combo":0,"${TOKEN}":1`) }));
  });

  it("đơn chiều đi của khách khác (SĐT khác, id người tạo khác) → 422", async () => {
    state.orders[OUT] = { ...(order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: true, phone: "0911111111" }) as object) };
    const d = (state.orders[OUT] as { data: { tickets: Array<{ user_created: { id: number } }> } }).data;
    d.tickets.forEach((tk) => (tk.user_created = { id: 999 }));
    await expectRejected(await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) }));
  });

  it("đã trả phải đúng payment.type === 1; đơn huỷ (status 3) bị loại", async () => {
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: true, paymentType: 2 });
    await expectRejected(await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) }));
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-10-31 07:00:00", { paid: true, cancelled: true });
    await expectRejected(await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) }));
  });

  it("apigw lỗi khi đọc đơn (5xx/hết giờ) → 503 chứ không phải 422", async () => {
    server.use(http.get(`${MOCK}/api/bookings/${OUT}`, () => new HttpResponse(null, { status: 500 })));
    const res = await post(["promotion", "check-promotions"], { search: checkQuery([TOKEN]) });
    expect(res.status).toBe(503);
    expect(state.upstream).toHaveLength(0);
  });
});

