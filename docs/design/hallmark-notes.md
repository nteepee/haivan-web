# Hallmark: ghi chú áp dụng cho haivan.com (261028)

Nguồn: `archive/ref/hallmark` (v2.0.0, chỉ đọc, không chạy script): `SKILL.md`, 24 file `references/`, 50 theme (đọc kỹ Ink, Wayfind, Hum, Dose, Furrow, Piste, Coral, Brutal), `README`, `ROADMAP`. Hallmark là skill sinh trang mới theo "sàn cứng" chống giao diện máy-làm. Ta không dùng quy trình (deal theme, stamp, log, sloplint) mà chỉ mượn luật và số đo. Token gốc: `docs/design-guidelines.md`.

Kết luận nhanh: (1) mượn bộ gate làm checklist review; (2) base theme = **Ink (colourway board)** + bảng giờ kiểu Wayfind + nút "ép cạnh" của Hum; (3) lỗi nặng nhất của UI hiện tại là **tương phản**: giá chữ vàng trên nền trắng 1,62:1, viền ghế trống 1,62:1, ô nhập không viền, chữ 11-14px; (4) bỏ gợi ý "Flat/Atkinson/xanh-cam" (mục 6).

## 1. Gate Hallmark thành checklist lint

Ba bậc: **Floor** (không waive, ship = 0 FAIL), **Reflex** (mặc định máy hay rơi vào; waive được nếu có lý do ghi lại), **Finish** (chi tiết, chỉ trả lời, không chặn). Số trong ngoặc là mã gate trong `references/gates.md`. Màn "app" (ghế, xác nhận, thanh toán, tài khoản) được bỏ các gate marketing (hero, fold, 80 từ/màn, nhịp section, ảnh) nhưng vẫn chịu toàn bộ Floor.

**Floor**
- [ ] Mọi màu/font đi qua token; không literal màu ngoài khối token (48). Ví dụ vi phạm: `bg-[#fff7dc]`, `text-[#BB0000]`, `text-[#349D0E]`.
- [ ] Không `transition: all`; không animate `width/height/top/left` (10a); chỉ `transform`/`opacity`.
- [ ] `overflow-x: clip` trên `html` và `body`, không `100vw`; không cuộn ngang 320-1920 (34).
- [ ] Mọi control có `:focus-visible` hiện tức thì, vòng >= 3:1 với nền (26a, 15). Không `outline: none` suông.
- [ ] Mọi animation có `prefers-reduced-motion`; nội dung hiện khi tắt JS (27, 62).
- [ ] Không bịa số liệu, đánh giá, logo, "N khách đã đặt" (46a). Số lấy từ API/CMS hoặc bỏ.
- [ ] Không eyebrow (chữ nhỏ trên heading) và không nhãn CHỮ HOA/giãn chữ (54, 67). Nhãn = font thân, nhỏ hơn 1 bậc, chữ thường.
- [ ] Không chuỗi `A · B · C`, không mũi tên dính chữ (`Tiếp tục ›`), không chấm trạng thái trang trí (63).
- [ ] Không gradient tím-xanh, thẻ trong thẻ (4), emoji/glyph làm icon (30a; `✓` ở footer tính).
- [ ] Tương phản: chữ >= 4,5:1; icon, vòng focus, **viền ô nhập** >= 3:1 (40). Chữ trên nền màu dùng cặp ink (41).
- [ ] Hero: h1 + 1 câu + nút chính thấy ở 1280x800 (44b); khoảng 80 từ/màn, hero chỉ h1 + 1 câu + nút (58).
- [ ] Container có max-width và căn giữa; ở 1920 gutter nở, lưới không đổi cột (44d).
- [ ] `<img>` có width/height và file tồn tại; không `loading=lazy` ở ảnh LCP; ảnh thư viện phải ghi nguồn (76, 28a).
- [ ] Input: viền không đổi bề rộng khi focus, cao bằng nút kề, disabled đủ 3 kênh (39a); nút/nav link không xuống dòng (49a).
- [ ] Không hai phần tử `sticky; top: 0` chồng nhau (56); không chữ bị che (73).
- [ ] Không "gửi giả": form/nút in "Đã gửi" khi chưa có request (70).

