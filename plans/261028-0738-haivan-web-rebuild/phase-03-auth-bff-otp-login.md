---
phase: 3
title: "BFF + đăng nhập OTP"
status: completed
priority: P1
effort: "3d"
dependencies: [2]
---

# Phase 3: BFF + đăng nhập OTP

## Overview
Đăng nhập giống web cũ (SĐT/email + reCAPTCHA v2 → OTP 6 số → token; khách mới → đăng ký). Token ở cookie httpOnly; mọi gọi cần token đi qua BFF có allowlist chặt, chống SSRF/CSRF.

## Requirements
- Functional (`docs/booking-flow/00` mục Đăng nhập, `03-payment-account.md` §5):
  - Modal "Đăng nhập" (Next) + route `/tai-khoan/dang-nhap?next=` cho trang WP dẫn sang: 1 ô (SĐT 10 số bắt đầu 0, hoặc email), reCAPTCHA v2 (site key web cũ), "Tiếp tục" chỉ bật khi có token captcha; reset captcha sau mỗi lần gửi.
  - **`GET api/get-otp?phone=&captcha=&channel=1` gọi thẳng trình duyệt → apigw** như web cũ (không qua BFF: giữ IP người dùng cho throttle/reCAPTCHA). Giá trị được mã hoá từng phần (email có `+`) — delta hợp đồng #1. Nhánh 2xx khác 200 → `is_new` → form đăng ký (như web cũ).
  - OTP 6 ô, tự gửi khi đủ → `POST /api/hv/auth/verify` → BFF gọi `api/verify-otp {phone: phone||email, otp, channel:1}`; có token → set cookie, **trả về client không kèm token**; không có → bước đăng ký `POST /api/hv/auth/register` → `api/register {email, phone, otp, name}` (thành công khi `data.code===200`); 400 → `login_form.msg.error_OTP`; hết `expire_time` → quay lại.
  - Không hiển thị `otp` nếu backend trả trong body.
  - Sau đăng nhập: `customer/customers`, `customer/definition`, `v4/definition` (như web cũ); modal bắt cập nhật hồ sơ khi `data_source===1` đặt ở layout chung Next.
  - Đăng xuất: **không gọi API** (giống web cũ, anh quyết 2026-10-28) — BFF xoá cookie, client reset store, về `/`.
  - 401 upstream → BFF trả 401 **kèm xoá cookie**; client mở lại modal, giữ nháp.
- Non-functional (BFF):
  - Cookie `hv_session`: httpOnly, Secure, SameSite=Lax, host-only (không đặt `Domain`), `Path=/`, `Max-Age` 365 ngày (web cũ giữ đăng nhập rất lâu), mã hoá iron-session (`SESSION_SECRET` server-only).
  - Chống CSRF cho mọi non-GET `/api/hv/*`: bắt buộc `Content-Type: application/json`, `Origin` = `https://haivan.com` (env), `Sec-Fetch-Site: same-origin`, header `X-HV-Req: 1`; sai → 403.
  - `Cache-Control: private, no-store` cho mọi `/api/hv/*`.
  - nginx `limit_req` theo IP client cho `/api/hv/auth/*` (phase 10).

## Architecture
- `app/api/hv/auth/{verify,register,logout,session}/route.ts`.
- `app/api/hv/gw/[...path]/route.ts`:
  - Bảng allowlist **theo method + regex đúng**, ví dụ: `POST ^hold-booking$`, `POST ^bookings$`, `GET ^bookings$`, `GET ^bookings/[A-Z0-9]+$`, `GET ^bookings/download-bill$`, `GET ^info-payments$`, `GET ^info-payment-block$`, `GET ^payment/(vnpay|payos)$`, `POST ^update-booking/[A-Z0-9]+$`, `POST ^cancel-seat$`, `POST ^cancel-booking$`, `GET ^list-reason$`, `GET|PUT|POST ^customer/customers(/update-profile|/tax)?$`, `GET ^customer/definition$`, `GET ^reward/definition$`, `GET ^v4/(definition|get-bonus-service|detail-transit/[A-Z0-9]+|get-info-ticket)$`, `POST ^v4/(get-price-transit|hold-transit|update-transit)$`, `GET ^promotion/(get-promotions|promotional_code_list_all)$`, `POST ^promotion/check-promotions$`, `GET ^price-ticket$`, `GET ^admin/search-code-hide$`, `GET ^transit/customer/(list-order|detail-order/[A-Z0-9]+)$`, `DELETE ^transit/cancel-order/[A-Z0-9]+$`, `POST ^qrcode/agency-qr-code-scan-logs$`. Ngoài bảng → 404.
  - Mỗi segment khớp `^[A-Za-z0-9_-]+$`; URL = `APIGW_ORIGIN + '/api/' + segments.join('/') + request.nextUrl.search` (**query thô, không serialize lại**); assert `url.origin === APIGW_ORIGIN`.
  - Header gửi đi cố định: `Accept: application/json`, `Domain: haivan.com`, `Content-Type` (khi có body), `Authorization` (từ cookie). Không chuyển header trình duyệt.
  - `fetch(..., {redirect:'manual'})`; trả status + body; chỉ chép `Content-Type` từ upstream (bỏ `content-encoding`, `set-cookie`, hop-by-hop).
  - `APIGW_URL` server-only (không dùng `NEXT_PUBLIC_*`); khi `E2E=1` hoặc `NODE_ENV!=='production'` mà host là `apigw.haivan.com` → từ chối (chỉ cho mock).
