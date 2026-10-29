# Tech stack & ràng buộc (đã duyệt 2026-10-28)

## Thoả thuận ban đầu
- **Kết quả:** dựng lại web haivan.com: trang nội dung do MKT tự sửa + luồng đặt vé xe khách chạy dữ liệu thật.
- **Phạm vi:** xe khách + tài khoản (OTP, vé của tôi, huỷ, hồ sơ) + nội dung CMS (tuyến đường, điểm đến, tin tức, khuyến mãi).
- **Ràng buộc cứng:** luồng đặt vé **giống web haivan.com hiện tại** (bước, API, trường dữ liệu, điều kiện, thông báo), không theo luồng booking.haivan.com (khách vãng lai + api.ta).
- **Ràng buộc khác:** chỉ dữ liệu thật; lỗi hiển thị đúng thông báo backend; token chỉ gửi tới apigw; không thao tác ghi production khi chưa được duyệt; không commit bí mật.
- **Ngoài phạm vi:** giống từng pixel; thông báo đẩy; xe sân bay, xe hợp đồng, CPN, trung chuyển riêng lẻ (đợt sau).
- **Nghiệm thu:** build/typecheck/test đạt; smoke chỉ đọc (tìm chuyến, sơ đồ ghế); test hợp đồng cho API ghi; MKT sửa được trang nội dung trong WP admin.

## Quyết định stack
| Phần | Chọn | Ghi chú |
|---|---|---|
| Nội dung (MKT) | WordPress, Flatsome child theme, Polylang (vi/en), Rank Math | Tham khảo nền `HV_QR_BOOKING` (booking.haivan.com); không chép bí mật/token |
| Đặt vé | Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui | Route handler làm BFF: token trong cookie httpOnly, chỉ gắn `Authorization` khi gọi apigw |
| State | TanStack Query (server state), zustand → sessionStorage (nháp booking), RHF + zod | zod parse response apigw/CMS |
| Bản đồ | Leaflet + react-leaflet (lazy) | Cần chọn nhà cung cấp tile |
| Test | Vitest + MSW (chặn mọi request chưa stub), Testing Library, Playwright (mock luồng ghi), smoke GET-only bật bằng env | |
| Công cụ | pnpm 10, Node 22, Docker cho WP local | |

## Luồng đặt vé (nguồn sự thật)
- Hợp đồng đã kiểm chứng: `web-vs-app-flow-parity.md` (thư mục ghi chú chung) + `plans/reports/researcher-261028-integration-specifics.md`.
- Đặc tả chi tiết sau REA đầy đủ + chạy thật: `docs/booking-flow-spec.md` (chỉ mục) và `docs/booking-flow/00–03`.

## Bối cảnh & domain (anh xác nhận 2026-10-28)
- haivan.com là bộ mặt Hải Vân nhưng web cũ lâu nay không ai bảo trì/sửa được; anh giữ **domain**, không có mã nguồn web cũ. Hạ tầng backend (apigw, cms, cpn) là của Hải Vân, giống trường hợp app Android → web mới dựng lại từ REA + chạy thật.
- Web mới **thay thế trên chính domain haivan.com**:
  - reCAPTCHA: dùng lại site key công khai của web cũ (gắn domain haivan.com; backend kiểm bằng secret phía Hải Vân) → `api/get-otp` chạy được trên haivan.com. Local/staging không qua captcha trừ khi domain nằm trong danh sách của key → test đăng nhập thật trên domain chính hoặc staging được phép.
  - `return_url` VNPay về `https://haivan.com/xe-khach/thanh-toan…` như cũ.
- Giữ nguyên URL cũ (SEO): `/xe-khach/[start]/[end]`, `/xe-khach/tim-chuyen`, `/xe-khach/xac-nhan`, `/xe-khach/thanh-toan`, `/xe-khach/thanh-toan/thanh-cong`, `/tai-khoan/...`, trang CMS.
- Lỗi web gốc: **giữ nguyên hợp đồng API** (request/response backend đang nhận, kể cả `is_combo`), **sửa lỗi thuần giao diện** (số "0" lạc, giữ header `Domain`, tự giữ chỗ lại sau đăng nhập…). Thay đổi chạm hợp đồng (mã hoá `get-otp`, bỏ `utm_source:"null"`, giữ `Domain`) đã duyệt; đăng xuất không gọi `api/logout` (giống web cũ).
- Thiết kế: bám giao diện haivan.com hiện tại, không làm wireframe → `docs/design-guidelines.md`.

## Còn mở
1. Cách nối WP ↔ Next trên cùng domain (nginx theo path: `/xe-khach/*`, `/tai-khoan/*` → Next; còn lại → WP).
2. Hosting (VPS nào, ai quản trị DNS haivan.com).
3. Staging domain cho test đăng nhập.

## Quyết định 2026-10-28: nội dung biên tập chuyển hết sang WordPress
- CMS (cms.haivan.com) đang chứa khoảng 800 bài điểm đến (`/diem-den/<điểm>/<slug>`, có bài do "Content Agent" viết tới 12/2025) và khoảng 180 tin tức công ty (mới nhất 02/2026). Bản chụp web cũ chỉ có 108 bài điểm đến → phải nhập từ API công khai của CMS.
- Anh chọn **chuyển hết sang WordPress**:
  - Bài viết, tin tức, điểm đến, ưu đãi từ nay viết trong WordPress.
  - Bộ đồng bộ CMS → WP chạy lại được cho tới ngày cutover rồi dừng.
  - Công cụ đang ghi vào CMS (Content Agent…) phải chuyển sang WP REST.
- CMS vẫn chạy cho API đặt vé mà Next dùng (`route-listing`, `list-banner`…).
