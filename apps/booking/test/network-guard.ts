/**
 * Backend Hải Vân và chính haivan.com chỉ có production. Test không bao giờ được
 * chạm tới chúng; mọi lần thử đều bị chặn và ghi lại để test đó fail.
 */
export const PRODUCTION_HOSTS = [
  "haivan.com",
  "apigw.haivan.com",
  "cms.haivan.com",
  "haivanexpress.vn",
  "api.cpn.haivanexpress.vn",
] as const;

/** Khớp host (không phân biệt hoa thường, bỏ dấu chấm cuối, mọi cổng, mọi subdomain). */
export function isProductionHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  return PRODUCTION_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function isProductionUrl(input: string | URL): boolean {
  try {
    return isProductionHost(new URL(String(input)).hostname);
  } catch {
    return false;
  }
}

/** Danh sách lần thử chạm production trong test hiện tại (setup.ts kiểm sau mỗi test). */
export const blockedProductionRequests: string[] = [];

export function recordBlocked(what: string): void {
  blockedProductionRequests.push(what);
}
