# Design guidelines (bám haivan.com hiện tại)

Nguồn: computed style trên haivan.com (2026-10-28) + ảnh mẫu `docs/screenshots/` (ảnh có thông tin cá nhân nằm ở `private/`, không commit).

## Tokens
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--hv-yellow` | `#FFC20E` | Thanh header, nút chính ("Tìm vé", "Tiếp tục", "Thanh toán"), tab đang chọn, ghế đang chọn |
| `--hv-dark` | `#333333` | Chữ đậm tiêu đề thẻ, nền phụ tối |
| `--hv-text` | `#212529` | Chữ thân |
| `--hv-text-muted` | `#58595B` | Nhãn 16px/700 |
| `--hv-gray` | `#CACBCD` / `#CACBD0` | Chữ mờ, viền ghế trống |
| `--hv-seat-sold` | `rgba(202,203,208,.5)` | Ghế đã đặt |
| `--hv-bg` | `#F8F8F8` | Nền trang |
| `--hv-surface` | `#FFFFFF` | Thẻ, form, sidebar |
| `--hv-input` | `#EDEEEE` | Nền ô nhập form tìm kiếm |
| `--hv-danger` | `#E53935` (xấp xỉ) | Nhãn "-13% Hôm nay", "*Khởi hành…" |
| `--hv-price` | `#FFC20E` | Giá khuyến mãi trên thẻ chuyến |
| `--hv-link-blue` | `#1890FF` | Nút "Thanh toán" trong Chuyến đi của tôi, liên kết |
| Bo góc | `4px` (chủ đạo), `8–10px` thẻ lớn | |
| Bóng tab chọn | `0 4px 10px rgba(0,0,0,.2)` | |
| Font | **Nunito** 400/600/700 (Google Fonts, subset vietnamese) | Toàn trang, 14px thân, 16–18px nhãn, 23px+ tiêu đề |

## Bố cục từng bước (giữ như cũ)
1. **Header**: logo HAIVAN trái; menu Tuyến đường · Khám phá · Dịch vụ · Chúng tôi · Hỗ trợ · Đăng nhập/Tài khoản (dropdown); chọn ngôn ngữ.
2. **Form tìm**: tab Xe liên tỉnh / Xe sân bay / Xe hợp đồng / Xe du lịch; Điểm xuất phát ⇄ Điểm đến · Ngày đi · Số người · nút vàng "Tìm vé". (`01-tim-chuyen.jpg`)
3. **Thẻ chuyến**: tuyến + hạng xe + "N Chỗ trống"; giờ đi/đến, thời lượng, điểm đón/trả (xe trung chuyển/tự di chuyển); hộp giá bên phải (nhãn giảm %, giá gạch, giá vàng, "đã gồm thuế VAT"); dòng đỏ "*Khởi hành: hh:mm Ngày dd/mm/yyyy"; mũi tên mở sơ đồ ghế.
4. **Sơ đồ ghế**: ảnh xe; chú thích Chỗ trống/Đang đặt/Đã đặt; khung xe bo tròn, vô lăng, ô ghế (tên + giá "VNĐ"); nút vàng full-width "Tiếp tục". (`02`, `03`)
5. **Đăng nhập**: modal nhỏ "Đăng nhập", một ô SĐT/email, reCAPTCHA, nút vàng "Tiếp tục". (`04`)
6. **Xác nhận**: cột trái (Thông tin của bạn · Thông tin dịch vụ bổ sung · Thông tin xuất hóa đơn · Chi tiết giá · nút "Tiếp tục"); cột phải (đồng hồ mm:ss · Kiểm tra thông tin đặt vé · Khách hàng thân thiết · Khuyến mãi và đổi điểm). (`private/05*`)
7. **Thanh toán**: danh sách radio phương thức (thẻ trắng); cột phải nút vàng "Thanh toán", đồng hồ, chi tiết giá, thẻ chuyến + mã vé. (`private/06`)
8. **Chuyến đi của tôi**: sidebar tài khoản; tab Chuyến đi sắp tới / Hoàn thành / Chuyến huỷ; hàng đơn vàng (mã đơn, ngày tạo, nút xanh "Thanh toán"); thẻ vé có QR, "Huỷ vé"; modal lý do huỷ. (`private/07`, `08`)

## Nguyên tắc làm mới
- Giữ bố cục, nhãn tiếng Việt và thứ tự bước; làm gọn khoảng cách, tăng tương phản, responsive tốt trên điện thoại (≥ 360px).
- Không thêm bước, không đổi tên trường hay nhãn nghiệp vụ.
- i18n vi/en lấy từ `docs/reference/locales/{vi,en}/common.json` (tải từ web cũ, bổ sung khoá thiếu `login_form.msg.error_input`).
