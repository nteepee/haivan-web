# WordPress nội dung (phase 9)

WP chạy mọi trang không thuộc luồng đặt vé (trang chủ, Chúng tôi, Dịch vụ, Chính sách, Hỗ trợ, Điểm đến, Tin tức, Ưu đãi, landing `/dat-ve-nhanh*`). Next.js (`apps/booking`) giữ `/xe-khach/**`, `/tai-khoan/**`, `/partner/**`, `/tracking/**`, `/_next/**`, `/api/hv/**` và bản `/en/` của chúng. Một nginx gốc (phase 10) chia theo đường dẫn; mẫu location WP: `wordpress/nginx-snippet.conf`.

## Chạy local
Yêu cầu: Docker (compose v2), `rsync`, Node 22 (chỉ cho `check-layout.mjs`). Cổng **8089** (không dùng 8080/443).
```bash
cd wordpress
cp .env.example .env                 # tuỳ chọn; mặc định chạy được ngay
./scripts/install-themes.sh          # chép Flatsome (license của chủ dự án) vào wp-content/themes/flatsome (gitignore)
./scripts/setup.sh                   # up -d, core install, plugin, theme, trang, menu, tuyến mẫu (chạy lại không đặt lại cài đặt MKT, xem dưới)
docker compose --profile tools run --rm -T wpcli eval-file /scripts/import-old-site.php   # trang tĩnh + tuyến phổ biến từ archive/ (tuỳ chọn)
docker compose --profile tools run --rm -T wpcli eval-file /scripts/import-cms.php        # bài điểm đến, tin, điểm đến, ưu đãi từ CMS (lâu, xem mục "Nội dung biên tập")
# Thiết kế mới (sau import): banner, landing tuyến, đồ thị tri thức SEO, thứ tự trang, ảnh trang tĩnh, CTA (xem "Thiết kế mới" bên dưới)
for s in seed-banners seed-home-v3 seed-route-landing seo-setup set-page-order restore-static-images; do docker compose --profile tools run --rm -T wpcli eval-file /scripts/$s.php; done
docker compose --profile tools run --rm -T -e HV_DRY_RUN=1 wpcli eval-file /scripts/replace-cta-iframes.php   # đọc báo cáo rồi chạy lại không có HV_DRY_RUN
node scripts/check-layout.mjs        # kiểm REST layout đúng hợp đồng Next
```
- `WP_ENV_TYPE` trong `.env`: máy dev đặt `local` (mẫu `.env.example` đã đặt); `compose.yaml` mặc định `production` khi thiếu biến. **Quy tắc `blog_public`**: chỉ noindex khi `WP_ENV_TYPE` là `local`/`development`/`staging` (đặt rõ); thiếu biến hoặc giá trị khác = production = cho lập chỉ mục. `setup.sh` suy ra `local` khi chưa có biến *và* `WP_URL` là loopback, còn lại coi là production. Môi trường không phải production luôn bị ép noindex ở mỗi lần chạy; production chỉ đặt `blog_public=1` ở lần cài đầu và cảnh báo (không tự đổi) nếu sau đó thấy `blog_public=0` (có thể MKT chủ ý noindex trước ngày ra mắt; ra mắt: `wp option update blog_public 1`).
- **Chạy lại `setup.sh` an toàn cho nội dung/cài đặt MKT**: tên site, mô tả, module Rank Math, trang chủ tĩnh, menu đang gán cho từng vị trí/ngôn ngữ, ngôn ngữ/múi giờ/định dạng ngày, trang `privacy-policy`, tuyến phổ biến chỉ được đặt/dọn ở **lần cài đầu** (dấu: option `hv_site_configured`, hoặc đã có trang chủ tĩnh). Lần sau chỉ: đảm bảo cấu trúc URL (permalink, Polylang), tạo trang/menu/tuyến **còn thiếu** (không sửa cái đã có), và ép các cài đặt bảo mật (tắt archive tác giả của Rank Math). Ép đặt lại toàn bộ: `HV_RECONFIGURE=1 ./scripts/setup.sh`.
- Site http://localhost:8089 · Admin http://localhost:8089/wp-admin. Mật khẩu quản trị sinh ngẫu nhiên lưu ở `wordpress/data/admin-credentials.txt` (gitignore) nếu `WP_ADMIN_PASSWORD` trống.
- Container (project `haivan-wp`): `haivan-wp-db-1` (MariaDB 11.4), `haivan-wp-wordpress-1` (php 8.3-fpm), `haivan-wp-nginx-1` (127.0.0.1:8089→80). `wpcli` chỉ chạy khi gọi (`--profile tools`).
- Dữ liệu ở `wordpress/data/` (DB, lõi WP, uploads, sao lưu) — gitignore, mẫu **neo ở gốc** (`/data/` trong `wordpress/.gitignore`) để không nuốt nhầm `haivan-web-child/data/layout-seed.json` (file này phải vào git). Kiểm: `git status --ignored --short wordpress`. Xoá làm lại: `docker compose down && rm -rf data && ./scripts/setup.sh`.
- WP-CLI: `docker compose --profile tools run --rm -T wpcli <lệnh>`. Script trong `scripts/` nằm ở `/scripts`, archive ở `/archive` (chỉ đọc), cache CMS ở `/cms-cache` (= `data/cms-cache`).
- Chạy sau nginx gốc: đổi `WP_URL` (và `WP_PORT`/`WP_BIND_ADDR`) trong `.env` cho đúng origin công khai rồi `docker compose up -d`.

## Cấu trúc
```
wordpress/
  compose.yaml  .env.example  .gitignore  nginx/default.conf  nginx-snippet.conf  php/hv-uploads.ini
  scripts/  setup.sh  install-themes.sh  configure-site.php  seed-site.php  import-old-site.php  import-cms.php  sanitize-content.php  check-layout.mjs  verify-cms-urls.mjs
            lib/{pages-manifest.php, helpers.php, html-extract.php, sanitize.php, cms-client.php, cms-source.php, cms-media.php}
  data/cms-cache/   bản lưu JSON thô của CMS + ảnh lỗi + dung lượng ảnh (gitignore, nằm trong /data/)
  wp-content/themes/haivan-web-child/
      style.css functions.php header.php footer.php front-page.php page.php single.php archive.php 404.php
      single-diem_den.php single-bai_viet.php single-tin_tuc.php search.php page-xe-san-bay.php template-parts/{article,post-row,side-posts,post-cards}.php
      templates/landing-search.php
      inc/{i18n,i18n-labels,tokens,icons,admin-fields,layout,layout-admin,template-tags,chrome,content-types,search-shortcode,
           home-settings,mkt-shared,banners,banners-render,offers,offers-render,mkt-admin,home-rest,home,home-blocks,cta,
           route-meta,route-rest,dest-routes,entry-tables,seo,hardening}.php
      assets/css/{tokens,base,chrome,footer,home,home-rails,home-blocks,content,article,search,offers-page,promo-tones,admin-mkt}.css   (tokens.css = bản sao nguyên văn docs/design/tokens-v4.css = apps/booking/src/app/tokens.css, nạp đầu tiên)
      assets/js/{site,home,search,admin-media,admin-mkt}.js   assets/fonts/Nunito*   assets/img/logo.svg
      data/layout-seed.json   (bản sao apps/booking/src/content/layout-fallback.json)
  scripts/ (thêm) seed-banners.php seed-home-v3.php seed-v4.php relativize-media-urls.php seed-route-landing.php replace-cta-iframes.php restore-static-images.php seo-setup.php set-page-order.php
              lib/{route-landing-seed.php, membership-content.php, asset-dims.json, seed-assets/}
```
Child theme khai báo `Template: flatsome` nhưng **không gọi hàm nào của Flatsome**; header/footer/REST/shortcode/tokens đều là PHP/JS thuần. Flatsome chỉ cấp shortcode/CSS UX Builder cho trang MKT dựng, nên `inc/hardening.php` **không nạp** `flatsome.css/js`, live-search, jQuery + migrate, hoverIntent và CSS/font Kirki ở front-end, trừ trang có shortcode UX Builder (`[section`, `[row`, `[ux_*`), đang trong Customizer/UX Builder (`?app=`), hoặc filter `hv_load_flatsome_assets` trả `true`. Muốn Flatsome toàn site: `add_filter( 'hv_load_flatsome_assets', '__return_true' );`. Muốn bỏ Flatsome: đổi `Template:` trong `style.css` sang theme cha khác (hoặc gộp file thành theme độc lập). Thiếu Flatsome thì WP không kích hoạt được child → `setup.sh` báo lỗi rõ.

## Plugin
Polylang (vi mặc định, en dưới `/en/`), Rank Math SEO (chỉ module sitemap, redirections, rich-snippet), Two Factor (2FA). Cài từ wordpress.org bằng WP-CLI trong `setup.sh`; thư mục `wp-content/plugins` không nằm trong git. Polylang bản miễn phí thêm hậu tố `-en` vào slug trùng; theme có filter cho **trang** (`page`) cùng slug ở hai ngôn ngữ (tương đương "share slugs") nên `/en/chung-toi/gioi-thieu` giữ slug cũ. Bài thuộc CPT (tin tức, điểm đến, ưu đãi) dịch sang en sẽ có hậu tố `-en`.

