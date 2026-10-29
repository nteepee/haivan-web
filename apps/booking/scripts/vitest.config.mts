import { defineConfig } from "vitest/config";

// Chạy: `pnpm contract-diff` / `pnpm test:scripts`. Tách khỏi `pnpm test` (vitest.config.mts) vì đây là kiểm hợp đồng
// với bản chụp live, không phải test đơn vị của app; môi trường Node thuần, không MSW/jsdom.
export default defineConfig({
  root: new URL("..", import.meta.url).pathname,
  resolve: { tsconfigPaths: true },
  test: { environment: "node", include: ["scripts/**/*.test.ts"] },
});
