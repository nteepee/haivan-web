import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fallbackJson from "@/content/booking-config-fallback.json";
import { server } from "../../test/msw-server";
import { bookingConfigSchema } from "@/schemas/booking-config";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const WP = "http://wp.test";
const URL_CONFIG = `${WP}/wp-json/haivan-web/v1/booking-config`;

/** Module mới mỗi test: kho "bản tốt" nằm ở module. */
async function load() {
  vi.resetModules();
  vi.stubEnv("WP_LAYOUT_URL", `${WP}/wp-json/haivan-web/v1/layout`);
  return import("./booking-config-source");
}

const wpConfig = (patch: Record<string, unknown> = {}) => ({ ...structuredClone(fallbackJson), ...patch });
const PROMO = {
  id: 7,
  type: "roundtrip",
  corridor: "hn-moc",
  direction: "ba",
  book_from: "2026-10-29",
  book_to: null,
  travel_from: null,
  travel_to: null,
  weekdays: null,
  hours: null,
  book_ahead_minutes: null,
  seats: { min: 1, max: 9 },
  per_seat_vnd: 20000,
  tiers: [],
  code: "TESTHIDDEN1",
  label: { vi: "Giảm 20k/ghế chiều về", en: "20k off" },
  badge: { vi: "Khứ hồi -20k", en: "Return -20k" },
};

describe("bản dự phòng trong repo", () => {
  it("đúng hợp đồng: 4 tuyến chính theo thứ tự, trạm đủ, không có chương trình", () => {
    const config = bookingConfigSchema.parse(fallbackJson);
    expect(config.corridors.map((c) => c.id)).toEqual(["sg-vt", "hn-db", "hn-moc", "hn-sl"]);
    expect(config.promos).toEqual([]);
    const moc = config.corridors.find((c) => c.id === "hn-moc")!;
    expect(moc.stops.a.map((s) => s.id)).toEqual(["my-dinh", "nguyen-tuan", "chau-van-liem"]);
    expect(moc.stops.b).toHaveLength(8);
    expect(config.corridors.find((c) => c.id === "hn-db")!.sleeper).toBe(true);
    // SG–VT: trạm sân bay đổi toạ độ tìm chuyến, trạm Q1 dùng đầu tuyến.
    const sg = config.corridors[0];
    expect(sg.stops.a.find((s) => s.id === "q1")!.point).toBeNull();
    expect(sg.stops.a.find((s) => s.id === "tsn-t1")!.point).toMatchObject({ lat: 10.8184631, lng: 106.6588245 });
  });
});

describe("getBookingConfig", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("không cấu hình WP → bản dự phòng, không gọi mạng", async () => {
    vi.resetModules();
    vi.stubEnv("WP_LAYOUT_URL", "");
    vi.stubEnv("WP_ROUTE_URL", "");
    const { getBookingConfig } = await import("./booking-config-source");
    expect((await getBookingConfig()).corridors).toHaveLength(4);
  });

  it("WP trả cấu hình hợp lệ → dùng nó (kèm chương trình)", async () => {
    const { getBookingConfig } = await load();
    server.use(http.get(URL_CONFIG, () => HttpResponse.json(wpConfig({ corridors: [fallbackJson.corridors[2]], promos: [PROMO] }))));
    const config = await getBookingConfig();
    expect(config.corridors.map((c) => c.id)).toEqual(["hn-moc"]);
    expect(config.promos.map((p) => p.id)).toEqual([7]);
    // mã thật không bao giờ nằm trong cấu hình đưa ra
    expect(JSON.stringify(config)).not.toContain("TESTHIDDEN1");
  });

  it("WP mới chỉ gửi has_code (không có code): hợp lệ, hiện nhãn; chương trình không có mã (has_code false, không code) bị bỏ", async () => {
    const { getBookingConfig } = await load();
    const { code, ...noCode } = PROMO;
    void code;
    server.use(http.get(URL_CONFIG, () => HttpResponse.json(wpConfig({ promos: [{ ...noCode, has_code: true }, { ...noCode, id: 8, has_code: false }] }))));
    const config = await getBookingConfig();
    expect(config.promos.map((p) => p.id)).toEqual([7]);
    expect(JSON.stringify(config)).not.toMatch(/"code":"/);
    expect(config.promos[0]).not.toHaveProperty("code");
  });

  it("WP 404 (endpoint chưa có) → dự phòng, lặng lẽ (không cảnh báo)", async () => {
    const { getBookingConfig } = await load();
    server.use(http.get(URL_CONFIG, () => HttpResponse.json({ code: "rest_no_route" }, { status: 404 })));
    expect((await getBookingConfig()).corridors).toHaveLength(4);
    expect(warn).not.toHaveBeenCalled();
  });

  it("WP lỗi (5xx, mạng, sai hợp đồng) sau khi thành công → giữ bản WP gần nhất; chưa từng thành công → dự phòng", async () => {
    const { getBookingConfig } = await load();
    server.use(http.get(URL_CONFIG, () => new HttpResponse("oops", { status: 503 })));
    expect((await getBookingConfig()).promos).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);

    server.use(http.get(URL_CONFIG, () => HttpResponse.json(wpConfig({ promos: [PROMO] }))));
    expect((await getBookingConfig()).promos).toHaveLength(1);
    for (const failing of [() => new HttpResponse(null, { status: 500 }), () => HttpResponse.error(), () => HttpResponse.json({ version: 2 })]) {
      server.use(http.get(URL_CONFIG, failing));
      expect((await getBookingConfig()).promos).toHaveLength(1);
    }
  });

  it("một chương trình hoặc một tuyến sai hợp đồng bị bỏ, phần còn lại vẫn dùng", async () => {
    const { getBookingConfig } = await load();
    const broken = { ...PROMO, id: 8, code: "", type: "combo" };
    const unknownType = { ...PROMO, id: 9, type: "flash" };
    server.use(http.get(URL_CONFIG, () => HttpResponse.json(wpConfig({ promos: [PROMO, broken, unknownType], corridors: [fallbackJson.corridors[2], { id: "x" }] }))));
    const config = await getBookingConfig();
    expect(config.promos.map((p) => p.id)).toEqual([7]);
    expect(config.corridors.map((c) => c.id)).toEqual(["hn-moc"]);
    // phần tử bị bỏ được ghi nhật ký (một lần) để MKT biết vì sao không hiện
    const messages = (warn.mock.calls as unknown[][]).map((c) => String(c[0]));
    expect(messages.some((m: string) => m.includes("bỏ promo 8"))).toBe(true);
    expect(messages.some((m: string) => m.includes("bỏ promo 9"))).toBe(true);
    expect(messages.some((m: string) => m.includes("bỏ corridor x"))).toBe(true);
  });
});