URL: permalink `/%postname%` **không dấu `/` cuối**; `/slug/` được WP 301 về `/slug` (không có redirect ngược). Home `/` (vi) và `/en/` (en); `/en` 301 sang `/en/`.

## Nội dung & URL cũ
| URL | Nguồn trong WP |
|---|---|
| `/`, `/en/` | trang "Trang chủ"/"Home" (front-page.php, thiết kế v3): dải vàng (H1 + banner carousel), thẻ tìm vé nổi, dải 4 cam kết, Ưu đãi hôm nay, tuyến phổ biến, điểm đến, tin, dải app vàng, phòng chờ (xem "MKT sửa gì ở đâu" và "Banner và ưu đãi trang chủ") |
| `/chung-toi/*`, `/dich-vu/**`, `/chinh-sach/*`, `/ho-tro/*`, `/tuyen-duong/*`, `/haivanplus`, `/mobile` | Trang (page) phân cấp, slug cũ; danh sách ở `scripts/lib/pages-manifest.php` |
| `/xe-san-bay` (+ `/en/xe-san-bay`) | Trang (page) giữ URL, mẫu `page-xe-san-bay.php`: H1 của trang, một câu giới thiệu, nút gọi tổng đài, `[haivan_search]`, thẻ tuyến đi/đến sân bay lấy từ `hv_route` có đường dẫn chứa `san-bay`/`tan-son-nhat`/`noi-bai` (chỉ tuyến có thật; Nội Bài chưa có tuyến nên chưa hiện; không có tuyến thì ẩn khối). Nội dung trang (nếu MKT nhập) hiện dưới câu giới thiệu |
| `/dat-ve-nhanh*`, `/dat-ve-nhanhs*` | Trang dùng mẫu `templates/landing-search.php` (hero + `[haivan_search]`) |
| `/diem-den` | archive CPT `diem_den` (mọi điểm đến, theo thứ tự ưu tiên của CMS) |
| `/diem-den/<điểm>` | CPT `diem_den` (`single-diem_den.php`): khối H2 "Xe Hải Vân đi {điểm}" liên kết các tuyến `/xe-khach/...` liên quan, danh sách bài của điểm (10/trang, phân trang `?page=N`) + cột "Bài viết mới nhất" |
| `/diem-den/<điểm>/<slug bài>` | CPT `bai_viet` (`single-bai_viet.php`), điểm = taxonomy `hv_location`, thẻ = `hv_tag`; **200**, không redirect |
| `/chung-toi/bao-chi-tin-tuc`, `/…/<slug>` | CPT `tin_tuc` (tin công ty; `single-tin_tuc.php`) |
| `/uu-dai` | Trang tổng hợp: mọi "Ưu đãi hôm nay" (`hv_offer`) đang chạy, dạng lưới thẻ (bảng màu vàng/xám/trắng, bo và bóng v4), + bài ưu đãi chi tiết nếu có (`archive-uu_dai.php`) |
| `/?s=<từ khoá>` | Kết quả tìm kiếm (`search.php`, cùng thẻ với archive); giao diện không có ô tìm kiếm, trang chỉ để đường dẫn tìm kiếm có sẵn không rơi về giao diện thô của theme cha |
| `/uu-dai/<id>` | CPT `uu_dai` (slug = id ưu đãi của CMS) |
| Trang cha `/chung-toi`, `/dich-vu`, `/chinh-sach`, `/tuyen-duong`… | **Nháp** (web cũ không có các URL này → 404) |
| sitemap | Rank Math: `/sitemap_index.xml` (nginx gốc phải để đường dẫn này vào WP; `/xe-khach/sitemap.xml` là của Next) |

Không thuộc WP (Next): `/xe-khach/**`, `/tai-khoan/**`, `/partner/**`, `/tracking/**`, `/email/verify`. Không tạo `/xe-san-bay/tim-chuyen-car-airport` (tìm xe sân bay ngoài phạm vi đợt này).

Slug chữ hoa của web cũ (`/diem-den/Ha-giang`) vẫn trả 200 (so khớp không phân biệt hoa thường; WP lưu slug chữ thường). Bài điểm đến và tin công ty là **hai bộ sưu tập khác nhau** của CMS và web cũ phục vụ cả hai URL bằng 200, nên WP cũng vậy: không còn redirect `/diem-den/<điểm>/<bài>` → tin tức (bản cũ nhập nhầm). Web cũ tra bài theo slug bài và **bỏ qua đoạn `<điểm>`** (`/diem-den/zzz/<slug>` vẫn 200); WP giữ hành vi đó (200, `canonical` trỏ URL chuẩn có điểm thật). `/slug/` (dấu `/` cuối) được 301 về `/slug`. Slug không tồn tại: 404 (web cũ trả 500). Bản `/en/diem-den/<điểm>/<slug>` của bài trả **200** nội dung tiếng Việt với vỏ tiếng Anh như web cũ (`bai_viet` không dịch qua Polylang). Bản `/en/` của tin tức/điểm đến chưa có nội dung tiếng Anh nên Polylang 301 về URL vi (trước đây vẫn thế). Redirect duy nhất trong theme: không còn (đã bỏ chuyển `/…/<id số>`: web cũ trả 500 cho các URL đó).

## Nhập nội dung cũ (`import-old-site.php`)
Đọc `archive/old-site/pages/**` (chỉ đọc, thiếu file thì bỏ qua và báo): trang tĩnh từ HTML (bỏ header/footer/breadcrumb/menu, chỉ giữ h2–h4, đoạn, danh sách, bảng, liên kết), tuyến phổ biến từ `list_route` của trang chủ. SEO title/description sang Rank Math. **Tin tức, điểm đến, bài điểm đến, ưu đãi không còn nhập từ bản chụp** mà từ CMS bằng `import-cms.php` (mục dưới; bản chụp chỉ có 108 bài điểm đến, CMS có 759). `HV_IMPORT_LEGACY_CONTENT=1` bật lại nhánh cũ (không nên: chạy sau `import-cms.php` sẽ ghi đè bài CMS bằng bản chụp).
- Biến: `HV_IMPORT_SIDELOAD=0` (không tải ảnh), `HV_IMPORT_EN=0` (không nhân bản trang tĩnh sang en), `HV_IMPORT_LIMIT=N`, `HV_ARCHIVE`, `HV_IMPORT_FORCE=1`, `HV_IMPORT_LEGACY_CONTENT`. Ví dụ: `docker compose --profile tools run --rm -T -e HV_IMPORT_LIMIT=5 wpcli eval-file /scripts/import-old-site.php`.
- Ảnh: ảnh đại diện tuyến tải từ `cms.haivan.com` bằng GET (chỉ đọc) vào Media. Ảnh của tin/điểm đến/bài do `import-cms.php` lo (kể cả ảnh trong nội dung). Ảnh trong trang tĩnh của web cũ là ảnh nạp lười, HTML đã lưu không còn đường dẫn: `scripts/restore-static-images.php` khôi phục dải ảnh đầu trang từ bundle JS của archive (xem "Thiết kế mới"); ảnh còn lại **MKT bổ sung**.
- Bản en của trang tĩnh = bản sao nội dung vi (web cũ cũng để nội dung tiếng Việt dưới `/en/`); điểm đến/tin tức en chưa có.

**Làm sạch nội dung (kses).** WP-CLI không có người dùng đăng nhập nên **không** tự chạy kses; mọi nội dung nhập đi qua `scripts/lib/sanitize.php` (`hvs_clean_html` = bỏ `<script>/<style>/<form>/<object>/<embed>` kèm nội dung, rồi `wp_kses_post`: gỡ thuộc tính `on*`, `javascript:`; `hvs_clean_text` cho tiêu đề/tóm tắt/giá/thời gian: bỏ thẻ, hiển thị qua `esc_html` ở mọi template). **Iframe**: chỉ giữ `https://www.youtube.com/embed/<id>` (và `youtube-nocookie.com`) và `https://cms.haivan.com/api/cta/<số>` (khung CTA của CMS cũ) — khung CTA được **đổi thành shortcode `[haivan_cta n="<số>"]`** (xem mục CTA), YouTube dựng lại từ đầu với `sandbox`, `loading=lazy`; mọi iframe khác bị bỏ. Khi MKT lưu lại một bài trong admin, kses của WP (do `DISALLOW_UNFILTERED_HTML`) sẽ gỡ iframe YouTube (ai cũng không có `unfiltered_html`) — chủ ý, đừng nới kses; shortcode thì không bị kses đụng tới.
- Bài đã nhập trước khi có bước lọc: `docker compose --profile tools run --rm -T wpcli eval-file /scripts/sanitize-content.php` (idempotent; `-e HV_DRY_RUN=1` chỉ báo cáo; ghi thẳng DB nên không đổi `post_modified`; có cả bản sửa đổi). `-e HV_BASELINE_UNKNOWN=1`: coi bài CPT cũ chưa có dấu nhập là nguyên bản nhập (chỉ dùng khi chắc chưa ai sửa, vd. local) để lần nhập sau còn cập nhật được.

