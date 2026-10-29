import { describe, expect, it } from "vitest";
import tripsFixture from "../../test/fixtures/trips.json";
import { tripSchema, type Trip } from "@/schemas/trip";
import { applyTripFilters, bucketOf, classOptions, departureMinutes, displayPrice, EMPTY_FILTERS, isActive, isFiltering, toggleIn } from "./trip-filters";

const BASE = tripSchema.parse(tripsFixture.data[0]);

/** Chuyến mẫu: giờ đón, hạng, chỗ, giá chỉnh theo test (giữ nguyên các trường còn lại của fixture thật). */
function trip(id: number, time: string, over: { product?: string; seats?: number; min?: number; max?: number; percent?: number; discount?: number; showPrice?: number } = {}): Trip {
  return {
    ...BASE,
    id,
    time,
    from: { ...BASE.from, reached_at: `2026-10-29 ${time}:00` },
    product: { ...BASE.product, name: over.product ?? "Luxury" },
    available_seats: over.seats ?? 11,
    price: { ...BASE.price, min: over.min ?? 200000, max: over.max ?? over.min ?? 200000, percent: over.percent ?? 0, price_discount: over.discount },
    route: { ...BASE.route, show_price: over.showPrice ?? 1 },
  };
}

const ids = (trips: Trip[]) => trips.map((t) => t.id);

describe("khung giờ đi", () => {
  it("biên nửa mở: 00:00 và 05:59 sáng sớm, 06:00 sáng, 11:00 trưa, 14:00 chiều, 18:00 tối, 23:59 tối", () => {
    const at = (hhmm: string) => bucketOf(departureMinutes(trip(1, hhmm))!);
    expect([at("00:00"), at("05:59"), at("06:00"), at("10:59"), at("11:00"), at("13:59"), at("14:00"), at("17:59"), at("18:00"), at("23:59")]).toEqual([
      "dawn", "dawn", "morning", "morning", "noon", "noon", "afternoon", "afternoon", "evening", "evening",
    ]);
  });

  it("giờ không đọc được: bị loại khi có lọc giờ, không lọc thì giữ", () => {
    const bad = { ...trip(1, "08:00"), time: "", from: { ...BASE.from, reached_at: undefined } } as Trip;
    expect(departureMinutes(bad)).toBeNull();
    expect(applyTripFilters([bad], { ...EMPTY_FILTERS, buckets: ["morning"] })).toEqual([]);
    expect(applyTripFilters([bad], EMPTY_FILTERS)).toEqual([bad]);
  });
});

describe("applyTripFilters", () => {
  const list = [trip(1, "05:30", { product: "Economy", seats: 2, min: 150000 }), trip(2, "07:00", { product: "Luxury", seats: 11, min: 250000 }), trip(3, "12:15", { product: "Luxury", seats: 5, min: 200000 }), trip(4, "19:00", { product: "Royal", seats: 0, min: 400000 })];

  it("không lọc: trả đúng thứ tự gốc, bản sao mới", () => {
    const out = applyTripFilters(list, EMPTY_FILTERS);
    expect(ids(out)).toEqual([1, 2, 3, 4]);
    expect(out).not.toBe(list);
  });

  it("OR trong nhóm giờ, AND giữa giờ và hạng", () => {
    expect(ids(applyTripFilters(list, { ...EMPTY_FILTERS, buckets: ["dawn", "noon"] }))).toEqual([1, 3]);
    expect(ids(applyTripFilters(list, { ...EMPTY_FILTERS, classes: ["Luxury", "Royal"] }))).toEqual([2, 3, 4]);
    expect(ids(applyTripFilters(list, { ...EMPTY_FILTERS, buckets: ["morning", "noon"], classes: ["Luxury"] }))).toEqual([2, 3]);
    expect(applyTripFilters(list, { ...EMPTY_FILTERS, buckets: ["afternoon"] })).toEqual([]);
  });

  it("sắp xếp giờ sớm nhất, giá tăng/giảm, còn nhiều chỗ; không đổi mảng đầu vào", () => {
    const shuffled = [list[2], list[3], list[0], list[1]];
    expect(ids(applyTripFilters(shuffled, { ...EMPTY_FILTERS, sort: "time" }))).toEqual([1, 2, 3, 4]);
    expect(ids(applyTripFilters(list, { ...EMPTY_FILTERS, sort: "price-asc" }))).toEqual([1, 3, 2, 4]);
    expect(ids(applyTripFilters(list, { ...EMPTY_FILTERS, sort: "price-desc" }))).toEqual([4, 2, 3, 1]);
    expect(ids(applyTripFilters(list, { ...EMPTY_FILTERS, sort: "seats" }))).toEqual([2, 3, 1, 4]);
    expect(ids(shuffled)).toEqual([3, 4, 1, 2]);
  });

  it("bằng nhau giữ thứ tự gốc; tuyến ẩn giá xuống cuối khi sắp theo giá", () => {
    const tie = [trip(1, "08:00", { min: 200000 }), trip(2, "09:00", { min: 200000 }), trip(3, "10:00", { showPrice: 0 }), trip(4, "11:00", { min: 100000 })];
    expect(ids(applyTripFilters(tie, { ...EMPTY_FILTERS, sort: "price-asc" }))).toEqual([4, 1, 2, 3]);
    expect(ids(applyTripFilters(tie, { ...EMPTY_FILTERS, sort: "price-desc" }))).toEqual([1, 2, 4, 3]);
  });

  it("lọc kèm sắp xếp: lọc trước, sắp sau", () => {
    expect(ids(applyTripFilters(list, { buckets: [], classes: ["Luxury"], sort: "price-asc" }))).toEqual([3, 2]);
  });
});

describe("giá hiển thị, hạng xe, trạng thái", () => {
  it("giá giảm lấy price_discount; khoảng giá lấy giá thấp nhất; ẩn giá = null", () => {
    expect(displayPrice(trip(1, "08:00", { min: 230000, percent: 13, discount: 200000 }))).toBe(200000);
    expect(displayPrice(trip(1, "08:00", { min: 150000, max: 250000 }))).toBe(150000);
    expect(displayPrice(trip(1, "08:00", { min: 200000 }))).toBe(200000);
    expect(displayPrice(trip(1, "08:00", { showPrice: 0 }))).toBeNull();
  });

  it("classOptions: hạng xe khác nhau theo thứ tự xuất hiện", () => {
    expect(classOptions([trip(1, "08:00", { product: "Royal" }), trip(2, "09:00", { product: "Luxury" }), trip(3, "10:00", { product: "Royal" })])).toEqual(["Royal", "Luxury"]);
  });

  it("isFiltering chỉ tính giờ/hạng; isActive tính cả sắp xếp; toggleIn bật tắt", () => {
    expect(isFiltering({ ...EMPTY_FILTERS, sort: "time" })).toBe(false);
    expect(isActive({ ...EMPTY_FILTERS, sort: "time" })).toBe(true);
    expect(isActive(EMPTY_FILTERS)).toBe(false);
    expect(toggleIn(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIn(["a", "b"], "a")).toEqual(["b"]);
  });
});
