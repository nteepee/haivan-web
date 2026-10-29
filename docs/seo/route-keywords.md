# Từ khoá và nội dung trang tuyến (bàn giao MKT)

> **Trạng thái:** bàn giao 29/10/2026. Title, H1 và tỷ lệ link là **đề xuất** lấy từ audit SEO, chưa được chủ dự án duyệt.
> Giá, giờ chạy, điểm đón và mọi số liệu vận hành do MKT điền và xác nhận; tài liệu này không chứa số liệu đó.

## Dùng tài liệu này

- **Đối tượng:** đội MKT viết và sửa nội dung trang tuyến.
- **Sửa ở đâu:** WordPress → **Tuyến phổ biến** (`hv_route`) → hộp **Nội dung trang tuyến**. Nhãn từng trường, giới hạn ký tự và định dạng từng dòng nằm trong `wordpress/wp-content/themes/haivan-web-child/inc/route-meta.php`. Hợp đồng dữ liệu: `docs/route-landing-contract.md`.
- **Một hướng đi = một bài `hv_route`** với đường dẫn `a/b` riêng.
- **Điều kiện có nội dung:** trang tuyến lấy dữ liệu từ danh sách tuyến (`apps/booking/src/content/popular-routes.json`, cùng cấu hình tuyến chính của Next) và từ bài `hv_route` xuất bản. Dev quản lý phần danh sách. Tuyến chưa được khai báo sẽ là trang trống và noindex. Cần báo Dev trước khi viết bài. Nguồn: `apps/booking/src/app/[lang]/xe-khach/[start]/[end]/page.tsx`.
- **Ngôn ngữ:** chỉ tiếng Việt. Bản `/en` chưa có nội dung nên không index.

## 1. Vai trò từ khoá theo tuyến

Quy tắc: mỗi cặp tuyến có một trang chiều đi (trang chính) và một trang chiều về (trang phụ). Từ khoá không ghi chiều, ví dụ "xe đi Vũng Tàu", chỉ đặt ở trang chiều đi. Trang chiều về không dùng từ khoá chính của chiều đi trong title, H1 hoặc anchor.