**Chạy lại không ghi đè việc của MKT (mọi loại bài: trang vi/en, tin tức, điểm đến, ưu đãi, tuyến phổ biến).** Mỗi lần script ghi một bài, nó đóng dấu meta `hv_imported_hash` (md5 tiêu đề+nội dung+tóm tắt+thứ tự) và `hv_imported_at` (= `post_modified_gmt` sau khi ghi). Lần sau một bài bị **bỏ qua** (và liệt kê ở cuối báo cáo kèm lý do) khi: `post_modified_gmt > hv_imported_at` hoặc hash khác (MKT đã sửa), trạng thái không còn `publish` (gỡ xuống/nháp/riêng tư), hoặc có nội dung nhưng chưa có dấu nhập (không rõ nguồn). Bài trong **thùng rác không bao giờ bị tạo lại** (kể cả `HV_IMPORT_FORCE=1`; khôi phục khỏi thùng rác trước). Mỗi bản ngôn ngữ kiểm riêng nên bản `en` MKT đã dịch không bị ghi đè bằng nội dung vi. Tuyến phổ biến: `setup.sh`/`seed-site.php` chỉ tạo tuyến còn thiếu; `import-old-site.php` chỉ cập nhật tuyến chưa bị sửa. Chỉ `HV_IMPORT_FORCE=1` mới ghi đè bài đã sửa/đã gỡ xuống. Đã kiểm trên DB local: sửa tin/bản en của trang/đặt điểm đến về nháp/xoá một tuyến/đổi tên một tuyến rồi chạy lại → cả năm bài giữ nguyên, không tạo trùng; `FORCE=1` khôi phục đúng.
- Các bản ghi không đi qua importer (menu, tuyến do MKT tạo) không bị đụng.

## Nội dung biên tập: từ CMS sang WordPress (`import-cms.php`)

**Quyết định của chủ dự án: viết bài ở WordPress.** CMS cũ (`cms.haivan.com`) sau khi cắt chuyển chỉ còn phục vụ API đặt vé (`route-listing`...) cho Next; không ai nhập bài ở CMS nữa.

### Mô hình nội dung
| CMS | CPT WP | URL | Ghi chú |
|---|---|---|---|
| `api/location` (điểm đến) | `diem_den` | `/diem-den/<điểm>` | trang điểm đến: danh sách bài của điểm (10/trang, `?page=N`) + cột "Bài viết mới nhất"; thứ tự điểm = `menu_order` (priority CMS) |
| `api/news` (bài viết theo điểm, ~760) | `bai_viet` | `/diem-den/<điểm>/<slug bài>` | điểm = taxonomy `hv_location` (term cùng slug với `diem_den`), thẻ = taxonomy `hv_tag` (hiển thị chữ, không có trang `/tag/` như web cũ); không dịch Polylang |
| `api/get-news` (tin công ty, ~170) | `tin_tuc` | `/chung-toi/bao-chi-tin-tuc/<slug>` | |
| `api/promotion-listing` (hiện rỗng) | `uu_dai` | `/uu-dai/<id>` | |

Trường: tiêu đề, slug (WP lưu chữ thường; slug CMS trùng không phân biệt hoa thường thì bài sau có hậu tố `-2`), nội dung (qua `hvs_clean_html`, giữ iframe CTA/YouTube), tóm tắt (= `description`), ngày đăng (= `published_at`, giờ VN; ngày tương lai bị kéo về hiện tại để không thành "lên lịch"), ảnh đại diện, điểm, thẻ, SEO title/description → meta Rank Math (`meta_title`; nếu CMS để `meta_title` trùng slug thì dùng tiêu đề bài), lượt xem → meta `hv_views` (**không hiển thị**: web cũ cũng không hiển thị), từ khoá → `hv_seo_keywords` (chỉ lưu). Bài `status=0` của CMS (nháp, kể cả vài bài `test-`/`debug-`) nhập thành **nháp**; CMS không có trường canonical nên không đặt `rank_math_canonical_url`. `rightPosts`/related của web cũ không nhập: theme tự dựng "Bài viết liên quan" (6 bài mới nhất cùng điểm; tin công ty: 6 tin mới nhất).

Phân trang trang điểm đến: web cũ chỉ có nút "Xem thêm" (AJAX, URL không đổi, `?page=` bị bỏ qua). WP dùng liên kết `/diem-den/<điểm>?page=N` (N vượt số trang → 404) để mọi bài có đường dẫn thật. `canonical` của trang N giữ `?page=N`.

### Chạy / chạy lại
```bash
cd wordpress
docker compose --profile tools run --rm -T wpcli eval-file /scripts/import-cms.php                      # đầy đủ (HV_CMS_MODE=all)
docker compose --profile tools run --rm -T -e HV_CMS_MODE=fetch wpcli eval-file /scripts/import-cms.php    # chỉ tải JSON vào data/cms-cache
docker compose --profile tools run --rm -T -e HV_CMS_MODE=measure wpcli eval-file /scripts/import-cms.php  # đếm URL ảnh + tổng dung lượng (GET Range 0-0, không tải ảnh)
```
Chạy lâu — số đo local lần đầu: tải JSON ~25 phút (~1.060 request, 343 MB), đo ảnh ~22 phút (3.830 URL, tổng 1,52 GB), nhập + tải ảnh ~62 phút (3.640 ảnh, 1,5 GB; thư mục `uploads` thành ~3,6 GB vì WP sinh thêm các cỡ ảnh). Chạy nền (`nohup … &`) rồi xem log. Lần chạy lại không có gì đổi: ~3 phút (chỉ tải lại ~130 danh sách), 0 ghi. Biến môi trường: xem đầu `scripts/import-cms.php` (`HV_CMS_DELAY_MS`, `HV_CMS_OFFLINE`, `HV_CMS_REFRESH`, `HV_IMPORT_SIDELOAD`, `HV_IMPORT_FORCE`, `HV_IMPORT_LIMIT`, `HV_CMS_TYPES`...).
- **Chỉ GET** tới API công khai (không trang admin, không đăng nhập), tuần tự, giãn cách ≥ 1,2 giây (CMS giới hạn 60 request/phút; script tôn trọng `x-ratelimit-remaining`, `Retry-After`), thử lại có backoff, timeout. Chỉ host `cms.haivan.com`/`haivan.com`, chỉ https. Lưu ý: GET chi tiết bài làm CMS **tăng `views_count`** (như một lượt xem); vì vậy chi tiết chỉ tải khi chưa có trong cache hoặc dữ liệu danh sách đổi.
- **Cache** `data/cms-cache/` (gitignore): `lists/` (tải lại mỗi lần chạy để phát hiện thay đổi), `detail-news/`, `detail-getnews/`, `fingerprints.json`, `image-failures.json` (ảnh 404/403 không thử lại; `HV_CMS_RETRY_FAILED=1` để thử), `asset-sizes.json`. Phát hiện thay đổi bài điểm đến bằng nội dung trong `api/news` + meta trong danh sách trang điểm đến (cả hai không làm tăng lượt xem); tin công ty (danh sách không có nội dung) tải lại chi tiết sau `HV_CMS_NEWS_TTL_H` giờ (mặc định 24).
- **Idempotent**: mỗi bài lưu `hv_cms_fp` (dấu vân tay dữ liệu CMS đã nhập). CMS không đổi → "không đổi", không ghi gì, không tải ảnh. CMS đổi → cập nhật **nếu MKT chưa sửa** (cơ chế `hv_imported_hash`/`hv_imported_at` ở mục "Chạy lại không ghi đè việc của MKT"); bài MKT đã sửa/gỡ xuống/chưa rõ nguồn được liệt kê "giữ nguyên"; bài trong thùng rác không bao giờ tạo lại (kể cả `HV_IMPORT_FORCE=1`). Bài CMS xuất bản sau khi đã nhập ở dạng nháp thì được xuất bản nếu MKT chưa đụng. Bài WP không còn trong CMS chỉ được báo, không xoá.
- **Ảnh**: ảnh đại diện + ảnh/tài liệu trong nội dung thuộc host Hải Vân được đưa vào Media, dedupe theo URL nguồn (meta `hv_import_source`; URL chuẩn hoá: bỏ `//` kép, mã hoá từng đoạn) và URL trong nội dung được viết lại sang bản local (bỏ `srcset`). Ảnh host khác (Google Docs `lh*.googleusercontent.com`, Facebook CDN…) **giữ nguyên URL** (không tải của bên thứ ba; nhiều link đã hết hạn từ web cũ). Ảnh 404 ở CMS (web cũ cũng hỏng) được báo cuối. Ảnh trỏ tới host cũ `api.haivan.com/photos/<tệp>` (đã tắt) được đổi sang `cms.haivan.com/photos/<tệp>`.
- **Khung CTA đã bỏ phụ thuộc CMS**: 640 bài từng nhúng `<iframe src="https://cms.haivan.com/api/cta/<số>">` (1.259 khung, 9 giá trị n); `scripts/replace-cta-iframes.php` đã đổi hết sang `[haivan_cta]` và importer mới cũng sinh shortcode (xem mục CTA). Sau khi chạy script này ở production, CSP không còn cần `frame-src https://cms.haivan.com` (chỉ còn YouTube).
- Lần chạy đầu cũng dọn 6 `tin_tuc` nhập nhầm từ bài điểm đến của bản cũ (`hv_old_id` dạng `dd-<id>`).
- `import-old-site.php` không còn nhập tin/điểm đến/ưu đãi (xem trên), để không ghi đè dữ liệu CMS bằng bản chụp.
- Kiểm sau khi nhập: `node wordpress/scripts/verify-cms-urls.mjs cms|archive|parity [--base http://localhost:8180]` (suy URL từ cache CMS, kiểm 200 + tiêu đề; kiểm `archive/old-site/log.jsonl` không có 404 mới; so mã với haivan.com cho một mẫu URL, chỉ GET).

