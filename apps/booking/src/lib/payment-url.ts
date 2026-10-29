/**
 * Query thô `api/payment/vnpay?…` như web cũ: return_url = `<href trước "/xe-khach/">/xe-khach/thanh-toan?booking_code=…`
 * nối KHÔNG mã hoá, nên backend nhận order_code/bank_code/merchant_code/trip_id ở cấp ngoài (hợp đồng hiện tại).
 */
export function vnpayRawQuery(args: { href: string; bookingCode: string; bankCode: string; merchantCode: string; tripId: string }): string {
  const base = args.href.split("/xe-khach/")[0];
  return `return_url=${base}/xe-khach/thanh-toan?booking_code=${args.bookingCode}&order_code=${args.bookingCode}&bank_code=${args.bankCode}&merchant_code=${args.merchantCode}&trip_id=${args.tripId}`;
}

export type PaymentReturn = "success" | "cancelled" | "verifying" | "failed" | null;

/** Kết quả quay về từ cổng (chỉ là gợi ý; trạng thái thật lấy từ api/bookings/{code}). */
export function paymentReturn(params: URLSearchParams): PaymentReturn {
  const vnp = params.get("vnp_ResponseCode");
  if (vnp !== null) return vnp === "00" ? "success" : vnp === "24" ? "cancelled" : vnp === "07" ? "verifying" : "failed";
  const status = params.get("status");
  if (status === "PAID") return "success";
  if (params.get("cancel") === "true" || status === "CANCELLED") return "cancelled";
  return null;
}

const KEY = "hv_payment_ctx";
export interface PaymentContext {
  booking_code: string;
  merchant_code: string;
  trip_id: string;
}

export function savePaymentContext(ctx: PaymentContext) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    /* bỏ qua */
  }
}

/** Tham số trang thanh toán: URL trước, thiếu thì lấy bản lưu trước khi sang cổng. */
export function readPaymentContext(params: URLSearchParams): PaymentContext | null {
  let saved: Partial<PaymentContext> = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    saved = {};
  }
  const booking_code = params.get("booking_code") ?? params.get("order_code") ?? saved.booking_code ?? "";
  const same = saved.booking_code === booking_code;
  const ctx = {
    booking_code,
    merchant_code: params.get("merchant_code") ?? (same ? saved.merchant_code : undefined) ?? "",
    trip_id: params.get("trip_id") ?? (same ? saved.trip_id : undefined) ?? "",
  };
  // Các giá trị này được nối thô vào return_url → chỉ nhận ký tự an toàn (chặn chèn tham số).
  const safe = /^[A-Za-z0-9]+$/.test(ctx.booking_code) && /^[A-Za-z0-9]*$/.test(ctx.merchant_code) && /^\d*$/.test(ctx.trip_id);
  return safe ? ctx : null;
}
