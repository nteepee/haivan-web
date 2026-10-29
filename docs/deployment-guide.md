# Hướng dẫn triển khai

## Kiến trúc
```
Internet → nginx (TLS, chia đường dẫn, limit_req)
            ├─ [/en]/xe-khach/**, [/en]/tai-khoan/**, [/en]/partner/**, [/en]/tracking/**, [/en]/email/**, /_next/**, /api/hv/** (limit_req) → Next standalone (apps/booking)
            └─ còn lại → WordPress (wordpress/compose.yaml: nginx + php-fpm + mariadb)
www.<domain> → 301 apex (CSRF của BFF so Origin đúng bằng PUBLIC_ORIGIN)
```
Cấu hình nginx dùng chung cho local và VPS: `deploy/nginx/`:
- `nginx.conf`: map/zone (limit_req, host hợp lệ, header bảo mật, page cache).
- `conf.d/haivan.conf.template`: khối 444 mặc định, www → apex, khối server cổng 80.
- `hv-server-common.inc`: nội dung server dùng chung (cổng 80 local và 443 production): kiểm host, location Next, include WP.
- `conf.d/wp-locations.inc`: location WordPress. `hv-wp-cache.conf`: page cache HTML WP. `hv-security-headers.conf`: header bảo mật.
- `conf.d/haivan-tls.conf.example`: mẫu khối 443 + TLS (không được nạp; sao chép khi có chứng chỉ).

### Header bảo mật và page cache (nginx gốc là nguồn duy nhất)
- Mọi phản hồi: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. HTML (WP và Next): thêm `X-Frame-Options: SAMEORIGIN` và `Permissions-Policy` tối thiểu (tắt camera/micro/payment, geolocation chỉ cùng origin). Header cùng tên của upstream bị bỏ (`proxy_hide_header`) để không lặp.
- `Strict-Transport-Security` chỉ phát khi chính nginx này nói TLS (`$scheme=https`), nên local http không bao giờ có. Mức `max-age` lấy từ biến `HV_HSTS_MAX_AGE` (compose đặt 300). Chưa dùng `includeSubDomains`/`preload`. CSP chưa bật (WP/Flatsome dùng inline script; cần đo riêng trước).
- Một location có `add_header` riêng thì **mất** `add_header` cấp server: phải `include /etc/nginx/hv-security-headers.conf` trong location đó.
- Page cache WP (`proxy_cache`, vùng `hv_wp` 500 MB, `/var/cache/nginx/hv_wp`; WP chạy sau proxy HTTP nên dùng `proxy_cache`, không phải `fastcgi_cache`):
  - Chỉ location `/` của WP (không áp cho Next, `/wp-json/`, `/wp-admin/`, `wp-login.php`). Key = `scheme + host + uri` (bỏ query nên `?utm_*`, `fbclid`, `gclid` dùng chung một bản).
  - Bỏ qua cache khi: cookie `wordpress_logged_in_*`/`wordpress_sec_*`/`wp-postpass_*`/`comment_author_*` (+ cookie giỏ hàng), có `Authorization`, query string khác utm/fbclid/gclid (`?s=`, `?p=`, `?preview=`...), method khác GET/HEAD. Không lưu response có `Set-Cookie` ngoài `pll_language`.
  - TTL 200/301 = 5 phút, 404 = 1 phút; phục vụ bản cũ khi WP lỗi/đang làm mới (`proxy_cache_use_stale`, `background_update`). Nếu WP tự gửi `Cache-Control` có `no-store/no-cache/private` thì nginx tôn trọng, không cache và không đè.
  - HTML ẩn danh 200 nhận `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`. Mọi phản hồi qua location này có `X-Cache-Status: HIT|MISS|BYPASS|STALE|EXPIRED|UPDATING`.
  - Tài nguyên tĩnh `wp-content`/`wp-includes` (css/js/font/ảnh): `Cache-Control: public, max-age=2592000` (chỉ 2xx/3xx). `/_next/static` và `/assets/` giữ cache của Next/nginx (`/assets/` 7 ngày immutable). Trang Next (`/xe-khach`...) giữ nguyên `Cache-Control` của Next; `/tai-khoan` và `/api/hv/*` là `private, no-store`.
  - Xoá cache sau khi di chuyển/import nội dung hàng loạt hoặc đổi theme: `docker exec <container-nginx> sh -c 'rm -rf /var/cache/nginx/hv_wp/*'` (TTL 5 phút nên bài sửa tay tự cập nhật; không cần plugin purge).
  - Lưu ý: bản cache trả lại cả `Set-Cookie: pll_language=...` (Polylang đặt ở mọi trang, cùng URL = cùng giá trị). Production phải đặt `define('PLL_COOKIE', false);` (compose WP đã có; bản không dùng compose thì thêm vào `wp-config.php`) để Polylang thôi gửi cookie và nginx không còn phát lại nó.