### Viết bài trong WordPress (từ nay)
Admin → **Bài viết điểm đến** → Thêm mới: tiêu đề, nội dung, **Điểm đến của bài** (chọn đúng một điểm; điểm mới: tạo *Điểm đến* ở menu "Điểm đến" thì term tự có, hoặc thêm trong ô này với slug trùng slug trang điểm đến), thẻ, ảnh đại diện, tóm tắt (hiện ở danh sách + mô tả khi thiếu SEO), SEO (Rank Math: title/description). Slug = phần cuối URL `/diem-den/<điểm>/<slug>`. Tin công ty: **Tin tức**; trang điểm đến: **Điểm đến**; ưu đãi: **Ưu đãi**. Nhớ vai trò **Editor** (xem Bảo mật). Lưu ý kses: iframe/script bị lọc khi lưu trong admin (xem mục Làm sạch nội dung); muốn chèn dải đặt vé dùng shortcode `[haivan_cta]`.

### Công cụ ngoài (vd. "Content Agent") đăng bài vào WP thay cho CMS
Dùng WP REST với **Application Password** của một người dùng vai trò **Editor** riêng cho công cụ (tạo ở Người dùng → Hồ sơ → Application Passwords; chỉ chạy qua HTTPS; **không lưu mật khẩu trong repo**, đặt vào kho bí mật của công cụ). Khách chưa đăng nhập luôn nhận 401 ở `/wp-json/wp/v2/*`. Tối thiểu để đăng một bài điểm đến (đã thử trên local):
```bash
# 1) id term của điểm (một lần): GET /wp-json/wp/v2/hv_location?slug=ha-noi  -> [{"id":80,...}]
# 2) (tuỳ chọn) ảnh: POST /wp-json/wp/v2/media  (header Content-Disposition: attachment; filename="a.jpg", body = nhị phân) -> {"id": 123}
curl -u "agent-user:APPLICATION-PASSWORD" -H 'Content-Type: application/json' \
  -X POST https://haivan.com/wp-json/wp/v2/bai_viet -d '{
    "title": "Tiêu đề bài", "slug": "tieu-de-bai", "status": "publish",
    "content": "<p>Nội dung HTML</p>", "excerpt": "Mô tả ngắn",
    "date": "2026-10-28T09:30:00",
    "hv_location": [80], "hv_tag": [], "featured_media": 123,
    "meta": { "rank_math_title": "SEO title", "rank_math_description": "SEO description" }
  }'
```
- `date` theo giờ site (Asia/Ho_Chi_Minh); bỏ `date` = bây giờ. `status`: `draft` để MKT duyệt trước. Sửa bài: `POST /wp-json/wp/v2/bai_viet/<id>` cùng các trường. Điểm đến của bài = `hv_location` (mảng một id). Thẻ: `hv_tag` (id term; tạo thẻ mới bằng `POST /wp-json/wp/v2/hv_tag {"name","slug"}`).
- Tin công ty: `POST /wp-json/wp/v2/tin_tuc` (cùng trường, không có `hv_location`). `rank_math_title`/`rank_math_description` được theme mở cho REST ở `bai_viet`, `tin_tuc`, `diem_den`, `uu_dai`.
- kses vẫn chạy (`DISALLOW_UNFILTERED_HTML`): script/iframe bị lọc; ảnh trong `content` phải là ảnh đã nằm trong Media (tải lên trước rồi dùng URL local) hoặc URL ngoài (không khuyến khích).
- Nếu công cụ đang ghi vào CMS thì đổi đích sang WP trước ngày cắt; CMS không còn là nguồn.

### Cắt chuyển (cutover): chạy lại rồi dừng
1. Trước ngày cắt, mỗi ngày (hoặc ngay trước giờ cắt) chạy lại `import-cms.php` để lấy bài mới/sửa của CMS: nhanh vì chỉ ghi phần đổi. Đọc phần "giữ nguyên" của báo cáo: đó là bài MKT đã sửa trong WP (WP thắng).
2. Thông báo "đóng băng CMS": từ giờ mọi bài mới viết ở WP. Chạy lần cuối `import-cms.php`.
3. **Dừng hẳn** đồng bộ: không chạy lại `import-cms.php` nữa (nếu lỡ chạy: bài MKT sửa vẫn an toàn nhờ dấu nhập, nhưng bài WP mới của MKT không bị đụng và bài CMS cũ có thể sống lại ở dạng đã sửa). Có thể xoá `wordpress/data/cms-cache/`. Giữ `hv_old_id` (đối chiếu id CMS).
4. Sau khi cắt, web cũ phải hết phục vụ editorial (nginx gốc đã chuyển `/diem-den/**`, `/chung-toi/**` sang WP); Next chỉ còn gọi CMS cho API đặt vé.

## MKT sửa gì ở đâu
- Tài liệu SEO cho MKT (từ khoá và brief theo tuyến, Google Business Profile và backlink, thông tin pháp lý cần xác nhận): `docs/seo/`.
- **Menu header/footer**: Giao diện → Menu. Mỗi ngôn ngữ một menu ("Header (vi)", "Footer (en)"…), gán vị trí *Header* / *Footer* cho đúng ngôn ngữ (Polylang). Footer: mục cấp 1 = tiêu đề cột, cấp 2 = liên kết. Menu trống → REST dùng `data/layout-seed.json`. Liên kết sang trang Next dùng *Liên kết tuỳ chỉnh* (`/xe-khach/...`).
- **Hotline, link app, thông tin công ty, logo đối tác/thành viên/thanh toán, chứng nhận, mạng xã hội, QR, huy hiệu app, bản quyền, logo trắng**: Cài đặt → **Layout Hải Vân** (đi thẳng vào REST layout nên Next cũng đổi theo, tối đa ~2 giờ). Ô logo: mỗi dòng `ảnh | liên kết (tuỳ chọn) | mô tả`; để trống = ẩn cả hàng.
- **Trang chủ** (`front-page.php`), từng khối:
  | Khối | MKT sửa ở |
  |---|---|
  | Banner carousel (2 kiểu slide) | menu **Banner trang chủ** (CPT `hv_banner`), xem mục "Banner và ưu đãi trang chủ" bên dưới; carousel CSS scroll-snap, mũi tên + đếm "1/3" + vuốt, không tự chạy |
  | Popup | cũng là `hv_banner` loại Popup (chỉ kiểu ảnh poster): hiện sau khi trình duyệt rảnh, 1 lần/24 giờ (cookie `hv_popup_seen`), không hiện trên điện thoại trừ khi tick "Hiện popup trên điện thoại" |
  | Ưu đãi hôm nay | menu **Ưu đãi hôm nay** (CPT `hv_offer`), xem mục bên dưới; không còn ưu đãi hiệu lực thì ẩn cả khối |
  | H1 + câu mô tả, liên kết "Tất cả ưu đãi", 4 ảnh phòng chờ + địa chỉ, ý và ảnh dải app | Cài đặt → **Trang chủ Hải Vân** (ô trống = dùng mặc định; liên kết "Tất cả ưu đãi" mặc định trỏ `/uu-dai`, trang tự liệt kê ưu đãi đang hiệu lực — thêm/sửa/hẹn giờ ở menu **Ưu đãi hôm nay**, không cần sửa trang) |
  | Dải 4 cam kết | cố định theo comp (tổng đài lấy từ Layout Hải Vân, vé QR, giữ đúng giường, VNPay-QR), không sửa trong admin |
  | Các tuyến phổ biến | menu **Tuyến phổ biến** (`hv_route`): tên, đường dẫn, giá, thời gian, Ảnh đại diện, "Thứ tự" (hiện tối đa 9) |
  | Điểm đến | **Điểm đến** (`diem_den`): chỉ điểm có Ảnh đại diện, theo "Thứ tự", tối đa 10 |
  | Tin tức | 3 bài **Tin tức** (`tin_tuc`) mới nhất |
  | QR, link App Store/Google Play | Layout Hải Vân |
  Nội dung trang "Trang chủ" (nếu có) hiện thêm ở cuối trang. Tiêu đề SEO/mô tả: Rank Math của trang đó.
