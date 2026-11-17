import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // "server-only" ném lỗi ngoài React Server; trong test Node thì bỏ qua.
    alias: { "server-only": new URL("./test/empty-module.ts", import.meta.url).pathname },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    // Test chạy trên localhost: giữ chế độ gọi thẳng apigw như web cũ (src/lib/http.ts `apigwDirect`).
    env: { NEXT_PUBLIC_APIGW_DIRECT_HOSTS: "haivan.com,localhost" },
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
