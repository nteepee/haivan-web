# Kết quả: Route SEO v3 + micro UI (15/11/2026)

Status: xong trên local, chưa lên stg, chưa commit.

## Đã làm

**Nội dung 15 trang tuyến** (2 script wp-cli, chạy lặp lại an toàn; đã chạy 2 lần trên WP local, lần 2 không đổi gì)
- `wordpress/scripts/route-copy-v3-south.php`: 4 tuyến Vũng Tàu. Hai tuyến sân bay trước đây là trang mỏng, nay đủ bố cục (quầy T1/T2/T3, hành lý, chuyến bay trễ, 14 câu FAQ).
- `wordpress/scripts/route-copy-v3-north.php`: 9 tuyến Bắc + 2 chiều về mới (Bản Phủ → Mỹ Đình, Mường Chà → Mỹ Đình). Yên Nghĩa, Bản Phủ, Mường Chà dựng đủ bố cục.
- Lệnh chạy: `cd wordpress && docker compose --profile tools run --rm -T wpcli eval-file /scripts/route-copy-v3-<south|north>.php`. Có `HV_DRY_RUN=1` để chỉ xem trước, `HV_ONLY=a/b` để chạy một tuyến.
- Kiểm tra qua REST local:
  - Không còn "Mường Trà", "Bán Phủ", "thuật tiện", "dưới 6 tuổi", "cam kết hoàn", "21h00", tên hạng cũ.
  - Cả 15 trang có link chính sách `/chinh-sach/quy-che` và link đăng ký "Tôi yêu Hải Vân".
- Đã áp quyết định của anh vào nội dung:
  - Hạng Royal/Luxury/Eco.
  - Chuyến cuối 21h45.
  - Trẻ em 6+ tuổi hoặc trên 25 kg phải mua ghế riêng.
  - Tích điểm 10% có điều kiện.
  - Trung chuyển bệnh viện; trả tận nơi ở Sơn La và Mộc Châu.
  - Đi xe miễn phí cho người bệnh tại Điện Biên, Mộc Châu – Sơn La.
- Không nên chạy lại `seed-route-landing.php` với `HV_FORCE=1`, vì sẽ đè nội dung v3.

**Next**
- **Tiêu đề khối theo tỉnh/thành:** "Sài Gòn", "Hà Nội" thay cho "Quận 1", "Quận 1 Sân Bay".
- **2 chiều về mới:** có trong `generateStaticParams` và sitemap, chỉ khi WP có bài.
- **Tên hạng trên thẻ chuyến:** đổi thành Royal / Luxury / Eco ở cả bản tiếng Việt và tiếng Anh.
  - "Giá từ" của từng hạng giờ khớp qua mã hạng (ROYAL / LUXURY / ECONOMY), vì ERP vẫn trả tên cũ "Cao cấp / Tiết kiệm / Siêu rẻ".
  - Luật giá vẫn đọc tên gốc, không bị ảnh hưởng.
- **Giá/combo/ưu đãi từ WP:** WP báo Next qua `POST /api/hv/revalidate` ngay khi lưu ưu đãi, combo hoặc luật giá.
  - Lần xem kế tiếp đọc dữ liệu mới, kể cả ở bước thanh toán.
  - Nếu WP không gọi được Next thì Next tự làm mới sau tối đa 60 giây (trước là 5–15 phút).
  - Cần `HV_REVALIDATE_SECRET` hoặc `HV_WP_SHARED_SECRET` ở cả hai phía, và `HV_NEXT_INTERNAL_URL` trên WP.

**Trang chủ WP** (theme lên 1.10.28)
- **Bỏ khối "Chuyện có thật".**
- **Thêm khối "Hành khách nói gì về Hải Vân":**
  - 5 đánh giá Google thật, lấy từ trang booking Sài Gòn – Vũng Tàu.
  - Điểm 4,6/5 trên 87 đánh giá, kèm link Google Maps.
  - Sửa được trong WP: Cài đặt → Đánh giá trang chủ.
  - Không thêm schema đánh giá, vì Google bỏ qua đánh giá doanh nghiệp tự đăng.
- **Màu chữ vàng tiêu đề lớn:** đổi `#8A6500` (ngả ô liu) → `#A87800` (hổ phách, gần vàng brand hơn).
  - Độ tương phản 3,3–3,9:1 trên mọi nền sáng, đạt chuẩn chữ lớn.
  - Chữ nhỏ giữ `#8A6500` (4,9:1).
  - Áp dụng ở cả theme và Next.

**`/bus-app/<id>`**
- Đi qua `haivan-app.onelink.me/BX9S/<id>` như web cũ, để AppsFlyer vẫn ghi lượt quét theo xe.
- Không có id thì chuyển thẳng sang store theo thiết bị.
- noindex, không cache.

## Kiểm tra
- typecheck, lint: qua.
- `next build`: qua.
- test: 634 qua, 2 lỗi có từ trước. Hai lỗi nằm ở `src/price-rules/*`, do theme thiếu thư mục `price-rules/` (nằm ở nhánh backup).
- `php -l` mọi file PHP đã sửa: sạch.
- Chưa xem giao diện thật: WP local đang để `siteurl` là một tunnel cũ đã chết, nên chưa chụp được màn hình.

## Còn lại / ngoài phạm vi
- Thẻ "Ưu đãi hôm nay" `hv_offer` trên trang chủ WP vẫn cũ tối đa 5 phút, do page cache của nginx.
- "Giá từ" lấy từ ERP (không phải WP) cũ tối đa 1 giờ.
- Lịch chạy Mộc Châu – Sơn La còn hạng PREMIUM ("Cao cấp" 24 chỗ) và BASIC ("Phổ thông" 34 chỗ) của Xuân Tráng; chưa ghép sang Royal / Luxury / Eco.

## Câu hỏi chưa giải quyết
1. Trang tuyến cũng có khối "Chuyện có thật" (bồi hoàn vé máy bay). Agent đã để trống ở 4 tuyến Vũng Tàu. Có bỏ ở mọi tuyến không?
2. Giờ có mặt trước chuyến: 15 phút (bản cũ) hay 30 phút (Quy chế)?
3. Tuyến Sơn La có limousine không? Doc có ghi, nhưng lịch chạy 16/11 không có.
4. Bản Phủ, Mường Chà, Yên Nghĩa: tiêu đề khối giữ tên bến hay đổi thành "Hà Nội"?
5. Khi WP sập, thanh toán vẫn dùng mã/luật gần nhất (cũ tối đa 1 giờ) như hiện nay, hay tạm từ chối tự áp mã?
6. Trang "Đánh giá của khách hàng" (14 đánh giá có tên) có phải đánh giá thật để đưa lên trang chủ không?