| Đường dẫn | Chiều | Vai trò | Title đề xuất (≤ 60 ký tự) | H1 đề xuất | Từ khoá chính | Tỷ lệ link nội bộ |
|---|---|---|---|---|---|---|
| `my-dinh/moc-chau` | Hà Nội → Mộc Châu | Chính (đi) | Xe đi Mộc Châu từ Mỹ Đình: giờ chạy, giá vé \| Hải Vân | Đặt vé xe Hà Nội đi Mộc Châu (Mỹ Đình) | Xe đi Mộc Châu; Xe đi Hà Nội - Mộc Châu; Xe khách Mỹ Đình Mộc Châu; Xe limousine Hà Nội Mộc Châu | 75% |
| `moc-chau/my-dinh` | Mộc Châu → Hà Nội | Phụ (về) | Xe Mộc Châu về Hà Nội (Mỹ Đình): giờ chạy, giá vé \| Hải Vân | Đặt vé xe Mộc Châu về Hà Nội (Mỹ Đình) | Xe Mộc Châu về Hà Nội; Xe khách Mộc Châu Mỹ Đình | 25% |
| `quan-1/vung-tau` | Quận 1 → Vũng Tàu | Chính (đi) | Xe đi Vũng Tàu từ Quận 1: giờ chạy, giá vé \| Hải Vân | Xe đi Vũng Tàu từ Quận 1 Sài Gòn | Xe đi Vũng Tàu; Xe limousine Sài Gòn Vũng Tàu; Xe Quận 1 đi Vũng Tàu | 70% |
| `vung-tau/quan-1-san-bay` | Vũng Tàu → Quận 1 | Phụ (về) | Xe Vũng Tàu đi Sài Gòn (Quận 1): giờ chạy, giá vé \| Hải Vân | Xe Vũng Tàu đi Sài Gòn (Quận 1) | Xe Vũng Tàu đi Sài Gòn; Xe limousine Vũng Tàu về Quận 1 | 30% |
| `tan-son-nhat/vung-tau` | Sân bay Tân Sơn Nhất → Vũng Tàu | Chính (đi từ sân bay) | Xe sân bay Tân Sơn Nhất đi Vũng Tàu: giờ chạy \| Hải Vân | Xe sân bay Tân Sơn Nhất đi Vũng Tàu | Xe sân bay Tân Sơn Nhất đi Vũng Tàu; Xe limousine Tân Sơn Nhất Vũng Tàu | Chia theo từ khoá "sân bay / Tân Sơn Nhất" (audit không đưa %). [anh chốt] |
| `vung-tau/tan-son-nhat` | Vũng Tàu → sân bay Tân Sơn Nhất | Phụ (về, ra sân bay) | Xe Vũng Tàu đi sân bay Tân Sơn Nhất: giờ chạy \| Hải Vân | Xe Vũng Tàu đi sân bay Tân Sơn Nhất | Xe Vũng Tàu đi sân bay Tân Sơn Nhất; Xe Vũng Tàu Tân Sơn Nhất | Như trên. [anh chốt] |
| `my-dinh/son-la` | Hà Nội → Sơn La | Chính (đi) | Xe đi Sơn La từ Mỹ Đình: giờ chạy, giá vé \| Hải Vân | Đặt vé xe Hà Nội đi Sơn La | Xe đi Sơn La; Xe khách Hà Nội Sơn La; Xe giường nằm Mỹ Đình Sơn La | 75% |
| `son-la/my-dinh` | Sơn La → Hà Nội | Phụ (về) | Xe Sơn La về Hà Nội (Mỹ Đình): giờ chạy, giá vé \| Hải Vân | Đặt vé xe Sơn La về Hà Nội | Xe Sơn La về Hà Nội; Xe khách Sơn La Mỹ Đình | 25% |
| `my-dinh/dien-bien` | Hà Nội → Điện Biên | Chính (đi) | Xe đi Điện Biên từ Mỹ Đình: giờ chạy, giá vé \| Hải Vân | Đặt vé xe Hà Nội đi Điện Biên | Xe đi Điện Biên; Xe khách Hà Nội Điện Biên; Xe giường nằm Mỹ Đình Điện Biên | 75% |
| `dien-bien/my-dinh` | Điện Biên → Hà Nội | Phụ (về) | Xe Điện Biên về Hà Nội (Mỹ Đình): giờ chạy, giá vé \| Hải Vân | Đặt vé xe Điện Biên về Hà Nội | Xe Điện Biên về Hà Nội; Xe khách Điện Biên Mỹ Đình | 25% |
| `yen-nghia/dien-bien` | Yên Nghĩa → Điện Biên | Phụ, điểm đi khác (không nhận "xe đi Điện Biên") | Xe khách Yên Nghĩa đi Điện Biên: giờ chạy, giá vé \| Hải Vân | Xe khách Yên Nghĩa đi Điện Biên | Xe khách Yên Nghĩa đi Điện Biên | Audit không đưa %. [anh chốt] |

Ghi chú bảng:
- Title đề xuất đã rút gọn để ≤ 60 ký tự, đúng khuyến nghị của hộp nội dung. Title trong audit dài 65–79 ký tự nên bị cắt trên kết quả tìm kiếm; bản trong bảng giữ từ khoá chính.
- Tỷ lệ là phần link từ hub và bài điểm đến đổ về từng cặp, không phải tỷ lệ nội dung.
- Tuyến Yên Nghĩa là điểm đi khác với Mỹ Đình. Không dùng "xe đi Điện Biên" làm title hay H1 của trang này, để trang chính Mỹ Đình → Điện Biên giữ từ khoá đó.
- Nếu trường "Tiêu đề SEO" dùng khuôn `Xe {A} đi {B} – Vé từ {giá} | Hải Vân` (trong hợp đồng), vẫn nên ≤ 60 ký tự.

## 2. Nội dung hai chiều khác nhau (≥ 60%)

Hai trang của cùng cặp phải khác nhau ít nhất 60% nội dung chính để tránh trùng lặp. Ba cách làm dưới đây là yêu cầu của audit.

