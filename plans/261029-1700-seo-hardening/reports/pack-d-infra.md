# Pack D hạ tầng (#2, #3, #6)

## Đã làm (chỉ deploy/** + docs/deployment-guide.md)
- `deploy/nginx/nginx.conf`: map header HTML (XFO, Permissions-Policy, HSTS theo $scheme + `HV_HSTS_MAX_AGE`), `proxy_cache_path hv_wp`, map bypass (cookie WP, Authorization, query lạ, method), map Cache-Control, gzip xml.
- `hv-security-headers.conf` (mới): nosniff + Referrer-Policy mọi phản hồi; XFO/Permissions-Policy/HSTS chỉ HTML. `hv-wp-proxy.conf`, `hv-next-proxy.conf`: bỏ header cùng tên của upstream (tránh lặp).
- `hv-wp-cache.conf` (mới): proxy_cache cho `location /` WP; key `scheme+host+uri`; TTL 200/301 5m, 404 1m; stale/background update; `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600` cho HTML 200 ẩn danh; `X-Cache-Status`.
- `wp-locations.inc`: `/wp-json/` không cache; static `wp-content|wp-includes` `public, max-age=2592000` (chỉ 2xx/3xx); `/` có cache.
- `hv-server-common.inc` (mới, tách từ template) + `haivan.conf.template` còn khối 444, www→apex, server :80 include common. `hv-next-api.conf` include security headers.
- `conf.d/haivan-tls.conf.example` (mới, không nạp): khối 80→443, www, 443 TLS include common. `nginx -t` pass trong container tạm (cert tự ký, không mở cổng).
- `local/compose.yaml`: mount file mới, env `HV_HSTS_MAX_AGE=300`.
- `deploy/check-seo-golive.sh <base-url>` (mới, +x): xem docs.
- `docs/deployment-guide.md`: mục "Header bảo mật và page cache" + "Checklist go-live SEO" (9 bước); sửa dòng fastcgi_cache -> proxy_cache.

## Kiểm trên local (chỉ recreate container `haivan-local-nginx-1` do compose local dựng; không đụng 8080/8090/8095 hay container khác)
- `/` : MISS -> HIT; `?utm_source=x&fbclid=1` HIT (cùng key); `?s=abc` BYPASS; cookie `wordpress_logged_in_x` BYPASS; POST không cache; `/en/mobile`, `/robots.txt` HIT lần 2.
- `/xe-khach`, `/xe-khach/quan-1/vung-tau`: giữ `cache-control: s-maxage=300, stale-while-revalidate=600` của Next; có nosniff/XFO/Referrer/Permissions.
- `/wp-admin/` 302, `/wp-login.php`: `no-cache,no-store,private` của WP giữ nguyên, XFO không lặp (1 dòng). `/tai-khoan/dang-nhap`, `/api/hv/auth/session`: `private, no-store`.
- Host lạ -> 444 (curl 000); limit_req verify: 403x6 rồi 429; header spoof `X-HV-Rewritten` vẫn 200 (bị xoá ở proxy).
- Static CSS WP: `public, max-age=2592000`; 404 không bị cache dài.
- HSTS: không có trên http local (đúng). Chưa kiểm phát thật qua HTTPS (chỉ `nginx -t`).
- `check-seo-golive.sh http://localhost:8180`: chạy được, exit 1 (14 FAIL): noindex+thiếu canonical toàn WP (blog_public=0, đúng cho local), `/xe-khach` và trang tuyến 0 `<h1>` trong HTML (việc gói A), WARN chưa `Disallow: /tai-khoan/`.

## Phát hiện
- Audit ghi `NEXT_PUBLIC_SITE_URL`; grep toàn apps/booking: biến này không tồn tại. Chỉ `PUBLIC_ORIGIN` (`src/lib/public-origin.ts`, mặc định `https://haivan.com`) -> metadataBase/canonical/hreflang/sitemap/CSRF. Không có noindex theo môi trường; noindex là per-page (`robots: { index:false }`, bản /en, tuyến CMS lạ). Đã ghi vào guide.
- WP gửi `Set-Cookie: pll_language` ở mọi trang -> nginx mặc định không cache. Dùng `proxy_ignore_headers Set-Cookie` + chặn lưu nếu Set-Cookie không bắt đầu bằng `pll_language=`. Hệ quả: bản cache phát lại cookie đó (cùng URL = cùng giá trị, đã kiểm ngôn ngữ không phụ thuộc cookie ở `/`). Gốc: tắt `PLL_COOKIE` phía WP.
- Template nginx chỉ envsubst lúc container khởi động: đổi `nginx.conf` phải `docker compose up -d --force-recreate`, `nginx -s reload` không đủ.
- Rank Math sitemap trả `no-cache` -> nginx không cache sitemap_index (đúng); robots.txt được cache 5m.
- Nginx gốc dùng `proxy_cache` (không phải fastcgi_cache) vì WP ở sau nginx WP riêng qua HTTP.

Status: DONE_WITH_CONCERNS
Summary: Header bảo mật + page cache WP + khối TLS mẫu + checklist go-live + check-seo-golive.sh xong, kiểm trên nginx local :8180.
Concerns: (1) HSTS chưa kiểm phát qua HTTPS thật (mới `nginx -t` trên cấu hình TLS mẫu). (2) Cache replay `Set-Cookie: pll_language`; nên tắt PLL_COOKIE phía WP (ngoài phạm vi D). (3) `wordpress/nginx/default.conf` vẫn tự thêm nosniff/Referrer-Policy; edge đã bỏ bản upstream nên không lặp, nhưng nếu ai bỏ qua nginx gốc thì còn bản đó. (4) CSP chưa thêm (cần đo Flatsome inline script). (5) `/xe-khach` hiện 0 h1 trong HTML curl: thuộc gói A, script sẽ bắt. (6) Container nginx local đã recreate, cache cũ mất (chỉ cache).
