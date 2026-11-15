# Web gốc haivan.com: phần chưa port và checklist SEO 13 tuyến (15/11/2026)

## Kết luận

- **Port từ web gốc:** mọi trang công khai của haivan.com đã có trên stg, hoặc được chuyển 301 sang trang tương ứng. Còn thiếu `llms.txt`.
- **Checklist SEO 13 tuyến** (sheet ngày 10/11 kèm 13 doc): **chưa áp dụng gì lên stg**. Title, meta và FAQ trên stg vẫn y như bản chụp trong doc.

## 1. llms.txt của haivan.com

Bản gốc lưu tại [haivan-com-llms-261115.txt](haivan-com-llms-261115.txt). File có các phần:

- Thông tin thương hiệu và pháp nhân.
- Tuyến trọng điểm Sài Gòn – Vũng Tàu.
- 9 tuyến mua vé.
- Trang giới thiệu, quy chế.
- Link app và mạng xã hội.

Khi đưa sang web mới, bản gốc có mấy chỗ cần sửa:

- **Thiếu tuyến:** chưa có 4 tuyến mà stg đã có: `dien-bien/my-dinh`, `my-dinh/moc-chau`, `moc-chau/my-dinh`, `son-la/my-dinh`.
- **Link hỏng ngay trên web gốc:**
  - `/sitemap.xml` trả 404 (còn ghi chú "[XÁC NHẬN …]").
  - `/tuyen-duong` trả 404 trên web gốc; trên stg thì chuyển 301 về `/xe-khach`.
- **Chưa có nội dung web mới:** trang điểm đến, chính sách hủy/hoàn, trang hỗ trợ.

Đề xuất: WordPress tự sinh `/llms.txt` từ danh sách tuyến, điểm đến và chính sách, giống cách theme đang sinh `robots.txt` trong `inc/seo.php`. Như vậy file không lệch khi thêm tuyến. Nginx đã chuyển `/llms.txt` sang WordPress qua `location /`, nên không cần đổi cấu hình.

## 2. Đối chiếu đường dẫn web gốc và stg

Danh sách trang lấy từ build manifest của haivan.com: 44 trang công khai cùng mẫu bài tin tức và điểm đến.

| Nhóm | Kết quả trên stg |
|---|---|
| `/chung-toi/*` (10 trang), `/chinh-sach/*` (5), `/dich-vu/*` (14), `/ho-tro`, `/ho-tro/huong-dan-thanh-toan`, `/diem-den`, `/dat-ve-nhanh`, `/tracking`, `/xe-khach`, `/xe-san-bay` | Đều trả 200 |
| Mẫu 8 bài tin tức và 8 trang điểm đến trên web gốc | Đều trả 200 |
| `/tuyen-duong/*` (6 trang) | 301 về đúng trang tuyến; Đà Lạt, Hà Giang, Sa Pa về `/xe-khach` |
| `/ho-tro/thanh-toan-viettel`, `/mobile`, `/haivanplus` | 301 (HAIVANplus bỏ theo quyết định trước) |
| `/bus-app/[id]` | 404. Đây là trang con của app; cần hỏi team app xem link này có còn được dùng không |
| `/llms.txt` | **404, chưa port** |

Ngoài ra: đường dẫn viết hoa như `/diem-den/Da-lat` trả 200, không chuyển về chữ thường. Sau khi bật index sẽ thành trang trùng; cần kiểm tra lại canonical khi gắn tên miền thật.

## 3. Checklist SEO 13 tuyến

Nguồn: sheet "Từ khóa mua vé và audit 13 landing page — 10.11.2026" (3 tab: 13 tuyến, 634 từ khóa, audit từng tuyến) và 13 doc kèm comment. Chi tiết từng tuyến ở [seo-261115-1449-route-docs-vs-stg-detail.md](seo-261115-1449-route-docs-vs-stg-detail.md).

