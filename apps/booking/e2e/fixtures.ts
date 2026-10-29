import type { Page, Route } from "@playwright/test";
import { E2E_CAPTCHA_TOKEN, FAKE_PAYMENT_HOST, recordedRequests, resetMock, type RecordedRequest } from "./mock-client";
import { expect, test as base } from "./production-block";

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const isExternal = (url: URL) => /^https?:$/.test(url.protocol) && !LOOPBACK.has(url.hostname);

/**
 * Thay `https://www.google.com/recaptcha/api.js`: component Recaptcha vẫn chạy nguyên mã thật (tải script,
 * `grecaptcha.render`, callback token) nhưng widget là một nút giả trả token cố định. Request tới Google không bao giờ
 * ra khỏi trình duyệt vì route trả lời tại chỗ. Không có hook thử nghiệm nào trong mã sản phẩm.
 */
const RECAPTCHA_STUB = `
window.grecaptcha = {
  render(el, opts) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "E2E reCAPTCHA";
    button.dataset.testid = "e2e-recaptcha";
    button.onclick = () => opts.callback(${JSON.stringify(E2E_CAPTCHA_TOKEN)});
    el.appendChild(button);
    return 1;
  },
  reset() {},
};
if (window.__hvRecaptchaReady) window.__hvRecaptchaReady();
`;

export interface Egress {
  /** Request tới host ngoài loopback bị chặn (phải rỗng, trừ những gì đã được xử lý có chủ đích bên dưới). */
  external: string[];
  /** Điều hướng tới trang cổng thanh toán giả: bị huỷ trước khi rời máy, chỉ ghi lại để kiểm URL. */
  paymentNavigations: string[];
  /** Số lần stub reCAPTCHA được phục vụ. */
  recaptchaStubbed: number;
}

export interface MockApi {
  /** Mọi request mock đã nhận trong test này. */
  requests: () => Promise<RecordedRequest[]>;
}

export const test = base.extend<{ egress: Egress; mock: MockApi }>({
  egress: [
    async ({ context }, use) => {
      const egress: Egress = { external: [], paymentNavigations: [], recaptchaStubbed: 0 };
      // Đăng ký catch-all trước; route đăng ký sau được ưu tiên.
      await context.route(isExternal, (route: Route) => {
        egress.external.push(`${route.request().method()} ${route.request().url()}`);
        return route.abort("blockedbyclient");
      });
      await context.route(
        (url) => url.hostname === "www.google.com" && url.pathname === "/recaptcha/api.js",
        (route) => {
          egress.recaptchaStubbed++;
          return route.fulfill({ status: 200, contentType: "application/javascript", body: RECAPTCHA_STUB });
        },
      );
      await context.route(
        (url) => url.hostname === FAKE_PAYMENT_HOST,
        (route) => {
          egress.paymentNavigations.push(route.request().url());
          return route.abort("blockedbyclient");
        },
      );
      await use(egress);
      expect(egress.external, "Request ra khỏi loopback trong E2E").toEqual([]);
    },
    { auto: true },
  ],
  mock: [
    async ({}, use, testInfo) => {
      await resetMock();
      await use({ requests: recordedRequests });
      const all = await recordedRequests();
      // Bằng chứng cho báo cáo: danh sách request mock nhận được (kèm trong trace/report); E2E_LOG_REQUESTS=1 in ra console.
      const summary = all.map((r) => `${String(r.seq).padStart(2)} ${r.method.padEnd(4)} ${r.path}${r.rawQuery ? `?${r.rawQuery}` : ""} → ${r.status}`);
      await testInfo.attach("mock-requests.txt", { body: summary.join("\n"), contentType: "text/plain" });
      if (process.env.E2E_LOG_REQUESTS === "1") console.log(`[mock-apigw] ${testInfo.title}\n${summary.map((l) => `  ${l}`).join("\n")}`);
      expect(
        all.filter((r) => !r.handled).map((r) => `${r.method} ${r.path}`),
        "Request tới endpoint chưa có trong mock",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page };
