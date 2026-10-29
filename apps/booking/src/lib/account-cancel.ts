import type { Locale } from "@/i18n/t";

/** Chỉ lý do "Lý do khác" (id 1) cho nhập ghi chú. */
export const OTHER_REASON_ID = 1;
export const noteEnabled = (reasonId: number | undefined) => reasonId === OTHER_REASON_ID;

const CANCELABLE_TICKET_STATUS = [1, 2, 3];

type TicketAction = { kind: "cancel" } | { kind: "paid" } | { kind: "unpaid" } | { kind: "status"; text: string };

/**
 * Cột hành động của vé: chưa thanh toán + trạng thái 1/2/3 → "Huỷ vé", đã thanh toán → nhãn "Đã thanh toán",
 * trạng thái khác → tên trạng thái. Không xét `is_cancel` (web cũ không đọc; backend tự từ chối huỷ muộn).
 */
export function ticketAction(ticket: { status?: { type: number; type_name: string }; payment?: { type: number } }): TicketAction {
  const status = ticket.status;
  if (!status || !CANCELABLE_TICKET_STATUS.includes(status.type)) return { kind: "status", text: status?.type_name ?? "" };
  if (ticket.payment?.type !== 0) return { kind: "paid" };
  return { kind: "cancel" };
}

/** Nút "Huỷ đơn hàng": chưa thanh toán, giá > 0, nhiều hơn 1 vé, chưa huỷ (đơn 1 vé chỉ có "Huỷ vé"). */
export function canCancelOrder(detail: { payment?: { type: number } | null; price: number; tickets: unknown[]; status: { type: number } }): boolean {
  return detail.payment?.type === 0 && detail.price > 0 && detail.tickets.length > 1 && detail.status.type !== 3;
}

export interface CancelChoice {
  reasonId: number;
  note: string;
}

const noteOf = (c: CancelChoice) => (noteEnabled(c.reasonId) ? c.note : "");

/** Body `POST api/cancel-seat` (không có `type`). */
export const cancelSeatBody = (orderCode: string, seatCode: string, merchantCode: string, c: CancelChoice) => ({
  order_code: orderCode,
  seat_code: seatCode,
  merchant_code: merchantCode,
  reason_cancel_id: c.reasonId,
  reason_cancel_note: noteOf(c),
});

/** Body `POST api/cancel-booking` (huỷ cả đơn, `type:0`). */
export const cancelBookingBody = (orderCode: string, merchantCode: string, c: CancelChoice) => ({
  order_code: orderCode,
  merchant_code: merchantCode,
  reason_cancel_id: c.reasonId,
  reason_cancel_note: noteOf(c),
  type: 0,
});

/** Body `DELETE api/transit/cancel-order/{code}` (huỷ dịch vụ phòng chờ / trung chuyển). */
export const cancelTransitBody = (reason: string) => ({ reason: reason.trim(), type: 0 });

export const reasonLabel = (reason: { reason_vi: string; reason_en?: string }, locale: Locale) =>
  locale === "en" && reason.reason_en ? reason.reason_en : reason.reason_vi;
