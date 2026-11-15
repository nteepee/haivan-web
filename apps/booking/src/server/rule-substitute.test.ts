// @vitest-environment node
import { sealData } from "iron-session";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fallbackJson from "@/content/booking-config-fallback.json";
import { server } from "../../test/msw-server";
import { POST as gwPost } from "@/app/api/hv/gw/[...path]/route";
import { stringifyQuery } from "@/lib/qs";
import { SESSION_COOKIE } from "./session";
import { resetPromoSecretsForTest } from "./promo-secrets";

/**
 * Luật giá v2 ở BFF: token `@auto:<post_id>:<đơn>` chỉ được đổi thành mã ERP khi engine (chạy trên dữ liệu đơn thật) chọn đúng luật đó.
 * Luật đầy đủ + SĐT thử đến từ route bí mật `/promo-codes` của WP.
 */
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const ORIGIN = "http://127.0.0.1:3100";
const MOCK = "http://127.0.0.1:4010";
const WP = "http://wp.test";
const SECRET = "test-secret-test-secret-test-secret-123";
const WP_SECRET = "wp-shared-secret";
const OUT = "B02OUTBOUND1";
const RET = "B02RETURN001";
const MY_DINH = { lat: 21.0284297, lng: 105.7782687 };
const MOC_CHAU = { lat: 20.8461723, lng: 104.6415738 };
const hnMoc = { ...fallbackJson.corridors.find((c) => c.id === "hn-moc")!, landing: { ab: "my-dinh/moc-chau", ba: "moc-chau/my-dinh" } };

const display = { label: { vi: "Ưu đãi", en: "Offer" }, badge: { vi: "Ưu đãi", en: "Offer" } };
const baseRule = (id: string, patch: Record<string, unknown>) => ({ schema: 2, id, title: id, status: "on", scope: { corridors: ["hn-moc"] }, display, ...patch });
const RULES: Record<number, Record<string, unknown>> = {
  500: baseRule("kh-moc", { who: { linked_order: { reverse: true, same_customer: true } }, effect: { seat_off_vnd: 20_000 } }),
  501: baseRule("nhom-moc", { exclusive_group: "nhom", who: { seats: { min: 2, max: 2 } }, effect: { total_tiers: [{ seats: 2, total_vnd: 300_000 }] } }),
  502: baseRule("truc-tiep", { exclusive_group: "tt", priority: 300, effect: { seat_off_vnd: 10_000 }, apply: { settlement: "erp_direct" } }),
  503: baseRule("co-suat", { exclusive_group: "cs", effect: { seat_off_vnd: 10_000 }, quota: { per_trip: 5 } }),
  504: baseRule("thu-nghiem", { exclusive_group: "tn", status: "test", effect: { seat_off_vnd: 15_000 } }),
  505: baseRule("chi-qr", { exclusive_group: "qr", effect: { seat_off_vnd: 5_000 }, who: { payments: ["qr"] } }),
};
const CODES = Object.fromEntries(Object.keys(RULES).map((id) => [id, `RULECODE${id}`]));

const order = (code: string, dep: typeof MY_DINH, dest: typeof MY_DINH, time: string, opts: { paid?: boolean; tickets?: number; phone?: string } = {}) => ({
  data: {
    id: 1,
    code,
    merchant_code: "17",
    status: { type: 1, type_name: "x" },
    price: 400000,
    customer: { phone: opts.phone ?? "0900000000", name: "Khach" },
    payment: opts.paid ? { type: 1, type_name: "Đã thanh toán" } : { type: 0, type_name: "Chưa thanh toán" },
    tickets: Array.from({ length: opts.tickets ?? 2 }, (_, i) => ({
      id: i + 1,
      code: `V${code}${i}`,
      name: String(i + 3),
      price: 200000,
      status: { type: 2, type_name: "x" },
      user_created: { id: 827708 },
      departure: { id: 11, name: "d", ...dep },
      destination: { id: 12, name: "e", ...dest },
      trip: { id: 1, departure_time: time, product: { name: "Luxury" } },
    })),
  },
});

const state = {
  upstream: [] as Array<{ path: string; search: string; body?: string }>,
  orders: {} as Record<string, unknown>,
  testers: [] as string[],
  active: Object.keys(RULES).map(Number),
  /** Sổ hạn mức giả: rule|order → { seats, state }. */
  ledger: new Map<string, { seats: number; state: string; trip: string }>(),
  ledgerCalls: [] as string[],
  /** Phản hồi check-promotions giả (mặc định: không có vé khớp → không đối chiếu). */
  checkReply: null as unknown,
  direct: [] as unknown[],
  directOk: true,
};
const ERP_DIRECT = "http://erp-direct.test/settle";
const envBackup = { ...process.env };