**Reflex** (fix hoặc waive có lý do)
- [ ] Accent > ~5% viewport (23): header + hero vàng là "Committed", khai báo posture rồi giữ nút/chữ nhấn dưới ngưỡng.
- [ ] Hero 92dvh+ căn giữa mọi thứ (6b); template "hero, 3 tính năng, CTA, footer" (8); mọi section cùng kiểu ngăn (9); section mỏng (77); heading section < 40px ở 1440 (78); dải trống > 160px dưới hero (79).
- [ ] Thẻ: 3 cột icon-trên-tiêu-đề, icon trong ô bo tròn, sọc màu dày cạnh thẻ (3); hover cùng một kiểu nâng trên mọi thẻ, ảnh zoom khi hover (11); bounce/overshoot (12); toast mừng cho việc user đã thấy (16).
- [ ] Chữ < 12px (75); prose ngoài 45-75ch (25); > 3 họ font (37); 2 bộ icon (30b); điều khiển ngoài 44-52px trang marketing (39b).
- [ ] Section cuối là email band khi job không phải đăng ký (85); nav/footer "mặc định AI" không có lý do (42); slot ảnh trống > 5 (68); một dữ kiện in lại >= 4 section (69; bảng giá/ledger được miễn).

**Finish** (trả lời, không chặn): ngoặc kép thẳng (F1), `...` thay `…` (F2), heading thiếu `text-wrap: balance` (F3), >1 kiểu nút chính (F4), icon trong "đồng xu" màu (F5), số lớn thiếu `tabular-nums` (F6), `::selection`/`caret-color` chưa theo brand (F16), >3 độ đậm font (F19), phần tử mồ côi ở hàng cuối lưới (F20), thiếu `lang`/`title`/meta (F23), đoạn kết bằng 1 từ (F26), bảng trên điện thoại mất cột hành động (F25).

**Dấu hiệu UI do AI sinh (tells), tránh khi viết mới:** eyebrow trên heading; một từ trong heading bị tô màu/in nghiêng; mọi thứ căn giữa; 3 thẻ icon bằng nhau; glow/aurora/gradient chữ; thẻ viền + bóng + nền xám nhạt "đủ thứ"; dải số liệu/logo/lời chứng bịa; ảnh minh hoạ vẽ bằng SVG hoặc ô ảnh trống; "Xem thêm →"; email band cuối trang; toast "Cảm ơn!" không có request; từ rỗng kiểu "seamless/elevate/unlock" (bản VN: "trải nghiệm đỉnh cao", "kiến tạo", "đột phá", do ta suy ra).

## 2. Trang đặt vé theo Hallmark, ánh xạ vào từng trang

