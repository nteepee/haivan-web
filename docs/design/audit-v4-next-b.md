# Audit v4: Next phần B (xác nhận, thanh toán, tài khoản, đăng nhập, theo dõi) — 2026-10-29

Phạm vi: `components/{confirm,payment,account,auth,booking,email,tracking}/*` + trang. Nền (`hv-card`, `hv-btn`, `hv-field`, `hv-notice`, `hv-tag`, `StickyBar`, `Dialog`, `Tabs`) do foundation v4 lo; bảng dưới chỉ ghi chỗ nằm trong class TSX của phần B. Kiểm: `node docs/design/check-tokens.mjs` (0 vi phạm ở các file này). Ảnh: scratchpad `v4/next-b-*.png`.
Quy ước cột cuối: Đã sửa / Còn.

| Trang / thành phần | Vấn đề (v3) | Sửa v4 | Trạng thái |
|---|---|---|---|
| `/xe-khach/xac-nhan` thanh đồng hồ | nền soft + viền accent, dính đỉnh điện thoại không phải kính; chữ cảnh báo 14px | `glass-yellow` khi dính (< lg), từ lg nền đặc (`!` thắng lớp .glass), chữ 16px | Đã sửa |
| xác nhận: chi tiết giá | vạch tổng ink 2px | vạch `border-rule` 1px | Đã sửa |
| xác nhận + vé: đường ray chặng | chấm `rounded-pill border-2 border-ink` | chấm tròn: ink = bến lên, vàng + vòng chọn = bến xuống/điểm đón | Đã sửa |
| xác nhận: hàng radio cá nhân/doanh nghiệp | viền ink 2px khi chọn | `bg-select select-ring` + tick, nền `paper-2` lúc nghỉ, `rounded-1` | Đã sửa |
| promo dialog (mã, ghế, đổi điểm) | 3 kiểu hàng viền 2px ink | cùng mẫu chọn (select + vòng + tick), nhãn trên kính 16px | Đã sửa |
| địa chỉ tận nhà: menu gợi ý, dialog dịch vụ, fieldset | menu `border-2 ink rounded-md`; fieldset viền rule | `rounded-2 shadow-2`; fieldset `bg-paper-2 rounded-2` | Đã sửa |
| `/xe-khach/thanh-toan` thẻ phương thức | `border-2 ink` + `rounded-md`, hover viền | `rounded-3`; nghỉ `shadow-1`, hover `shadow-2`; chọn `bg-select select-ring` + tick | Đã sửa |
| thanh toán: ô ngân hàng | viền 2px | nghỉ viền edge 1px; chọn vòng chọn + tick | Đã sửa |
| thanh toán: tóm tắt giá | vạch ink 2px | vạch rule 1px | Đã sửa |
| thanh toán: thanh tổng/nút (PayBar), dialog hết giờ | (nền foundation) | dùng `StickyBar`/`Dialog` kính của foundation | Đã sửa (qua foundation) |
| `/thanh-toan/thanh-cong` | hộp xác minh `border-2`; "Thử lại" cứng tiếng Việt | bỏ viền; nút dùng `account.retry` | Đã sửa |
| thẻ vé (`ticket-card`) | chấm ink 2px; tiêu đề băng `paper-2` | chấm mới; vạch 1px giữ | Đã sửa |
| `/xe-khach/cap-nhat-dich-vu` + dialog | fieldset viền, nhãn nhỏ | `bg-paper-2 rounded-2`, lỗi 16px | Đã sửa |
| `/tai-khoan/dang-nhap`, dialog, OTP, đăng ký | khung reCAPTCHA `border-2`; nhãn/lỗi 14px trực tiếp trên kính | khung `bg-paper-2 rounded-1`; nhãn + lỗi 16px | Đã sửa |
| `/tai-khoan/dang-xuat`, `/email/verify` | không có viền/bo lẻ (dùng `hv-card`) | không đổi | Không cần |
| sidebar tài khoản | viền ink 2px cho mục hiện tại; `md:border rounded-md`; hai mục cùng `aria-current` (tiêu đề + liên tỉnh); không cuộn mục chọn; mục thân thiết ẩn với khách chưa tham gia | thẻ `rounded-3 shadow-1`; mục hiện tại select + vòng + tick; tiêu đề bỏ `aria-current`; `scrollIntoView({inline:"center",block:"nearest"})` khi dải cuộn được; mục luôn hiện | Đã sửa |
| chuyến đi của tôi (3 tab, hàng đơn, chi tiết) | cạnh `rounded-md` ở vé huỷ; nút "Huỷ đơn" viền không có (class `border-error` không có độ rộng) | `rounded-2`; nút `bg-error-soft text-error`; tab do foundation | Đã sửa |
| hộp huỷ vé/đơn | hàng lý do viền ink 2px | select + vòng + tick | Đã sửa |
| chuyến đi của tôi ở 390px | nội dung rộng 459px do dải tab/nút nowrap nới cột lưới | cột `minmax(0,1fr)`: dải tab cuộn, trang không tràn | Đã sửa |
| trung-chuyen, hang-hoa, xe-san-bay, xe-hop-dong | placeholder `hv-card` "đang cập nhật"; trung-chuyen/hang-hoa không có lối vào từ sidebar | không đổi (ngoài phạm vi đợt này) | Còn (ghi chú) |
| thông tin cá nhân + dialog hồ sơ/thuế/bắt buộc | nhãn/lỗi 14px trên kính | 16px; "Thử lại" qua i18n | Đã sửa |
| ưu đãi của tôi | ô số `rounded-md`; ô mã `border-2 ink` | `rounded-1`; mã `bg-accent-soft` không viền | Đã sửa |
| `/tracking` | bảng dưới `border-t-2 ink` bằng nền đặc | kính `rounded-t-3` đè mép bản đồ, ghi chú 16px | Đã sửa |
| `/tracking/hv|hshv` | placeholder | không đổi | Không cần |
| Chuỗi cứng tiếng Việt ngoài i18n (`Làm mới`, `Không tìm thấy đơn hàng.`, toast thanh toán) | `/en` hiện tiếng Việt | chưa sửa (ngoài yêu cầu v4) | Còn |

