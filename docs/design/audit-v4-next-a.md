# Audit v4, Next nửa A (layout, /xe-khach, tim-chuyen, landing tuyến, partner, ui/*)

Chuẩn: v4 (`design.md`, `tokens-v4.css`), ui-ux-pro-max §1-6 (a11y, touch, hiệu năng, style, layout, chữ), hallmark Floor. Kiểm: `node docs/design/check-tokens.mjs` (CSS + class TSX), ảnh `scratchpad/v4/next-a-*.png`.
Ký hiệu: Đã sửa = trong code; Mở = cần chủ quyết hoặc ngoài phạm vi.

## Layout dùng chung
| Trang / thành phần | Vấn đề v3 | Trạng thái |
|---|---|---|
| Header | không dính; nav hiện tại gạch ink 2px; nút Đăng nhập viền ink; panel menu mobile viền ink 2px; dropdown viền ink 2px | Đã sửa: dính, `HeaderShell` bật `.glass-yellow` khi cuộn > 8px (scroll passive, chỉ đổi nền/bóng nên không xô layout), nav hiện tại = nền vàng đậm, ghost = trắng + shadow-1, panel mobile r-2 shadow-2 đặc, dropdown r-2 shadow-2 |
| Menu mobile | chữ 18px, vạch ink | Đã sửa (đặc, không kính: chữ nhỏ + nền trắng cho dễ đọc) |
| Footer, dải app | ô logo r-sm, icon xã hội không bo | Đã sửa r-2 / r-1; nền đặc, không kính; vạch 1px muted |
| Nút gọi (FAB) | viền ink 2px, pill | Đã sửa: tròn `--r-round`, không viền, shadow-2 |
| Stepper (`ui/stepper`) | gạch trên ink, vòng số pill, viền 2px | Đã sửa: ô r-1 xám, hiện tại = ô trắng nổi + số vàng, xong = số ink + tick |
| Breadcrumb | không có component trong app | n/a |
| Skip link | vuông | Đã sửa r-1 |
| Hiệu năng | header dính + blur | Blur chỉ khi đã cuộn; `@supports` + `prefers-reduced-transparency` về nền đặc |

## Trang
| Route | Vấn đề | Trạng thái |
|---|---|---|
| `/xe-khach` | thẻ tìm vé bóng raise, tab ink đặc, bộ đếm viền 2px, nút đổi chiều viền ink; thẻ tuyến viền 1px + r-md | Đã sửa: thẻ r-3 kính (nhãn 16px trên kính), tab phân đoạn xám, bộ đếm 1px edge, swap tròn shadow-1, thẻ tuyến r-3 shadow-1 không viền; margin tab bị gộp (flow-root) |
| `/xe-khach/tim-chuyen` | dải vàng bước viền ink; chip lọc nền ink; hàng chuyến mở viền ink 2px; ghế viền 2px ink; thanh tổng viền ink trên | Đã sửa: bước ô r-1; thanh lọc dính kính (chip chọn = `--select-bg` + vòng + tick); thẻ chuyến r-3 đệm s-2 + ảnh r-2 đồng tâm, mở = select + ring; ghế r-1 1px edge, chọn vàng + ring + tick, đã đặt xám + số gạch + chữ; khung xe r-3; thanh tổng kính (phone: đáy r-3 trên, desktop: thẻ dính), chữ 16px ink; ảnh xe r-1; bản đồ r-4 |
| `/xe-khach/[start]/[end]` | 5 vạch ink 2px (whys, địa chỉ, ruled); ảnh mosaic r-lg; thẻ hạng xe viền; sơ đồ điểm dừng không khung | Đã sửa: vạch 1px rule, thẻ r-3 shadow-1, mosaic r-3 (ảnh đầu và khung bản đồ r-4), huy hiệu r-1 |
| `/partner/booking` | không giao diện (chuyển trang); chuỗi "Đang chuyển trang…" ghi cứng tiếng Việt | Mở: giữ nguyên (đổi nhãn cần chủ) |
| not-found, error | không có `not-found.tsx`/`error.tsx`/`global-error.tsx`: lang sai hoặc tuyến không có → trang 404/lỗi mặc định của Next, không header | Mở: cần chủ duyệt chữ (vi/en) rồi dựng bằng `hv-card` + nút chính; không thêm nhãn mới trong đợt này |

