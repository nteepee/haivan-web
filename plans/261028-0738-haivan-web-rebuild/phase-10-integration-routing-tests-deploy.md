---
phase: 10
title: "Ghép domain, test, triển khai"
status: in-progress
priority: P1
effort: "4d"
dependencies: [2, 3, 4, 5, 6, 7, 8, 9]
---

# Phase 10: Ghép domain, test, triển khai

## Overview
Ghép WP + Next sau một nginx trên haivan.com, kiểm thử toàn luồng không chạm production, chạy thật có duyệt, cutover DNS có đường lùi.

## Requirements
- nginx (`deploy/nginx/haivan.conf`):
  - → Next: `= /xe-khach`, `/xe-khach/`, `= /tai-khoan`, `/tai-khoan/`, `/partner/`, `/tracking`, `/tracking/`, `/_next/`, `/api/hv/`, và bản `/en/` tương ứng (`^/en/(xe-khach|tai-khoan|partner|tracking)(/|$)`) — web cũ phục vụ `/en/xe-khach/...` (đã kiểm 200). Sitemap tuyến tại `/xe-khach/sitemap.xml`.
  - → WP: còn lại (gồm `/`, `/en/`, `/dat-ve-nhanh*`, trang nội dung, `/wp-json/`). `/wp-admin`, `/wp-login.php` giới hạn IP (hoặc host riêng `admin.haivan.com`).
  - Cookie affiliate: `map $arg_utm_source`/`$arg_aff_sid` → `add_header Set-Cookie` 30 ngày, `path=/`, SameSite=Lax trên mọi location (cùng ngữ nghĩa `_app` cũ).
  - `limit_req` theo `$binary_remote_addr` cho `/api/hv/auth/`; tắt cache nginx + `Cache-Control: private, no-store` cho `/api/hv/`, `/tai-khoan/`.
  - CSP **theo location**: Next (nonce hoặc `'unsafe-inline'` cho script inline App Router — quyết khi dựng; `frame-src www.google.com/recaptcha recaptcha.net`; `connect-src 'self' apigw.haivan.com cms.haivan.com`; `img-src 'self' data: cms.haivan.com <tile>`), WP front-end, wp-admin (lỏng hơn, giới hạn IP).
  - HTTPS (Let's Encrypt), HSTS sau khi ổn định, gzip/brotli, www → apex.
- Test (không chạm production):
  - Vitest + MSW phase 2–8 xanh.
  - E2E Playwright: khởi động Next với `APIGW_URL=http://127.0.0.1:<port>` trỏ **mock server** dựng từ fixtures (`apps/booking/e2e/mock-apigw.ts`) — vì BFF gọi từ server, `page.route` không chặn được; trình duyệt dùng `NEXT_PUBLIC_APIGW_URL` cùng mock. Guard BFF từ chối `apigw.haivan.com` khi `E2E=1`. Kiểm URL redirect VNPay/PayOS (không theo).
  - Job e2e chạy với DNS override `apigw.haivan.com → 127.0.0.1` (hoặc chặn egress) để chứng minh không có request thật.
  - Smoke live: **allowlist endpoint** (không dựa vào method): `places`, `el/trips` (ngày mai), `trips/{id}`, `el/trip_detail`, CMS `route-listing`, `list-banner`; parse bằng schema; bật bằng env.
  - Contract diff: script so body/query sinh ra với `docs/booking-flow/00` + chuỗi query tái dựng từ `02`.
- Chạy thật có duyệt (từng lần, tài khoản không đơn treo) — **chưa có VPS nên làm Tier C local trước** (Chrome profile mới, `--host-resolver-rules="MAP haivan.com 127.0.0.1:8180"`, `PUBLIC_ORIGIN=http://haivan.com`, `HV_LIVE_WRITES=1` chỉ trong cửa sổ chạy, lưu log `[BFF][LIVE WRITE]`); khi có VPS thì lặp lại trên `staging.haivan.com` nếu Hải Vân thêm domain vào key reCAPTCHA: đăng nhập reCAPTCHA thật, giữ chỗ → đặt vé → trang cổng VNPay/PayOS (không trả tiền, quay về staging) → huỷ; tuỳ anh: khuyến mãi/dịch vụ. Sau cutover chạy lại 1 vòng quay về từ cổng.
- Cutover:
  - Trước: export toàn bộ zone DNS (MX/SPF/DKIM/TXT), ghi A/CNAME cũ (đường lùi), hạ TTL 300; chụp lưu site cũ đã có ở phase 1.
  - Dựng song song, chuyển A/CNAME apex + www, theo dõi 404/5xx 48h; lùi = trả bản ghi cũ (nếu hạ tầng cũ còn) hoặc trang bảo trì.
  - Backup DB WP + uploads trước cutover, kiểm khôi phục 1 lần.
- SEO: Rank Math sitemap index thêm `/xe-khach/sitemap.xml`; `robots.txt` (WP) trỏ sitemap; 301 cho URL không giữ.
- Tài liệu: `docs/deployment-guide.md`, `docs/system-architecture.md`, `docs/codebase-summary.md`.

## Architecture
```
Internet → nginx (TLS, CSP/location, limit_req) ─┬─ Next standalone :3000 (apps/booking)
                                                 └─ php-fpm WordPress (Docker) + MariaDB
```

## Related Code Files
- Create: `deploy/nginx/haivan.conf`, `deploy/compose.prod.yaml`, `apps/booking/e2e/{mock-apigw.ts,booking-flow.spec.ts,auth.spec.ts,account.spec.ts}`, `apps/booking/scripts/smoke.ts`, `scripts/contract-diff.ts`, `docs/{deployment-guide,system-architecture,codebase-summary}.md`.

## Implementation Steps
1. Mock apigw + E2E + DNS override; smoke allowlist; contract diff.
2. nginx + compose prod; dựng `staging.haivan.com`.
3. Chạy thật có duyệt trên staging; ghi `docs/booking-flow/00-live-capture-<ngày>.md` (mã giả).
4. Tài liệu.
5. Cutover theo checklist + theo dõi + chạy lại vòng cổng thanh toán.

## Bổ sung sau checkpoint kongming (2026-10-28)
- Route `/email/verify` (đích link thư xác minh email, web cũ trả 200) → Next; nginx thêm `email` vào nhóm route Next.
- `www.haivan.com` → 301 apex (CSRF so Origin chính xác với `PUBLIC_ORIGIN`).
- `limit_req` thêm cho `/api/hv/gw/` (dò `bookings/{code}` đi qua IP server).
- Web cũ không có `robots.txt`, `sitemap.xml`, `/.well-known/*` (đã kiểm 404) → không cần giữ.
- Hỏi Hải Vân IT: throttle theo IP/user cho `get-otp`/`verify-otp`/`register`/`hold-booking`/`bookings`, whitelist IP VPS; domain list key reCAPTCHA; owner-scope `bookings/{code}`; CORS; return/IPN VNPay/PayOS; email nào link về haivan.com; endpoint tracking đọc-only; DNS do ai giữ.
- Plan B nếu bị throttle theo IP: trình duyệt gọi thẳng `verify-otp` như web cũ rồi BFF kiểm token qua `customer/customers` trước khi seal cookie (chưa làm).

## Success Criteria
- [ ] Job e2e chứng minh 0 request tới apigw thật.
- [ ] Đăng nhập reCAPTCHA thật thành công ở Tier C local (rồi staging/domain chính khi có VPS).
- [ ] `/en/xe-khach/...`, `/tai-khoan`, `/xe-khach/sitemap.xml` tới Next; tài sản Next không 404.
- [ ] Không 5xx; 404 chỉ với URL đã biết bỏ (có 301). Lighthouse mobile: performance ≥ 80, SEO ≥ 95 (trang chủ, trang tuyến).

## Risk Assessment
- reCAPTCHA từ chối staging/domain → dừng cutover, báo anh.
- apigw 403/429 với BFF → hỏi Hải Vân; không mở thêm proxy.
- Mất email do DNS → đã export zone; kiểm MX sau khi đổi.

## Kết quả bước 1 + stack local (2026-10-28)
- E2E Playwright (`pnpm e2e`, 7 test, mock apigw `e2e/mock-apigw.ts`): tìm chuyến → ghế → OTP → giữ chỗ → xác nhận → thanh toán VNPay (không theo link); auth (cookie httpOnly, token không lộ JS, ranh giới BFF); tài khoản (huỷ vé). 0 request production, 5 lớp chặn:
  - log mock;
  - chặn production phía trình duyệt;
  - chặn egress và DNS của trình duyệt;
  - DNS guard phía server cho `next build`/`next start`;
  - guard BFF khi `E2E=1`.
- `pnpm contract-diff` (9 test): body/query sinh ra khớp live capture 261028 (hold, bookings, hold-transit, cancel-seat, get-promotions, el/trips, check-promotions, vnpay raw).
- `pnpm smoke` (live, chỉ GET, allowlist cứng) cần `HV_SMOKE_LIVE=1`; chưa chạy.
- Sửa: Next 16 chuẩn hoá query trước route handler → client gửi kèm `X-HV-Query`, BFF chỉ dùng khi tương đương ngữ nghĩa (`src/server/raw-query.ts`), giữ byte như web cũ (return_url VNPay, `%20`).
- Stack local `http://localhost:8180`:
  - nginx docker → Next standalone `:3010` (`deploy/local/start-next.sh`) + WP `:8089` (`WP_URL=http://localhost:8180`, đã search-replace DB).
  - nginx thêm: route `email`, `limit_req` cho `/api/hv/`, `www` → apex, `default_server`, `Host $http_host`.
- Sửa lỗi chỉ lộ ở standalone: `proxy.ts` rewrite `/x` → `/vi/x` bị chạy lại và 308 vòng lặp → đánh dấu `x-hv-rewritten`.
- `pnpm verify` xanh (196 test).

### Review phase 10 (`plans/reports/code-review-phase-10.md`) + phần nginx của review phase 9 — đã sửa
- **Rate limit:**
  - `limit_req` cho verify/register trước đây không bao giờ áp (regex thua `^~ /api/hv/`) → chuyển sang `location =`.
  - `/api/hv/auth/session` không giới hạn (gọi ở mọi trang).
  - 429 trả JSON.
- **`gw()`:** mỗi đoạn path phải khớp `^[A-Za-z0-9_-]+$`; danh sách đen cũ bị lách bằng tab/LF.
- **`X-HV-Query`:** bỏ qua khi có `#`, bắt đầu bằng `?` hoặc UTF-8 hỏng.
- **Host:**
  - Host lạ → 444.
  - Map `$hv_host_ok` (`HV_HOST_REGEX`) chặn cả request dùng URL tuyệt đối.
  - `www.haivan.com` → apex.
- **Nginx khác:**
  - `admin-ajax`/`admin-post` mở công khai (trước đó lồng trong `/wp-admin/` nên bị deny).
  - `/tai-khoan` gửi `private, no-store`.
  - Xoá header `X-HV-Rewritten` client gửi lên.
- **E2E:** chạy `server.js` standalone như production.
- **SEO:** `SearchForm`/`RouteTrips` đọc giờ hiện tại lúc prerender làm Next bỏ trống khối nội dung (HTML không có `h1`/JSON-LD) → `useToday()` (`useSyncExternalStore`, server trả `""`).
- **Còn mở:**
  - Ngưỡng rate limit thực tế khi có CDN/NAT nhà mạng.
  - Khối TLS 443 + compose prod khi có VPS (`docs/deployment-guide.md` đã ghi cách chạy trên Linux).
