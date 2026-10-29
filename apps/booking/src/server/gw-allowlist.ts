import "server-only";

type Method = "GET" | "POST" | "PUT" | "DELETE";

/** GET có tác dụng phụ (tạo link thanh toán, đổi giá đơn) → coi là thao tác ghi. */
const GET_WRITES = [/^payment\/(vnpay|payos)$/, /^price-ticket$/];

/**
 * Endpoint apigw cần đăng nhập mà BFF được phép chuyển tiếp (method + regex đúng).
 * Nguồn: docs/booking-flow-spec.md và docs/booking-flow/01-03. Ngoài bảng → 404.
 */
const CODE = "[A-Za-z0-9]+";
const RULES: Array<[Method, RegExp]> = [
  ["POST", /^hold-booking$/],
  ["POST", /^bookings$/],
  ["GET", /^bookings$/],
  ["GET", new RegExp(`^bookings/${CODE}$`)],
  ["GET", /^bookings\/download-bill$/],
  ["GET", /^info-payments$/],
  ["GET", /^info-payment-block$/],
  ["GET", /^payment\/(vnpay|payos)$/],
  ["POST", new RegExp(`^update-booking/${CODE}$`)],
  ["POST", /^cancel-seat$/],
  ["POST", /^cancel-booking$/],
  ["GET", /^list-reason$/],
  ["GET", /^customer\/customers$/],
  ["POST", /^customer\/customers$/],
  ["PUT", /^customer\/customers\/update-profile$/],
  ["GET", /^customer\/customers\/tax$/],
  ["POST", /^customer\/customers\/tax$/],
  ["GET", /^customer\/definition$/],
  ["GET", /^reward\/definition$/],
  ["GET", /^v4\/(definition|get-bonus-service|get-info-ticket|check-transit|get-price-ticket)$/],
  ["GET", new RegExp(`^v4/detail-transit/${CODE}$`)],
  ["POST", /^v4\/(get-price-transit|hold-transit|update-transit)$/],
  ["GET", /^promotion\/(get-promotions|promotional_code_list_all)$/],
  ["POST", /^promotion\/check-promotions$/],
  ["GET", /^price-ticket$/],
  ["GET", /^admin\/search-code-hide$/],
  ["GET", /^transit\/customer\/list-order$/],
  ["GET", new RegExp(`^transit/customer/detail-order/${CODE}$`)],
  ["DELETE", new RegExp(`^transit/cancel-order/${CODE}$`)],
  ["POST", /^qrcode\/agency-qr-code-scan-logs$/],
];

const SEGMENT = /^[A-Za-z0-9_-]+$/;

/** Trả đường dẫn đã ghép (vd. "bookings/B02...") nếu được phép, ngược lại null. */
export function allowedPath(method: string, segments: string[]): string | null {
  if (segments.length === 0 || !segments.every((s) => SEGMENT.test(s))) return null;
  const path = segments.join("/");
  return RULES.some(([m, re]) => m === method && re.test(path)) ? path : null;
}

/** Thao tác ghi (mọi method khác GET, và GET có tác dụng phụ). */
export const isWrite = (method: string, path: string) => method !== "GET" || GET_WRITES.some((re) => re.test(path));
