import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // E2E build riêng (mock URL được nhúng vào bundle) để không lẫn với build production.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  images: { remotePatterns: [{ protocol: "https", hostname: "cms.haivan.com" }, { protocol: "https", hostname: "haivan.com" }] },
  cacheComponents: true,
  cacheLife: {
    // Nội dung landing tuyến từ WP (src/lib/route-landing.ts): làm mới mỗi giờ. Request-time render phục vụ bản cũ khi hết hạn
    // rồi làm mới nền; trang ISR tạo lại ở foreground nên bản "tốt gần nhất" được giữ riêng trong src/lib/last-good.ts.
    routeLanding: { stale: 3600, revalidate: 3600, expire: 604800 },
    // Cấu hình tuyến chính + chương trình giảm giá từ WP (src/lib/booking-config-source.ts): MKT bật/tắt nên làm mới tối đa 5 phút.
    bookingConfig: { stale: 60, revalidate: 300, expire: 900 },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
