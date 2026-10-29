import "server-only";
import type { NextRequest } from "next/server";

export const RAW_QUERY_HEADER = "x-hv-query";

// Ký tự hợp lệ trong query (RFC 3986), không có "#"; không bắt đầu bằng "?".
const RAW_SAFE = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@/][A-Za-z0-9\-._~%!$&'()*+,;=:@/?]*$/;

/** %FF… giải mã ra U+FFFD ở cả hai phía nên "bằng nhau" mà byte khác → không nhận. */
function validUtf8(raw: string): boolean {
  try {
    decodeURIComponent(raw.replace(/\+/g, " "));
    return true;
  } catch {
    return false;
  }
}

const entries = (qs: string) => JSON.stringify([...new URLSearchParams(qs)]);

/**
 * Next chuẩn hoá query trước khi route handler thấy `request.url` (": / ?" → %3A %2F %3F, khoảng trắng → "+"),
 * trong khi web cũ gửi chuỗi ghép thô (vd. return_url của VNPay). Client gửi kèm chuỗi gốc ở header;
 * chỉ dùng khi nó giải mã ra đúng các cặp khoá/giá trị của URL thật, nên header không thể chèn tham số khác.
 */
export function upstreamSearch(request: NextRequest): string {
  const search = request.nextUrl.search;
  const raw = request.headers.get(RAW_QUERY_HEADER);
  if (raw === null || raw === "" || raw.length > 4096 || !RAW_SAFE.test(raw) || !validUtf8(raw)) return search;
  return entries(raw) === entries(search) ? `?${raw}` : search;
}