## Chạy local (tạm, chưa có VPS)
Cổng: nginx gốc `127.0.0.1:8180`, Next `127.0.0.1:3010`, WordPress `127.0.0.1:8089` (các cổng 8080/8090 trên máy đang có dịch vụ khác).

1. WordPress: xem `docs/wordpress.md` (`docker compose -f wordpress/compose.yaml up -d` + `wordpress/scripts/setup.sh`). Để WordPress sinh URL qua nginx gốc, đặt `WP_URL=http://localhost:8180` trong `wordpress/.env`, chạy `docker compose -f wordpress/compose.yaml up -d`. DB đã cài với URL cũ thì đổi URL trong DB một lần:
   `docker compose -f wordpress/compose.yaml --profile tools run --rm -T wpcli search-replace 'http://localhost:8089' 'http://localhost:8180' --all-tables-with-prefix --skip-columns=guid` (thêm `--dry-run` để xem trước).
2. Next: tạo `apps/booking/.env.local` theo `.env.example`. Mốc local mặc định là **tầng B**: `HV_LIVE_BACKEND=1`, `HV_LIVE_WRITES=0` (đọc dữ liệu thật, mọi thao tác ghi bị BFF chặn 503). `PUBLIC_ORIGIN=http://localhost:8180`.
   ```bash
   deploy/local/start-next.sh          # build vào .next-local + chạy standalone (PID: deploy/local/next.pid)
   ```
3. nginx gốc: `docker compose -f deploy/local/compose.yaml up -d` → mở http://localhost:8180
   - Giới hạn: `verify`/`register` 10 lần/phút/IP (burst 5), các `/api/hv/*` khác 120 lần/phút/IP (burst 60), `/api/hv/auth/session` không giới hạn; vượt ngưỡng trả JSON 429.
4. Dừng: `deploy/local/stop.sh` (dừng Next do script tạo + nginx local; WordPress dừng bằng compose của nó).

### Đăng nhập OTP khi chạy local (tầng C, cần anh có mặt)
Site key reCAPTCHA của web cũ chỉ hợp lệ trên tên miền `haivan.com`. Để thử đăng nhập + đặt vé thật trên máy:
- Đặt `HV_LIVE_WRITES=1` trong `.env.local`, chạy lại `deploy/local/start-next.sh`.
- Mở Chrome riêng: `open -na "Google Chrome" --args --user-data-dir=/tmp/hv-local --host-resolver-rules="MAP haivan.com 127.0.0.1:8180" http://haivan.com/xe-khach` (trang mang tên miền haivan.com nên reCAPTCHA hiện được; `PUBLIC_ORIGIN` khi đó phải là `http://haivan.com`).
- WordPress cũng phải sinh URL `http://haivan.com` (đổi `WP_URL` + search-replace như trên), nếu không trang WP sẽ chuyển hướng về localhost.
- Checklist mỗi lần chạy:
  - Anh duyệt trước.
  - Tài khoản không có đơn chưa thanh toán (backend giới hạn 2 đơn treo).
  - Chỉ tới trang cổng VNPay/PayOS, không trả tiền.
  - Huỷ đơn ở "Chuyến đi của tôi" khi xong.
  - Lưu các dòng `[BFF][LIVE WRITE]` trong `deploy/local/next.log` làm biên bản.
  - Đặt lại `HV_LIVE_WRITES=0`.