## Khách hàng thân thiết (audit 261029, phần Next)
| # | Sửa | Trạng thái |
|---|---|---|
| A1 | 2 query độc lập; lỗi hồ sơ → `hv-notice-error` + "Thử lại"; lỗi `definition` chỉ chặn bảng quyền lợi (lỗi + "Thử lại" riêng) | Đã sửa + test |
| A2 | `subscribe_loyalty` rỗng → thẻ mời "Bạn chưa tham gia…" + nút "Đăng ký" mở `ProfileDialog` (POST customer/customers); không gọi `definition` khi vào trang | Đã sửa + test |
| A3 | `rank.next_rank` (đọc tolerant) → ngưỡng tĩnh (Bạc 1 vé; Vàng 30 vé/150.000 điểm; Kim cương 50 vé/250.000 điểm) trừ vé đã hoàn thành; hạng cao nhất có câu riêng; ghi "trong 12 tháng gần nhất" (A13) | Đã sửa + test |
| A4 | mục "Khách hàng thân thiết" ở sidebar luôn hiện; thêm 1 mục vào `account-menu.tsx` (desktop) và `header-nav.tsx` (menu điện thoại, khi đã đăng nhập); WP menu thuộc phần WordPress, chưa làm | Đã sửa |
| A5 | `account.rank_0..3` vi/en, `generateMetadata` theo locale, số theo locale | Đã sửa |
| A6 | icon `/assets/icons/icon_{member,silver,gold,diamond}_.png` 32-40px, alt = tên hạng | Đã sửa |
| A7 | thanh hạng lưới 4 cột, nhãn trong dòng (không absolute) | Đã sửa |
| A8 | quyền lợi hạng chưa đạt: mờ + khoá + "Cần đạt hạng X" + chữ sr-only | Đã sửa |
| A9 | `rank_evaluators` rỗng → "Chưa có thông tin quyền lợi…" | Đã sửa |
| A10 | ngày: có offset/`Z` → giờ VN; `Y-m-d H:i:s` coi là giờ VN | Đã sửa + test 2 dạng |
| A11 | nút lịch sử luôn hiện, trạng thái rỗng, đơn vị "điểm" | Đã sửa + test |
| A12 | 4 tab chia đều (lưới 4 cột), cuộn tab chọn vào giữa | Đã sửa |
| Low | key ổn định, `aria-current="step"` trên hạng hiện tại, bỏ `max-h` lạ ở thanh, test cho loyalty-page + sidebar | Đã sửa |