- **Trang tuyến `/xe-khach/<a>/<b>`**: bài Tuyến phổ biến → hộp "Nội dung trang tuyến" (xem mục Landing tuyến). **Khối "Xe Hải Vân đi X" ở trang Điểm đến**: tự suy từ tuyến có đường dẫn chứa slug điểm đến; ghi đè ở hộp "Tuyến xe liên quan" (cột phải bài Điểm đến, mỗi dòng một đường dẫn `a/b`).
- **Dải đặt vé trong bài**: shortcode `[haivan_cta route="a/b"]` (bỏ `route` = dẫn về `/xe-khach`).
- Trang, tin tức, điểm đến, ưu đãi, SEO (Rank Math), redirect 301 (Rank Math → Redirections) làm trong admin như WP bình thường.

## Banner và ưu đãi trang chủ (MKT)
Cả hai là mục menu riêng trong admin, có cột xem trước, kiểu, trạng thái, lịch, thứ tự; danh sách mặc định xếp theo "Thứ tự" (số nhỏ hiện trước). Bài ở trạng thái **Nháp** không hiện. Mọi ô được làm sạch khi lưu (nonce + quyền sửa bài); chỉ nhận đường dẫn nội bộ `/...`, đường dẫn tuyến `a/b` (thành `/xe-khach/a/b`) hoặc https.

**Thêm slide banner** (menu **Banner trang chủ → Thêm banner**, loại *Banner trang chủ*), chọn một trong hai kiểu:
1. *Ảnh poster*: đặt **Ảnh desktop** (khung bên phải; tốt nhất 3334 × 1156 px) hoặc dán URL `/assets/...`; ảnh điện thoại (1000 × 540 px, tuỳ chọn) thay ảnh desktop trên màn hình dưới 640 px; chỉ có ảnh điện thoại thì slide chỉ hiện trên điện thoại. Tiêu đề bài là mô tả ảnh cho người dùng đọc màn hình. Liên kết tuỳ chọn.
2. *Thiết kế sẵn (chữ + màu + ảnh xe)*: dòng nhỏ (vd. `Hà Nội đi Điện Biên`), tiêu đề (bắt buộc, vd. `900.000đ cho 2 vé Luxury`; số đầu tiên tự phóng to), dòng phụ, chữ trên nút (nút dẫn tới Liên kết; trống = không nút), **Màu nền** chọn từ bảng màu, **Ảnh xe tách nền** (PNG/WebP nền trong suốt, rộng khoảng 900 px, từ thư viện Media hoặc `/assets/...`). Không có ảnh xe thì slide chỉ có chữ.

**Hẹn giờ banner**: ô *Bắt đầu hiệu lực* / *Kết thúc hiệu lực* (ngày giờ, giờ Việt Nam); để trống = hiện ngay / không hết hạn. Hết giờ banner tự ẩn, chưa đến giờ thì chưa hiện, không cần vào gỡ. Cột "Trạng thái và lịch" ghi *Đang hiển thị / Chưa đến ngày / Đã hết hạn / Nháp*. Popup luôn là kiểu ảnh poster.

**Thêm ưu đãi** (menu **Ưu đãi hôm nay → Thêm ưu đãi**): Tiêu đề bài = tên tuyến (vd. `Sài Gòn đi Vũng Tàu`); Huy hiệu (vd. `Tiết kiệm 101k`, `Đi nhóm`, `Đặt trước 3 ngày`, `Mới`; kiểu *Giảm giá* có nền đỏ và biểu tượng nhãn, thẻ màu San hô tự dùng nền trắng); **Giá nổi bật** (bắt buộc, vd. `419k`, `900.000đ`; thiếu giá thì thẻ không hiện); Ghi chú giá (vd. `/ 2 vé Luxury, 210k mỗi người`); Điều kiện ngắn; **Màu thẻ**; **Ảnh minh hoạ** (khung bên phải, hoặc ô URL), không có ảnh thì chọn biểu tượng (điện thoại, quà, vé, xe, đồng hồ); Liên kết (đường dẫn tuyến `my-dinh/dien-bien` hoặc URL; trống = thẻ không bấm được); Chữ trên nút (mặc định "Đặt vé"); *Hiện từ ngày* / *Hiện đến hết ngày* (ngày cuối cùng còn hiện; qua ngày đó thẻ tự ẩn). Thứ tự = ô "Thứ tự"; tối đa 12 thẻ hiện. Chỉ đăng ưu đãi có thật và còn hiệu lực (nguồn chuẩn: `docs/reference/route-landing/*.json`).

**Bảng màu** (select theo tên token, `--color-promo-<tên>` kèm chữ `--color-on-<tên>` cố định, không nhập mã hex): `blue` Xanh dương đậm, `orange` Cam, `teal` Xanh teal, `coral` San hô (đỏ), `leaf` Xanh lá. Thêm màu mới = đổi `docs/design/tokens-v4.css` (và bản sao ở Next/theme) (cặp màu + chữ đủ tương phản) rồi `HV_PROMO_TONES` trong `inc/mkt-shared.php`.

**Gieo nội dung mẫu** (`seed-home-v3.php`, idempotent, `HV_DRY_RUN=1` chỉ báo cáo): slide thiết kế sẵn "Hà Nội đi Điện Biên 900.000đ" (xe tách nền từ `scripts/lib/seed-assets/` vào Media), xếp 2 banner poster sau nó, chuyển Nháp banner CMS không có trong comp (một lần), và 5 ưu đãi theo comp. Không ghi đè bài MKT đã sửa, không tạo lại bài MKT đã xoá.

Menu **Bài ưu đãi (chi tiết)** (CPT `uu_dai`) là bài ưu đãi nhập từ CMS, khác với thẻ "Ưu đãi hôm nay" ở trang chủ.

**REST** `GET /wp-json/haivan-web/v1/home` (chỉ đọc, công khai): `{banners:[…], offers:[…]}` đang hiệu lực, cache 10 phút (transient + `Cache-Control: public, max-age=600`, xoá ngay khi lưu/xoá bài) để Next dùng lại sau này. Ảnh là đường dẫn tương đối.