- **Thứ tự điểm đón.** Điểm đầu tiên là điểm xuất phát của chiều đó. Trường "Điểm đón" có dòng đầu tiên được dùng vào mô tả SEO mẫu, nên nhập đúng thứ tự. Ví dụ trang Vũng Tàu → Quận 1 liệt kê điểm đón ở Vũng Tàu trước, kèm khu vực xe trung chuyển đón tại Vũng Tàu.
- **FAQ khác nhau.** Ít nhất 4 trong 5 câu khác chiều ngược lại. Chiều từ tỉnh về Hà Nội hoặc Sài Gòn tập trung vào giờ đến nơi sáng sớm và khả năng kịp giờ khám hoặc giờ bay. Ví dụ câu hỏi nêu trong audit: "Xe về tới Hà Nội/Sài Gòn lúc mấy giờ sáng?". Trả lời là văn bản thuần.
- **Chiều ngược lại.** Mọi cặp phải điền trường "Chiều ngược lại". Vị trí hiển thị do Dev quyết định; MKT chỉ điền dữ liệu.
- **Không sao chép đoạn giữa hai trang.** Thông tin pháp lý và hotline lấy từ bảng thống nhất trong `legal-consistency.md`, không tự viết khác nhau.

Cách đo "≥ 60%": repo chưa có công cụ đo. MKT đo thủ công bằng cách đếm đoạn, câu FAQ và điểm đón khác nhau giữa hai trang. Phương pháp đo cần chốt (xem mục Cần chốt).

## 3. Brief cho trang mỏng

Các trang dưới đây có ít nội dung hoặc chưa có. Số chữ theo audit, đo ngày 29/10/2026, chưa đo lại.

- **Mốc độ dài:** ≥ 1.000 chữ mỗi trang. Audit ghi các trang tuyến đã có nội dung đạt 1.148–1.258 chữ, nên mốc này nằm trong khoảng đó.
- **Cấu trúc mỗi trang:**
  1. Đoạn mở đầu, 1–2 câu (trường "Đoạn mở đầu").
  2. Giờ chạy và giá vé (trường "Đoạn dưới tiêu đề Giờ chạy và giá vé"). Lịch chuyến lấy từ hệ thống, không gõ tay.
  3. Điểm đón hoặc điểm trả (trường "Điểm đón").
  4. Văn phòng và phòng chờ (trường "Văn phòng / phòng chờ").
  5. Hạng xe (trường "Hạng xe").
  6. Nội dung chính (trường "Nội dung chính"): thuận tiện của tuyến, chuẩn bị trước giờ xe chạy, trung chuyển.
  7. FAQ: 5 câu, ít nhất 4 câu khác chiều ngược lại.
  8. Chiều ngược lại, tuyến liên quan, ghi chú khứ hồi (nếu có).

