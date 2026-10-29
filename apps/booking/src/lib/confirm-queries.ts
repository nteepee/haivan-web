import type { BookingDraft, DraftSeat } from "@/stores/booking-draft";
import type { Query } from "./qs";

/** Tham số chuyến dùng chung cho get-promotions / check-promotions như web cũ. */
function tripParams(draft: BookingDraft) {
  const t = draft.trip_info;
  return {
    merchant_code: t.merchant.code,
    route: t.route.code,
    product: t.product.code,
    channel: 1,
    direction: t.direction === "A" ? 1 : 2,
    departure_id: t.from.place_id,
    destination_id: t.to.place_id,
    departure_time: t.node_time,
  };
}

/** `GET api/promotion/get-promotions?` (live: …&price=200000&channel_code=WEBHAIVAN). */
export function getPromotionsQuery(draft: BookingDraft): Query {
  return { ...tripParams(draft), price: draft.trip_info.price.min, channel_code: "WEBHAIVAN" };
}

/** `POST api/promotion/check-promotions?<qs>` không body; codes theo ghế đã gắn mã. */
export function checkPromotionsQuery(draft: BookingDraft, seats: DraftSeat[]): Query {
  return {
    ...tripParams(draft),
    bookingCode: draft.order_code,
    tripCode: draft.trip_info.id,
    adm_id: 0,
    codes: seats.filter((s) => s.promotion).map((s) => ({ promotion: s.promotion, ticketCode: s.code, ticketPrice: s.price })),
    channel_code: "WEBHAIVAN",
  };
}

/** `GET api/price-ticket?` (đổi giữa giá combo và giá niêm yết). */
export function priceTicketQuery(draft: BookingDraft, isCombo: 0 | 1): Query {
  return {
    order_code: draft.order_code,
    merchant_code: draft.trip_info.merchant.code,
    seats: draft.seats.map((s) => ({ id: s.id })),
    is_combo: isCombo,
    trip: { trip_id: draft.trip_info.id, departure_id: draft.trip.departure_id, destination_id: draft.trip.destination_id },
  };
}

/** Body `POST api/v4/hold-transit` (gửi sau mọi booking thành công; services rỗng nếu không chọn). */
export function holdTransitBody(draft: BookingDraft, services: unknown[]) {
  return {
    order_code: draft.order_code,
    merchant_code: draft.trip_info.merchant.code,
    pick_up: draft.pick_up.address,
    pick_up_lat: draft.pick_up.coordinates.lat,
    pick_up_lng: draft.pick_up.coordinates.lng,
    drop_off: draft.drop_off.address,
    drop_off_lat: draft.drop_off.coordinates.lat,
    drop_off_lng: draft.drop_off.coordinates.lng,
    services,
  };
}

/** Merchant có dịch vụ đón/trả tận nhà (02, 16, 17). */
export const hasHomeTransit = (draft: BookingDraft) => ["02", "16", "17"].includes(draft.trip_info.merchant.code);