## Thiết kế mới: banner, CTA, landing tuyến, SEO, ảnh trang tĩnh
Các script dưới đây chạy bằng `docker compose --profile tools run --rm -T [-e BIEN=1] wpcli eval-file /scripts/<tên>.php`; tất cả idempotent và không ghi đè việc của MKT.
- **Banner** (`seed-banners.php`, rồi `seed-home-v3.php` cho slide thiết kế sẵn + ưu đãi): tạo MỘT LẦN theo khoá meta `hv_banner_seed`: 2 banner `/assets/page/page1.jpg`, `page2.jpg` (đang dùng ở comp), cộng banner của CMS cũ qua `GET https://cms.haivan.com/api/list-banner` (chỉ GET): `mobile_banner` → banner chỉ hiện trên điện thoại (ảnh tải vào Media), `web_banner` → desktop, `web_popup` → popup, `app_banner` (dành cho app) → nháp. Banner MKT đã xoá không tạo lại. `HV_DRY_RUN=1` chỉ báo cáo.
- **CTA** (`[haivan_cta route="a/b" title="" text=""]`, `inc/cta.php`): dải đặt vé (thẻ r-3 bóng cấp 1 không viền, nút vàng "Đặt vé" → `/xe-khach/<a>/<b>` hoặc `/xe-khach`, nút gọi hotline nền xám). `replace-cta-iframes.php` (`HV_DRY_RUN=1` trước, `HV_SAMPLE=N` in ví dụ) đổi mọi `<iframe src="https://cms.haivan.com/api/cta/<n>">` (kể cả hai bài dán mã nhúng dưới dạng chữ) sang shortcode; tuyến suy từ điểm đến của bài (`hv_route_for_destination`: tuyến có điểm đến là đích, rồi tuyến chứa slug), không suy được thì CTA chung. Số `n` của khung CMS không cho biết tuyến (CMS trả lỗi cho `api/cta`), chỉ lưu vết. Importer (`lib/sanitize.php`) vẫn nhận iframe CTA nhưng đổi luôn thành shortcode.
- **Landing tuyến** (`inc/route-meta.php`, `inc/route-rest.php`; hợp đồng `docs/route-landing-contract.md`): hộp "Nội dung trang tuyến" trên bài Tuyến phổ biến (`hv_route`, mỗi hướng một bài, `hv_route_path`): tiêu đề SEO, mô tả SEO, H1, mở đầu, đoạn lịch chạy, nội dung chính (HTML qua `wp_kses` đúng allowlist của hợp đồng, bỏ `//host`), FAQ (`câu hỏi | trả lời`), điểm đón (`tên | địa chỉ | ghi chú`), văn phòng (`tên | địa chỉ | giờ | ghi chú | liên kết bản đồ`), hạng xe (`tên | số chỗ | giá từ | mô tả | tiện ích 1; tiện ích 2`), tuyến liên quan và chiều ngược (`nhãn | a/b`), ghi chú khứ hồi. `GET /wp-json/haivan-web/v1/route/<a>/<b>` → JSON hợp đồng (trường rỗng bị bỏ, `updated_at` = ngày sửa bài), 404 khi không có bài xuất bản (`Cache-Control: public, max-age=300`), 200 có `public, max-age=3600`. Bài có `hv_route_path` mà chưa nhập trường nào vẫn trả 200 chỉ có `path` + `updated_at` (Next gộp CMS + mẫu). `seed-route-landing.php` điền nội dung viết lại cho 4 hướng ánh xạ được (`quan-1/vung-tau`, `vung-tau/quan-1-san-bay`, `my-dinh/dien-bien`, `my-dinh/son-la`; nội dung ở `scripts/lib/route-landing-seed.php`; bài đã có nội dung hoặc đã seed thì giữ nguyên; `HV_FORCE=1` ghi đè). 5 hướng trong `docs/reference/route-landing/README.md` chưa có slug trong `popular-routes.json` (Điện Biên → Hà Nội, Điện Biên – Hà Nội khứ hồi, Hà Nội → Mộc Châu, Mộc Châu → Hà Nội, Sơn La → Hà Nội) chưa seed; có slug thì tạo bài Tuyến phổ biến (hoặc nháp) với đúng `hv_route_path` rồi thêm khối vào `route-landing-seed.php`. Kiểm hợp đồng: import `routeLandingSchema` thật của `apps/booking` rồi `safeParse` JSON của endpoint (đã OK cho 5 tuyến). Next cache `routeLanding` 1 giờ; trang ISR của 10 tuyến phổ biến lên nội dung WP sau lần revalidate kế tiếp hoặc lần build sau.
- **SEO** (`seo-setup.php`, `inc/seo.php`): robots.txt có thêm `Sitemap: <trang chủ>/xe-khach/sitemap.xml` (cạnh `sitemap_index.xml` của Rank Math); Rank Math đồ thị tri thức = **Tổ chức** "Hải Vân" (logo tải vào Media từ `HV_LOGO_SOURCE`, mặc định `/cms-cache/logo-yellow.jpg`: chép `apps/booking/public/assets/images/logo-yellow.jpg` vào `wordpress/data/cms-cache/`), có Facebook; JSON-LD không còn Person. Title/description của trang chủ đặt khi trống. Title/description của `diem_den`, `bai_viet`, `tin_tuc` giữ meta đã nhập. `blog_public` theo quy tắc `WP_ENV_TYPE`, không đổi.
- **Ảnh trang tĩnh** (`restore-static-images.php`): đường dẫn ảnh gốc đọc từ bundle JS của archive (`archive/old-site/_next/static/chunks/pages/<trang>-<hash>.js`, chuỗi `/assets/...` theo thứ tự dựng trang; HTML đã lưu không còn `_next/image`). Ảnh thật (cạnh ngắn ≥ 200px, `scripts/lib/asset-dims.json`) đứng trước tiêu đề nội dung đầu tiên → dải ảnh đầu trang `div.hv-photo-strip`; bỏ qua trang chỉ có ảnh từng bước và khối con của landing `/dat-ve-nhanh*`. Trang MKT đã sửa không bị đụng. `set-page-order.php` đặt "Thứ tự" cho trang tĩnh theo manifest để thanh điều hướng cùng mục đúng thứ tự.

## REST layout
`GET /wp-json/haivan-web/v1/layout` → đúng hợp đồng `apps/booking/src/schemas/layout.ts` (`version, hotline, messenger?, apps?, vi{primary,footer_columns,company}, en{…}` và các trường tuỳ chọn `partners, members, payments, social, certificate, qr, badges, copyright, logo_white`; ảnh phải là `/assets/...` hoặc https, URL Media của chính site tự đổi sang đường dẫn tương đối; mảng logo rỗng = ẩn hàng; trường đơn để trống = bỏ khỏi payload, Next dùng `layout-fallback.json`), công khai, `Cache-Control: public, max-age=3600`. Href là đường dẫn tương đối (`/en/...` cho en); liên kết `tel:`/`mailto:`/`sms:` và URL ngoài giữ nguyên, scheme khác (`javascript:`...) thành `#`. Next cache thêm tối đa 1 giờ → menu đổi hiển thị trên Next ≤ ~2 giờ. Kiểm: `node wordpress/scripts/check-layout.mjs [URL]` (import schema zod thật; dự phòng bản sao zod, rồi kiểm cấu trúc thủ công). Next trỏ vào đây bằng `WP_LAYOUT_URL`.

## Thiết kế, header/footer & đăng nhập
Hệ thiết kế khoá: `design.md` + `docs/design/tokens-v4.css` (bản sao nguyên văn: `assets/css/tokens.css`, nạp đầu tiên, giống hệt `apps/booking/src/app/tokens.css`; kiểm `diff docs/design/tokens-v4.css wordpress/wp-content/themes/haivan-web-child/assets/css/tokens.css`). CSS của theme chỉ dùng token (v4: bo góc chỉ `--r-1` 4 / `--r-2` 8 / `--r-3` 16 / `--r-4` 24 (chỉ cho ảnh/banner) và `--r-round` cho nút vuông chỉ-có-icon; thang cách 4–96px, 3 bóng `--shadow-1..3`, chữ 14–48 (48 chỉ cho H1 trang chủ), nút/ô 48px), kiểm bằng `node docs/design/check-tokens.mjs wordpress/wp-content/themes/haivan-web-child/assets/css/*.css`. Tên lớp `hv-*` khớp Next (`hv-header`, `hv-nav-link`, `hv-footer`, `hv-rcard`...). Ảnh lấy từ `/assets/...` (Next phục vụ qua nginx gốc; mặc định trang chủ dùng `/assets/design/*`, nên phải có bản Next đã build chứa thư mục này) và Media của WP, không chép vào theme. Header: thanh vàng dính một dòng, kính vàng (logo, 5 nhóm menu có dropdown mở bằng rê chuột/chạm/phím, hotline, Đăng nhập/Tài khoản, EN) + bảng menu điện thoại (kính sáng); footer "mast": dải app + QR (trừ trang chủ, nơi dải này nằm giữa trang), logo + hotline, 4 cột, Đối tác/Thành viên/Thanh toán, tầng pháp lý (công ty, Chứng nhận, Theo dõi, Ứng dụng, bản quyền) — tất cả đọc từ cùng payload REST layout. Markup thừa của Flatsome sau footer (`#main-menu`, Search, Newsletter, icon xã hội `http://url`) bị gỡ ở `inc/hardening.php`. JS nhỏ `assets/js/site.js`:
- gọi cùng origin `GET /api/hv/auth/session` → `{loggedIn:true}` thì hiện "Tài khoản" (Thông tin cá nhân, Ưu đãi của tôi, Khách hàng thân thiết → `/tai-khoan/khach-hang-than-thiet`, Chuyến đi của tôi, Đăng xuất = `POST /api/hv/auth/logout` với `X-HV-Req: 1`; chỉ khi BFF trả 2xx mới về trang chủ, lỗi (vd. 403 sai Origin, mạng) thì ở lại và hiện thông báo); lỗi/404/không phải JSON → giữ "Đăng nhập" (WP chạy độc lập vẫn dùng được).
- "Đăng nhập" → `/tai-khoan/dang-nhap?next=<đường dẫn+query hiện tại>` (`/en/...` cho en).
- Cookie affiliate: URL có `utm_source` / `aff_sid` → ghi cookie cùng tên 30 ngày, `path=/`, `SameSite=Lax` (`Secure` khi https); bỏ qua rỗng, `null`, `undefined`.