## `components/ui/*`
| Thành phần | Vấn đề | Trạng thái |
|---|---|---|
| button | viền 2px transparent/ink, r-sm | Đã sửa: không viền; outline/secondary = xám + vòng trong 1px rule; icon-only = `rounded-round` (bán kính theo size vì `cn` không gộp xung đột) |
| input, textarea, select trigger | viền 2px, hover viền ink | Đã sửa: 1px edge, hover nền accent-soft, r-1 |
| select, dropdown-menu, popover | viền ink 2px, r-md, shadow-float | Đã sửa: r-2 shadow-2, mục r-1, focus = nền accent-soft |
| dialog | viền ink 2px | Đã sửa: `.hv-sheet` (kính + shadow-3 + scrim), r-3, chân r-b-3; phủ mọi dialog dùng `DialogContent` (cả sibling) |
| tabs | gạch dưới ink 2px | Đã sửa: thanh phân đoạn paper-2 r-2, chọn trắng + shadow-1 |
| checkbox, radio | viền 2px ink khi chọn | Đã sửa: 1px edge; chọn = accent + `select-ring` + tick/chấm |
| calendar (chưa dùng) | ô r-md | Đã sửa `--cell-radius` = r-1 |
| skeleton, sonner (toast) | r-md | r-2; toast giữ viền 1px màu ngữ nghĩa (lỗi, thành công) |
| rail | mũi tên pill viền | Đã sửa: tròn, shadow-1, hover shadow-2 |
| sticky-bar | viền ink trên, nền đặc | Đã sửa: `.glass`, r-3, chữ nhãn 16px ink |
| separator, label, field-error | ổn | Giữ |

## ui-ux-pro-max / hallmark còn mở
- Vòng chọn `--color-accent-edge` trên trắng 2,2:1 (<3:1): luôn kèm tick + nền soft; chủ quyết có đậm hơn không (câu hỏi mở 1 của README v4).
- Giới hạn 3 lớp kính: header + thanh lọc + thanh tổng = 3; dialog mở thêm lớp thứ 4 ngắn hạn (có scrim). Chấp nhận, hoặc tắt blur các lớp phía sau khi dialog mở.
- Giá ghế: đã xử lý (v4 audit M9): ô ghế rộng 64 (co tới 56 khi khung hẹp), giá "240.000" và "VNĐ" một dòng; dưới mức đó khung xe cuộn ngang trong panel (`.hv-bus-scroll`), trang không tràn.
- `src/schemas/layout.test.ts` đang đỏ: `content/layout-fallback.json` lệch `test/fixtures/wp-layout.json` (sửa lúc 11:19, không thuộc phạm vi này).

## Nhịp section (đo trên trình duyệt, 1440 / 390; chủ phát hiện khoảng trắng lạ giữa hai section)
Luật (design.md v4): section xếp liền nhau, KHÔNG margin giữa chúng; nhịp chỉ từ `padding-block: var(--section-pad)` (48 / 32 phone) của mỗi section; hai section liền kề khác nền (trắng, vàng ấm `tint-warm`, xám `paper-2`, vàng `accent`, ink) hoặc gộp; không section rỗng/trùng, không bọc thêm đệm (spacer, container + section, `mt-*`); dải app + footer giống WP; chỗ đệm thanh dính chỉ có chiều cao khi có thanh (`--bar-h`). Đệm ghi `trên/dưới` (px) ở 1440; ở 390 mọi `48` thành `32`, footer `48/100` giữ nguyên.

