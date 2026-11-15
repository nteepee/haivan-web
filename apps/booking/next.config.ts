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
    // Cấu hình tuyến chính + chương trình giảm giá/combo từ WP (src/lib/booking-config-source.ts). Đường chính: WP lưu → POST
    // /api/hv/revalidate → bỏ cache ngay. Hạn 60 s chỉ là lưới an toàn khi WP không gọi được Next và cho mốc ngày (chương trình
    // tới ngày bắt đầu/kết thúc mà không ai lưu bài).
    bookingConfig: { stale: 30, revalidate: 60, expire: 300 },
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
