import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// BFF gọi apigw từ phía server nên page.route() không chặn được; E2E trỏ mọi
// base URL ra ngoài (server lẫn trình duyệt) vào mock local (e2e/mock-apigw.ts).
const MOCK = process.env.E2E_MOCK_APIGW ?? "http://127.0.0.1:4010";
const mockUrl = new URL(MOCK);
if (!["127.0.0.1", "localhost", "::1"].includes(mockUrl.hostname)) {
  throw new Error(`E2E_MOCK_APIGW phải là loopback, nhận: ${MOCK}`);
}
const APP_ORIGIN = "http://127.0.0.1:3100";
const DNS_LOG = path.join(__dirname, ".e2e-output", "server-dns-blocked.log");

const STANDALONE = ".next-e2e/standalone/apps/booking";

export default defineConfig({
  testDir: "./e2e",
  // Mock dùng chung một bộ nhớ ghi request → chạy tuần tự để spec đối chiếu đúng request của mình.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  // Máy dùng chung có thể chậm (điều hướng RSC của `next start`); thời gian chờ rộng thay vì retry che flake.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  outputDir: "./test-results",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: APP_ORIGIN,
    trace: "retain-on-failure",
    serviceWorkers: "block",
    // Trình duyệt chỉ phân giải được loopback: mọi host khác lỗi DNS (lớp thứ hai sau context.route).
    launchOptions: { args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1 , EXCLUDE localhost"] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Phải lên trước: `next build` prerender trang tuyến bằng CMS và lấy layout WP từ mock.
      command: "node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON e2e/mock-apigw.ts",
      url: `${MOCK}/__e2e/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: { E2E_MOCK_PORT: mockUrl.port || "4010" },
    },
    {
      // Build riêng vào .next-e2e; chạy đúng server.js standalone như production (deploy/local/start-next.sh),
      // vì có lỗi chỉ lộ ở chế độ này (proxy.ts chạy lại sau rewrite). Standalone không mang theo .env*.
      command: [
        `rm -f "${DNS_LOG}"`,
        "pnpm build",
        // Chốt chặn SSR: mọi trang /xe-khach/** prerender (landing có CMS mock) phải có <h1> trong HTML tĩnh.
        "NEXT_DIST_DIR=.next-e2e node scripts/check-ssr-h1.mjs",
        `rm -rf ${STANDALONE}/.next-e2e/static`,
        `cp -R .next-e2e/static ${STANDALONE}/.next-e2e/static`,
        `(if [ -d public ]; then rm -rf ${STANDALONE}/public && cp -R public ${STANDALONE}/public; fi)`,
        `PORT=3100 HOSTNAME=127.0.0.1 node ${STANDALONE}/server.js`,
      ].join(" && "),
      url: APP_ORIGIN,
      // Không tái dùng server có sẵn: có thể đang trỏ production qua .env.local.
      reuseExistingServer: false,
      timeout: 300_000,
      // Playwright gộp env này lên process.env; process.env thắng .env.local nên mọi khoá
      // có thể chạm production đều phải được ghi đè ở đây (kể cả khi shell hay .env.local bật cờ live).
      env: {
        E2E: "1",
        NODE_ENV: "production",
        NEXT_DIST_DIR: ".next-e2e",
        NEXT_TELEMETRY_DISABLED: "1",
        NODE_OPTIONS: `--require=${path.join(__dirname, "e2e", "server-dns-guard.cjs")}`,
        E2E_DNS_LOG: DNS_LOG,
        APIGW_URL: MOCK,
        NEXT_PUBLIC_APIGW_URL: MOCK,
        NEXT_PUBLIC_CMS_URL: MOCK,
        CPN_URL: MOCK,
        NEXT_PUBLIC_CPN_URL: MOCK,
        WP_LAYOUT_URL: `${MOCK}/wp-json/haivan-web/v1/layout`,
        HV_WP_SHARED_SECRET: "e2e-wp-shared-secret",
        PUBLIC_ORIGIN: APP_ORIGIN,
        HV_LIVE_BACKEND: "0",
        HV_LIVE_WRITES: "0",
        SESSION_SECRET: "e2e-session-secret-e2e-session-secret-0123456789",
        // reCAPTCHA: khoá giả khiến widget được dựng; spec thay api.js của Google bằng stub (e2e/fixtures.ts).
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "e2e-site-key",
        NEXT_PUBLIC_MAP_TILE_URL: `${MOCK}/tiles/{z}/{x}/{y}.png`,
      },
    },
  ],
});
