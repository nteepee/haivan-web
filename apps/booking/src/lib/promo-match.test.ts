import { describe, expect, it } from "vitest";
import { COMBO_PROMO, makePromo, ROUNDTRIP_PROMO, withPromos } from "../../test/booking-config";
import { comboPromoFor, comboTierFor, roundtripPromoForOutbound, roundtripPromoForReturnLeg, type ComboContext, type TripWindow } from "./promo-match";

/** 2026-10-29 10:00 giờ VN (thứ năm). */
const NOW = Date.parse("2026-10-29T03:00:00Z");
const ctx = (patch: Partial<ComboContext> = {}): ComboContext => ({
  corridorId: "sg-vt",
  chieu: "ab",
  travelDate: "2026-10-31",
  departure: "09:00",
  seatCount: 2,
  nowMs: NOW,
  ...patch,
});
const config = withPromos([ROUNDTRIP_PROMO, COMBO_PROMO]);

const LABEL = { seatCount: 1, nowMs: NOW };
const trip = (patch: Partial<TripWindow> = {}): TripWindow => ({ travelDate: "2026-10-31", departure: "09:00", seatCount: 2, nowMs: NOW, ...patch });

describe("khứ hồi", () => {
  it("nhãn ở form: chiều đi ab khớp chương trình có chiều về ba; chiều đi ba thì không", () => {
    expect(roundtripPromoForOutbound(config, "hn-moc", "ab", LABEL)?.id).toBe(10);
    expect(roundtripPromoForOutbound(config, "hn-moc", "ba", LABEL)).toBeNull();
    expect(roundtripPromoForOutbound(config, "hn-sl", "ab", LABEL)).toBeNull();
  });

  it("direction both khớp cả hai chiều; chương trình hết hạn đặt hoặc chưa tới ngày thì không", () => {
    const both = withPromos([makePromo({ type: "roundtrip", corridor: "hn-moc" })]);
    expect(roundtripPromoForOutbound(both, "hn-moc", "ba", LABEL)).not.toBeNull();
    const expired = withPromos([makePromo({ type: "roundtrip", corridor: "hn-moc", book_to: "2026-10-28" })]);
    expect(roundtripPromoForOutbound(expired, "hn-moc", "ab", LABEL)).toBeNull();
    const future = withPromos([makePromo({ type: "roundtrip", corridor: "hn-moc", book_from: "2026-10-30" })]);
    expect(roundtripPromoForOutbound(future, "hn-moc", "ab", LABEL)).toBeNull();
  });

  describe("cùng điều kiện ngày/thứ/giờ/đặt trước/ghế như combo", () => {
    const rt = (patch: Record<string, unknown>) => withPromos([makePromo({ type: "roundtrip", corridor: "hn-moc", direction: "ba", ...patch })]);

    it("nhãn với ngày về đã chọn: theo travel_from/to và thứ; ngoài ra thì ẩn", () => {
      const c = rt({ travel_from: "2026-11-05", travel_to: "2026-11-30", weekdays: [6, 7] });
      const at = (returnDate: string) => roundtripPromoForOutbound(c, "hn-moc", "ab", { returnDate, seatCount: 1, nowMs: NOW });
      expect(at("2026-11-07")).not.toBeNull(); // thứ bảy trong khoảng
      expect(at("2026-11-09")).toBeNull(); // thứ hai
      expect(at("2026-11-01")).toBeNull(); // trước travel_from
      expect(at("2026-12-05")).toBeNull(); // sau travel_to
    });

    it("chưa chọn ngày về: hiện nếu có ít nhất một ngày trong khoảng đủ điều kiện", () => {
      const c = rt({ travel_from: "2026-11-05", travel_to: "2026-11-05" });
      expect(roundtripPromoForOutbound(c, "hn-moc", "ab", { range: { min: "2026-10-30", max: "2026-11-10" }, seatCount: 1, nowMs: NOW })).not.toBeNull();
      expect(roundtripPromoForOutbound(c, "hn-moc", "ab", { range: { min: "2026-11-06", max: "2026-11-20" }, seatCount: 1, nowMs: NOW })).toBeNull();
    });

    it("đặt trước: ngày về hôm nay mà chuyến muộn nhất vẫn không kịp thì ẩn; số vé ngoài khoảng thì ẩn", () => {
      const c = rt({ book_ahead_minutes: 24 * 60 * 2 });
      expect(roundtripPromoForOutbound(c, "hn-moc", "ab", { returnDate: "2026-10-30", seatCount: 1, nowMs: NOW })).toBeNull();
      expect(roundtripPromoForOutbound(c, "hn-moc", "ab", { returnDate: "2026-11-02", seatCount: 1, nowMs: NOW })).not.toBeNull();
      expect(roundtripPromoForOutbound(rt({ seats: { min: 2, max: 4 } }), "hn-moc", "ab", { returnDate: "2026-11-02", seatCount: 1, nowMs: NOW })).toBeNull();
    });

    it("áp ở chuyến chiều về cụ thể: đủ bộ điều kiện combo (giờ xuất bến, đặt trước, thứ, số ghế)", () => {
      const c = rt({ hours: { from: "06:00", to: "12:00" }, weekdays: [6], book_ahead_minutes: 60, seats: { min: 1, max: 3 } });
      const leg = (patch: Partial<TripWindow>) => roundtripPromoForReturnLeg(c, "hn-moc", "ba", trip({ travelDate: "2026-10-31", ...patch }));
      expect(leg({})).not.toBeNull(); // thứ bảy 09:00, 2 ghế
      expect(leg({ departure: "13:00" })).toBeNull();
      expect(leg({ travelDate: "2026-11-01" })).toBeNull(); // chủ nhật
      expect(leg({ seatCount: 4 })).toBeNull();
      expect(leg({ departure: null })).toBeNull();
    });
  });

  it("áp ở xác nhận: theo chiều của chính chuyến chiều về", () => {
    expect(roundtripPromoForReturnLeg(config, "hn-moc", "ba", trip())?.id).toBe(10);
    expect(roundtripPromoForReturnLeg(config, "hn-moc", "ab", trip())).toBeNull();
  });
});