- Client: `useSession()` qua `/api/hv/auth/session` (`{loggedIn, user}` không token); `LoginDialog` (react-google-recaptcha, `next/dynamic` ssr:false); fetch wrapper luôn gửi `X-HV-Req: 1`.

## Related Code Files
- Create: `src/app/api/hv/auth/{verify,register,logout,session}/route.ts`, `src/app/api/hv/gw/[...path]/route.ts`, `src/lib/{session,gw-allowlist,csrf,upstream}.ts`, `src/components/auth/{login-dialog,otp-step,register-step,force-profile-dialog}.tsx`, `src/app/(booking)/tai-khoan/dang-nhap/page.tsx`, `src/hooks/use-session.ts`, tests.

## Implementation Steps
1. Session + CSRF libs + test.
2. Allowlist + proxy + test tấn công: `%2F`, `%2e%2e`, `//evil.com`, sai method, path ngoài bảng, Authorization không bao giờ tới host khác apigw, query thô giữ nguyên (`codes%5B0%5D%5Bpromotion%5D`, `%20`).
3. Auth routes + test hợp đồng (body verify/register như live; response không chứa token).
4. UI modal + trang đăng nhập + i18n `login_form.*` (thêm `error_input`).
5. Logout (chỉ xoá cookie) + 401 toàn cục.

## Success Criteria
- [ ] Mọi test tấn công proxy trả 404/403; không request nào ra host khác `APIGW_ORIGIN`.
- [ ] Response verify/register/session không chứa `access_token`; `document.cookie` không thấy token.
- [ ] POST thiếu `X-HV-Req`/sai Origin → 403.
- [ ] `get-otp` đi trực tiếp trình duyệt → apigw với `channel=1`.

## Risk Assessment
- reCAPTCHA không chạy ngoài domain trong danh sách key → dev dùng MSW; kiểm thật trên `staging.haivan.com` (thường được chấp nhận như subdomain) ở phase 10. Google báo "Invalid domain for site key" → dừng, báo anh.
- apigw throttle theo IP cho người đã đăng nhập (đi qua BFF) → theo dõi 429 ở staging; nếu có → hỏi Hải Vân; không chuyển tiếp `X-Forwarded-For` từ client (chỉ set từ nginx `$remote_addr` nếu Hải Vân yêu cầu).
- WordPress cùng origin: XSS trong WP có thể gọi BFF bằng phiên người dùng → giảm thiểu ở phase 9 (khoá `unfiltered_html`, wp-admin giới hạn IP, CSP); ghi nhận rủi ro còn lại.

## Kết quả (2026-10-28)
- `src/server/*`: env, session (iron-session sealData, cookie host-only, Secure theo scheme của `PUBLIC_ORIGIN`), csrf, allowlist method+regex, upstream (header cố định, query thô, `redirect:"manual"`, chỉ chép Content-Type).
- Cổng an toàn rõ ràng (thay cho dò NODE_ENV): backend không phải loopback cần `HV_LIVE_BACKEND=1`; ghi tới backend thật cần thêm `HV_LIVE_WRITES=1` (log `[BFF][LIVE WRITE]`).
- Đăng nhập: `get-otp` trình duyệt → apigw; verify/register qua BFF; đăng xuất chỉ xoá cookie; `/tai-khoan/dang-nhap?next=` cho header WP. reCAPTCHA tự nạp (explicit render), site key qua `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
- Test: 10 test BFF (allowlist/traversal, CSRF, 401 xoá cookie, cổng live, không lộ token).
- Sau review độc lập (6 high): đã sửa open redirect qua ký tự điều khiển (`safeNext` so origin), GET qua gw cần `X-HV-Req` + chặn `Sec-Fetch-Mode: navigate`, `payment/*` và `price-ticket` tính là thao tác ghi (cổng `HV_LIVE_WRITES`), relay chỉ trả JSON + `nosniff` + CSP sandbox, DELETE giữ body, 204 không thành 502, giới hạn 5 lần verify/10 phút theo SĐT, cookie `__Host-` khi HTTPS, `instrumentation.ts` dừng production nếu thiếu `SESSION_SECRET`.
- Còn mở (go-live blocker): nginx `limit_req` theo IP cho `/api/hv/auth/*`; hỏi Hải Vân khoá throttle của verify-otp (IP server).
- Lệch có chủ đích: không gọi `customer/definition` + `v4/definition` ngay sau đăng nhập (tải khi vào trang hồ sơ); modal bắt cập nhật hồ sơ (`data_source===1`) làm ở phase 8.
