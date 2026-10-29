---
title: "Dựng lại web haivan.com (WP nội dung + Next.js đặt vé)"
description: "Thay web haivan.com không còn bảo trì bằng WordPress cho MKT + Next.js cho luồng đặt vé giống hệt web cũ, chạy trên backend Hải Vân"
status: in-progress
priority: P1
effort: "~30 ngày công (1 dev)"
tags: [haivan, nextjs, wordpress, booking, rebuild]
created: 2026-10-28
---

# Dựng lại web haivan.com

## Overview
haivan.com là bộ mặt Hải Vân nhưng không còn ai bảo trì được; anh giữ domain, không có source, backend (apigw/cms/cpn) là của Hải Vân. Dựng lại trên chính domain: **WordPress** cho trang nội dung MKT tự sửa, **Next.js** cho luồng đặt vé + tài khoản. Luồng đặt vé phải **giống web hiện tại** theo đặc tả đã REA + chạy thật.

Nguồn sự thật: `docs/tech-stack.md`, `docs/booking-flow-spec.md`, `docs/booking-flow/00-03`, `docs/design-guidelines.md`, `docs/reference/locales/`, `plans/reports/researcher-261028-*.md`, `plans/reports/red-team-261028.md`.

## Brainstorm contract (đã duyệt)
- **Outcome:** haivan.com mới: trang nội dung (WP) + đặt vé xe khách & tài khoản (Next.js) chạy dữ liệu thật.
- **Constraints:** giữ nguyên hợp đồng API web cũ (`Domain: haivan.com`, `channel:1`, body/query như live capture và chuỗi tái dựng từ bundle, kể cả `is_combo`, `return_url` VNPay nối thô); sửa lỗi thuần UI; giữ URL cũ (kể cả `/en/`); token chỉ tới apigw (cookie httpOnly qua BFF); không dữ liệu mẫu; không ghi production trong test tự động; không commit bí mật/PII; không sửa `/Users/phuc/Documents/REA Android`.
- **Non-goals:** thông báo đẩy; xe sân bay/hợp đồng/CPN/trung chuyển như sản phẩm riêng; pixel-perfect.

## Kiến trúc
```
haivan.com (nginx: TLS, CSP theo location, limit_req, cookie affiliate)
 ├─ [/en]/xe-khach/**, [/en]/tai-khoan/**, [/en]/partner/**, [/en]/tracking/**, /_next/**, /api/hv/** → apps/booking (Next.js 16)
 └─ còn lại (/, /en/, /chung-toi/**, /dich-vu/**, /chinh-sach/**, /diem-den/**, /uu-dai/**, /ho-tro/**, /dat-ve-nhanh*, /wp-json/**) → WordPress
apps/booking:
  trình duyệt → apigw/cms trực tiếp (CORS *): places, el/trips, trips/{id}, el/trip_detail, maps/places, get-otp, CMS
  trình duyệt → /api/hv/auth/* , /api/hv/gw/* (allowlist method+regex, CSRF, query thô) → apigw (Authorization từ cookie)
WordPress child theme: header/footer + REST `haivan-web/v1/layout`, widget tìm vé → /xe-khach/tim-chuyen, trạng thái đăng nhập qua /api/hv/auth/session
```

