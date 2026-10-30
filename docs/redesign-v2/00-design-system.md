# Redesign v2: design system dùng chung (WordPress)

Theo bản mẫu v0 (`redesign-website-hai-van.zip`), tinh thần **"Tử tế từ Tâm – Chu đáo từ Hành"**. Muốn đổi kiểu nào, đổi ở **một chỗ**, mọi trang đổi theo.

## Ở đâu

| Lớp | File | Ghi chú |
|---|---|---|
| Biến + thành phần dùng chung | `wordpress/wp-content/themes/haivan-web-child/assets/css/v2.css` | Nạp sau cùng trên **mọi trang**, body có lớp `.hv2` |
| Hàm PHP dùng chung | `inc/v2.php` | Gồm `hv2_head`, `hv2_page_head`, `hv2_link`, `hv2_img_tag`, `hv2_hotline`, `hv2_offer_cards`, `hv2_section_label` |
| Riêng trang chủ | `inc/home-v2.php`, `assets/css/home-v2.css`, `assets/js/home-v2.js` | Chữ hai thứ tiếng nằm trong `hv2_t()` |
| Ảnh | `assets/img/v2/` | Ảnh thật lấy từ kho `HV_QR_BOOKING`. Ảnh gen thì lấy xe thật làm gốc (nháp lưu ở `design-work/`) |

## Biến (`.hv2`)

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--hv2-ink` | #333333 | Chữ, nền khối tối, nút chính |
| `--hv2-yellow` | #FFC20E | Vạch nhấn, nền khối vàng, chữ nhấn trên nền tối |
| `--hv2-gold` | #8A6500 | Chữ nhấn trên nền sáng (4.9:1) |
| `--hv2-paper` | #F6F6F4 | Nền trang |
| `--hv2-tint` | #EFEEEA | Nền khối xen kẽ |
| `--hv2-surface` | #FFFFFF | Nền thẻ |

Thông số nhịp và khung:
- Khung nội dung `--hv2-max` 1256px.
- Lề `--hv2-gut` 20/40px.
- Nhịp khối `--hv2-pad` 72/96/110px.
- Góc vuông ở mọi nơi.

## Thành phần

- **Đầu khối** `hv2_head()`: dòng `01 · NHÃN` rồi H2 hai vế. Vế sau tô vàng, viết dạng `<em>`, mỗi vế một dòng. Bên phải có thể đặt đoạn dẫn hoặc link.
- **Đầu trang** `hv2_page_head()`: dòng `01 · Mục` (tên trang cha), H1 lớn nét mảnh, đoạn dẫn (lấy từ excerpt), sau đó là ảnh hoặc nút. Dùng ở page, lưu trữ, tìm kiếm, ưu đãi, sân bay, 404.
- **Link chữ** `.hv2-textlink`: chữ đậm, gạch chân, mũi tên ↗ màu vàng.
- **Nút** `.hv2-btn`:
  - nền than, mũi tên vàng;
  - biến thể `.hv2-btn--yellow`: nền vàng, chữ than.
- **Thẻ** `.hv2-card`: nền trắng, vạch vàng 5px phía trên phần chữ. Thẻ v4 `.hv-card` và `.hv-rcard` cũng được phủ về kiểu này.
- **Khối** `.hv2-sec`, có 3 biến thể:
  - `--tint`: nền xám ấm;
  - `--dark`: nền than, chữ nhấn màu vàng;
  - `--yellow`: nền vàng, chữ nhấn màu than.
- **Ưu đãi** `hv2_offer_cards()`: đặt trong khối than. Thẻ đầu nền vàng. Dùng cho trang chủ và /uu-dai.
- **Ứng dụng** `hv2_render_app()`: khối vàng. Trang chủ là khối 11, các trang khác đặt ngay trên footer.
- **Form tìm vé** `[haivan_search]`:
  - nhãn nhỏ viết hoa, ô nền xám, nút than;
  - tuyến chính hiển thị dạng tab gạch chân;
  - từ 60rem dồn thành một hàng.
  - Trang chủ có thêm công tắc Một chiều/Khứ hồi.
- **Phần chung của site** (phủ lớp v4 trong `v2.css`):
  - header nền trắng, có vạch mảnh;
  - footer nền xám giấy, tiêu đề cột viết hoa nhỏ;
  - đường dẫn (breadcrumb);
  - menu cùng mục: vạch vàng bên trái trên desktop, tab gạch chân trên điện thoại;
  - nội dung bài: H2 nét mảnh, link than gạch chân vàng, trích dẫn có vạch vàng;
  - bảng và phân trang.

## Quy tắc chữ (kể chuyện)

1. Mỗi khối có một câu **Tâm** (điều Hải Vân quan tâm) và một bằng chứng **Hành** (số liệu, địa chỉ, ảnh thật, việc đã làm).
2. Giọng văn:
   - gần gũi, không suồng sã;
   - rõ ràng, không máy móc;
   - có cảm xúc, không sáo rỗng;
   - chủ động, không gây áp lực.
3. Không dùng số liệu chưa có nguồn (ví dụ "4.8/5") và không dùng ảnh sai địa danh.

## Next (apps/booking)

- **Cùng bộ biến và kiểu:** `apps/booking/src/app/v2.css`, nạp cuối `globals.css`. Bộ này phủ lại các lớp v4 giống bên WP.
- **Đầu trang tuyến:** `components/route-landing/route-hero.tsx`.
- **Khối ứng dụng:** `components/layout/app-band.tsx`.
- **Lưu ý:** CSS Next nằm trong `@layer`. Luật `!important` nằm trong layer sẽ thắng luật ở ngoài layer, nên muốn đổi kiểu thì sửa luật gốc trong layer.

## Trang khuyến mãi (/uu-dai)

- **Template:** `archive-uu_dai.php`, gồm 4 khối:
  - đầu trang nền than kèm ưu đãi nổi bật (thẻ đầu tiên trong danh sách);
  - ưu đãi theo tuyến, có tab lọc;
  - cách dùng ưu đãi;
  - các bài khuyến mãi.
- **Thẻ ưu đãi:** MKT quản lý ở WP → Ưu đãi (tên, giá, điều kiện, ảnh, lịch, thứ tự).
- **Chữ trên trang:** sửa ở WP → Ưu đãi → Trang Ưu đãi (v2).

## Chưa làm

- Chữ của các trang nội dung, trừ trang chủ và Giới thiệu, vẫn là chữ cũ. Sẽ viết lại từng trang một theo khung kể chuyện (`inc/v2-story.php`).
- Bản EN của nhiều trang còn nội dung tiếng Việt (vấn đề có từ trước).
- Các màn cần dữ liệu thật chưa kiểm bằng mắt: sơ đồ chọn ghế, xác nhận, thanh toán.