## VPS (khi có)
Gợi ý cấu hình: 2 vCPU / 4 GB RAM (+2 GB swap) / 80 GB NVMe, Ubuntu 24.04, **IPv4 tĩnh** (gửi IP cho IT Hải Vân, xem `docs/hai-van-it-questions.md`), đặt ở Việt Nam (hoặc Singapore). Build Next ở máy dev/CI rồi chép bản standalone lên (build trên máy 2 GB dễ hết RAM). Chỉ chạy **một** instance Next (bộ đếm thử OTP nằm trong bộ nhớ).

1. Cài Docker + Node 22 + pnpm 10.
2. Sao chép repo, `.env.local` production (cả hai cờ `HV_LIVE_*=1`, `PUBLIC_ORIGIN=https://haivan.com`, `SESSION_SECRET` ngẫu nhiên ≥ 32 ký tự, `NEXT_PUBLIC_MAP_TILE_URL` của nhà cung cấp tile).
3. WordPress: `wordpress/.env` (`WP_URL=https://haivan.com`, mật khẩu DB mạnh), restore DB + uploads.
4. Next: build standalone, chạy bằng systemd/PM2 trên cổng 3010 (một instance).
   - **Linux:** nginx trong Docker không tới được `127.0.0.1` của host (chỉ Docker Desktop mới có). Chọn một trong hai:
     - chạy nginx thẳng trên host (upstream `127.0.0.1:3010`);
     - cho Next nghe ở IP `docker0` (`HOSTNAME=172.17.0.1`), `HV_NEXT_UPSTREAM=host.docker.internal:3010` (compose đã có `host-gateway`), và ufw chặn 3010 từ ngoài.
   - Biến nginx: `HV_SERVER_NAME="haivan.com"`, `HV_HOST_REGEX='^haivan\.com$'` (Host khác bị đóng kết nối), khối `server` 443 + TLS cần viết thêm (template hiện chỉ có cổng 80).
   - **Mã khuyến mãi ẩn (tự áp)**: mã thật không nằm trong `booking-config` công khai; Next (server) lấy từ route riêng của WP. Biến production:
     - Next (`apps/booking/.env.local`): `HV_WP_SHARED_SECRET` (cùng giá trị với WP, ≥ 16 ký tự, `openssl rand -hex 24`); `WP_ROUTE_URL` = gốc WP, không có `/wp-json` (bỏ trống thì suy từ `WP_LAYOUT_URL`; xem `src/lib/route-landing.ts`); tuỳ chọn `HV_WP_PROMO_CODES_URL` đè hẳn URL route (mặc định `<gốc WP>/wp-json/haivan-web/v1/promo-codes`; xem `src/server/promo-secrets.ts`).
     - WordPress (`wordpress/.env` -> compose): `HV_WP_SHARED_SECRET` cùng giá trị; trống = route luôn 403 (tính năng tắt, Next chỉ cảnh báo một lần). `wp-config` production có `define('PLL_COOKIE', false);` (compose đã có).
     - Xoay bí mật: đặt giá trị mới ở WP rồi ở Next và khởi động lại Next (Next giữ bản mã tốt gần nhất, làm mới tối đa 5 phút). Không commit, không ghi log.
     - `/wp-json/` không đi qua page cache nginx nên route này không bị cache. `deploy/check-seo-golive.sh` kiểm route không bí mật phải trả 403 và `booking-config` không có khoá `code`.
