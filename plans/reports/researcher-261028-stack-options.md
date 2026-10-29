# Stack + architecture research (2026-10-28)

Nguồn: researcher subagent (npm registry, Next 16 docs 2026-10-06, probe CORS/CMS chỉ đọc). Lưu lại bởi session chính.

## Phiên bản npm hiện tại
next 16.4.3, react 19.3.1, tailwindcss 4.3.3, @tanstack/react-query 5.105, vitest 5.0.5, msw 3.0.3, zod 4.6.7, react-hook-form 7.91, zustand 5.0.16, next-intl 4.14.9, leaflet 1.9.4, react-leaflet 5.0.0, antd 6.6.8, astro 7.4.2, @playwright/test 1.64.

## Phương án
| | A: Next 16 App Router + TS + Tailwind 4 + shadcn/ui + TanStack Query | B: Next 16 + antd 6 | C: Astro 7 + React island |
|---|---|---|---|
| SEO trang CMS | Tốt nhất: `'use cache'`/`cacheLife`/`cacheTag`, `generateStaticParams`, `generateMetadata`, `sitemap.ts`; giữ URL cũ | Như A; antd SSR cần registry, rủi ro FOUC | Rất tốt (HTML tĩnh), không có ISR thật |
| Luồng đặt vé có đăng nhập | Tốt; có route handler làm BFF | Form nhanh nhưng giao diện kiểu antd, nặng | Hai thế giới, khó chia state |
| Bundle | Nhỏ | Lớn (ước tính) | Nhỏ nhất cho trang nội dung |
| Tiếng Việt | `next/font` subset vietnamese, next-intl | antd có vi_VN | Tự làm i18n |
**Khuyến nghị: A.** pnpm 10, Node 22, TS strict, `cacheComponents`, CMS đọc ở server có cache, trang `/xe-khach/*` chủ yếu client. TanStack Query, RHF + zod (zod cũng parse response), fetch client mỏng có header `Domain: haivan.com`. Hosting: Vercel dễ nhất; self-host cần cache handler.

## State & auth
- Tham số tìm chuyến nằm trên URL. Bản nháp booking `{trip_id, departure_id, destination_id, merchant_code, seats, order_code, expire_time, pick_up, drop_off, note}` → zustand persist sessionStorage; bỏ khi quá `expire_time`.
- Trang thanh toán chạy được chỉ từ URL (`booking_code, merchant_code, trip_id`) vì gateway redirect về.
- Token: khuyến nghị cookie httpOnly qua BFF Next (`/api/gw/[...path]` có allowlist path, chỉ gắn `Authorization` khi tới apigw). localStorage chỉ chấp nhận với CSP chặt, nhưng reCAPTCHA/analytics/bản đồ là script bên thứ ba.
- Không có refresh token đã biết.

## Test
Vitest 5 + MSW 3 (`onUnhandledRequest: 'error'`, chặn fetch apigw chưa stub), assert body/header cho hold/bookings/update-booking/cancel/get-otp/verify-otp/register/payment; zod dùng chung cho fixture. Testing Library cho chọn ghế, đếm ngược. Playwright với `page.route` mock luồng ghi. Smoke live chỉ GET, bật bằng env flag.

## Bản đồ
Leaflet 1.9.4 + react-leaflet 5, `next/dynamic` ssr:false. Cần chọn nhà cung cấp tile trước khi lên production (OSM không cho dùng nặng).

## Probe chỉ đọc
- apigw preflight POST: 204, `allow-origin *`, `allow-headers authorization,domain,content-type`.
- cms.haivan.com phản chiếu Origin (localhost OK). `route-listing?route=quan-1/vung-tau` trả `{data:{slug,start_place,end_place,wayroad{…}}}`.
- `cms api/homewayroads` trả `[]` (cả có/không `language`): tuyến phổ biến trang chủ web gốc nằm trong `__NEXT_DATA__.list_route` render phía server → cần lần nguồn.
- `cms api/location` có dữ liệu; `cms api/get-news?page=1` trả `{}`.

## Câu hỏi chưa giải quyết
1. Domain chạy web mới / reCAPTCHA key cho domain đó.
2. Hosting (Vercel hay tự host).
3. Nguồn CMS cho tin tức, khuyến mãi, điểm đến, tuyến phổ biến.
4. next-intl với `cacheComponents`; có cần `/en` không.
5. Nhà cung cấp tile bản đồ.
6. Backend có `expires_in` / refresh không.
7. CMS có webhook revalidate không.