Hallmark (`anatomy.md` job `book`/`buy`, `layout.md` 6-7, `interaction-and-states.md`, `imagery.md`):
- **Nút chính**: ở hero **và** lặp cạnh nội dung, không chỉ ở chân trang; nav mang từ hành động của job (Đặt vé). Hero posture "Counter": hành động *là* hình ảnh (form tìm vé đặt lớn). Trang mua có thanh dính hiển thị giá + nút.
- **Kết trang bằng việc khách đến làm** (giờ chạy kế tiếp, địa chỉ, hotline, nút đặt lại), không email band (85). Trang "book" có thể rất ngắn: một ảnh, thực đơn (= danh sách chuyến), đặt chỗ.
- **Số section**: 6-9 gồm hero + footer, <= 450 từ hiển thị, h1 <= 7 từ, h2 <= 6 từ, không quá 2 section liền kề cùng khung "đầu rồi khối". Mỗi section có "khối lượng": bảng/danh sách >= 3 hàng, ảnh >= 360px, hoặc control làm việc.
- **Form**: nhãn hiện trên ô (không dùng placeholder làm nhãn); placeholder chỉ mẫu định dạng; validate khi blur rồi mỗi lần gõ; lỗi 1 câu (gì sai, vì sao, làm gì) gắn `aria-describedby` + `aria-invalid`, dòng trợ giúp giữ chỗ `min-height: 1lh`; bắt buộc có chữ, không chỉ màu; ô nhập cao 48-56px, 16px, `type`/`inputmode`/`autocomplete` đúng, không chặn dán; **nút gửi chỉ disabled khi đang gọi API, không disabled khi nghỉ**; lỗi gửi thì focus ô sai đầu tiên; toast chỉ cho lỗi hệ thống/hiệu ứng vô hình.
- **Tin cậy** chỉ bằng thứ có thật: số hotline, địa chỉ văn phòng, "đã gồm VAT", chính sách huỷ, logo ngân hàng thật, đồng hồ giữ chỗ. Không lời chứng giả; đánh giá chỉ khi nguồn có (route landing có 5 đánh giá thật cho Sài Gòn-Vũng Tàu).
- **Ảnh**: ảnh thật (xe, bến, điểm đến), to hoặc không dùng (>= 6/12 cột, cao >= 440px), một chủ thể mỗi khung, tối đa ~1/3 trang dưới hero, không hai section ảnh liền nhau, không tường ảnh, không minh hoạ vẽ, không ô trống; chữ đè ảnh phải có scrim từ cạnh chữ 35-65% đạt 4,5:1; ảnh hero là LCP (`fetchpriority=high`), còn lại lazy, có width/height. Không dùng stock; thư viện Wikimedia của Hallmark không dùng cho ta.

| Trang | Áp dụng |
|---|---|
| Home (WP) | Job = đặt vé. Hero kiểu Counter: h1 ngắn + 1 câu + form tìm là "hình"; tuyến phổ biến là lưới ảnh thật + giá; giữ đủ block cũ nhưng mỗi block đặt thành một composition khác nhau (lưới, hàng, rail); kết bằng hotline/tải app (không email). Chữ thân 16px. |
| Landing tuyến + danh sách chuyến (Next) | Form tìm gọn ngay trên; dòng sự thật tuyến (giá TB, giờ, km) tách span, không `•`; danh sách chuyến = Index/Schedule (hàng dày, cột giờ cố định, hàng đầu nổi); 10 block nội dung parity gom bằng Rows/Table/Rail/Switcher (xe = Switcher, văn phòng = Rows, đánh giá = Rail), FAQ cuối; không thêm block. |
| Sơ đồ ghế | Màn app: legend + sơ đồ + thanh dính dưới (mobile) gồm ghế đã chọn, tổng tiền, nút "Tiếp tục" (mẫu Offer/sticky price bar). Trạng thái ghế không chỉ bằng màu. |
| Xác nhận | Form theo luật trên; cột phải thu thành thanh timer + tổng ở mobile; ô "Chi tiết giá" là bảng hàng kẻ, tổng có vạch 2px. |
| Thanh toán | Danh sách radio là các thẻ cả khối bấm được; nút "Thanh toán" kèm tổng, dính đáy mobile; lỗi/đang xác minh có chữ rõ, không chỉ màu. |
| Tài khoản | Màn app: bảng/hàng trước thẻ, 4 trạng thái dữ liệu (đang tải skeleton, trống 1 hành động, lỗi + cách xử lý, đầy), trạng thái tab/lọc nằm trong URL, huỷ vé = xác nhận có nêu rõ hậu quả. |

## 3. Shortlist theme và token (giữ #FFC20E + Nunito)

Chọn theo vật liệu hợp thương hiệu vàng ấm của vận tải: phẳng, ít bóng, ít kết cấu (máy Android rẻ không gánh nổi grain/blur), tương phản mạnh.

