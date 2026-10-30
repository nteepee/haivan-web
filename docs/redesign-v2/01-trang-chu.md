# Redesign v2 · Trang chủ: khung câu chuyện và chữ (bản nháp để anh duyệt)

Bản 30/10/2026. Phong cách lấy theo bản mẫu v0 (`redesign-website-hai-van.zip`). Nội dung và số liệu lấy từ site thật (bộ xuất `exports/landing-audit-261030`).

## Xương sống: Tâm và Hành

Slogan **"Tử tế từ Tâm – Chu đáo từ Hành"** là cấu trúc của cả trang. Mỗi khối có 2 phần:

- **Tâm**: một câu nói lên điều Hải Vân quan tâm. Câu ngắn, có cảm xúc, không sáo rỗng.
- **Hành**: bằng chứng cụ thể như con số, địa chỉ, giờ chạy, ảnh thật, hoặc việc đã làm.

Khách đọc thấy lời hứa, rồi thấy ngay bằng chứng, nên an tâm.

Mạch trang chủ (theo `pageNarratives` của bản mẫu, bổ sung phần phụng sự):

> Lời hứa → Đặt vé ngay → Dịch vụ → Những việc nhỏ trên một chuyến đi → Ưu đãi → Tuyến → Phòng chờ → Con số → Phụng sự cộng đồng → Điểm đến → Ứng dụng → Tin

Quy tắc giọng văn (giữ đúng bản mẫu):
1. Gần gũi, không suồng sã.
2. Rõ ràng, không máy móc.
3. Có cảm xúc, không sáo rỗng.
4. Chủ động, không gây áp lực.

Quy ước trong bản này: chữ trong `*…*` là nửa câu tô vàng (kiểu chữ của bản mẫu). `[ảnh thật]` là ảnh có sẵn trong kho `HV_QR_BOOKING/.../assets`. `[ảnh gen]` là ảnh tạo bằng AI, lấy ảnh xe thật làm gốc.

---

## 01 · Lời hứa (hero)
**Mục đích:** nói tinh thần thương hiệu trong 5 giây đầu.

- Dòng nhỏ trên đầu: `Xe khách Hải Vân · Từ 1994`
- **H1:** Tử tế từ Tâm. / *Chu đáo từ Hành.*
- Đoạn: Hơn 30 năm đưa khách đi Vũng Tàu, sân bay Tân Sơn Nhất và các tỉnh Tây Bắc, Hải Vân vẫn giữ một cách làm: lo cho hành khách như lo cho người nhà.
- Hai link: `Tìm chuyến đi ↗` (cuộn tới form đặt vé) · `Câu chuyện Hải Vân ↗` (sang /chung-toi/gioi-thieu)
- Ảnh: [ảnh gen] xe giường nằm vàng thật của Hải Vân trên đèo Tây Bắc lúc sớm mai, có sương. Bên trái ảnh để trống cho tiêu đề. Bản thứ hai: [ảnh gen] xe Limousine trên đường ven biển Vũng Tàu, để xoay vòng hoặc dùng cho bản EN.

> **Cần anh chọn: H1 nên viết thế nào?**
> - (a) Slogan làm H1, như trên. Đậm thương hiệu nhất. Từ khoá "đặt vé xe khách" vẫn có trong title, trong đoạn mô tả và trong H2 của khối đặt vé.
> - (b) Giữ H1 kiểu SEO: "Xe khách Hải Vân. *Tử tế từ Tâm, chu đáo từ Hành.*"
>
> Em đề xuất (b): vừa giữ thương hiệu, vừa giữ từ khoá chính trong H1.

## 02 · Đặt vé (thẻ đặt vé nằm đè lên mép dưới hero)
**Mục đích:** "Chủ động, không áp lực", tức là đặt được ngay mà không phải cuộn.

- Dòng nhỏ: `Đặt vé nhanh`
- **H2:** Tìm chuyến đi của bạn
- Form thật đang chạy (giữ nguyên logic):
  - 4 tuyến chính;
  - điểm đi, điểm đến, ngày đi;
  - nút "Thêm ngày về";
  - số vé;
  - nút `Tìm chuyến →`.
- Dải **Chuyến hôm nay** (dữ liệu trực tiếp): `Sài Gòn đi Vũng Tàu · Cả ngày 85 · 0–6h 4 · …`
- Chữ nhỏ dưới form: `Cần người tư vấn? Gọi 1900 6763, luôn có người nghe máy.`

## 03 · Dịch vụ
**Tâm:** Một chuyến đi tốt / *bắt đầu từ sự quan tâm.*
**Đoạn:** Đi tỉnh, ra sân bay hay cần cả một chiếc xe cho gia đình, công ty, Hải Vân đều chuẩn bị sẵn.

3 thẻ, mỗi thẻ có ảnh thật:

| Thẻ | Câu | Ảnh | Link |
|---|---|---|---|
| Xe liên tỉnh | Giường nằm, cabin riêng, chạy đêm êm như ngủ ở nhà. | [ảnh thật] `hn-royal-2.webp` (cabin) | /xe-khach |
| Xe sân bay | Đón tại Tân Sơn Nhất (Làn B, cột B04), đưa thẳng về Vũng Tàu. | [ảnh thật] `airport-van.webp` | /xe-san-bay |
| Xe hợp đồng | Một chiếc xe có tài xế, cho chuyến đi riêng của gia đình hoặc doanh nghiệp. | [ảnh thật] `fleet-team-hotel.webp` | /dich-vu/xe-hop-dong/phuong-tien |

Dòng phụ dưới 3 thẻ: `Gửi hàng cùng chuyến xe →` (/dich-vu/hang-hoa/tra-cuu-don).

## 04 · Những việc nhỏ trên một chuyến đi (khối mới, là trái tim của trang)
**Tâm:** Chu đáo không nằm ở lời hứa. / *Nó nằm ở những việc nhỏ.*
**Đoạn:** Từ lúc bạn bấm đặt vé đến khi xuống xe, có 5 lần Hải Vân có mặt.

Một dải 5 chặng kể theo dòng thời gian. Mỗi chặng ghi việc Hải Vân làm (Hành), kèm ảnh thật:

1. **Lúc đặt vé:** Bạn tự chọn đúng giường, đúng ghế. Vé QR nằm gọn trong điện thoại, không sợ mất. [ảnh: chụp màn hình app hoặc sơ đồ ghế]
2. **Trước giờ đi:** Phòng chờ có điều hoà, trà nước, có người hỗ trợ xếp hành lý. Bạn chỉ cần có mặt trước 20 phút. [ảnh thật] `lounge-q1-1.webp`
3. **Lúc lên xe:** Cabin sạch, chăn gối mới, có sạc USB và nước uống. [ảnh thật] `hn-royal-3.webp` hoặc `eco-fridge-water.webp`
4. **Trên đường:** Tài xế được kiểm tra sức khoẻ trước mỗi ca. Tốc độ và giờ lái được giám sát liên tục. [ảnh thật] `hvxt-son-la-bus-night.webp`
5. **Khi cần thay đổi:** Tổng đài 1900 6763 có người thật nghe máy 24/7, hỗ trợ đổi giờ trước giờ xe chạy. [ảnh thật] `staff-guests-lounge.webp`

> Thay cho khối "Vì sao đặt vé với Hải Vân" (4 ô) hiện tại. Nội dung giữ nguyên, nhưng kể theo dòng thời gian nên khách hình dung được chuyến đi của chính mình.

## 05 · Ưu đãi hôm nay (nền than)
**Tâm:** Đi cùng nhau. / *Tiết kiệm nhiều hơn.*
- Thẻ ưu đãi lấy trực tiếp từ dữ liệu ưu đãi trên WordPress, như hiện tại. Thẻ đầu tiên nền vàng.
- Ví dụ thật đang chạy:
  - Sài Gòn – Vũng Tàu: 419k cho 2 vé Luxury.
  - Trọn hàng cuối: 599k cho 3 vé.
  - Hà Nội – Điện Biên: đặt trước 3 ngày, 900k cho 2 vé.
  - Xe Eco: đặt trước 7 ngày, 500k cho 2 vé.
  - App: tặng 50k cho lần đặt đầu tiên.
- Link: `Xem tất cả ưu đãi ↗` (/uu-dai)

## 06 · Tuyến phổ biến
**Tâm:** Chọn nơi bạn muốn / *bắt đầu.*
- Danh sách 4 tuyến dạng hàng ngang: `Sài Gòn → Vũng Tàu · 2 giờ · Từ 140.000đ ↗`
  - Hà Nội → Điện Biên: 11 giờ, từ 485.000đ.
  - Hà Nội → Mộc Châu: 4 giờ 15, từ 270.000đ.
  - Hà Nội → Sơn La: 6 giờ, từ 330.000đ.
- Giá "từ" lấy từ dữ liệu, không ghi cứng. Mỗi hàng dẫn tới đúng trang tuyến.
- Link: `Xem tất cả tuyến ↗`

## 07 · Phòng chờ
**Tâm:** Phòng chờ / *cũng phải tử tế.*
**Đoạn:** Không ai muốn đứng chờ xe dưới nắng mưa. Phòng chờ của Hải Vân mát, sạch, có trà nước và có người hỗ trợ bạn.
- Bên trái: ảnh lớn [ảnh thật] `lounge-q1-1.webp`. Trên tường phòng chờ có chữ "Tử tế từ Tâm – Chu đáo từ Hành", nên đây là bằng chứng thật nhất cho slogan.
- Bên phải: 6 địa chỉ thật.
  - 34 Nguyễn Thái Bình, Q.1
  - 307 Nguyễn Văn Trỗi
  - 607 Điện Biên Phủ
  - 156B Lê Hồng Phong, Vũng Tàu
  - 01 Nguyễn Hoàng, Mỹ Đình
  - Quầy Tân Sơn Nhất T1/T2/T3
