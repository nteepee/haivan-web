# Đánh giá cấu trúc web: internal link, SEO, GEO, ASO (15/11/2026)

Đối tượng: bản stg (`/opt/haivan-web-stg`, theme 1.10.27), qua https://harry-rebate-gordon-mas.trycloudflare.com — trùng với `main` sau đồng bộ.
Cách đo: crawl toàn bộ sitemap + đi theo link từ trang chủ (1.109 URL, 1.108 trang HTML 200), `jev-audit` (30 trang, 870 cặp, 92 gợi ý, ~0,024 USD), đọc thẻ head/JSON-LD, robots, các file `.well-known`.

## Kết luận

Khung internal link **tốt**: không trang mồ côi, mọi trang trong sitemap tới được từ trang chủ, bài viết dẫn về đúng trang tuyến (trang bán vé) ngay trong thân bài, trang tuyến dẫn ngược về điểm đến/bài viết. Điểm yếu nằm ở **độ sâu của kho bài viết**, **cấu hình host/index khi lên tên miền thật**, **GEO bị chặn ở tầng Cloudflare** và **ASO gần như chưa có cầu nối web → app**.

## 1. Internal link

| Chỉ số | Kết quả |
|---|---|
| Trang mồ côi (trong sitemap, không link trỏ tới) | 0 |
| Trang trong sitemap không tới được từ trang chủ | 0 |
| Link hỏng | 1: `/cdn-cgi/l/email-protection` (22 link — Cloudflare che email, hết khi tắt "Email Obfuscation" hoặc dùng `tel:`/form) |
| Link nội bộ/trang | trung vị 49, tối đa 63 (hợp lý) |
| Bài viết có link tới trang tuyến | 728/728; mẫu 12/12 có link **trong thân bài** đúng tuyến của điểm đến |
| Trang tuyến → điểm đến/bài viết | 6 link mỗi trang tuyến |
| Trang trỏ host khác (IP, haivan.com) | 0 |

**Độ sâu click** (trang trong sitemap): 0:1 · 1:45 · 2:126 · 3:273 · 4:247 · 5:167 · 6:66 · 7:32 · 8:18.
530 trang sâu hơn 3 click, toàn bộ là bài viết (412) và tin tức (118) — do chỉ đi được qua phân trang lưu trữ.

**Trang tuyến nhận link gần như chỉ từ menu chung** (mỗi tuyến 1.041 link = mọi trang): đủ để Google tìm thấy nhưng không phân biệt chủ đề; tín hiệu theo ngữ cảnh chỉ đến từ bài viết của đúng điểm đến (đã có, tốt).

**jev-audit**: 92 gợi ý → bỏ 33 gợi ý chéo ngôn ngữ (vi→en, không nên) và 53 link đã có sẵn → **còn 6 gợi ý mới thật**, đều ở trang tiếng Anh:

| Tin cậy | Nguồn → Đích |
|---|---|
| 94% | `/en/ho-tro` → `/en/dich-vu/xe-lien-tinh/hanh-ly-that-lac` |
| 86% | `/en/chung-toi/lien-he` → `/en/dich-vu/xe-hop-dong/ung-dung` |
| 85% | `/en/dich-vu/xe-lien-tinh/phong-ve` → `/en/dich-vu/xe-hop-dong/ung-dung` |
| 83% | `/en/dich-vu/xe-lien-tinh/tien-ich-tren-xe` → `/en/dich-vu/xe-hop-dong/giai-tri` |
| 80% | `/en/ho-tro` → `/en/dich-vu/xe-lien-tinh/hanh-ly` |
| 77% | `/en/dich-vu/xe-lien-tinh/chon-cho-truoc` → `/en/dich-vu/xe-hop-dong/ung-dung` |

Lưu ý: mẫu 30 trang của jev lấy theo thứ tự sitemap nên lệch về trang tiếng Anh; jev không biết link đã có. Muốn dùng tiếp cho bài viết/điểm đến, chạy theo từng sitemap (`diem_den-sitemap.xml`, `bai_viet-sitemap1.xml`…) và lọc như trên.

## 2. SEO

| Vấn đề | Mức | Ghi chú |
|---|---|---|
| WP stg `blog_public = 0` → 1.094 trang `noindex`, không canonical | Đúng cho stg | **Phải bật lại khi lên haivan.com** (kèm kiểm canonical, hreflang sau khi bật) |
| 14 trang tuyến Next vẫn index được, canonical `http://14.225.206.62:8181/...` | Cao | Next không theo trạng thái stg của WP; `PUBLIC_ORIGIN` đang là IP. Lên tên miền: `PUBLIC_ORIGIN=https://haivan.com`; stg: Next cũng nên `noindex` |
| Sitemap WP dùng host trycloudflare, sitemap Next dùng `http://14.225.206.62:8181` | Cao (khi go-live) | Hai nguồn host khác nhau; chạy search-replace + đặt `PUBLIC_ORIGIN` cùng lúc (docs/deployment-guide.md) |
| hreflang có ở trang có bản EN (vd. `/`, `/chinh-sach/*`) | Tốt | 916 trang không hreflang là bài viết/tin chỉ có tiếng Việt — đúng |
| H1, meta description | Tốt | 14 trang thiếu description; H1 đủ |
| Schema | Tốt | Bài viết `BlogPosting`+Breadcrumb; tin `NewsArticle`; điểm đến `CollectionPage`; trang tuyến `Service`+`Offer`+`FAQPage`; Organization có `sameAs` |
| Bài viết dày | Tốt | trung vị 1.396 chữ, không bài nào < 300 chữ |
| Nội dung lạc chủ đề trong cụm Điện Biên | Trung bình | Nhiều bài về bưu điện/giao hàng nhanh trong `/diem-den/dien-bien/` — kéo chủ đề cụm ra khỏi "xe Hà Nội – Điện Biên" |