| | A. **Ink** (board) | B. **Wayfind** | C. **Hum** |
|---|---|---|---|
| Vật liệu gốc | giấy trắng, mực đen không sắc, Epilogue 700/400, vạch 1px; colourway *board* = nền vàng bảng thông báo `oklch(93% .10 95)`, vạch `oklch(84% .10 92)`, ô trắng | giấy xám lạnh, mực xanh-đen, Chivo Mono, viền mực 2px, "tấm bảng" (plate) nền mực chữ hổ phách, cobalt = đang chạy | giấy kem hạt sợi, mực xanh-đen, Chillax 17-19px, thẻ bìa cứng bấm xuống, vàng-lê `oklch(87% .175 96)` là nút chính |
| Nền / surface | `#F8F8F8` / `#FFF`, ô nhấn `accent-soft #FFF3CD` | `#F8F8F8` / `#FFF`; vùng ink `#333` cho bảng giờ | `#F8F8F8` / `#FFF`; bỏ grain, mép xé |
| Viền | thẻ 1px `#E2E3E5`; ô nhập 1px `#767779`; vạch đầu danh sách 1px `#333` | 2px `#333` trên ô nhập/nút phụ; hàng 1px | 1px `#767779` ô nhập |
| Chữ / muted | `#212529` (heading `#333`) / `#58595B` | như A, tabular, đậm 800 cho giờ | như A |
| Dùng vàng | chỉ **nền** nút/tab/ghế/ô nhấn, chữ ink `#333` (7,8:1); không bao giờ chữ vàng | vàng trên nền ink cho con số (thay hổ phách); nút chính vàng | nút chính vàng + cạnh dưới 3px `#D9A400` |
| Radius | 4 control, 8 thẻ (giữ brand; Ink gốc 10/12) | 0 gốc, ta giữ 4 | gốc 14-24, ta cắt còn 4/8 |
| Bóng | không bóng khi nghỉ; chỉ menu/dialog nổi `0 8px 20px rgba(0,0,0,.18)` | không bóng thẻ | cạnh đặc, không blur |
| Type | Nunito 400/600/800, thân 16, nhãn 14 | thêm `tabular-nums` cột giờ/giá | Nunito 600 thân 17 cho trang đọc |
| Nhịp | 4/8/12/16/24/40/64; giữa block 32 (mobile) 48-64 (desktop) | như A | như A |
| Chuyển động | tĩnh: đổi màu 120-220ms, không reveal | `steps(1)`, bảng cập nhật tại chỗ | nút ép 1-5px, bỏ spring |

Luật riêng của từng theme cần nhớ: **Ink**: một màu duy nhất "có nghĩa" (ở ta = vàng = hành động), trạng thái hết/đóng là viền xám chứ không đỏ, mực đen không sắc (ta giữ `#333` chuẩn brand), thẻ phẳng, bóng chỉ cho thứ nổi trên trang, thanh danh sách mở bằng vạch ink 1px. **Wayfind**: viết như biển báo (giờ, bến, số), con số 800 ở size tiêu đề trở lên, hổ phách/vàng chỉ trên nền ink, mọi ô viền cứng, không gradient/texture. **Hum**: mỗi màu một việc, nút nhấn có "cạnh" (5px) xuống 1px khi bấm, giọng thân thiện, ảnh ban ngày không mặt người nhìn thẳng; phần grain/xé giấy/spring bị loại.

**Khuyến nghị: A (Ink, board) làm nền hệ thống**, vay 2 mảnh: bảng giờ/plate số của B cho thẻ chuyến và hộp giá, cạnh-nhấn nút chính của C. Lý do: (1) phẳng, không texture nên mượt trên máy yếu, "mướt mắt" nhờ vạch mảnh và khoảng thở; (2) triết lý một-màu-có-nghĩa trùng với "vàng = bấm được"; (3) danh sách hàng kẻ khớp danh sách chuyến/lịch sử vé; (4) hợp giọng "tử tế, đúng giờ" của bến xe địa phương; (5) cần đổi ít nhất so với token hiện có (không đổi bố cục, nhãn, thứ tự bước).

