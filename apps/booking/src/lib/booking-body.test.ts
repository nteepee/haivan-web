import { describe, expect, it } from "vitest";
import { tripSchema } from "@/schemas/trip";
import type { BookingDraft } from "@/stores/booking-draft";
import trips from "../../test/fixtures/trips.json";
import { priceTransitBody, servicesForPricing } from "./bonus-services";
import { buildBookingBody, comboFlag, seatsTotal, validateCustomer, validateInvoice } from "./booking-body";
import { checkPromotionsQuery, getPromotionsQuery, holdTransitBody, priceTicketQuery } from "./confirm-queries";
import { stringifyQuery } from "./qs";

const trip = {
  ...tripSchema.parse(trips.data[0]),
  id: 41389806,
  direction: "B",
  node_time: "2026-11-01 05:30:00",
  route: { code: "VTA-TSN", name: "Vũng Tàu - Tân Sơn Nhất", show_price: 1 },
  product: { code: "LUXURY", name: "Luxury" },
  merchant: { code: "02", name: "Hải Vân Vũng Tàu", id: "3" },
  price: { min: 200000, max: 260000 },
  from: { place_id: 95, place_name: "159 Điện Biên Phủ, Đa Kao, Quận 1, Hồ Chí Minh", location: [106.6952939, 10.7879376] },
  to: { place_id: 12, place_name: "TP Vũng Tàu (Gành Hào)", location: [107.0710401, 10.3391989] },
  transit: { start: true, end: false, is_check_transit_start: true, is_check_transit_end: false },
};

const draft = {
  trip_info: trip,
  trip: { trip_id: 41389806, departure_id: 95, destination_id: 12 },
  transit: { departure: true, destination: false },
  pick_up: { address: "Quận 1", coordinates: { lat: 10.7753882, lng: 106.702825 } },
  drop_off: { address: "Vũng Tàu", coordinates: { lat: 10.3391989, lng: 107.0710401 } },
  seats: [{ id: 503528630, name: "11", price: 250000, is_empty: true, code: "V02SAMPLE000001", is_select: true }],
  order_code: "B02SAMPLE00001",
  expire_time: "28-10-2026 14:38:29",
  expiresAt: 0,
  is_combo: 0,
  show_price: 1,
  newParams: { order_code: "B02SAMPLE00001", merchant_code: "02", seats: [] },
} as unknown as BookingDraft;

describe("trang xác nhận — hợp đồng live 2026-10-28", () => {
  it("body api/bookings khớp live (khoá + thứ tự)", () => {
    const body = buildBookingBody(draft, { customer: { name: "Khach Test", phone: "0900000000", email: "" } as never, invoice: null, note: "" });
    expect(JSON.stringify(body)).toBe(
      JSON.stringify({
        pick_up: { address: "Quận 1", coordinates: { lat: 10.7753882, lng: 106.702825 } },
        drop_off: { address: "Vũng Tàu", coordinates: { lat: 10.3391989, lng: 107.0710401 } },
        trip: { trip_id: 41389806, departure_id: 95, destination_id: 12 },
        transit: { departure: true, destination: false },
        seats: [{ id: 503528630, is_reward: false }],
        order_code: "B02SAMPLE00001",
        merchant_code: "02",
        note: "",
        is_combo: 0,
        if_customer: { email: null, phone: "0900000000", name: "Khach Test" },
      }),
    );
  });

  it("seats[].code là mã khuyến mãi, sort theo id; is_combo theo công thức R", () => {
    const combo = { ...draft, is_combo: 1, seats: [{ ...draft.seats[0], id: 9, promotion: "KM" }, { ...draft.seats[0], id: 3 }] } as BookingDraft;
    const body = buildBookingBody(combo, { customer: null, invoice: null, note: "x" });
    expect(body.seats).toEqual([{ id: 3, is_reward: false }, { id: 9, code: "KM", is_reward: false }]);
    expect(body.is_combo).toBe(1); // ghế id nhỏ nhất không có mã → vẫn combo (bug giữ nguyên)
    expect(comboFlag(combo, [{ code: "KM", is_reward: false }])).toBe(0);
    expect("if_customer" in body).toBe(false);
  });

  it("tổng miễn phí bỏ ghế đổi điểm, trừ discount", () => {
    expect(seatsTotal([{ ...draft.seats[0], discount: 50000 }, { ...draft.seats[0], is_reward: true }])).toBe(200000);
  });

  it("validate như web cũ", () => {
    expect(validateCustomer({ email: null, phone: "", name: "A" })).toBe("booking_infor.msg.noti_info");
    expect(validateCustomer(null)).toBeNull();
    expect(validateInvoice({ name: "A", address: "B", email: "c@d", code: "" }, 1)).toBeNull();
    expect(validateInvoice({ name: "A", address: "B", email: "c@d", code: "" }, 2)).toBe("booking_infor.msg.noti_info_invoice");
  });

  it("get-promotions query khớp live", () => {
    expect(stringifyQuery(getPromotionsQuery(draft))).toBe(
      "merchant_code=02&route=VTA-TSN&product=LUXURY&channel=1&direction=2&departure_id=95&destination_id=12&departure_time=2026-11-01%2005%3A30%3A00&price=200000&channel_code=WEBHAIVAN",
    );
  });

  it("check-promotions đủ tham số trên query, price-ticket lồng qs", () => {
    const q = stringifyQuery(checkPromotionsQuery(draft, [{ ...draft.seats[0], promotion: "KM10" }]));
    expect(q).toContain("bookingCode=B02SAMPLE00001&tripCode=41389806&adm_id=0");
    expect(q).toContain("codes%5B0%5D%5Bpromotion%5D=KM10&codes%5B0%5D%5BticketCode%5D=V02SAMPLE000001&codes%5B0%5D%5BticketPrice%5D=250000");
    expect(q.startsWith("merchant_code=02&route=VTA-TSN&product=LUXURY&channel=1&direction=2")).toBe(true);
    expect(stringifyQuery(priceTicketQuery(draft, 1))).toBe(
      "order_code=B02SAMPLE00001&merchant_code=02&seats%5B0%5D%5Bid%5D=503528630&is_combo=1&trip%5Btrip_id%5D=41389806&trip%5Bdeparture_id%5D=95&trip%5Bdestination_id%5D=12",
    );
  });

  it("hold-transit và get-price-transit khớp body live", () => {
    expect(holdTransitBody(draft, [])).toEqual({
      order_code: "B02SAMPLE00001", merchant_code: "02", pick_up: "Quận 1", pick_up_lat: 10.7753882, pick_up_lng: 106.702825,
      drop_off: "Vũng Tàu", drop_off_lat: 10.3391989, drop_off_lng: 107.0710401, services: [],
    });
    const services = servicesForPricing([{ dvbs_id: 1, dvbs_code: "TCDON", dvbs_name: "Trung chuyển đón" }], draft, { pickUp: "Đón tận nhà", dropOff: "Trả tận nhà" });
    expect(services[0]).toMatchObject({ check: false, seat: 1, seatCheck: 1, address: [{ number: 1, address: "Quận 1" }], title: "Đón tận nhà", transit_lat: 10.7879376, transit_lng: 106.6952939 });
    expect(Object.keys(priceTransitBody(draft, services))).toEqual(["order_code", "merchant_code", "seats", "services", "trip_id"]);
  });
});
