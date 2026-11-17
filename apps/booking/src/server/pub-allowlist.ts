import "server-only";

/**
 * Endpoint apigw công khai (không cần đăng nhập) mà trình duyệt gọi qua proxy `/api/hv/pub/*` khi trang không chạy trên
 * haivan.com (stg, tunnel): apigw chỉ trả dữ liệu cho Origin https://haivan.com, nên máy chủ Next gọi thay. Đúng các lệnh
 * gọi `apigw()` trong src (tìm chuyến, sơ đồ ghế, lộ trình, điểm đón, địa chỉ, OTP, tra cứu xe, xác minh email, log quét QR).
 */
const RULES: Array<["GET" | "POST", RegExp]> = [
  ["GET", /^places$/],
  ["GET", /^el\/trips$/],
  ["GET", /^trips\/\d{1,15}$/],
  ["GET", /^el\/trip_detail$/],
  ["GET", /^maps\/places(\/detail)?$/],
  ["GET", /^get-otp$/],
  ["GET", /^trip\/search-location-detail$/],
  ["GET", /^customer\/email\/verify$/],
  ["POST", /^qrcode\/agency-qr-code-scan-logs$/],
];

/** Đường dẫn sau /api/ nếu được phép, ngược lại null. */
export function allowedPubPath(method: string, segments: string[]): string | null {
  if (!segments.length || segments.some((s) => !/^[A-Za-z0-9_-]+$/.test(s))) return null;
  const path = segments.join("/");
  return RULES.some(([m, re]) => m === method && re.test(path)) ? path : null;
}
