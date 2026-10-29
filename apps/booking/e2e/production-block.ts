import { test as base, expect } from "@playwright/test";

const PRODUCTION_HOSTS = ["haivan.com", "haivanexpress.vn"];

function isProductionUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase().replace(/\.+$/, "");
  return PRODUCTION_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * Lớp chặn phía trình duyệt (cả popup/tab mới); lớp phía server là APIGW_URL trỏ mock.
 * Mọi spec E2E import `test` từ đây.
 */
export const test = base.extend<{ blockedProduction: string[] }>({
  blockedProduction: [
    async ({ context }, use) => {
      const blocked: string[] = [];
      await context.route(isProductionUrl, (route) => {
        blocked.push(`${route.request().method()} ${route.request().url()}`);
        return route.abort("blockedbyclient");
      });
      await use(blocked);
      expect(blocked, "Trình duyệt gọi production trong E2E").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
