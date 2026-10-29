---
phase: 9
title: "WordPress nội dung"
status: pending
priority: P1
effort: "5d"
dependencies: [1]
---

# Phase 9: WordPress nội dung (MKT tự sửa)

## Overview
WP chạy mọi trang không thuộc luồng đặt vé: trang chủ, Chúng tôi, Dịch vụ, Chính sách, Hỗ trợ, Điểm đến, Ưu đãi, Tin tức, landing. Giao diện bám haivan.com, header/footer dùng chung với Next qua REST.

## Requirements
- Docker local (`wordpress/compose.yaml`: wordpress php-fpm 8.3 + mariadb + nginx), tham khảo `/Users/phuc/Documents/HV_QR_BOOKING/deploy/local` (chỉ đọc, **không chép** `hvb-direct-booking.php` hay token).
- Theme: Flatsome (license sẵn có của anh) + child theme `haivan-web-child`: tokens `design-guidelines.md`, Nunito, header/footer giống web cũ; menu quản lý trong WP.
- Plugins: Polylang (vi mặc định, en `/en/`), Rank Math (SEO, sitemap, redirect 301).
- REST `GET /wp-json/haivan-web/v1/layout` → `{menus:{primary, footer_columns}, footer:{company, addresses, certificates, partners, payment_logos}, hotline}` (public, cache header 1h) cho Next.
- Widget/shortcode `[haivan_search]` (JS thuần, không framework): form giống `search-form` Next, gọi `apigw api/places`, submit GET tới `/xe-khach/tim-chuyen?...` (mã hoá URL). Dùng trên trang chủ và landing.
- Giữ URL nội dung cũ (từ build manifest): `/chung-toi/{gioi-thieu,an-toan-chat-luong,bao-chi-tin-tuc,bao-chi-tin-tuc/[id],chuong-trinh-khach-hang-than-thiet,danh-gia-cua-khach-hang,doi-tac,lien-he,phat-trien-ben-vung,tuyen-dung}`, `/dich-vu/**`, `/chinh-sach/**`, `/ho-tro/**`, `/diem-den`, `/diem-den/[id]`, `/uu-dai/[id]`, `/tuyen-duong/*`, `/haivanplus`, `/dat-ve-nhanh*` (`/tracking*` thuộc Next, phase 8).
- Nhập nội dung 1 lần (ưu tiên từ `archive/old-site/` phase 1): script WP-CLI đọc `cms.haivan.com` (`api/location`, `api/location/{slug}`, `api/news`, `api/get-news`, `api/promotion-listing`, `api/promotion-detail`, `api/list-banner`) + nội dung tĩnh của trang cũ (`_next/data/<build>/vi/*.json`) → bài viết/trang WP; giữ slug; ảnh tải về Media. API trả rỗng (`get-news` = `{}`) → nhập từ `_next/data` hoặc HTML trang cũ.
- URL: permalink `/%postname%` **không dấu `/` cuối** (tránh 301 hàng loạt); CPT + rewrite cho `/diem-den/[id]`, `/uu-dai/[id]`, `/chung-toi/bao-chi-tin-tuc/[id]` khớp id/slug cũ; Polylang en giữ slug cũ dưới `/en/`. `/dat-ve-nhanh*` = landing WP (widget tìm vé).
- Trạng thái đăng nhập trên trang WP: header gọi `/api/hv/auth/session` (JS nhỏ) để hiện "Tài khoản"/"Đăng nhập"; "Đăng nhập" dẫn `/tai-khoan/dang-nhap?next=<url>`.
- Cookie affiliate `utm_source`/`aff_sid` 30 ngày nếu nginx chưa đặt (cùng ngữ nghĩa, phase 10); widget tìm vé đặt cookie `pll_language` → Next dùng đúng ngôn ngữ.
- Bảo mật (cùng origin với BFF): `DISALLOW_UNFILTERED_HTML`, `DISALLOW_FILE_EDIT`, `wp-admin`/`wp-login.php` giới hạn IP hoặc host riêng, 2FA cho tài khoản quản trị, cập nhật plugin tự động, CSP front-end.
- Tuyến phổ biến trang chủ: CPT/ACF hoặc block do MKT sửa (thay `homewayroads` đang trả `[]`), seed từ `__NEXT_DATA__.list_route` trang chủ cũ.
- Non-functional: trang chủ LCP < 2.5s; không plugin thừa; backup DB + uploads hằng ngày (tài liệu ở phase 10).

## Architecture
```
wordpress/
  compose.yaml, nginx/default.conf
  wp-content/themes/haivan-web-child/{style.css,functions.php,header.php,footer.php,inc/{layout-rest.php,search-shortcode.php,tokens.php},assets/{search.js,search.css,fonts}}
  scripts/import-cms.php (WP-CLI)
```

## Related Code Files
- Create: các file trên, `wordpress/README.md` (chạy local, import, cấu hình Polylang/Rank Math).

## Implementation Steps
1. Docker local + cài WP, Flatsome, Polylang, Rank Math.
2. Child theme: tokens, header/footer, menu.
3. REST layout + test (WP-CLI/PHPUnit nhẹ hoặc curl script).
4. Shortcode tìm vé.
5. Script nhập nội dung + seed tuyến phổ biến; kiểm slug/URL cũ.
6. Rank Math: sitemap, meta, redirect cho URL đổi.

## Success Criteria
- [ ] Mọi URL nội dung cũ trong manifest trả 200 (hoặc 301 có chủ đích) trên local.
- [ ] MKT đổi menu trong admin → `layout` REST đổi theo.
- [ ] Widget tìm vé submit ra đúng URL Next.

## Risk Assessment
- Flatsome license/phiên bản: nếu không dùng được trên domain mới → dùng block theme miễn phí, giữ child theme logic. Dấu hiệu: không kích hoạt được license → hỏi anh.
- Nội dung cũ không lấy được qua API → lấy từ `_next/data`/HTML; thiếu ảnh gốc → đánh dấu để MKT bổ sung.
