import type { HoldResponse } from "@/schemas/booking";
import type { Seat, Trip } from "@/schemas/trip";
import type { BookingDraft, TransitTicket } from "@/stores/booking-draft";
import { parseVnDateTime } from "./format";
import type { SearchParamsData } from "./search-url";

/**
 * Sau hold thành công: dựng nháp như `data_save` web cũ. Toạ độ đón/trả = điểm người dùng tìm.
 * Có `trip.transit.start` → thêm `newParams` (đúng body `v4/get-price-transit` quan sát live).
 */
export function draftFromHold(args: {
  trip: Trip;
  search: SearchParamsData;
  seats: Seat[];
  hold: HoldResponse;
  isCombo: boolean;
  user: { name: string | null; phone: string | null } | null;
}): BookingDraft {
  const { trip, search, hold, isCombo, user } = args;
  const seats = [...args.seats]
    .sort((a, b) => a.id - b.id)
    .map((s) => ({ ...s, ...(isCombo ? {} : { is_select: true }), ...(hold.tickets.find((t) => t.id === s.id) ?? {}) }));
  const transit = (trip.transit ?? { start: false, end: false }) as { start: boolean; end: boolean };

  const draft: BookingDraft = {
    search,
    trip_info: trip,
    trip: { trip_id: trip.id, departure_id: trip.from.place_id, destination_id: trip.to.place_id },
    transit: { departure: !!transit.start, destination: !!transit.end },
    pick_up: { address: search.from.name, coordinates: { lat: search.from.lat, lng: search.from.lng } },
    drop_off: { address: search.to.name, coordinates: { lat: search.to.lat, lng: search.to.lng } },
    seats,
    order_code: hold.order_code,
    expire_time: hold.expire_time,
    // Không được ném lỗi ở đây: chỗ đã giữ trên server; định dạng lạ → coi hạn 10 phút.
    expiresAt: Number.isFinite(parseVnDateTime(hold.expire_time)) ? parseVnDateTime(hold.expire_time) : Date.now() + 10 * 60_000,
    is_combo: isCombo ? 1 : 0,
    show_price: trip.route.show_price ?? 0,
  };

  if (transit.start) {
    const tickets: TransitTicket[] = hold.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      ticket_code: t.code,
      phone: user?.phone ?? null,
      name: user?.name ?? null,
      pick_up: search.from.name,
      pick_up_lat: search.from.lat,
      pick_up_lng: search.from.lng,
      drop_off: search.to.name,
      drop_off_lat: search.to.lat,
      drop_off_lng: search.to.lng,
      number: seats.find((s) => s.id === t.id)?.name ?? "",
      quantity: 1,
      date: search.date,
    }));
    draft.newParams = { order_code: hold.order_code, merchant_code: trip.merchant.code, seats: tickets };
  }
  return draft;
}
