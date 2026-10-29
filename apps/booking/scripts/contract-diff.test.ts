/**
 * Contract diff: body/query mà app SINH RA phải khớp bản chụp chạy thật `docs/booking-flow/00-live-capture-261028.md`
 * (tham chiếu sao chép vào test/fixtures/live-capture-261028.json) và các chuỗi query dựng lại từ docs/booking-flow/02, 03.
 * Chọn vitest thay vì script riêng: dùng chung alias "@/", báo diff theo từng khoá, thoát mã khác 0 khi lệch.
 *
 *   pnpm contract-diff
 *
 * Body JSON so theo chuỗi `JSON.stringify` (thứ tự khoá cũng là hợp đồng với backend/WAF). Query so theo danh sách
 * cặp khoá/giá trị đã giải mã (tài liệu ghi dạng giải mã) theo đúng thứ tự.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cancelSeatBody } from "@/lib/account-cancel";
import { priceTransitBody, servicesForPricing, type BonusService } from "@/lib/bonus-services";
import { buildBookingBody, type Customer } from "@/lib/booking-body";
import { checkPromotionsQuery, getPromotionsQuery, holdTransitBody } from "@/lib/confirm-queries";
import { draftFromHold } from "@/lib/hold-draft";
import { vnpayRawQuery } from "@/lib/payment-url";
import { stringifyQuery } from "@/lib/qs";
import { parseSearch, tripsQuery } from "@/lib/search-url";
import { buildHoldBody } from "@/lib/seats";
import { holdResponseSchema } from "@/schemas/booking";
import { seatSchema, tripSchema } from "@/schemas/trip";

const ref = JSON.parse(readFileSync(new URL("../test/fixtures/live-capture-261028.json", import.meta.url), "utf8"));

const trip = tripSchema.parse(ref.scenario.trip);
const seat = seatSchema.parse(ref.scenario.seat);
const hold = holdResponseSchema.parse(ref.scenario.holdResponse);
const customer: Customer = ref.scenario.customer;
const search = parseSearch(new URL(ref.scenario.pageUrl).searchParams);
if (!search) throw new Error("fixture pageUrl không parse được");

const draft = draftFromHold({ trip, search, seats: [seat], hold, isCombo: false, user: { name: customer.name, phone: customer.phone } });

/** "a=1&b[0]=x%20y" → [["a","1"],["b[0]","x y"]] */
const pairs = (qs: string): [string, string][] =>
  qs.split("&").map((part) => {
    const at = part.indexOf("=");
    return [decodeURIComponent(part.slice(0, at)), decodeURIComponent(part.slice(at + 1))];
  });

/** Body so theo JSON (có thứ tự khoá); lỗi in ra cả hai bản đã định dạng để thấy diff. */
const sameJson = (actual: unknown, expected: unknown) => expect(JSON.stringify(actual, null, 1)).toBe(JSON.stringify(expected, null, 1));

describe("contract diff vs live capture 2026-10-28", () => {
  it("GET api/el/trips: query từ URL trang tìm chuyến", () => {
    expect(pairs(stringifyQuery(tripsQuery(search)))).toEqual(pairs(ref.requests.el_trips_query));
  });

  it("POST api/hold-booking: body (thứ tự khoá, ghế nguyên object + is_select, không aff khi không có)", () => {
    sameJson(buildHoldBody(trip, [seat], false, { aff: undefined }), ref.requests.hold_booking_body);
    // Có nguồn affiliate thì thêm khoá, vẫn sau `channel`.
    expect(Object.keys(buildHoldBody(trip, [seat], false, { aff: "X", utm_source: "u", aff_sid: "s" }))).toEqual(["trip_id", "seats", "merchant_code", "channel", "aff", "utm_source", "aff_sid"]);
  });

  it("GET api/promotion/get-promotions: query", () => {
    expect(pairs(stringifyQuery(getPromotionsQuery(draft)))).toEqual(pairs(ref.requests.get_promotions_query));
  });

  it("POST api/v4/get-price-transit: khoá body, vé và dịch vụ", () => {
    const list: BonusService[] = [{ dvbs_id: 1, dvbs_code: "TCDON", dvbs_name: "Trung chuyển đón" }, { dvbs_id: 2, dvbs_code: "TCTRA", dvbs_name: "Trung chuyển trả" }];
    const body = priceTransitBody(draft, servicesForPricing(list, draft, { pickUp: "Đón tận nhà", dropOff: "Trả tận nhà" })) as unknown as {
      seats: Record<string, unknown>[];
      services: Record<string, unknown>[];
    };
    expect(Object.keys(body)).toEqual(ref.requests.get_price_transit_body_keys);
    expect(Object.keys(body.seats[0])).toEqual(ref.requests.get_price_transit_seat_keys);
    expect(Object.keys(body.services[0]).slice(-ref.requests.get_price_transit_service_extra_keys.length)).toEqual(ref.requests.get_price_transit_service_extra_keys);
    expect(body).toMatchObject({ order_code: hold.order_code, merchant_code: "02", trip_id: trip.id });
  });

  it("POST api/bookings: body (thứ tự khoá, transit, is_combo, if_customer)", () => {
    sameJson(buildBookingBody(draft, { customer, invoice: null, note: "" }), ref.requests.bookings_body);
  });

  it("POST api/v4/hold-transit: body", () => {
    sameJson(holdTransitBody(draft, []), ref.requests.hold_transit_body);
  });

  it("POST api/cancel-seat: body (không có type)", () => {
    const b = ref.requests.cancel_seat_body;
    sameJson(cancelSeatBody(b.order_code, b.seat_code, b.merchant_code, { reasonId: b.reason_cancel_id, note: "" }), b);
  });
});

describe("contract diff vs chuỗi dựng lại từ docs/booking-flow/02, 03 (chưa chạy thật)", () => {
  it("POST api/promotion/check-promotions: query thô theo qs (ngoặc, dấu cách mã hoá)", () => {
    const withPromo = { ...draft, seats: draft.seats.map((s) => ({ ...s, promotion: "KM10" })) };
    const raw = stringifyQuery(checkPromotionsQuery(withPromo, withPromo.seats));
    expect(pairs(raw)).toEqual(pairs(ref.reconstructed.check_promotions_query));
    expect(raw).toContain("codes%5B0%5D%5Bpromotion%5D=KM10");
    expect(raw).toContain("departure_time=2026-11-01%2005%3A30%3A00");
    expect(raw).not.toContain("+");
  });

  it("GET api/payment/vnpay: return_url nối thô, các tham số còn lại ở cấp ngoài", () => {
    const args = { bookingCode: hold.order_code, merchantCode: "02", tripId: String(trip.id) };
    const origin = ref.scenario.origin;
    expect(vnpayRawQuery({ ...args, href: `${origin}/xe-khach/thanh-toan?booking_code=${hold.order_code}`, bankCode: "VNPAYQR" })).toBe(ref.reconstructed.vnpay_raw_query.vi);
    expect(vnpayRawQuery({ ...args, href: `${origin}/en/xe-khach/thanh-toan?booking_code=${hold.order_code}`, bankCode: "NCB" })).toBe(ref.reconstructed.vnpay_raw_query.en);
  });
});