Token đề xuất (thêm vào `globals.css` / `tokens.php`; `#FFC20E`, `#333`, Nunito giữ nguyên):
```
--hv-yellow #FFC20E | hover #F2B600 | edge #D9A400 | soft #FFF3CD   (chữ trên vàng luôn #333)
--hv-bg #F8F8F8 | surface #FFF | rule #E2E3E5 | field-edge #767779 (4,5:1) | sold #E4E5E7
--hv-text #212529 | dark #333 | muted #58595B (đừng dùng trên vàng: 4,3:1)
--hv-danger #C62828 (5,6:1, thay #E53935 4,2 và #BB0000) | success #2E7D32 (5,1) | link #0A5FB4 (6,0; thay #1890FF 3,2)
--hv-focus #333 (2px, offset 2) | radius 4 control / 8 thẻ | shadow-float 0 8px 20px rgba(0,0,0,.18)
chữ: 14 nhãn (sàn) · 16 thân/ô nhập · 18 tiêu đề hàng · 20-24 giờ & giá · 28-32 h1 (22 h2 mobile) · line-height 1.5-1.6
```
Tuỳ chọn (cần chủ duyệt): nghiêng nhẹ nền/ink về hue vàng (vd. nền `#F9F8F5`) theo gate 22 "neutral có sắc"; mặc định giữ `#F8F8F8` cho parity.

**Thích ứng người lớn tuổi / máy Android rẻ**
- Thân và ô nhập >= 16px (16px chặn iOS zoom), nhãn >= 14px, không chữ < 12px (hiện có `text-[11px]`, `text-xs`).
- Vùng chạm >= 48px cho nút chính, >= 44px cho còn lại, khoảng cách >= 8px giữa hai thứ bấm được; radio/checkbox bấm cả khối thẻ.
- Tương phản cao: chữ >= 4,5:1, viền ô nhập/ghế/vòng focus >= 3:1; trạng thái luôn có chữ hoặc icon kèm (chọn = nền vàng + dấu tick; hết = gạch chữ + nhãn), không chỉ màu.
- Không phụ thuộc chuyển động: không reveal, không parallax, không carousel tự chạy; đồng hồ giữ chỗ có chữ ("còn mm phút ss giây"), mọi hiệu ứng có `prefers-reduced-motion`.
- Nút có động từ rõ ("Chọn ghế", "Thanh toán"); lỗi nằm cạnh ô sai, không biến mất như toast; không cử chỉ ẩn (double-click chọn ngân hàng là điểm cần xem lại, parity cũ).
- Máy yếu: không `backdrop-filter`/blur/grain/CSS 3D, bóng nhẹ, Nunito woff2 subset latin+vietnamese chỉ 400/600/800 và `font-display: swap`, ảnh có kích thước + lazy + `srcset`, danh sách dài cân nhắc `content-visibility: auto`.

## 4. Polish backlog (màn hình, thay đổi, luật Hallmark)

P0 = sai tương phản/vùng chạm, P1 = trạng thái và lỗi, P2 = tinh chỉnh. Tất cả giữ bố cục, nhãn và thứ tự bước hiện có.