| Đường dẫn | Hiện trạng (audit) | Cần viết thêm | MKT điền (dữ kiện) |
|---|---|---|---|
| `tan-son-nhat/vung-tau` | 363 chữ; chưa có đoạn giới thiệu, FAQ, điểm đón | Đoạn mở đầu; điểm đón tại từng nhà ga; chuyến sớm; FAQ về chuyến sớm nhất và đổi chuyến khi bay trễ | Giờ xe sớm nhất và muộn nhất; giờ đến Vũng Tàu dự kiến; vị trí quầy từng nhà ga (xem `legal-consistency.md`, mục điểm đón ga T1); giá từ; thời gian di chuyển; cách đổi và huỷ |
| `vung-tau/tan-son-nhat` | 651 chữ; có 3 FAQ | Điểm đón tại Vũng Tàu lên đầu; điểm trả ở sân bay; FAQ khác ít nhất 4/5 câu so với trang đi | Giờ xe từ Vũng Tàu; địa chỉ điểm đón Vũng Tàu; điểm trả từng nhà ga; giá từ |
| `yen-nghia/dien-bien` | 653 chữ; không có FAQ; chưa có bài seed riêng | Mô tả đường đi từ Yên Nghĩa đến Điện Biên; điểm đón Yên Nghĩa; FAQ | Địa chỉ bến Yên Nghĩa; thời gian và độ dài đường đi; giờ chạy; giá từ; khu vực trung chuyển |
| `moc-chau/my-dinh` | Chưa có nội dung; không có H1 | Toàn bộ 8 mục | Địa chỉ điểm đón Mộc Châu; giờ xe; giá từ; thời gian; điểm trả Mỹ Đình |
| `my-dinh/moc-chau` | Chưa có nội dung; không có H1 | Toàn bộ 8 mục; không dùng lại đoạn của tuyến Sơn La | Điểm đi Mỹ Đình (01 Nguyễn Hoàng); giờ xe; giá từ; địa chỉ điểm dừng Mộc Châu; điểm trả Mộc Châu |
| `son-la/my-dinh` | Chưa có nội dung (tạo mới) | Toàn bộ 8 mục | Điểm đón Sơn La (khu vực đón tận nơi, bến xe); giờ xe; giá; điểm trả Mỹ Đình |
| `dien-bien/my-dinh` | Chưa có nội dung (tạo mới) | Toàn bộ 8 mục | Điểm đón Điện Biên (bến xe hay văn phòng); giờ xe; điểm trả Mỹ Đình; trung chuyển bệnh viện (chỉ ghi số bệnh viện đã xác nhận cho tuyến này) |
| `my-dinh/son-la` (ngoài nhóm trên) | 1.148 chữ | Gỡ đoạn và văn phòng Mộc Châu khỏi nội dung Sơn La | Xác nhận điểm dừng Mộc Châu có thuộc tuyến Sơn La không (xem `legal-consistency.md`) |

Dữ kiện MKT điền cho mọi trang:
- Giá từ theo hạng xe. [MKT điền]
- Giờ xuất bến và giờ đến dự kiến theo từng chiều. [MKT điền]
- Điểm đón, điểm trả, địa chỉ và giờ mở phòng chờ. [MKT điền]
- Số hotline hiển thị, dùng đúng số đã chốt trong `legal-consistency.md`. [MKT điền]
- Thời gian di chuyển. [MKT điền]
- Chính sách đổi, huỷ và hành lý theo quy định hiện hành. [MKT điền]
- Ảnh xe và phòng chờ, đường dẫn `/assets/...` hoặc https. [MKT điền]

Đối chiếu, không chép số: `docs/reference/route-landing/`. Thư mục này chứa bản chụp trang đặt vé hiện có (ngày 28/10/2026). Bảng ánh xạ file với đường dẫn nằm trong README của thư mục. Giá trị trong bản chụp có thể đã đổi; MKT phải xác nhận lại trước khi dùng.

## 4. Lưu ý kỹ thuật cho MKT

- Không chèn `<table>`, iframe hoặc script vào nội dung. Danh sách tag cho phép nằm trong `hv_route_kses_allowed()` của `route-meta.php`. Bảng giá và giờ do khung hiển thị của Next dựng từ trường hạng xe và giờ chạy (việc của Dev).
- Title nên ≤ 60 ký tự, mô tả nên ≤ 155 ký tự (gợi ý ghi trên nhãn trường trong `route-meta.php`).
- Tuyến chưa được khai báo không vào sitemap và không có nội dung tuyến. Dev khai báo trước khi MKT viết bài.
- Trang tuyến không tải được nội dung sẽ trả noindex (`apps/booking/src/app/[lang]/xe-khach/[start]/[end]/page.tsx`). Không đưa link ra ngoài site trước khi trang đã có nội dung. Xem `offpage-plan.md`.

## Cần chốt

1. Phương pháp đo "≥ 60%" khác nhau giữa hai trang (thủ công theo đoạn, FAQ và điểm đón, hay tiêu chí khác).
2. Tỷ lệ link của cặp Vũng Tàu – sân bay Tân Sơn Nhất, và vai trò của trang Yên Nghĩa – Điện Biên.
3. Mốc 1.000 chữ có phù hợp không.
4. Vị trí quầy ga T1 Tân Sơn Nhất: cột B5 (theo bản chụp đặt vé và seed) hay cột B6 (theo audit).
5. Điểm dừng Mộc Châu nằm ở tuyến nào, và có phải bài tuyến Sơn La đang chứa nó không.