## Thiết kế v4: kính chức năng + bo góc theo logo
Chủ đã duyệt v4 (`docs/design/v4-glass-radius-proposal.md`, README v4, comp `docs/design/comps/home-v4.html`). Kiểm toàn bộ mẫu: `docs/design/audit-v4-wp.md` (trước/sau, ảnh chụp 1440 và 390).
- **Bo góc**: chỉ 4/8/16/24 (`--r-1..4`) và `--r-round`; khung chứa nội dung dừng ở r-3 (thẻ r-3 đệm s-2 + ảnh r-2 = đồng tâm), r-4 chỉ cho banner và ảnh lớn; huy hiệu/thẻ là chữ nhật r-1, không còn viên thuốc; ô icon là ô vuông r-1. Không dùng lại alias v3 (`--r-sm/md/lg/pill`) trong theme.
- **Không viền đen**: bỏ mọi viền ink 2px (nút phụ, dropdown, dải CTA, ô tìm, popup, phân trang, thanh phụ…). Ô nhập viền 1px `--color-edge`; vạch phân cách 1px `--color-rule`; chọn/hiện tại = `--select-bg` + vòng 2px `--select-ring` (= `--color-select-edge`, ≥ 3:1) (+ chữ đậm); chỉ vòng focus giữ 2px ink.
- **Kính** (tối đa 3 lớp một màn, chữ ≥ 16px màu ink, đo ≥ 4,5:1): header dính (vàng đặc lúc nghỉ; `site.js` đặt `data-scrolled="true"` khi `scrollY > 8` thì `::before` thành kính vàng: chỉ đổi nền + blur, không xô layout, listener `passive`; dự phòng solid), thẻ tìm vé trên trang chủ (`.hv-hero-card.glass`, phủ một phần ba dưới của banner), popup banner. Mọi lớp có `@supports not (backdrop-filter)` và `prefers-reduced-transparency` → nền đặc. Bảng menu điện thoại, dropdown, menu tài khoản, danh sách gợi ý điểm là nền đặc (menu: r-2, bóng 2, mục 48px + vạch 1px rule, mục con thụt s-4, như Next) (không phải lớp kính theo đề xuất).
- **Banner**: slide ảnh thật đầu tiên (`seed-v4.php`, ảnh `/assets/design/home-hero.jpg` nạp vào Media kèm bản 720px cho điện thoại) cho kính có ảnh để làm mờ. Banner ảnh có tỉ lệ < 2,2:1 tự phủ kín khung (`hv-slide--photo`), poster giữ nguyên "contain". MKT đặt thứ tự/ẩn như mọi banner.
- **Nội dung nhập (`.hv-entry`)**: ảnh r-3; bảng được bọc `div.hv-table-wrap > div.hv-table-scroll[tabindex=0][role=region][aria-label]` lúc hiển thị (`inc/entry-tables.php`, không đổi DB): khung r-2, vạch 1px, cuộn ngang có mờ mép (`site.js`), cột đầu dính; `<th>` tự có `scope`; `aria-label` lấy từ `<caption>`, tiêu đề/đoạn ngắn đứng ngay trước bảng, hoặc "Bảng dữ liệu". Soạn bảng mới: dùng `<thead>`/`<th>`/`<caption>` để có tiêu đề cột đúng.
- **Dải app**: mỗi ý ở Cài đặt → Trang chủ Hải Vân có thể là liên kết nội bộ: `Khách hàng thân thiết | /chung-toi/chuong-trinh-khach-hang-than-thiet` (bản en tự thêm `/en`).
- **Nhịp section** (bảng đo ở `docs/design/audit-v4-wp.md`): các khối xếp liền nhau, không margin giữa chúng; khoảng trống dọc chỉ do `padding-block: var(--section-pad)` của từng khối (trang nội dung `.hv-page`, `.hv-404`, dải ưu đãi, footer cũng vậy); hai khối liền nhau khác nền (giấy / trắng / ấm / xám / vàng / ink): `/uu-dai` có dải app nền ấm (`hv_app_band_ground()`) vì dải ưu đãi vàng, landing `/dat-ve-nhanh` nền ấm. `.hv-main` không còn `min-height`. Khối trống từ nhập cũ (đoạn rỗng/`&nbsp;`/`<br>` liên tiếp) bị bỏ lúc hiển thị (`hv_strip_blank_blocks`). Ảnh đại diện đầu trang không rộng quá cỡ thật (`hv_featured_photo` đặt `--hv-nat`); ảnh đơn dạng dải ôm theo `width`/`height`.
- **Nút gọi nổi** ẩn khi thẻ tìm vé đang trong màn hình (`site.js`), chân trang chừa chỗ; vùng chạm mọi liên kết ≥ 44px (breadcrumb, chân trang, liên kết `tel:` trong nội dung; `tel:` đứng một mình trong đoạn là nút vàng).
- **Breadcrumb**: dấu "/" là `li + li::before` lùi vào trái mục sau, `ol` cắt phần lùi nên không có "/" mồ côi đầu dòng; chỉ mục cuối có `aria-current="page"`; mục cha luôn là liên kết (trang cha nháp như `/chung-toi` dẫn tới trang con đầu tiên đã xuất bản).

### Chương trình khách hàng thân thiết (`/chung-toi/chuong-trinh-khach-hang-than-thiet`, vi + en)
Trang WP chỉ giải thích chương trình; đăng ký/đăng nhập/lời mời do Next xử lý ở `/tai-khoan/khach-hang-than-thiet` (`/en/...`).
- `scripts/seed-v4.php` (idempotent, `HV_DRY_RUN=1` báo cáo, `HV_FORCE=1` ghi đè trang MKT đã sửa) ghi nội dung sạch từ `scripts/lib/membership-content.php`: nút chính "Tham gia ngay" ở đầu và cuối trang (liên kết thật), tiêu đề `h2`, một ảnh, hai bảng có `thead`/`th scope`/`caption`, icon có/không có `alt` "Có"/"Không" (en: "Yes"/"No"), số 150.000/250.000, bỏ câu lặp và mảnh tab; Rank Math title `Chương trình khách hàng thân thiết "Tôi yêu Hải Vân" | Hải Vân` và mô tả (vi + en); liên kết "Khách hàng thân thiết" trong cột "Về chúng tôi"/"About us" của menu Footer (vi/en) và trong `data/layout-seed.json`. Trang đã bị MKT sửa thì giữ nguyên.
- **Next fallback**: `apps/booking/src/content/layout-fallback.json` cần cùng mục footer (cùng trường, chỉ thêm dữ liệu; `check-layout.mjs` sẽ báo "khác" tới khi hai bên khớp).
- **URL ảnh tương đối**: `scripts/relativize-media-urls.php` (`HV_DRY_RUN=1` trước) đổi `http://localhost:8180/wp-content/` → `/wp-content/` chỉ trong `post_content` (815 bài, 3.503 chỗ ở local; tương đương `wp search-replace 'http://localhost:8180/wp-content/' '/wp-content/' hv_posts --include-columns=post_content --precise`, nhưng đóng dấu lại hash nhập cho bài còn nguyên bản nhập để importer không coi là "MKT đã sửa"). Không đụng GUID, postmeta, link bài. Production: chạy lại với `HV_ABS_BASE=https://haivan.com` nếu nội dung từng nhập với host tuyệt đối.

## Shortcode `[haivan_search]`
JS thuần (`assets/js/search.js`, `search.css`), dùng ở trang chủ, landing và `/xe-san-bay`; markup/CSS khớp Next: icon ghim trong ô điểm, bộ đếm −/+ 48px cho "Số người" (vẫn là ô `numberGuest`), nút đổi chiều đè mép phải giữa hai ô trên điện thoại, nút "Tìm vé" 48px cùng đáy với ô; nhãn tab bản en ngắn ("Bus", "Airport bus", "Airport taxi", "Car hire"), "Guests"/"Search". Tab "Xe liên tỉnh" đang chọn; "Xe sân bay"/"Xe hợp đồng"/"Xe du lịch" là liên kết sang trang WP (đổi bằng thuộc tính `airport_url`, `contract_url`, `rental_url`; cùng `results_path`, các thuộc tính này chỉ nhận đường dẫn nội bộ dạng `/a/b-c`, giá trị khác như `//evil.com` hay `\\evil.com` bị thay bằng mặc định). Điểm đi/đến lấy từ `GET https://apigw.haivan.com/api/places?type=0` (header `Domain: haivan.com`, chỉ đọc; shortcode chỉ chấp nhận host apigw.haivan.com). Có hoán đổi, ngày từ hôm nay đến +4 tháng, số người ≥ 1, thông báo lỗi thiếu điểm đi/đến. Gửi GET tới `/xe-khach/tim-chuyen?from=<tên>,<lat>,<lng>&to=<tên>,<lat>,<lng>&date=DD-MM-YYYY&numberGuest=N` (mỗi giá trị `encodeURIComponent`; dấu phẩy trong tên bị đổi thành khoảng trắng để không vỡ bộ ba), tiền tố `/en` cho tiếng Anh, và ghi cookie `pll_language`. Không thêm `type=` (đặc tả phase 4 quyết định).