## Phases
| # | Phase | Phụ thuộc | Effort | Status |
|---|-------|-----------|--------|--------|
| 1 | [Repo, tooling, chụp lưu site cũ](./phase-01-start.md) | – | 1d | Completed |
| 2 | [Nền app đặt vé (tokens, layout, i18n /en, API client, schemas)](./phase-02-booking-app-foundation.md) | 1 | 2.5d | Completed |
| 3 | [BFF an toàn + đăng nhập OTP](./phase-03-auth-bff-otp-login.md) | 2 | 3d | Completed |
| 4 | [Tìm chuyến + trang tuyến](./phase-04-search-and-route-pages.md) | 2 | 2.5d | Completed |
| 5 | [Sơ đồ ghế + giữ chỗ + affiliate](./phase-05-seat-map-and-hold.md) | 3, 4 | 2.5d | Completed |
| 6 | [Xác nhận + đặt vé](./phase-06-confirm-and-booking.md) | 5 | 4d | Completed |
| 7 | [Thanh toán + thành công](./phase-07-payment-and-success.md) | 6 | 2d | Completed |
| 8 | [Tài khoản, cập nhật dịch vụ, tracking](./phase-08-account-my-trips-profile.md) | 3 | 3.5d | Completed |
| 9 | [WordPress nội dung](./phase-09-wordpress-content-site.md) | 1 (song song 2–8) | 5d | Completed (CMS → WP: 1.001 URL 200) |
| 10 | [Ghép domain, test, triển khai](./phase-10-integration-routing-tests-deploy.md) | 2–9 | 4d | In progress |
| 11 | [Khớp giao diện gốc + landing tuyến + SEO](./phase-11-ui-parity-seo.md) | 9, 10 | 3d | Completed |

## Delta hợp đồng có chủ đích (anh đã duyệt 2026-10-28; `api/logout` bỏ hẳn, giống web cũ)
| # | Thay đổi so với web cũ | Lý do |
|---|---|---|
| 1 | Mã hoá từng giá trị trong `get-otp?phone=` (email có `+`) | Web cũ gửi `+` thô → backend hiểu thành dấu cách |
| 2 | Không gửi `utm_source`/`aff_sid` = chuỗi `"null"` | Lỗi ghi cookie ở `_app` cũ làm bẩn dữ liệu affiliate |
| 3 | Giữ header `Domain` sau đăng nhập | Web cũ mất header tới khi tải lại |

## Success Criteria
- [ ] Đi hết luồng trên `staging.haivan.com`: trang tuyến → tìm chuyến → ghế → đăng nhập OTP → giữ chỗ → xác nhận → đặt vé → trang cổng thanh toán → huỷ; request/response khớp `docs/booking-flow/00` (contract diff + 1 lần chạy thật có duyệt).
- [ ] Mọi lỗi API hiện đúng `message`/`errors` backend; không đánh dấu đã thanh toán ở client.
- [ ] `pnpm typecheck lint test build` xanh; E2E (mock apigw, chứng minh 0 request thật) xanh; smoke allowlist live xanh.
- [ ] Test tấn công BFF (path traversal, `//host`, sai method, CSRF) đều bị chặn.
- [ ] MKT sửa trang/menu/tin trong WP admin; header/footer Next cập nhật ≤ 2h (cache WP + Next).
- [ ] URL cũ (vi + `/en/`) trả 200 hoặc 301 hợp lệ; sitemap index gồm `/xe-khach/sitemap.xml`.
- [ ] Không bí mật/PII trong git; token không đọc được từ JS và không có trong response BFF.

## Rủi ro chính
- Backend không có sandbox: test tự động dùng MSW + mock server (BFF), chạy thật chỉ khi anh duyệt từng lần.
- reCAPTCHA chỉ chạy trên domain trong danh sách key: kiểm trên `staging.haivan.com` (subdomain thường được chấp nhận) trước cutover.
- Người dùng đã đăng nhập đi qua 1 IP server: theo dõi 429/403 ở staging; `get-otp` đi trực tiếp để giữ throttle theo IP người dùng.
- WP cùng origin với BFF: XSS/plugin lỗi có thể gọi BFF bằng phiên người dùng → khoá `unfiltered_html`, wp-admin giới hạn IP, CSP, CSRF header; rủi ro còn lại được ghi nhận.
- Host cũ có thể mất bất cứ lúc nào → chụp lưu site cũ ở phase 1.
- Effort ~30 ngày (đã tính lại sau phản biện); nếu cần rút → chỉ có thể dời phần ngoài luồng chính (tracking, ưu đãi, khách hàng thân thiết) với sự đồng ý của anh.

## Open questions
1. Ai quản trị DNS haivan.com và hosting cũ còn không (đường lùi); VPS mới ở đâu.
2. Nhà cung cấp tile bản đồ (OSM giới hạn production).
3. Giữ pixel affiliate `lacmp.net` không.

<!-- slug: haivan-web-rebuild -->
