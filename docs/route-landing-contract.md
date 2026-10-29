# Hợp đồng landing tuyến (WordPress ↔ Next)

Nguồn sự thật: `apps/booking/src/schemas/route-landing.ts` (zod) + mẫu `apps/booking/test/fixtures/wp-route.json`.
WP chỉ cần trả JSON đúng mẫu; Next tự gộp với CMS và mẫu chuỗi.

## Endpoint
`GET /wp-json/haivan-web/v1/route/<a>/<b>` — `<a>/<b>` là slug CMS (`my-dinh/dien-bien`, `[a-z0-9-]+`). Bài `hv_route`
(1 bài/hướng, meta `hv_route_path`). Public, không cần đăng nhập, `Content-Type: application/json`.
- Có bài → 200. **Chưa có bài → 404** (Next dùng CMS + mẫu, không coi là lỗi).
- 5xx/timeout/sai hợp đồng được Next xử lý như "WP lỗi" (xem Fallback).

## Trường (tất cả tuỳ chọn trừ `path`; `null` hoặc `""` = chưa nhập)
| Trường | Kiểu | Ghi chú |
|---|---|---|
| `path` | `"a/b"` | bắt buộc, trùng URL |
| `seo_title`, `meta_description`, `h1`, `intro` | string | title dùng nguyên văn (nên ≤ 60 ký tự, mô tả ≤ 155) |
| `schedule_text` | HTML | đoạn dưới tiêu đề "Giờ chạy & giá vé xe A đi B" |
| `content_html` | HTML | khối nội dung chính (h2/h3, danh sách, link) |
| `faq` | `[{q,a}]` | `a` là văn bản thuần; sinh FAQPage JSON-LD |
| `pickup_points` | `[{name,address,note?}]` | điểm đón đầu tiên vào meta description mẫu |
| `offices` | `[{name,address,hours?,note?,map_url?}]` | `map_url` bắt buộc http(s) |
| `vehicle_classes` | `[{name,seats?,price_from?,text?,amenities?[]}]` | `price_from` chuỗi hiển thị ("485.000đ") |
| `related_routes` | `[{label,path}]` | `path` dạng `a/b`; Next dựng link `/xe-khach/a/b` (+`/en`) |
| `reverse_route` | `{label,path}` | chiều ngược lại |
| `round_trip_note` | string | khối "Đặt vé khứ hồi" |
| `updated_at` | ISO 8601 có múi giờ | `lastmod` của `/xe-khach/sitemap.xml` |
Chỉ tiếng Việt. Bản `/en` dùng mẫu + CMS, `noindex,follow`, không có hreflang `en` cho tới khi có hợp đồng en.

## Thứ tự ưu tiên (từng trường)
WP > CMS `route-listing` > mẫu. CMS: `wayroad.meta_title/meta_desc` (bỏ qua nếu chỉ lặp tên tuyến), `questions_wayroad` → FAQ,
`services` → tiện ích (icon), `price_avg/run_time/distance` → phụ đề, JSON-LD Offer.
Mẫu: title `Xe {A} đi {B} – Vé từ {giá} | Hải Vân` (≤ 60), H1 `Đặt vé xe {A} đi {B}`, meta `Đặt vé xe Hải Vân {A} đi {B}: giá từ …, … giờ, đón tại … Giữ chỗ online, thanh toán VNPay.` (≤ 155, thiếu phần nào bỏ phần đó).

## Cache và Fallback
Next cache profile `routeLanding` (`next.config.ts`): stale 1h, revalidate 1h, expire 7 ngày. Nội dung WP sửa xong tối đa ~1h sau mới lên trang.

Hành vi đã kiểm chứng:
- **Request-time render** (trang chưa có HTML tĩnh): hết `revalidate` thì phục vụ bản cache cũ và làm mới nền (stale-while-revalidate).
- **Trang ISR** (10 tuyến phổ biến): tạo lại ở **foreground**, không phải nền; hàm cache ném lỗi thì Next không tự giữ nội dung cũ trong hàm đó.
  Vì vậy Next giữ thêm một kho "bản tốt gần nhất" trong bộ nhớ tiến trình (`src/lib/last-good.ts`), nằm ngoài hàm `use cache` nên sống qua mọi lần làm mới.

