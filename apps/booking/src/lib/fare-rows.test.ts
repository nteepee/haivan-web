import { describe, expect, it } from "vitest";
import tripsFixture from "../../test/fixtures/trips.json";
import { tripSchema, type Trip } from "@/schemas/trip";
import { buildFareRows } from "./fare-rows";

const BASE = tripSchema.parse(tripsFixture.data[0]);
const trip = (time: string, product: string, min: number, duration = "02h40"): Trip => ({
  ...BASE,
  time,
  duration,
  from: { ...BASE.from, reached_at: `2026-10-29 ${time}:00` },
  product: { ...BASE.product, name: product },
  price: { ...BASE.price, min, max: min, percent: 0, price_discount: undefined },
});

describe("buildFareRows: chỉ dữ liệu thật", () => {
  it("chưa có chuyến: hạng + giá từ bài WP, giờ chạy CMS, không có giờ xuất bến", () => {
    const rows = buildFareRows([{ name: "Royal", price_from: "485.000đ" }, { name: "Luxury" }], [], { complete: false, hours: "11" });
    expect(rows).toEqual([
      { name: "Royal", times: [], timesPartial: true, duration: "11h", minPrice: null, priceLabel: "485.000đ" },
      { name: "Luxury", times: [], timesPartial: true, duration: "11h", minPrice: null, priceLabel: null },
    ]);
  });

  it("đã tải hết chuyến: giờ xuất bến tăng dần không trùng, thời gian theo chuyến, giá thấp nhất theo hạng", () => {
    const rows = buildFareRows([{ name: "Luxury" }], [trip("19:00", "Luxury", 300000), trip("07:00", "Luxury", 250000), trip("07:00", "Royal", 400000, "02h30")], { complete: true, hours: null });
    expect(rows.map((r) => r.name)).toEqual(["Luxury", "Royal"]);
    expect(rows[0]).toMatchObject({ times: ["07:00", "19:00"], timesPartial: false, minPrice: 250000, duration: "02h40" });
    expect(rows[1]).toMatchObject({ times: ["07:00"], minPrice: 400000, duration: "02h30" });
  });

  it("chưa tải hết trang: không đưa giá thấp nhất (có thể sai), giờ chỉ là phần đầu", () => {
    const [row] = buildFareRows([], [trip("05:30", "Luxury", 250000)], { complete: false, hours: null });
    expect(row).toMatchObject({ minPrice: null, timesPartial: true, times: ["05:30"] });
  });
});
