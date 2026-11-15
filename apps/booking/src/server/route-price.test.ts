import { afterEach, describe, expect, it, vi } from "vitest";
import tripsFixture from "../../test/fixtures/trips.json";
import { classPrice, minTripPrice, routePricesToday, tripPrices } from "./route-price";
import { callApigw } from "./upstream";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("./upstream", () => ({ callApigw: vi.fn() }));

const BASE = tripsFixture.data[0] as Record<string, unknown> & { price: object; route: object; product: object };
const trip = (price: object, showPrice = 1, seats = 5) => ({ ...BASE, available_seats: seats, price: { ...BASE.price, ...price }, route: { ...BASE.route, show_price: showPrice } });

describe("minTripPrice", () => {
  it("lấy giá khách thực trả thấp nhất (giá sau giảm), bỏ chuyến ẩn giá, hết chỗ, giá 0 và dữ liệu hỏng", () => {
    const items = [
      trip({ min: 230000, max: 230000, percent: 0 }),
      trip({ min: 200000, max: 230000, percent: 13, price_discount: 200000 }),
      trip({ min: 100000, max: 100000, percent: 0 }, 0),
      trip({ min: 150000, max: 150000, percent: 0 }, 1, 0), // hết chỗ
      trip({ min: 0, max: 0, percent: 0 }),
      { id: "hỏng" },
    ];
    expect(minTripPrice(items)).toBe(200000);
  });

  it("không có chuyến hợp lệ → null (trang ẩn giá)", () => {
    expect(minTripPrice([])).toBeNull();
    expect(minTripPrice([{ id: 1 }])).toBeNull();
  });
});

describe("tripPrices / classPrice", () => {
  const withClass = (name: string, min: number, seats = 5, code = name.toUpperCase()) => ({ ...BASE, available_seats: seats, product: { ...BASE.product, name, code }, price: { ...BASE.price, min, max: min, percent: 0 }, route: { ...BASE.route, show_price: 1 } });
  it("giá thấp nhất theo hạng, bỏ chuyến hết chỗ; khớp tên WP Royal/Luxury/Eco", () => {
    const p = tripPrices([withClass("Luxury", 230000), withClass("Luxury", 200000), withClass("Royal", 230000), withClass("Economy", 150000, 0)]);
    expect(p.min).toBe(200000);
    expect(p.byClass).toEqual({ Luxury: 200000, LUXURY: 200000, Royal: 230000, ROYAL: 230000 });
    expect(classPrice(p, "Royal")).toBe(230000);
    expect(classPrice(p, "luxury")).toBe(200000);
    expect(classPrice(p, "Eco")).toBeNull();
  });

  it("ERP còn tên cũ (Cao cấp / Tiết kiệm / Siêu rẻ): khớp tên WP Royal/Luxury/Eco qua mã hạng", () => {
    const p = tripPrices([withClass("Cao cấp", 450000, 5, "ROYAL"), withClass("Tiết kiệm", 380000, 5, "LUXURY"), withClass("Siêu rẻ", 300000, 5, "ECONOMY")]);
    expect(classPrice(p, "Royal")).toBe(450000);
    expect(classPrice(p, "Luxury")).toBe(380000);
    expect(classPrice(p, "Eco")).toBe(300000);
  });
});

describe("routePricesToday", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(callApigw).mockReset();
  });
  const page = (items: unknown[]) => new Response(JSON.stringify({ ...tripsFixture, data: items, meta: { ...tripsFixture.meta, last_page: 1 } }));
  const dateOf = (call: unknown[]) => new URLSearchParams(String((call[0] as { search: string }).search)).get("date");

  it("hôm nay hết chuyến còn đặt được (xe đêm đã xuất bến) → lấy giá ngày mai", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-15T15:50:00Z") }); // 22:50 giờ VN
    vi.mocked(callApigw).mockImplementation(async (req) =>
      new URLSearchParams(String(req.search)).get("date") === "2026-11-16" ? page([trip({ min: 450000, max: 450000, percent: 0 })]) : page([trip({ min: 450000, max: 450000, percent: 0 }, 1, 0)]),
    );
    const prices = await routePricesToday({ lat: 21.03, lng: 105.78 }, { lat: 21.4, lng: 103.02 });
    expect(vi.mocked(callApigw).mock.calls.map(dateOf)).toEqual(["2026-11-15", "2026-11-16"]);
    expect(prices.min).toBe(450000);
  });

  it("hôm nay còn chuyến → không hỏi ngày mai", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-15T01:00:00Z") });
    vi.mocked(callApigw).mockImplementation(async () => page([trip({ min: 210000, max: 210000, percent: 0 })]));
    const prices = await routePricesToday({ lat: 10.77, lng: 106.7 }, { lat: 10.35, lng: 107.08 });
    expect(vi.mocked(callApigw).mock.calls.map(dateOf)).toEqual(["2026-11-15"]);
    expect(prices.min).toBe(210000);
  });
});
