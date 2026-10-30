import { describe, expect, it } from "vitest";
import tripsFixture from "../../test/fixtures/trips.json";
import { minTripPrice } from "./route-price";

const BASE = tripsFixture.data[0] as Record<string, unknown> & { price: object; route: object };
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
