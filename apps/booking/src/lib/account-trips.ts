import type { Query } from "./qs";

export type TripTab = 1 | 2 | 3;
/** `booking-status[0]`: 1 sắp tới, 2 hoàn thành, 3 đã huỷ. */
export const TRIP_TABS: readonly TripTab[] = [1, 2, 3];

/** Query `GET api/bookings` như web cũ: trang 1 chỉ có trạng thái, từ trang 2 thêm `page` đứng trước. */
export function bookingsQuery(tab: TripTab, page = 1): Query {
  return page > 1 ? { page, "booking-status": [tab] } : { "booking-status": [tab] };
}

/** Tuyến SBLK không hiện giá vé ở web cũ. */
const HIDDEN_PRICE_ROUTES = ["DLA-SBLK", "BLO-SBLK"];
export const isPriceHidden = (routeCode?: string | null) => !!routeCode && HIDDEN_PRICE_ROUTES.includes(routeCode);

/** Nút "Thanh toán" → trang thanh toán với đúng 3 tham số web cũ gửi. */
export function payUrl(prefix: string, bookingCode: string, merchantCode: string, tripId?: number | null): string {
  const params = [`booking_code=${encodeURIComponent(bookingCode)}`, `merchant_code=${encodeURIComponent(merchantCode)}`];
  if (tripId != null) params.push(`trip_id=${tripId}`);
  return `${prefix}/xe-khach/thanh-toan?${params.join("&")}`;
}

export type RowBadge = { kind: "cancelled" } | { kind: "paid" } | { kind: "pay"; amount: number | null } | { kind: "none" };

interface BadgeInput {
  status: number;
  status_payment?: unknown;
  total_money?: number | null;
}

/** Nhãn bên phải hàng đơn: huỷ > đã thanh toán > nút thanh toán (giá chi tiết khi đã mở, ngược lại tổng tiền). */
export function rowBadge(info: BadgeInput, opts: { detailPrice?: number; hidePrice?: boolean } = {}): RowBadge {
  if (info.status === 3) return { kind: "cancelled" };
  if (info.status_payment) return { kind: "paid" };
  const price = opts.detailPrice !== undefined ? opts.detailPrice : info.total_money;
  if (!price) return { kind: "none" };
  return { kind: "pay", amount: opts.hidePrice ? null : price };
}

/** "2026-10-28 09:15:51" → "28/10/2026". */
export const formatCreatedDate = (value: string) => value.slice(0, 10).split("-").reverse().join("/");

/**
 * Nút "Thông tin dịch vụ bổ sung": chỉ đối tác "02", có vé, đơn chưa xử lý xong/huỷ.
 * `locked` = đã thanh toán hoặc có vé trạng thái 11 → chỉ báo hết hạn thay đổi.
 */
export function serviceInfoState(detail: {
  merchant_code?: string;
  status: { type: number };
  payment?: { type: number } | null;
  tickets: { status?: { type: number }; payment?: { type: number } }[];
}): "hidden" | "locked" | "open" {
  if (detail.merchant_code !== "02" || detail.tickets.length === 0 || detail.status.type === 3 || detail.status.type === 2) return "hidden";
  const locked = detail.payment?.type === 1 || detail.tickets.some((tk) => tk.status?.type === 11 || tk.payment?.type === 1);
  return locked ? "locked" : "open";
}

export const serviceUpdateUrl = (prefix: string, code: string, merchantCode: string) =>
  `${prefix}/xe-khach/cap-nhat-dich-vu?code=${encodeURIComponent(code)}&merchant_code=${encodeURIComponent(merchantCode)}`;