Khi nguồn trả lỗi tạm (mạng, 5xx, timeout, sai hợp đồng) hoặc 404:
| Nguồn | 404 | Lỗi tạm, đã có bản tốt | Lỗi tạm, chưa có bản tốt |
|---|---|---|---|
| WP `route/<a>/<b>` | `null` → CMS + mẫu (xoá bản tốt) | dùng bản tốt, **title/index không đổi** | CMS + mẫu |
| CMS `route-listing` | `null` → trang chỉ có form, `noindex`, 200 (CMS thật trả **200 `[]`** cho slug không có tuyến, 404/410 cũng tính) | dùng bản tốt | **ném lỗi**: ISR giữ HTML cũ, request-time trả 500 (không trả 200 noindex) |
| WP `layout` | không áp dụng | dùng layout WP gần nhất | `layout-fallback.json` |

Giới hạn: kho nằm trong bộ nhớ nên mất khi khởi động lại/deploy; tiến trình mới mà WP sập ngay lần tải đầu thì rơi về CMS/mẫu cho tới khi WP hồi phục.
Chỉ 404/410 hoặc thân rỗng (`[]`, `{}`, `data` rỗng) của CMS mới được coi là "không có tuyến"; thân khác sai hợp đồng là lỗi tạm. Trang tuyến gọi CMS trước, chỉ gọi WP khi CMS có tuyến (slug lạ không tạo thêm request/cache WP).
Build thật mà CMS `route-listing` sập → build dừng (không đóng băng trang noindex vào HTML tĩnh); riêng `pnpm build:verify` (`HV_BUILD_OFFLINE=1`) cố ý chạy không mạng nên dựng trang rỗng (không bao giờ deploy).
Log một lần/khoá cho tới khi hồi phục: `[route] fallback <a>/<b>: …`, `[route-listing] <a>/<b>: …`, `[layout] fallback layout: …` (cấp warn).
Env: `WP_ROUTE_URL` (gốc WP, tuỳ chọn) — thiếu thì suy từ `WP_LAYOUT_URL` (cắt từ `/wp-json/`). `PUBLIC_ORIGIN` (bỏ dấu `/` cuối) là gốc của canonical, JSON-LD và sitemap.
JSON-LD `Service.provider` là `Organization{name:"Hải Vân", url:<origin>}` viết thẳng trong trang (không tham chiếu `@id` ngoài).

## HTML cho phép (`src/lib/sanitize-html.ts`)
Thẻ: `h2 h3 p ul ol li strong em b i a br img blockquote`. Mọi thẻ/thuộc tính khác bị bỏ (kể cả `class`, `style`, `on*`; `script/style/iframe/svg…` bỏ cả nội dung).
- `a[href]`: `http(s)://…`, đường dẫn tương đối (không `//host`), `tel:` (chỉ số và `+().,;#*-`) hoặc `mailto:`; không scheme khác. Link http(s) được thêm `rel="noopener"`.
- Giới hạn: thuộc tính dài quá 2.000 ký tự bị bỏ; đầu vào quá 200 KB bị cắt.
- `img`: `src` là `https://…` hoặc `/assets/…`; `alt` giữ; luôn `loading="lazy"`; ảnh không hợp lệ bị bỏ.
Dùng trình soạn thảo cơ bản của WP (đoạn, tiêu đề 2/3, danh sách, đậm/nghiêng, link, ảnh); đừng dán HTML có bảng/iframe/nhúng.

## Footer/layout (cùng phiên bản)
`GET …/layout` giữ `version: 1`; thêm trường tuỳ chọn `partners[] members[] payments[] {img,href?,alt}`, `social{facebook?,youtube?}`, `certificate{href,img,alt?}`,
`qr`, `badges{appstore,playstore,appstore_icon?,playstore_icon?}`, `copyright`, `logo_white`. Mẫu: `test/fixtures/wp-layout.json`. `img` là `/assets/…` (ảnh nằm ở `apps/booking/public/assets`, không `//host` hay `/\host`) hoặc https; `href` của logo/mạng xã hội/chứng nhận, `apps.ios`, `apps.android`, `messenger` là http(s); `href` của menu là http(s) hoặc đường dẫn bắt đầu bằng `/`; `hotline` là chuỗi hiển thị ("1900 6763"). Trường vắng mặt → Next lấy từ `src/content/layout-fallback.json`; mảng rỗng (`[]`) → ẩn hàng đó.
