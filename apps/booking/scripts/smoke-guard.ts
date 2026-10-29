/**
 * Smoke live chỉ được GET đúng các endpoint đọc dưới đây (allowlist theo host + đường dẫn, không dựa vào
 * method hay tên hàm). Mọi thứ khác — kể cả endpoint ghi, endpoint cần đăng nhập, host lạ, method khác GET,
 * userinfo/cổng trong URL — bị từ chối trước khi có bất kỳ request nào.
 */
export const APIGW = "https://apigw.haivan.com";
export const CMS = "https://cms.haivan.com";

const ALLOWED: ReadonlyArray<{ origin: string; path: RegExp }> = [
  { origin: APIGW, path: /^\/api\/places$/ },
  { origin: APIGW, path: /^\/api\/el\/trips$/ },
  { origin: APIGW, path: /^\/api\/trips\/\d+$/ },
  { origin: APIGW, path: /^\/api\/el\/trip_detail$/ },
  { origin: CMS, path: /^\/api\/route-listing$/ },
  { origin: CMS, path: /^\/api\/list-banner$/ },
];

export class SmokeRefused extends Error {}

/** Trả URL đã kiểm hoặc ném SmokeRefused. */
export function assertAllowed(input: string | URL, method = "GET"): URL {
  if (method !== "GET") throw new SmokeRefused(`smoke chỉ được GET, nhận ${method}`);
  let url: URL;
  try {
    url = new URL(String(input));
  } catch {
    throw new SmokeRefused(`URL không hợp lệ: ${String(input)}`);
  }
  if (url.username || url.password || url.hash) throw new SmokeRefused(`URL có userinfo/hash: ${url.href}`);
  if (!ALLOWED.some((rule) => rule.origin === url.origin && rule.path.test(url.pathname))) {
    throw new SmokeRefused(`ngoài allowlist smoke: ${url.origin}${url.pathname}`);
  }
  return url;
}