| Tuyến | Mức | Việc chính |
|---|---|---|
| quan-1/vung-tau, vung-tau/quan-1-san-bay | Có nền, tách ý định | Title/meta mới; H2 dùng "Sài Gòn"; tách phần sân bay sang trang sân bay |
| tan-son-nhat/vung-tau | Trang gần trống (156 chữ, không có FAQ) | Thêm hướng dẫn đón tại quầy T1/T2/T3, hành lý, xử lý khi chuyến bay trễ, FAQ |
| vung-tau/tan-son-nhat | Sửa nội dung sai chiều | Description lẫn Quận 1; FAQ viết ngược chiều; 9 câu chính sách cũ nằm trong FAQPage |
| my-dinh/dien-bien, dien-bien/my-dinh | Làm rõ phạm vi | Bỏ "trung chuyển miễn phí 10 bệnh viện", "xe tải 8 tấn"; thống nhất tên hạng xe |
| yen-nghia/dien-bien | Viết lại FAQ | Description có văn mẫu và lỗi "thuật tiện"; giờ chạy dễ hiểu nhầm |
| my-dinh/ban-phu | Thêm nội dung riêng | FAQ ghi "Bán Phủ" và thời gian của tuyến khác; thiếu địa chỉ điểm trả |
| my-dinh/muong-cha | **Sửa địa danh** | Title/meta ghi "Mường Trà" |
| my-dinh/moc-chau, moc-chau/my-dinh | Đồng bộ | Title thêm "Xuân Tráng"; bỏ "trả tận homestay"; thời gian chạy đang mâu thuẫn ngay trên trang |
| my-dinh/son-la, son-la/my-dinh | Đồng bộ | Title theo "Hà Nội"; bỏ "trả tận nơi"; câu trung chuyển bệnh viện có vẻ chép nhầm từ tuyến Điện Biên |

**Vấn đề chung:**

- Câu chính sách cũ trong FAQPage của các tuyến 04, 07, 08, 09 cần bỏ để Google không hiển thị chính sách sai:
  - "cam kết hoàn tiền"
  - "trẻ dưới 6 tuổi miễn phí"
  - "tích điểm 10%"
  - "trễ giờ không hoàn tiền"
- Sheet cũng ghi các trang tuyến đang index được trên IP, canonical trỏ IP. Việc này trùng với báo cáo cấu trúc trước ([seo-261115-1311-site-structure-seo-geo-aso.md](seo-261115-1311-site-structure-seo-geo-aso.md)).
- Chưa có trang chiều về cho 3 tuyến: Điện Biên → Yên Nghĩa, Bản Phủ → Mỹ Đình, Mường Chà → Mỹ Đình. Cần xác nhận các chuyến này đang bán rồi mới làm.

**Sửa ở đâu:**

- Nội dung trang tuyến là bài WordPress loại `hv_route`. Next đọc qua `apps/booking/src/lib/route-landing.ts` và dựng trang bằng `route-landing-build.ts`.
- 8 tuyến chính có file seed: `wordpress/scripts/lib/route-landing-seed*.php`. Muốn ghi đè phải chạy với `HV_FORCE=1 HV_ONLY=<slug>`.
- 5 tuyến phụ (03, 04, 07, 08, 09) chỉ có trong cơ sở dữ liệu, nên phải sửa trong WP admin hoặc bằng script wp-cli.

**Có thể làm ngay, không cần vận hành xác nhận:**

- Title và meta mới cho cả 13 tuyến.
- Sửa "Mường Trà" thành "Mường Chà", "Bán Phủ" thành "Bản Phủ".
- Sửa lỗi chính tả "thuật tiện".
- Đổi tên H2 theo tỉnh, thành phố.
- Bỏ các câu chính sách cũ khỏi FAQ.

**Cần vận hành xác nhận trước khi viết lại:**

- Trung chuyển bệnh viện; trả tận nơi ở Sơn La và Mộc Châu.
- Chuyến cuối từ Vũng Tàu: 21h00 hay 21h45.
- Thời gian chạy Vũng Tàu – Tân Sơn Nhất và Mộc Châu – Hà Nội.
- Tên hạng xe tuyến Điện Biên.
- Chính sách đổi/hoàn vé, trẻ em, tích điểm.
- Thẻ đi xe miễn phí cho người bệnh.

## Câu hỏi chưa giải quyết

- Các comment trong 13 doc đều đang mở. Đó là bản đã chốt hay còn chờ duyệt?
- 5 tuyến trang mỏng có dựng đủ bố cục mới như 8 tuyến chính không, hay chỉ sửa title, meta và FAQ?
- Ai bên vận hành xác nhận các dữ kiện đang mâu thuẫn và chính sách vé?
- `/bus-app/[id]` của web gốc có còn được app dùng không?