- Mỗi địa chỉ có link `Chỉ đường ↗` mở Google Maps.

## 08 · Con số (nền than)
**Tâm:** Không chỉ là / *một chuyến xe.*

| Số | Nhãn |
|---|---|
| 1994 | Năm bắt đầu hành trình |
| 250 | Phương tiện |
| 1.000+ | Nhân viên |
| ~200 triệu | Lượt khách đã đồng hành |

> Bỏ hẳn "4.8/5 hài lòng" của bản mẫu vì chưa có số liệu thật. Bỏ "30+ tỉnh thành" nếu không có danh sách chứng minh.

## 09 · Phụng sự cộng đồng (khối mới)
**Tâm:** Không bỏ lại / *ai phía sau.*
**Đoạn:** Có những chuyến xe Hải Vân chạy không để bán vé.

3–4 thẻ chuyện thật, mỗi thẻ có ảnh thật:
- **Xe trung chuyển miễn phí qua các bệnh viện lớn tại Hà Nội.** Ảnh [ảnh thật] `hn-csr-trungchuyen.webp`.
- **Đồng hành cùng bệnh nhân Điện Biên.** Ảnh [ảnh thật] `hn-csr-benhnhan.webp`.
- **Tặng vé cho học sinh, sinh viên mùa tựu trường.** Ảnh [ảnh thật] `hn-csr-hocsinh.webp`.
- **Trao thẻ đi xe miễn phí tại Mộc Châu.** Ảnh [ảnh thật] `hvxt-csr-moc-chau-2.webp`.
- Câu chuyện nhỏ làm trích dẫn: đoàn 6 khách từ Vũng Tàu bị kẹt đường, trễ chuyến bay đi Phú Quốc, và Hải Vân đã xoay xở cho đoàn kịp đi. Chuyện lấy từ trang Phát triển bền vững.
- Link: `Phát triển bền vững ↗`

## 10 · Điểm đến
**Tâm:** Mỗi nơi đến, / *một câu chuyện.*
- 6 ô ảnh: Vũng Tàu, Điện Biên, Mộc Châu, Sơn La, Hà Nội, Sài Gòn. Dẫn tới /diem-den/….
- Ảnh:
  - Điện Biên: [ảnh thật] `dien-bien-gallery/pha-din-pass-clouds.webp` (đèo Pha Đin).
  - Còn lại: [ảnh gen] đúng địa danh, không dùng ảnh Unsplash sai chỗ như bản mẫu.

## 11 · Ứng dụng (nền vàng)
**Tâm:** Hải Vân / *trong túi bạn.*

Lưu ý: chữ nhấn trên nền vàng phải đổi sang màu than. Bản mẫu bị mất chữ vì để chữ vàng trên nền vàng.

- Đoạn: Theo dõi xe đang ở đâu, giữ vé không sợ mất, tích điểm đổi vé. Lần đặt đầu tiên qua ứng dụng được tặng 50k.
- Mã QR thật cùng nút App Store và Google Play.

## 12 · Tin Hải Vân
**Tâm:** Chuyện trên / *mỗi hành trình.*
- 3 tin mới nhất, lấy tự động từ mục Tin tức. Tiêu đề viết thường, không dùng emoji, không viết hoa toàn bộ.

---

## Thiết kế: giữ gì, sửa gì so với bản mẫu

| Giữ | Sửa |
|---|---|
| Tông than #353535, vàng #FFCC00, giấy #F6F6F4 | Chữ nhấn màu vàng trên nền sáng đổi sang vàng đậm (khoảng #8A6A00) để đủ tương phản. Trên nền vàng thì dùng màu than. |
| Góc vuông, đường kẻ mảnh, nhiều khoảng trắng | Chữ thân bài tối thiểu 16px (bản mẫu chỉ 11–12px) |
| Nunito, tiêu đề lớn, nét mảnh | Đánh số các khối liền mạch 01 → 12 |
| Dòng nhỏ có số thứ tự đứng trên mỗi khối | Thêm khối 04 và 09 |
| Thẻ đặt vé nằm đè lên mép hero | Dùng form và dữ liệu thật |

## Anh cần xác nhận
1. Chọn H1 kiểu (a) hay (b).
2. Số liệu khối 08: 250 phương tiện, hơn 1.000 nhân viên, gần 200 triệu lượt khách. Các số này còn đúng không?
3. Các chương trình cộng đồng ở khối 09 có còn đang chạy không? Có muốn nêu thêm chương trình nào không?
4. Khối 04 (5 chặng của một chuyến đi) có đúng thực tế vận hành không? Ví dụ: có mặt trước 20 phút, kiểm tra sức khoẻ tài xế mỗi ca.
