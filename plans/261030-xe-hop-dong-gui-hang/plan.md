---
title: "Trang Xe hợp đồng + Gửi hàng (v2, lead về Zalo)"
status: completed
created: 2026-10-30
---

# Trang Xe hợp đồng và Gửi hàng (design system v2)

## Khung mục tiêu

- **Kết quả cần có:**
  1. `/dich-vu/xe-hop-dong`: trang kể chuyện v2. Khách điền nhu cầu, trang dựng sẵn nội dung tin nhắn rồi mở Zalo để gửi.
  2. `/dich-vu/hang-hoa`: trang chuyên gửi hàng cho 4 tuyến Điện Biên, Mộc Châu, Sơn La, Vũng Tàu. Cũng dẫn lead về Zalo.
- **Ràng buộc:**
  - Chỉ dùng số liệu có nguồn: các trang cũ, mã booking.haivan.com (`gui-hang-*`, `north-brand-sections`, `hanoi-routes`), brief thuê bao.
  - Chữ sửa được trong WP (`inc/v2-story.php`). Dùng lại thành phần v2.
  - Không ghi gì lên production.
- **Không làm:**
  - Không lưu lead vào cơ sở dữ liệu, không gửi lead sang Telegram.
  - Không tính cước tự động.
  - Không đổi trang tra cứu đơn.
- **Điều kiện hoàn thành:**
  - Cả hai trang trả 200 ở vi và en, có 1 H1, không tràn ngang.
  - Form tạo đúng nội dung tin nhắn và mở đúng OA: tuyến Tây Bắc mở `zalo.me/haivanxuantrang`, miền Nam mở `zalo.me/708526450733753395`.
  - Menu và footer trỏ đúng tới hai trang.
  - layout-audit không có lỗi.

## Nguồn dữ liệu

- **Zalo:**
  - Miền Nam: `https://zalo.me/708526450733753395` (HV_QR_BOOKING `inc/niche-shared.php`).
  - Tây Bắc: `https://zalo.me/haivanxuantrang` (`hanoi-routes.php`).
- **Gửi hàng Vũng Tàu:**
  - Cước: bì thư từ 30k, kiện 40×60 từ 40k, kiện 50×70 từ 50k, hàng cồng kềnh báo giá riêng.
  - Xe chạy 15 phút/chuyến.
  - 4 phòng chờ, mở 5h–22h.
- **Gửi hàng Tây Bắc:**
  - Hàng tới nơi sau 4–12 tiếng.
  - Giao nhận tại 01 Nguyễn Hoàng (Mỹ Đình) và 254 Trần Huy Liệu (Mộc Châu).
  - Có xe tải tới 8 tấn.
- **Xe hợp đồng:**
  - Gần 250 xe từ 7 đến 45 chỗ, gần 1.000 lái xe.
  - Giá tham khảo tuyến Sài Gòn – Vũng Tàu (brief thuê bao): 1 chiều 2,2tr, khứ hồi 3,8tr, 2 ngày 1 đêm 4,8tr. Giá này cần anh xác nhận.

## Các bước

1. Thêm thành phần dùng chung `hv2_zalo_lead()` (PHP) và phần JS trong `v2.js`.
2. Khai báo nội dung hai trang trong `hv2_story_schemas()` (vi/en).
3. Tạo `page-xe-hop-dong.php` và `page-hang-hoa.php`, viết CSS cho các thành phần mới trong `v2.css`.
4. Đăng hai trang nháp (ID 14/15 và 12/13). Sửa link menu, footer và thẻ dịch vụ ở trang chủ.
5. Kiểm tra: lint PHP, chụp ảnh trang, chạy layout-audit, thử form; cho agent review code. Sau đó commit.

## Kết quả (30/10/2026)

- Đã làm xong các bước 1–5.
  - Đăng hai trang 14/15 và 12/13 trên WP local. Trang 12 đổi tên thành "Gửi hàng" / "Parcel delivery".
  - Menu DB (75/76) và seed đã trỏ tới hai trang mới.
- **Kiểm tra:**
  - layout-audit chạy 8 trang × 2 khổ màn hình: không có lỗi.
  - Playwright: OA mở đúng theo vùng, tin nhắn chép đúng; khi không chép được thì form hiện sẵn tin nhắn; số điện thoại để trống bị chặn.
  - Agent review: không có lỗi critical. Đã sửa H1, M1, M2, M4. M3 cần anh quyết.
- **Còn mở:**
  - Bảng giá xe hợp đồng lấy từ brief, chưa có ai xác nhận.
  - Menu trên DB production phải cập nhật tay hoặc chạy lại seed.
  - Mục "Tra cứu hàng hoá" không còn trong menu, chỉ còn vào được từ trang Gửi hàng.