beforeEach(() => {
  Object.assign(process.env, { APIGW_URL: MOCK, PUBLIC_ORIGIN: ORIGIN, SESSION_SECRET: SECRET, WP_LAYOUT_URL: `${WP}/wp-json/haivan-web/v1/layout`, HV_WP_SHARED_SECRET: WP_SECRET });
  delete process.env.HV_LIVE_BACKEND;
  delete process.env.HV_LIVE_WRITES;
  delete process.env.E2E;
  resetPromoSecretsForTest();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T08:00:00+07:00"));
  state.upstream = [];
  state.testers = [];
  state.active = Object.keys(RULES).map(Number);
  state.ledger = new Map();
  state.ledgerCalls = [];
  state.direct = [];
  state.checkReply = null;
  state.directOk = true;
  delete process.env.HV_ERP_DIRECT_URL;
  delete process.env.HV_ERP_DIRECT_SECRET;
  state.orders = {
    [OUT]: order(OUT, MY_DINH, MOC_CHAU, "2026-11-01 07:00:00", { paid: true }),
    [RET]: order(RET, MOC_CHAU, MY_DINH, "2026-11-03 09:00:00"),
  };
  const rules = () => state.active.map((id) => ({ post_id: id, rule: RULES[id] }));
  server.use(
    http.get(`${WP}/wp-json/haivan-web/v1/booking-config`, () =>
      HttpResponse.json({ ...fallbackJson, version: 2, corridors: fallbackJson.corridors.map((c) => (c.id === "hn-moc" ? hnMoc : c)), promos: [], rules: rules().map(({ post_id, rule }) => ({ post_id, rule: { ...rule, quota: undefined } })) }),
    ),
    http.get(`${WP}/wp-json/haivan-web/v1/promo-codes`, ({ request }) =>
      request.headers.get("x-hv-secret") === WP_SECRET ? HttpResponse.json({ codes: CODES, mask: [], rules: rules(), testers: state.testers }) : new HttpResponse(null, { status: 403 }),
    ),
    http.get(`${MOCK}/api/bookings/:code`, ({ params }) => {
      const body = state.orders[String(params.code)];
      return body ? HttpResponse.json(body) : HttpResponse.json({ message: "Not found" }, { status: 404 });
    }),
    http.post(`${WP}/wp-json/haivan-web/v1/rule-quota/:action`, async ({ request, params }) => {
      if (request.headers.get("x-hv-secret") !== WP_SECRET) return new HttpResponse(null, { status: 403 });
      const b = (await request.json()) as { rule_id?: string; order_code: string; seats?: number; trip_key?: string; limits?: { per_trip?: number } };
      state.ledgerCalls.push(`${String(params.action)}:${b.rule_id ?? "*"}:${b.order_code}`);
      if (params.action === "reserve") {
        const used = [...state.ledger.entries()].filter(([k, v]) => k.startsWith(`${b.rule_id}|`) && !k.endsWith(`|${b.order_code}`) && v.trip === b.trip_key && v.state !== "released").reduce((n, [, v]) => n + v.seats, 0);
        if (b.limits?.per_trip && used + (b.seats ?? 0) > b.limits.per_trip) return HttpResponse.json({ ok: false, reason: "quota" });
        state.ledger.set(`${b.rule_id}|${b.order_code}`, { seats: b.seats ?? 0, state: "held", trip: b.trip_key ?? "" });
        return HttpResponse.json({ ok: true });
      }
      for (const [k, v] of state.ledger) if (k.endsWith(`|${b.order_code}`) && (!b.rule_id || k.startsWith(`${b.rule_id}|`))) v.state = params.action === "commit" ? "committed" : "released";
      return HttpResponse.json({ ok: true });
    }),
    http.post(ERP_DIRECT, async ({ request }) => {
      state.direct.push(await request.json());
      return HttpResponse.json(state.directOk ? { ok: true } : { ok: false, message: "form ERP đổi" });
    }),
    http.post(`${MOCK}/api/bookings`, async ({ request }) => {
      state.upstream.push({ path: "bookings", search: "", body: await request.text() });
      return HttpResponse.json({ data: { code: RET } });
    }),
    http.post(`${MOCK}/api/promotion/check-promotions`, ({ request }) => {
      state.upstream.push({ path: "promotion/check-promotions", search: new URL(request.url).search });
      return HttpResponse.json(state.checkReply ?? { message: "ok", codes: [{ code: "x", ticketCode: "V1", ticketPrice: "200000", priceDiscount: 20000 }] });
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
const check = (codes: string[], booking = RET, tickets?: string[]) =>
  `?${stringifyQuery({ merchant_code: "17", bookingCode: booking, codes: codes.map((promotion, i) => ({ promotion, ticketCode: tickets?.[i] ?? `V${i + 1}`, ticketPrice: 200000 })), channel_code: "WEBHAIVAN" })}`;
async function apply(codes: string[], booking = RET, tickets?: string[]) {
  const search = check(codes, booking, tickets);
  const headers = { cookie: await cookie(), "content-type": "application/json", "x-hv-req": "1", origin: ORIGIN, "sec-fetch-site": "same-origin", "x-hv-query": search.slice(1) };
  const res = await gwPost(new NextRequest(`${ORIGIN}/api/hv/gw/promotion/check-promotions${search}`, { method: "POST", headers }), { params: Promise.resolve({ path: ["promotion", "check-promotions"] }) });
  return { status: res.status, text: await res.text() };
}
async function book(codes: string[], booking = RET) {
  const body = JSON.stringify({ pick_up: { address: "A" }, drop_off: { address: "B" }, trip: { trip_id: 1 }, seats: codes.map((code, i) => ({ id: i + 1, code, is_reward: false })), order_code: booking, merchant_code: "17", note: "", is_combo: 0 });
  const headers = { cookie: await cookie(), "content-type": "application/json", "x-hv-req": "1", origin: ORIGIN, "sec-fetch-site": "same-origin" };
  const res = await gwPost(new NextRequest(`${ORIGIN}/api/hv/gw/bookings`, { method: "POST", body, headers }), { params: Promise.resolve({ path: ["bookings"] }) });
  return { status: res.status, text: await res.text() };
}

describe("luật giá v2 ở BFF", () => {
  it("khứ hồi: token với đơn chiều đi đã trả → đổi thành mã ERP của luật", async () => {
    const res = await apply([`@auto:500:${OUT}`, `@auto:500:${OUT}`]);
    expect(res.status).toBe(200);
    expect(state.upstream[0].search).toBe(check(["RULECODE500", "RULECODE500"]));
    expect(res.text).not.toContain("RULECODE500");
  });
  it("khứ hồi: đơn chiều đi chưa trả → 422, không gọi apigw", async () => {
    state.orders[OUT] = order(OUT, MY_DINH, MOC_CHAU, "2026-11-01 07:00:00", { paid: false });
    const res = await apply([`@auto:500:${OUT}`]);
    expect(res.status).toBe(422);
    expect(state.upstream).toHaveLength(0);
  });
  it("khứ hồi: khác khách → 422", async () => {
    state.orders[OUT] = { data: { ...order(OUT, MY_DINH, MOC_CHAU, "2026-11-01 07:00:00", { paid: true, phone: "0911111111" }).data, tickets: [] } };
    expect((await apply([`@auto:500:${OUT}`])).status).toBe(422);
  });
  it("combo nhóm: token gắn chính đơn đang đặt → đổi mã; gắn đơn khác → 422", async () => {
    state.orders[RET] = order(RET, MY_DINH, MOC_CHAU, "2026-11-03 09:00:00");
    expect((await apply([`@auto:501:${RET}`, `@auto:501:${RET}`])).status).toBe(200);
    expect(state.upstream[0].search).toBe(check(["RULECODE501", "RULECODE501"]));
    expect((await apply([`@auto:501:${OUT}`])).status).toBe(422);
  });
  it("combo nhóm: 3 vé không có bậc giá → 422", async () => {
    state.orders[RET] = order(RET, MY_DINH, MOC_CHAU, "2026-11-03 09:00:00", { tickets: 3 });
    expect((await apply([`@auto:501:${RET}`])).status).toBe(422);
  });
  it("luật ghi ERP trực tiếp chưa cấu hình dịch vụ → 422, không gọi apigw", async () => {
    expect((await apply([`@auto:502:${RET}`])).text).toContain("chưa áp được tự động");
    expect(state.upstream).toHaveLength(0);
  });
  it("hạn mức: giữ suất khi kiểm mã, chốt khi đặt vé thành công; hết suất → 422", async () => {
    expect((await apply([`@auto:503:${RET}`, `@auto:503:${RET}`])).status).toBe(200);
    expect(state.ledger.get(`co-suat|${RET}`)).toMatchObject({ seats: 2, state: "held" });
    expect((await book([`@auto:503:${RET}`, `@auto:503:${RET}`])).status).toBe(200);
    expect(state.ledger.get(`co-suat|${RET}`)?.state).toBe("committed");
    expect(state.upstream.at(-1)?.body).toContain('"code":"RULECODE503"');
    // Chuyến đã dùng 2/5: đơn khác 4 ghế → hết suất.
    const OTHER = "B02OTHER0001";
    state.orders[OTHER] = order(OTHER, MOC_CHAU, MY_DINH, "2026-11-03 09:00:00", { tickets: 4 });
    const full = await apply([`@auto:503:${OTHER}`, `@auto:503:${OTHER}`, `@auto:503:${OTHER}`, `@auto:503:${OTHER}`], OTHER);
    expect(full.status).toBe(422);
    expect(full.text).toContain("hết suất");
  });
  it("huỷ đơn thành công → trả suất", async () => {
    server.use(http.post(`${MOCK}/api/cancel-booking`, () => HttpResponse.json({ message: "ok" })));
    await apply([`@auto:503:${RET}`]);
    const headers = { cookie: await cookie(), "content-type": "application/json", "x-hv-req": "1", origin: ORIGIN, "sec-fetch-site": "same-origin" };
    const res = await gwPost(new NextRequest(`${ORIGIN}/api/hv/gw/cancel-booking`, { method: "POST", body: JSON.stringify({ order_code: RET, merchant_code: "17", type: 0 }), headers }), { params: Promise.resolve({ path: ["cancel-booking"] }) });
    expect(res.status).toBe(200);
    expect(state.ledger.get(`co-suat|${RET}`)?.state).toBe("released");
  });
  describe("ghi giảm trực tiếp ERP (dịch vụ đã cấu hình)", () => {
    beforeEach(() => {
      process.env.HV_ERP_DIRECT_URL = ERP_DIRECT;
      process.env.HV_ERP_DIRECT_SECRET = "erp-direct-secret-0001";
    });
    it("kiểm mã: BFF tự trả tiền giảm từ engine, không gọi apigw", async () => {
      const res = await apply([`@auto:502:${RET}`, `@auto:502:${RET}`], RET, [`V${RET}0`, `V${RET}1`]);
      expect(res.status).toBe(200);
      expect(state.upstream).toHaveLength(0);
      const body = JSON.parse(res.text) as { codes: Array<{ ticketCode: string; priceDiscount: number }> };
      expect(body.codes).toEqual([
        { code: "@auto:502", ticketCode: `V${RET}0`, ticketPrice: "200000", priceDiscount: 10000 },
        { code: "@auto:502", ticketCode: `V${RET}1`, ticketPrice: "200000", priceDiscount: 10000 },
      ]);
    });
    it("đặt vé: gỡ token khỏi seats[].code, apigw nhận đơn rồi ghi giảm ERP", async () => {
      const res = await book([`@auto:502:${RET}`, `@auto:502:${RET}`]);
      expect(res.status).toBe(200);
      expect(state.upstream.at(-1)?.body).not.toContain("@auto");
      expect(state.direct).toEqual([{ merchant: "17", order_code: RET, rule_id: "truc-tiep", note: "WEB truc-tiep", tickets: [{ ticket_code: `V${RET}0`, seat: "3", discount_vnd: 10000 }, { ticket_code: `V${RET}1`, seat: "4", discount_vnd: 10000 }] }]);
    });
    it("ghi ERP lỗi → 502 có hướng dẫn, không im lặng bán giá thường", async () => {
      state.directOk = false;
      const res = await book([`@auto:502:${RET}`]);
      expect(res.status).toBe(502);
      expect(res.text).toContain("1900 6763");
    });
  });
  it("đối chiếu tiền giảm ERP: khớp luật → 200; lệch → 422 và trả suất", async () => {
    const tickets = [`V${RET}0`, `V${RET}1`];
    state.checkReply = { message: "ok", codes: tickets.map((t) => ({ code: "x", ticketCode: t, ticketPrice: "200000", priceDiscount: 10000 })) };
    expect((await apply([`@auto:503:${RET}`, `@auto:503:${RET}`], RET, tickets)).status).toBe(200);
    state.checkReply = { message: "ok", codes: tickets.map((t) => ({ code: "x", ticketCode: t, ticketPrice: "200000", priceDiscount: 50000 })) };
    const drift = await apply([`@auto:503:${RET}`, `@auto:503:${RET}`], RET, tickets);
    expect(drift.status).toBe(422);
    expect(drift.text).toContain("chưa khớp");
    expect(state.ledger.get(`co-suat|${RET}`)?.state).toBe("released");
  });
  it("luật ràng buộc cách thanh toán chưa kiểm được lúc áp mã → 422", async () => {
    expect((await apply([`@auto:505:${RET}`])).text).toContain("chưa áp được tự động");
  });
  it("luật test chỉ áp cho SĐT thử", async () => {
    expect((await apply([`@auto:504:${RET}`])).status).toBe(422);
    state.testers = ["0900000000"];
    resetPromoSecretsForTest();
    expect((await apply([`@auto:504:${RET}`])).status).toBe(200);
  });
  it("luật đã tắt (không còn trong danh sách) → 422", async () => {
    state.active = [501];
    expect((await apply([`@auto:500:${OUT}`])).status).toBe(422);
  });
});