## Bảo mật
Vì WP cùng origin với BFF Next, XSS/plugin lỗi ở WP có thể gọi BFF bằng phiên người dùng:
- `wp-config` (qua `WORDPRESS_CONFIG_EXTRA` trong compose): `DISALLOW_FILE_EDIT`, `DISALLOW_UNFILTERED_HTML` (kses chạy khi MKT lưu bài trong admin, kể cả Administrator), `WP_AUTO_UPDATE_CORE=minor`, `FORCE_SSL_ADMIN` (production: `WP_FORCE_SSL_ADMIN=true`). **Ghi chú**: kses chỉ chạy qua giao diện admin; WP-CLI/importer không qua kses nên có bước lọc riêng (mục Nhập nội dung).
- **Script/HTML thô của Flatsome bị vô hiệu** (`inc/hardening.php`): Flatsome vốn echo theme_mod *Header/Footer/Body Scripts* và các khối HTML (sau header, trước/sau footer) lên mọi trang, bỏ qua `DISALLOW_UNFILTERED_HTML`. Child theme (1) ép các theme_mod đó trả rỗng, (2) gỡ các hàm echo, (3) ẩn trang *Flatsome > Advanced* và AJAX lưu của nó. Người vận hành bật lại được bằng `define( 'HV_ALLOW_FLATSOME_RAW_HTML', true )` trong `wp-config` (không qua admin UI). Vai trò: cho MKT quyền **Editor**, không phải Administrator (Administrator vẫn cài được plugin/đổi theme trừ khi đặt `DISALLOW_FILE_MODS`); 2FA vẫn do từng người bật ở Hồ sơ (Two Factor), chưa có cơ chế ép buộc.
- **Không lộ tên đăng nhập**: `/?author=N`, `/?author_name=`, `/author/*` (cả `/en/`) trả **404** (hook `template_redirect` ưu tiên 1, chạy trước `redirect_canonical`; không có rewrite rule tác giả); `author_name`/`author_url` bị bỏ khỏi oEmbed; tên tác giả bị bỏ khỏi JSON-LD Rank Math (thực thể Person + gravatar), nhãn "Written by" của Slack/Twitter; feed (`/feed`, `/comments/feed`, có `dc:creator`) trả 404 và bỏ link feed; sitemap tác giả của lõi WP/Rank Math tắt; REST: `/wp/v2/*` (gồm `users`) trả 401 cho khách (cả `?rest_route=`), chỉ `haivan-web/v1/layout`, `oembed` và các route công khai khác của plugin mở. Kiểm bằng `curl` ở mục Kiểm thử nhanh.
- **Không lộ phiên bản**: bỏ `generator` (meta, header, feed), `X-Pingback`, link api.w.org/oEmbed/RSD/wlwmanifest; `?ver=<phiên bản WP>` của tài nguyên lõi được thay bằng băm có muối; `expose_php=Off` + `fastcgi_hide_header X-Powered-By`; `readme.html`, `license.txt`, `wp-admin/install.php` trả 404. `wp-cron.php` vẫn công khai (production: `DISABLE_WP_CRON` + cron hệ thống, phase 10).
- nginx WP (`wordpress/nginx/default.conf`): chặn PHP trong `uploads`, `xmlrpc.php`, file ẩn, và (**không phân biệt hoa thường**: bind mount macOS không phân biệt hoa thường nên `/wp-config.PHP` từng trả mã nguồn) `wp-config*`, `.ht*`, `*.sql|log|bak|old|orig|save|swp|ini|conf|env|dist`; khối PHP dùng `~* \.php$` và đứng sau các khối chặn. `nginx-snippet.conf` (mẫu cho nginx gốc) có cùng bộ chặn và `allow all;` trong `admin-ajax.php`/`admin-post.php` lồng trong `/wp-admin/` (location lồng kế thừa `deny all` của cha).
- Plugin tự cập nhật (`wp plugin auto-updates enable --all`); Two Factor: mỗi tài khoản quản trị bật 2FA ở Hồ sơ.
- **Production**: giới hạn `/wp-admin`, `/wp-login.php` theo IP văn phòng/VPN thật (mẫu trong `nginx-snippet.conf`; không allow dải IP riêng 10/172.16/192.168), CSP front-end ở nginx gốc (phase 10; WP chỉ nạp script cùng origin + `apigw.haivan.com` cho widget tìm vé: `connect-src https://apigw.haivan.com`; iframe CTA: `frame-src https://cms.haivan.com`), `WP_ENV_TYPE=production`, mật khẩu DB riêng, sao lưu DB + `data/wp/wp-content/uploads` hằng ngày (phase 10).
- Không có bí mật trong repo: `.env`, `data/`, Flatsome, plugin đều gitignore. Không chép `hvb-direct-booking.php`/token từ `HV_QR_BOOKING`.

## Chuyển URL (đổi `WP_URL`, staging → production)
Nội dung lưu URL tuyệt đối (ảnh trong bài, meta Rank Math, GUID file đính kèm) theo `WP_URL` lúc nhập. Cách tốt nhất: chạy `setup.sh` + import trên staging với đúng `WP_URL` cuối. Nếu phải đổi sau: sao lưu DB, rồi **dry-run trước**, đọc số dòng thay, mới chạy thật:
```bash
cd wordpress && mkdir -p data/backups
docker compose --profile tools run --rm -T wpcli db export /var/www/html/hv-before-migrate.sql   # trong data/wp, chép ra data/backups
docker compose --profile tools run --rm -T wpcli search-replace 'http://localhost:8180' 'https://haivan.com' \
  --all-tables --skip-columns=guid --precise --dry-run
# kết quả hợp lý thì chạy lại KHÔNG có --dry-run, rồi:
docker compose --profile tools run --rm -T wpcli cache flush; docker compose --profile tools run --rm -T wpcli rewrite flush
```
`--skip-columns=guid` giữ GUID (định danh bài, không phải địa chỉ; đổi GUID làm trình đọc RSS thấy bài mới), `--precise` xử lý dữ liệu serialize an toàn. Sau đó đặt `WP_URL` trong `.env` rồi `docker compose up -d`. Lưu ý: GUID file đính kèm giữ URL cũ (ảnh vẫn hiển thị vì WP dùng `wp_get_attachment_url`, không dùng GUID). Đã dùng cách này cho `8089 → 8180` ở local.

## Kiểm thử nhanh
```bash
# (đổi cổng cho đúng WP_URL: local qua nginx gốc là 8180; 8089 chỉ khi WP_URL trỏ 8089)
curl -s -o /dev/null -w '%{http_code}\n' localhost:8180/                       # 200
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:8180/chung-toi/gioi-thieu   # 200, không redirect
for u in '/?author=1' /author/hvadmin /wp-json/wp/v2/users /feed; do curl -s -o /dev/null -w "$u %{http_code}\n" "localhost:8180$u"; done   # 404 404 401 404
for f in wp-config.PHP wp-config.php readme.html license.txt backup.SQL; do curl -s -o /dev/null -w "$f %{http_code}\n" localhost:8089/$f; done  # 404 (WP nginx trực tiếp)
node wordpress/scripts/check-layout.mjs
node wordpress/scripts/verify-cms-urls.mjs cms       # mọi URL bài/tin/điểm đến suy từ cache CMS -> 200 + tiêu đề khớp (~1.000 URL, ~1 phút)
node wordpress/scripts/verify-cms-urls.mjs archive   # archive/old-site/log.jsonl: không có 404 mới
node wordpress/scripts/verify-cms-urls.mjs parity    # mẫu URL cũng GET trên haivan.com (chỉ đọc, 1 giây/URL) và so mã
```
Sửa menu trong admin rồi chạy lại `check-layout.mjs`/`curl .../layout` để thấy thay đổi (Cache-Control chỉ ảnh hưởng client).

## Còn thiếu / lưu ý
- Nội dung CMS: ảnh trong bài từ host khác (Google Docs, Facebook CDN, `replicate.delivery`) giữ URL gốc (nhiều link đã chết từ web cũ); bài CMS `status=0` nhập thành nháp; hai bài trùng slug (không phân biệt hoa thường) trong CMS: bài sau có hậu tố `-2` (web cũ chỉ phục vụ được bài đầu). `/en/diem-den/<điểm>` và `/en/chung-toi/bao-chi-tin-tuc/<slug>` vẫn 301 về URL vi (web cũ trả 200 nội dung tiếng Việt dưới `/en/`); muốn trả 200 như bài điểm đến thì thôi dịch Polylang cho `diem_den`/`tin_tuc` và thêm rule `en/` như `bai_viet`. Web cũ còn trả 200 cho tiền tố `/vi/...` (rác của next-i18next); WP trả 404, không phải URL biên tập.
- Hiệu năng: đo local (Chrome, mobile 412px, 4× CPU, ~1.6 Mbps/150ms, trung vị 7 lần, PerformanceObserver LCP) trang `/`: LCP **~1.44 s → ~0.76 s**, 25 → 14 request, 433 → 288 KB sau khi bỏ Flatsome/jQuery khỏi front-end. Đây là số phòng thí nghiệm trên máy dev, **chưa phải** dữ liệu production (CDN, TLS, ảnh thật, `apigw`): vẫn phải đo lại trên staging.
- Flatsome là theme thương mại: cần license hợp lệ cho domain mới (rủi ro đã nêu trong phase 9).
- Ảnh nội dung các trang tĩnh, nội dung tiếng Anh thực, điểm đến/tin tức en: MKT bổ sung.
- Chưa làm ở phía WP (thuộc nginx gốc/phase 10): giới hạn IP admin, CSP/HSTS/frame-ancestors, `wp-cron.php` công khai, sao lưu.
- Thiết kế mới, điểm cần biết: (1) ảnh mặc định của trang chủ/dải app nằm ở `/assets/design/*` do Next phục vụ, nên bản Next đang chạy phải được dựng sau khi thư mục này có (local: `SKIP_BUILD=1 bash deploy/local/start-next.sh` chép lại `public/`); (2) các khối trang chủ chỉ có một bộ nội dung tiếng Việt, bản `/en/` dùng nhãn tiếng Anh với cùng nội dung; (3) bài nhập từ CMS mang `style` nội tuyến (Arial, cỡ chữ, màu): `content.css` ép về thang chữ và màu của hệ thiết kế để giữ tương phản; (4) `/favicon.png`, `/en/test`, `/en/sentry-example-page`, `/xe-san-bay/tim-chuyen-car-airport` vẫn 404 như đã ghi ở review phase 9 (không thuộc WP).