5. nginx: dùng `deploy/nginx/*`. Việc cần làm:
   - Thêm TLS (Let's Encrypt): dùng mẫu `deploy/nginx/conf.d/haivan-tls.conf.example` (khối 443 include `hv-server-common.inc`; mount thêm `/etc/letsencrypt`).
   - Đổi dải IP được vào `wp-admin`, hoặc dùng host riêng `admin.haivan.com` + Two Factor.
   - Thêm CSP theo location (chưa có).
   - HSTS: tự phát khi TLS chạy; bắt đầu `HV_HSTS_MAX_AGE=300`, tăng dần (xem checklist go-live bên dưới).
   - Nếu đặt sau Cloudflare: thêm `real_ip`.
   - Bảo mật máy: ufw (22/80/443), SSH chỉ bằng key, unattended-upgrades.
6. Cutover DNS theo phase 10 (export zone trước, hạ TTL, giữ bản ghi cũ để lùi).

## Kích thước máy chủ (đo 2026-10-28 trên stack local, Mac 10 nhân; VPS 2 vCPU ước ≈ 1/4–1/5 số này)
| Thành phần | RAM thực đo | Thông lượng đo (10 kết nối song song) |
|---|---|---|
| Next standalone (1 tiến trình) | 70 MB nghỉ → 120 MB khi tải | `/xe-khach` 140 rps (p95 120 ms); trang tuyến 215 rps; tìm chuyến 265 rps; BFF session 825 rps |
| php-fpm (5 child) + WP | 125 MB nghỉ, ~60–120 MB/child | **14–18 rps, p50 550–650 ms** — chưa có page cache, đây là nút thắt |
| MariaDB (buffer pool 128 MB, dữ liệu WP 38 MB) | 210 MB | — |
| nginx | 10 MB | hàng nghìn rps cho nội dung đã cache |

Tải hiện tại ~50k người dùng/tháng ≈ 200k lượt xem/tháng ≈ 0,1–0,3 rps trung bình, đỉnh quảng cáo/Tết ước 3–5 rps → **2 vCPU / 4 GB RAM / 80 GB NVMe** là đủ với dư ≥ 50 % RAM, với điều kiện:
- Page cache nginx cho WP (đã cấu hình trong `deploy/nginx`, `proxy_cache` TTL 5 phút, bỏ qua khi đăng nhập/POST/query lạ; xem mục Header bảo mật và page cache); không cache `/api/hv/*`, `/tai-khoan/*`, `/wp-json/*`.
- php-fpm: `pm.max_children = 10`, `memory_limit = 256M`; MariaDB `innodb_buffer_pool_size = 256M`.
- Next: 1 tiến trình, `NODE_OPTIONS=--max-old-space-size=768`; build ở máy dev/CI (build cần ~2–3 GB RAM), chỉ chép bản standalone (111 MB) lên.
- Swap 2 GB; ngân sách RAM: OS + Docker ~0,5 GB, DB 0,3 GB, php-fpm tối đa ~1 GB, Next 0,5 GB → ~2,3 GB dùng, ~1,7 GB dư.
- Phần đặt vé thật đi qua apigw của Hải Vân nên giới hạn thực tế nằm ở apigw, không ở VPS.

## Sao lưu
- `archive/old-site/` (bản chụp web cũ, 634MB) chỉ có trên máy này — sao lưu ra ổ ngoài/cloud.
- WordPress: dump DB + `wp-content/uploads` hằng ngày ra ngoài máy (rclone → S3/Drive); thử khôi phục ít nhất 1 lần trước cutover.

## Checklist go-live SEO (làm theo thứ tự; số trong ngoặc là mục trong `plans/reports/seo-task-list-261029.md`)
Local cố tình `noindex` nên lỗi noindex/canonical trên local là đúng; mục dưới là việc **bắt buộc** trước khi mở cho Google.

1. **WordPress cho phép index (#2).**
   - `docker compose -f wordpress/compose.yaml --profile tools run --rm -T wpcli option get blog_public` phải là `1` (local đang `0`). Đặt: `... option update blog_public 1`. Cài đặt tương ứng: Settings → Reading → bỏ "Discourage search engines".
   - Rank Math → Titles & Meta → Misc: không bật "noindex" toàn cục; từng post type (page, bai_viet, tin_tuc, diem_den) để "Robots Meta" mặc định (index). Khi `blog_public=0` Rank Math tự ẩn canonical, nên sau khi bật phải thấy `<link rel="canonical">` trên mọi trang.
   - `WP_URL` trong `wordpress/.env` = `https://haivan.com`; `home`/`siteurl` trong DB cùng origin (search-replace khi chuyển từ localhost, xem phần Chạy local).
2. **Next dùng đúng origin (#3).**
   - Biến duy nhất: `PUBLIC_ORIGIN=https://haivan.com` trong `apps/booking/.env.local` (không có dấu `/` cuối). Đọc ở `apps/booking/src/lib/public-origin.ts`; mặc định `https://haivan.com` nếu thiếu. Nó quyết định `metadataBase` (canonical, hreflang, og:url tuyệt đối), `<loc>` của `/xe-khach/sitemap.xml` và so Origin của BFF (CSRF).
   - Khuyến nghị audit nhắc `NEXT_PUBLIC_SITE_URL`: **biến này không tồn tại trong code**, đặt vào cũng vô tác dụng. Next không có công tắc `noindex` theo môi trường: `noindex` nằm cố định theo từng trang (tài khoản, tìm chuyến, thanh toán, bản `/en`, tuyến chưa có CMS; `robots: { index: false }` trong `metadata`). Vì vậy các trang `/xe-khach/*` noindex trên local là do trang, không phải do `PUBLIC_ORIGIN`.
   - Sau khi đổi biến phải build + khởi động lại Next (giá trị nhúng lúc build/khởi động), rồi mới chạy `deploy/check-seo-golive.sh`.
3. **robots.txt dùng domain thật.** `https://haivan.com/robots.txt` (do WordPress sinh; nginx chuyển tiếp) phải có đúng hai dòng `Sitemap: https://haivan.com/sitemap_index.xml` và `Sitemap: https://haivan.com/xe-khach/sitemap.xml`, không có `Disallow: /`, nên có `Disallow: /tai-khoan/` và `/wp-admin/`. Dòng Sitemap lấy từ `home_url()` nên đúng sau bước 1.
4. **TLS trước, HSTS sau (#6).**
   - Chứng chỉ chạy ổn trên cả `haivan.com` và `www` (301 → apex), http → https đã chuyển hướng, không còn mixed content.
   - Bắt đầu `HV_HSTS_MAX_AGE=300`, kiểm 1 ngày, rồi 86400, 604800, cuối cùng 31536000. Chỉ khi chắc chắn HTTPS không phải lùi lại. Không thêm `includeSubDomains`/`preload` nếu chưa kiểm hết subdomain (`apigw`, `cms`, mail).
5. **Làm sạch cache sau khi di chuyển nội dung.** Restore DB/uploads hoặc chạy script nội dung xong thì xoá `hv_wp` (lệnh ở mục page cache), và nếu có CDN thì purge cả CDN. Kiểm `curl -I https://haivan.com/` ra `X-Cache-Status: MISS` rồi `HIT` ở lần sau.
6. **Chạy script kiểm bằng curl**:
   ```bash
   deploy/check-seo-golive.sh https://haivan.com
   # staging có origin khác nhưng PUBLIC_ORIGIN/WP_URL đã đặt domain thật:
   EXPECT_ORIGIN=https://haivan.com deploy/check-seo-golive.sh https://staging.haivan.com
   ```
   Script (chỉ GET/HEAD) kiểm: robots.txt (không chặn toàn site, có 2 dòng Sitemap đúng origin), 2 sitemap (200, `<loc>` đúng origin), các trang mẫu (trang chủ, `/xe-khach`, 1 trang tuyến, tối đa 5 URL WP lấy từ sitemap_index): HTTP 200 không redirect, không `noindex` (meta + `X-Robots-Tag`), có canonical trùng origin và không query, đúng 1 `<h1>`; `/tai-khoan/dang-nhap` phải noindex; header `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Cache-Control` có `s-maxage` và `X-Cache-Status` (HSTS + http→https khi base là https). Thoát mã 1 nếu có FAIL; WARN (vd. chưa `Disallow: /tai-khoan/`) không làm fail.
7. **Audit layout trên staging**: `BASE=https://staging.haivan.com node scripts/layout-audit.mjs --all` (đọc sitemap, GET, mã 1 nếu còn lỗi mức `error`). Báo cáo ở `.layout-audit/<thời điểm>/report.md`. Cần 0 lỗi mới được cutover.
8. **Search Console** (cần tài khoản chủ domain): xác minh property `https://haivan.com` (hoặc Domain property bằng DNS TXT), gửi cả hai sitemap `sitemap_index.xml` và `xe-khach/sitemap.xml`, kiểm "URL Inspection" cho trang chủ, 1 trang tuyến và 1 bài; theo dõi báo cáo Pages (Indexed/Excluded) và Core Web Vitals 1–2 tuần đầu. Việc này làm sau cutover DNS, không làm được từ repo.
9. **Sau cutover**: chạy lại bước 6 trên domain thật; kiểm `curl -I https://haivan.com/` có HSTS; theo dõi log nginx `X-Cache-Status` và tỉ lệ HIT.
