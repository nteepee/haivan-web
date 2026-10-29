import type { BookingDraft, DraftSeat } from "@/stores/booking-draft";

export interface Customer {
  email: string | null;
  phone: string;
  name: string;
}
export interface Invoice {
  name: string;
  address: string;
  code: string;
  email: string;
}

type TransitFlags = { start?: boolean; end?: boolean; is_check_transit_start?: boolean; is_check_transit_end?: boolean };

/** `value_start`/`value_end` web cũ: địa chỉ tìm khi chuyến hỗ trợ trung chuyển chiều đó, ngược lại "". */
export function transitValues(draft: BookingDraft) {
  const t = (draft.trip_info.transit ?? {}) as TransitFlags;
  return {
    valueStart: draft.pick_up.address && t.is_check_transit_start && t.start ? draft.pick_up.address : "",
    valueEnd: draft.drop_off.address && t.is_check_transit_end && t.end ? draft.drop_off.address : "",
  };
}

/** `transit` gửi api/bookings: so địa chỉ đón/trả với value_start/end (giữ cả trường hợp ""==="" → true như web cũ). */
export function bookingTransit(draft: BookingDraft) {
  const { valueStart, valueEnd } = transitValues(draft);
  return { departure: draft.pick_up.address === valueStart, destination: draft.drop_off.address === valueEnd };
}

/** Công thức `is_combo` R của web cũ (điều kiện mã KM chỉ xét ghế id nhỏ nhất — giữ nguyên hợp đồng). */
export function comboFlag(draft: BookingDraft, sortedSeats: { code?: string; is_reward: boolean }[]): number {
  const hasReward = sortedSeats.some((s) => s.is_reward) || undefined;
  const firstCode = sortedSeats[0]?.code;
  if (draft.is_combo !== 1) return draft.is_combo;
  return (firstCode !== undefined && firstCode !== "") || hasReward !== undefined ? 0 : 1;
}

/** Body `POST api/bookings` đúng thứ tự khoá như live 2026-10-28. */
export function buildBookingBody(draft: BookingDraft, opts: { customer: Customer | null; invoice: Invoice | null; note: string }) {
  const seats = [...draft.seats]
    .sort((a, b) => a.id - b.id)
    .map((s: DraftSeat) => ({ id: s.id, ...(s.promotion !== undefined ? { code: s.promotion } : {}), is_reward: !!s.is_reward }));
  const body: Record<string, unknown> = {
    pick_up: draft.pick_up,
    drop_off: draft.drop_off,
    trip: { trip_id: draft.trip.trip_id, departure_id: draft.trip_info.from.place_id, destination_id: draft.trip_info.to.place_id },
    transit: bookingTransit(draft),
    seats,
    order_code: draft.order_code,
    merchant_code: draft.trip_info.merchant.code,
    note: opts.note,
    is_combo: comboFlag(draft, seats),
  };
  // Thứ tự khoá như live: {email, phone, name}.
  if (opts.customer) body.if_customer = { email: opts.customer.email || null, phone: opts.customer.phone, name: opts.customer.name };
  if (opts.invoice) body.invoice = opts.invoice;
  return body;
}

/** Σ(price − discount) ghế không đổi điểm — điều kiện "miễn phí" của web cũ (không tính phụ thu). */
export function seatsTotal(seats: DraftSeat[]): number {
  return seats.reduce((sum, s) => (s.is_reward ? sum : sum + s.price - (s.discount ?? 0)), 0);
}

/** Kiểm tra form như web cũ; trả khoá i18n lỗi hoặc null. */
export function validateCustomer(customer: Customer | null): string | null {
  return customer && (!customer.name || !customer.phone) ? "booking_infor.msg.noti_info" : null;
}

export function validateInvoice(invoice: Invoice | null, kind: 1 | 2): string | null {
  if (!invoice) return null;
  const base = invoice.name && invoice.address && invoice.email;
  return base && (kind === 1 || invoice.code) ? null : "booking_infor.msg.noti_info_invoice";
}