## 3. GEO (hiện diện trong câu trả lời AI)

| Vấn đề | Mức | Ghi chú |
|---|---|---|
| `robots.txt` chặn **mọi** bot AI kể cả bot tìm kiếm (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Google-Extended, Applebot…) | **Cao** | Do Cloudflare chèn (AI Crawl Control / managed robots) ở tầng tunnel; robots gốc của site sạch, haivan.com hiện không chặn. Khi chuyển tên miền: tắt chặn cho bot **tìm kiếm/trích dẫn**, chỉ giữ chặn bot **huấn luyện** nếu muốn |
| Thiếu `/llms.txt` (và `llms-full.txt`) | Trung bình | Tóm tắt tuyến, giá từ, giờ chạy, chính sách, hotline 1900 6763, link trang tuyến |
| FAQPage ở trang tuyến (16 câu) | Tốt | Nguồn trích dẫn tốt cho AI; nên có trên trang điểm đến |
| Thực thể doanh nghiệp | Trung bình | Có Organization; thiếu `LocalBusiness`/văn phòng, bến (địa chỉ, giờ mở cửa, toạ độ), `BusStation`/`BusTrip` cho tuyến |
| Bài viết tiếng Anh cho điểm đến | Thấp | `/en/diem-den/*` chỉ có giới thiệu, bài viết vẫn tiếng Việt → AI tiếng Anh ít nguồn |

## 4. ASO (cầu nối web → app HAIVAN, iOS `id1440552948`, Android `com.havaz_app`)

| Có | Thiếu |
|---|---|
| Link App Store / Google Play ở trang chủ, trang tuyến, trang `/dich-vu/xe-lien-tinh/ung-dung` | Smart App Banner iOS (`<meta name="apple-itunes-app" content="app-id=1440552948">`) |
| | Schema `MobileApplication` (tên, hệ điều hành, đánh giá, link store) trên trang app |
| | `/.well-known/apple-app-site-association` (Universal Links) và `/.well-known/assetlinks.json` (Android App Links) → mở thẳng app từ link tuyến/đặt vé (cần Team ID, bundle ID, SHA-256 từ team app) |
| | `manifest.webmanifest` (`related_applications`) |
| | Gắn UTM/`ct` campaign trên link store để đo nguồn tải app từ web |
| | `Applebot` đang bị chặn ở tầng Cloudflare (ảnh hưởng Siri/Spotlight, Apple Maps) |

## Ưu tiên

1. **Khi gắn haivan.com (bắt buộc):** bật `blog_public`, search-replace host, `PUBLIC_ORIGIN=https://haivan.com`, xoá cache sitemap Rank Math, tắt chặn bot AI tìm kiếm trên Cloudflare, kiểm lại canonical/hreflang bằng crawl này.
2. **Ngay trên stg:** Next `noindex` khi WP `blog_public=0` (tránh trang tuyến bị index dưới IP); tắt Email Obfuscation hoặc bỏ link email bị che.
3. **Độ sâu bài viết:** trang điểm đến làm hub có phân mục (lịch trình, ăn gì, đi lại, gửi hàng) + "bài liên quan" cùng cụm; đưa bài/tin mới lên trang chủ hoặc trang tuyến; mục tiêu ≤ 3 click.
4. **GEO:** `/llms.txt`, FAQ ở trang điểm đến, `LocalBusiness`/bến xe có địa chỉ.
5. **ASO:** Smart App Banner, `MobileApplication` schema, AASA + assetlinks (cần thông tin từ team app), UTM trên link store.
6. **Nội dung:** rà cụm Điện Biên (bài bưu điện/giao hàng), thêm 6 link tiếng Anh jev gợi ý.

## Câu hỏi chưa giải quyết

- Ai quản lý tài khoản Cloudflare của haivan.com (để tắt chặn bot AI tìm kiếm khi chuyển)?
- Team app có cung cấp Team ID / bundle ID iOS và SHA-256 Android để làm Universal Links / App Links không?
- Bài bưu điện/giao hàng trong cụm Điện Biên: giữ (phục vụ dịch vụ gửi hàng) hay chuyển sang cụm "gửi hàng"?