| Route | Section từ trên xuống (nền, đệm) | Đã sửa so với trước |
|---|---|---|
| `/xe-khach`, `/en/xe-khach` | dải vàng hero (kề header vàng = một băng; thẻ tìm vé đè 24 lên mép) · trắng `section-white` 48/48 (rail) · vàng `app-band` 48/48 · footer ink 48/100 | khoảng trắng 80-96px giữa thẻ tìm và "Các tuyến phổ biến" (dải đệm `rplate-bleed` đệm đáy 32/64 cộng đệm section 48) → bỏ đệm đáy dải; rail lệch +8 (đệm 24 bù margin -16) → margin âm bằng đệm; thiếu dải app (WP có ở mọi trang) → thêm ở layout |
| `/xe-khach/tim-chuyen?...` | dải vàng bước + tiêu đề + tóm tắt 48/48 (kề header vàng) · thân `app-main` 48/48 (nền giấy) · vàng `app-band` · footer | dải vàng đệm 16/32 và thân 24/48 → cả hai `--section-pad` |
| `/xe-khach/<a>/<b>` (Quận 1-Vũng Tàu, Mỹ Đình-Điện Biên) | hero vàng · 10-11 khối `hv-ground` xoay trắng → ấm → xám (Điện Biên có thêm khối ink "Điểm dừng") mỗi khối 48/48 · vàng `app-band` · footer | xoay nền chỉ định nghĩa tới khối 8, khối 9-11 trùng xám → `:nth-child(3n+k of .hv-ground)` (chu kỳ 3, không giới hạn); dải app tối (ink) liền footer ink → vàng; hero đệm 24/48 → `section-pad` / `section-pad + 24` (24 là phần thẻ tìm đè) |
| `/tracking` (không tham số) | thẻ `hv-card` có h1 (thân `app-main` 48/48, nền giấy) · vàng `app-band` · footer | trước: chỉ một dòng chữ phủ toàn màn hình, không h1/CTA; đệm `py-16` cộng đệm riêng |
| `/partner/booking` | thẻ h1 "Đang chuyển trang…" + liên kết dự phòng · app-band · footer | trước: một dòng `py-16`, không h1 |
| `/tai-khoan/dang-nhap` | nền ấm `section-warm` (thẻ đăng nhập, `app-main` 48/48) · vàng `app-band` · footer | `py-16` cộng `app-main` (đệm đôi 64+48) → chỉ `app-main` |
| 404 gốc (`/khong-co`) | thẻ 404 (`app-main` 48/48), không header/footer (ngoài `[lang]/layout`, không có dữ liệu layout WP) | `py-16` đôi đệm → `app-main`. Header/footer cho 404 gốc: Mở (cần chủ quyết, cần layout tĩnh) |
| `/tai-khoan/*` (thông tin, hạng thành viên, ưu đãi, chuyến đi) | lưới `app-main` 48/48 (cột menu 16rem + nội dung) · app-band · footer | thêm dải app (WP); nội dung ngắn hơn cột menu nên đáy trống là chiều cao cột menu (529) chứ không phải đệm |
| `/xe-khach/xac-nhan`, `/xe-khach/thanh-toan` | dải tóm tắt dính vàng (không chiếm chỗ ≥ lg) · `app-main` 48/48 · app-band · footer; thanh dính đáy (phone) + `bar-spacer` 88 | `bar-spacer` = 0 khi không có thanh (kiểm: mọi trang khác); trạng thái đang tải/không có đơn dùng `PageNote` / `OrderMissing` thay các `<p py-16>` |
| `/xe-khach/thanh-toan/thanh-cong`, `/xe-khach/cap-nhat-dich-vu` (không tham số) | thẻ "Không tìm thấy đơn hàng" có h1 + nút về `/xe-khach`; cập nhật dịch vụ: `PageNote` | trước: `<p py-16>` không h1; thanh-cong không tham số chỉ còn dải app + footer |

Còn lại, có chủ đích: thẻ tìm vé đè 24px lên dải hero (chữ ký v3/v4, dùng margin âm trên `rplate-bleed` thay vì thêm section); `hero` và `rs-top` cùng nền vàng với header nên là một băng; footer dùng đúng giá trị WP (`padding-block: section-pad / section-pad + 52`, tầng `section-pad`, tiêu đề cột 16/24 như `footer.css` hiện tại; nếu WP đổi 18/24 thì đổi cả hai nơi).