1. **Token toàn cục** (`globals.css`, `inc/tokens.php`): thay danger `#E53935`/`#BB0000` → `#C62828`, link `#1890FF` → `#0A5FB4`, thêm `field-edge`, `rule`, `accent-soft`; xoá literal `#fff7dc`, `#349D0E`, `#9E9E9E`. P0. (40, 48)
2. **search-form**: ô ngày/số người `bg-hv-input` không viền (L88, L92; #EDEEEE trên trắng 1,2:1) → viền 1px `#767779`, cao 48, chữ 16; vòng focus `focus:ring-hv-yellow` (1,6:1) → outline `#333` 2px. P0. (40, 26a, 39a)
3. **search-form**: thiếu điểm đi/đến chỉ `toast.warning` (L42-43) → lỗi dưới ô + `aria-invalid` + focus ô sai; toast chỉ lỗi hệ thống. P1. (forms, 16)
4. **search-form**: tab `px-4 py-3` 14px (L49-60) → cao 48, chữ 16, tab chọn đậm + gạch 3px, hàng tab cuộn ngang không xuống dòng, tab liên kết có đủ `role`. P1. (craft §9 nav/tab, 49, 39b)
5. **search-form**: nút đổi chiều `p-2` + `size-5` (L71-82) = 36px → vùng chạm 44-48px (mở rộng `::before`); số người `type=number` → stepper −/+ 48px, số `tabular-nums`. P1. (hit targets, Piste stepper)
6. **price-box**: giá chữ `text-hv-yellow` trên trắng 1,62:1 (L17, L21, L29) và `trip-card` L35 → giá `#333` 800 24px; vàng chỉ làm nền chip giá thấp nhất/"sắp hết"; giá gạch muted. P0. (40, 41)
7. **price-box**: nhãn `-x% Hôm nay` trắng/`#E53935` 4,2:1 và "đã gồm thuế VAT" `text-[11px]` (L14, L22) → `#C62828` + 13-14px. P0. (40, 75)
8. **trip-card**: giờ `w-12 font-bold` 16px, timeline `border-dashed border-hv-gray` 1,6:1 (L40-57) → cột giờ cố định 56px, 20px/800 `tabular-nums` (bảng giờ Wayfind), trục 2px `#767779` có nút tròn đầu/cuối. P1. (Wayfind Range, 40, F6)
9. **trip-card**: "hết chỗ" `#BB0000`, "≤3 chỗ" chữ vàng, dòng `*Khởi hành` đỏ 14px (L33-35, L71) → pill có chữ: hết = xám + gạch, sắp hết = ink trên `accent-soft`, dòng khởi hành ink trên băng `accent-soft` + icon. P1. (40, "never colour alone")
10. **trip-card**: cả thẻ là một `<button>` bọc `h3` + `ol` (L27-69), chỉ chevron báo "mở" → nút có `aria-controls`; thêm chữ "Chọn ghế" cạnh chevron (nhãn mới, **cần chủ duyệt** vì guidelines giữ nhãn); trạng thái `:active`, `:focus-visible`. P1. (26b, buttons = verb)
11. **seat-grid**: ghế trống `border-hv-seat-border` #CACBD0 1,6:1, chọn = `#fff7dc` gần như trắng (L36-41) → viền 2px `#767779`; chọn = nền `#FFC20E` + chữ #333 + dấu tick; đã đặt = `#E4E5E7` + tên gạch. P0. (40, 48, state not colour alone)
12. **seat-grid / legend**: chữ ghế `text-[11px]`, ô 44x60 (L35), legend ô 16px (L62) → tên ghế 16/700, giá 12px, ô >= 44x64, legend ô 20px đúng hệt trạng thái thật + chữ 15px. P1. (75, hit targets)
13. **seat-panel**: nút `text-hv-muted` trên vàng 4,3:1, và xám + chữ trắng khi chưa chọn ghế, bấm không phản hồi (L103-110, `keepSeat` return im lặng) → chữ #333, luôn bấm được, chưa chọn thì dòng `aria-live` "Chọn ít nhất 1 ghế"; mobile: thanh dính đáy (ghế chọn, tổng, nút). P0. (40, forms "disabled chỉ khi gọi API", Offer sticky bar)
14. **confirm-form**: lỗi nhập chỉ `toast.warning` (L72) và nút `h-12` + `›` dính (L85-86) → lỗi cạnh ô + focus ô sai đầu; nút cao 56, full-width mobile, `Tiếp tục` + icon ChevronRight; câu chính sách đặt trên nút. P1. (forms, 63, 39b)
15. **confirm-form + summary Countdown**: `aside` nằm sau form nên mobile không thấy đồng hồ (L90-94), timer `aria-live="off"` chỉ số (L23) → mobile: thanh timer + tổng dính trên; thêm chữ "Còn mm phút ss giây", dưới 2 phút đổi nền `accent-soft` + chữ "Sắp hết thời gian giữ chỗ" (không chỉ màu). P1. (never colour alone, responsive reading order)
16. **summary / payment (Chi tiết giá)**: thẻ `shadow-sm` mờ (L38, L67), `text-sm`, tổng `text-lg` → thẻ phẳng viền 1px, hàng 16px, tổng 22px/800 có vạch 2px `#333` phía trên; thay `text-[#349D0E]`. P2. (surface ladder, F24, Furrow total rule)
17. **payment-page**: nút "Thanh toán ›" (L149-150) nằm đầu `aside`, mobile chìm → thanh dính đáy "Thanh toán + tổng", bỏ glyph `›`, 56px. P1. (Offer sticky bar, 63)
18. **payment-page**: lỗi `text-hv-danger` 4,2:1 (L73), "Thử lại"/"Làm mới" `py-2` ~36px (L74, L84) → danger mới + icon, nút 48px; trạng thái "đang xác minh" in đậm câu "Vui lòng không thanh toán lại". P0. (40, 39b)
19. **method-list**: radio `size-4` accent vàng (L49), thẻ chọn `ring-hv-yellow` 1,6:1 (L40), chỉ nhãn bấm được → cả thẻ là `<label>`, radio 22px accent `#333`, thẻ chọn viền 2px `#333` + nền `accent-soft`; hover/active/focus đủ. P0. (26a, 40, hit targets)
20. **method-list**: chuyển khoản `dl text-sm` 14px (L75-82) → 16px; thêm nút "Sao chép" (đổi chữ 2,5s, không toast) cho số tài khoản/nội dung CK; ghi chú `text-[#BB0000]` → danger mới. Double-click chọn ngân hàng (L65) cần xem lại. P1. (microinteractions copy, 75)
21. **site-header** (+ WP `.hv-nav__link`, `.hv-burger`): link nav 14px, burger 40px, `w-8` ngôn ngữ → 16px, vùng chạm 48px, mục "Đăng nhập" nhận dạng nút. Nền vàng 64px giữ (posture Committed). P1. (39b, 23)
22. **site-footer**: `✓` glyph (L19-22), `text-xs` 12px (L47), link `text-sm` (L36) → icon Check của lucide, 14px công ty, link 16px cao 44px, nút store `py-2` → 44px. P1. (30a, 75, hit targets)
23. **WP front-page**: hero `linear-gradient(rgba(0,0,0,.35)...)` phẳng + chữ trắng (front-page L18, site.css L93) → scrim từ cạnh chữ 35-65% đạt 4,5:1 trên ảnh sáng, h1 `text-wrap: balance`, h1+sub+form thấy ở 1280x800, kết trang bằng hotline/tải app. P1. (imagery §5 scrim, 44b)
24. **WP site.css**: body 14px (L3), `.hv-section__title` 23px (L86), `.hv-section` padding 24px (L85), `.hv-route__cta` ~32px (L103), card chỉ hover (L98) → thân 16, h2 28, khoảng giữa section 40-56, CTA/cả thẻ 48px với nhãn "Đặt vé", thêm `:active`/`:focus-visible`. P1. (78, 39b, 26b)
25. **WP buttons & search.css**: `.hv-btn-outline` 36px (L15), `.hv-btn` thiếu `:active`/`:disabled`, `search.css` L18 nhóm nhãn HOA + giãn chữ 12px → 44-48px, đủ 8 trạng thái, nhãn nhóm chữ thường 14px, thêm `font-display: swap` + `@media (pointer: coarse)` cao 48. P1. (67, 75, 26b)

## 5. Không nên mượn từ Hallmark

- **Quy trình**: deal theme/shape/hero rotation, Picks block, stamp CSS dòng đầu, `.hallmark/log.json`, `sloplint`, `capture`, review agent. Dành cho việc sinh trang mới, lại đòi chạy Node/puppeteer; ta redesign trang cố định, không chạy script từ ref.
- **Luật "đa dạng giữa các lần build"** (gate 8, 32, 42): ta cần nhất quán một hệ thống, ngược lại với xoay vòng.
- **"Không thẻ trắng trên nền có màu"** (surface ladder): ta giữ thẻ trắng trên `#F8F8F8` vì brand và parity; chỉ đổi từ bóng mờ sang viền 1px.
- **Thang cỡ marketing** (hero 84px, h2 52px, section gap 120-176px, container 1440): quá to cho form + danh sách chuyến; ta dùng 28-32/22-28 và container 1200.
- **Radius theo theme** (Ink 12, Hum 24, Wayfind 0): brand chốt 4px/8px.
- **Cấm mũi tên/chấm trong mọi nhãn**: chỉ áp cho phần ta viết mới; nhãn nghiệp vụ parity (`Tiếp tục`, "Từ ... đ") không đổi chữ, chỉ thay glyph `›`/`•` bằng icon/khoảng cách.
- **Kết cấu, grain, mép giấy xé, spring, 3D, canvas map** (Hum, Dose, Furrow, Coral): nặng với Android rẻ.
- **Ảnh thư viện Wikimedia, "slot", chính sách tự vẽ sản phẩm**: ta có ảnh thật từ CMS/WP; không lấy stock, không dựng ảnh giả.
- **Luật copy tiếng Anh** (gate 19, từ cấm, "câu ngắn 12 từ"): nội dung VN lấy nguyên từ web cũ/MKT; chỉ dùng tinh thần "nói như chủ nhà xe".
- **Ngân sách chữ "~80 từ/màn, 450 từ/trang"** cho 10 block của landing tuyến: parity bắt giữ nội dung; chỉ áp cho hero.
- **Dark mode** (`dark-mode.md`): chưa trong phạm vi.
- **Bỏ nút/nhãn mới** nếu chưa được duyệt: guidelines cấm đổi tên trường/nhãn nghiệp vụ và thêm bước (vd. stepper "Bước 2/4", nhãn "Chọn ghế" cần chủ duyệt).

## 6. Gợi ý design system từ công cụ khác (Flat, Atkinson Hyperlegible, xanh/cam)

**Bỏ phần phong cách và màu; chỉ giữ tinh thần "dễ đọc".** Lý do ngắn: (1) vàng `#FFC20E` + Nunito là nhận diện và nằm trong yêu cầu parity của chủ; xanh/cam làm khách quen không nhận ra nhà xe; (2) "Flat" thực ra là hướng ta đã có (phẳng, hairline), không cần nhãn riêng; (3) Atkinson thiết kế cho khác biệt chữ Latin, **chưa kiểm tra đủ dấu tiếng Việt** (Nunito có subset vietnamese, đã dùng trên web cũ), và đổi font phải tải thêm file cho máy yếu; (4) mục tiêu khả dụng đạt được bằng số đo ở mục 3 (cỡ, tương phản, vùng chạm) chứ không cần đổi font hay palette. Nếu vẫn muốn thử Atkinson, chỉ cho một A/B có đo, sau khi xác nhận bộ glyph tiếng Việt.

## Câu hỏi còn mở
- Có duyệt thêm nhãn "Chọn ghế" cạnh chevron và stepper số người (mục 4 #5, #10) không?
- Có đổi nền/ink sang tông ấm nhẹ (gate 22) hay giữ đúng `#F8F8F8`?
- Double-click chọn ngân hàng (method-list L65) có thật sự là hành vi parity cần giữ?
- Agent khác đang sửa `wordpress/`: các mục #21-25 cần phối hợp để không đè.