describe("combo", () => {
  it("khớp khi tuyến, chiều, ngày, thứ, giờ, đặt trước và số ghế đều đạt", () => {
    expect(comboPromoFor(config, ctx())?.id).toBe(11);
  });

  it("sai tuyến / chiều / số ghế ngoài [min, max] → không khớp", () => {
    expect(comboPromoFor(config, ctx({ corridorId: "hn-moc" }))).toBeNull();
    expect(comboPromoFor(config, ctx({ chieu: "ba" }))).toBeNull();
    expect(comboPromoFor(config, ctx({ seatCount: 1 }))).toBeNull();
    expect(comboPromoFor(config, ctx({ seatCount: 5 }))).toBeNull();
    expect(comboPromoFor(config, ctx({ seatCount: 4 }))).not.toBeNull();
  });

  it("khung giờ xuất bến tính cả hai đầu; ngoài khung hoặc không đọc được giờ → không khớp", () => {
    expect(comboPromoFor(config, ctx({ departure: "05:00" }))).not.toBeNull();
    expect(comboPromoFor(config, ctx({ departure: "23:00" }))).not.toBeNull();
    expect(comboPromoFor(config, ctx({ departure: "04:59" }))).toBeNull();
    expect(comboPromoFor(config, ctx({ departure: "23:30" }))).toBeNull();
    expect(comboPromoFor(config, ctx({ departure: null }))).toBeNull();
  });

  it("đặt trước tối thiểu: chuyến 10:30 hôm nay cách 30 phút không đạt mức 60 phút; 11:00 đạt", () => {
    expect(comboPromoFor(config, ctx({ travelDate: "2026-10-29", departure: "10:30" }))).toBeNull();
    expect(comboPromoFor(config, ctx({ travelDate: "2026-10-29", departure: "11:00" }))).not.toBeNull();
  });

  it("ngày đi trong [travel_from, travel_to] và đúng thứ (1 = thứ hai)", () => {
    const only = withPromos([makePromo({ type: "combo", corridor: "sg-vt", travel_from: "2026-11-05", travel_to: "2026-11-30", weekdays: [6, 7] })]);
    expect(comboPromoFor(only, ctx({ travelDate: "2026-11-07" }))).not.toBeNull(); // thứ bảy
    expect(comboPromoFor(only, ctx({ travelDate: "2026-11-08" }))).not.toBeNull(); // chủ nhật
    expect(comboPromoFor(only, ctx({ travelDate: "2026-11-09" }))).toBeNull(); // thứ hai
    expect(comboPromoFor(only, ctx({ travelDate: "2026-10-31" }))).toBeNull(); // trước travel_from
    expect(comboPromoFor(only, ctx({ travelDate: "2026-12-05" }))).toBeNull(); // sau travel_to
  });

  it("không có chương trình → không khớp (không hiện gì)", () => {
    expect(comboPromoFor(withPromos([]), ctx())).toBeNull();
  });

  it("bậc giá 'từ': đúng hạng xe, ưu tiên đúng số vé, không có hạng khớp → null", () => {
    expect(comboTierFor(COMBO_PROMO, "Luxury", 2)).toEqual({ seats: 2, price_vnd: 419000 });
    expect(comboTierFor(COMBO_PROMO, "luxury", 3)).toEqual({ seats: 3, price_vnd: 599000 });
    expect(comboTierFor(COMBO_PROMO, "Luxury", 4)).toEqual({ seats: 2, price_vnd: 419000 });
    expect(comboTierFor(COMBO_PROMO, "Economy", 2)).toBeNull();
  });
});
