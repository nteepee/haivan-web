# v4 — "Kính chức năng" + bo góc theo logo (đề xuất, 2026-10-29)

Nguồn: audit UI hiện tại (v3), ak:ui-ux-pro-max (style DB + checklist), hallmark (`archive/ref/hallmark`, Floor/Reflex/Finish), hình học logo `apps/booking/public/assets/images/logo.svg`.

## 1. Audit v3 — vì sao trông "phẳng, viền đen, cũ"
| Vấn đề | Đo được | Quy tắc vi phạm |
|---|---|---|
| Viền đen dày khắp nơi | ~130 chỗ: `border-ink` 34, `border-color: ink` 30, `border-2` 23, `line-strong ink` 17, gạch ngang ink 15 | ui-ux-pro-max `elevation-consistent`, `effects-match-style`; hallmark F24 (viền mảnh dưới bóng mềm) |
| Bo góc lẫn lộn | 6/12/20 + pill (22 chỗ) + `rounded-sm/md/lg/full` + 4 kiểu bo ghép (`r-sm 0 0 r-sm`, `r-lg r-lg r-md r-md`…) | hallmark F15 (một bán kính cho mỗi tầng lồng), F7 (pill ≥5 chỗ không phải control/tag) |
| Bán kính không liên quan thương hiệu | 6/12/20 chọn tuỳ ý | Apple: một hình học, mọi thành phần suy ra từ đó |
| Chiều sâu chỉ bằng viền | 0 `backdrop-filter`; 3 mức bóng nhưng viền đen đè lên | `elevation-consistent`, `blur-purpose` |

## 2. Hình học logo HAIVAN
- Chữ khối, mỗi góc ngoài là **góc bo đều r ≈ 1,95–2,0 đơn vị trên chiều cao chữ 24** (thân H, I, đáy V, chân A/N) → **tỉ lệ thương hiệu k = r / chiều cao ≈ 1/12 (8,3%)**.
- Đỉnh trong (A, V, N) **sắc nhọn**, cạnh chéo cắt thẳng. Không có hình tròn.
- Nghĩa là: thương hiệu "cứng cáp, bo nhẹ" — không phải pill tròn, không phải vuông sắc.

## 3. Hệ bo góc mới (cố định, suy ra từ logo)
Quy tắc: **bán kính = chiều cao (cạnh ngắn) của phần tử × 1/12, làm tròn về bậc 4px**, rồi khoá thành 4 bậc. Phần tử lồng trong phần tử khác dùng **bán kính đồng tâm**: `r_trong = r_ngoài − padding` (tối thiểu 4).

| Token | Giá trị | Dùng cho (cạnh ngắn ≈) | Ví dụ |
|---|---|---|---|
| `--r-1` | 4px | ≤ 56px (×1/12 = 4) | nút, ô nhập, chip, nhãn, ghế, tab, ảnh thumbnail nhỏ |
| `--r-2` | 8px | ~96px | thẻ chuyến (dòng), thẻ ưu đãi nhỏ, ảnh trong thẻ, menu thả |
| `--r-3` | 16px | ~192px | card lớn, form tìm, sheet/dialog, thanh dính đáy |
| `--r-4` | 24px | ≥ 288px | banner hero, ảnh lớn, khung bản đồ |
| tròn | 50% | chỉ nút chỉ-có-icon vuông (FAB gọi, mũi tên rail) | — |

Bỏ: pill cho nhãn/badge (dùng `--r-1`), mọi bo ghép tuỳ ý, `rounded-*` lẻ.

## 4. Kính — dùng ở đâu (và không dùng ở đâu)
Kết luận: **"kính chức năng" kiểu Apple, không phải glassmorphism trang trí.** Hallmark coi glassmorphism/blob mờ là dấu hiệu UI máy sinh (comp.md, gate 29); ui-ux-pro-max: `blur-purpose` — blur để báo "lớp nổi phía trên", không để trang trí; Liquid Glass hiệu năng kém, khó đạt tương phản (khách lớn tuổi, Android rẻ).

| Có kính (lớp nổi trên ảnh/nội dung) | Không kính (nền đặc) |
|---|---|
| Header khi cuộn (vàng 85% + blur) | Thẻ chuyến, thẻ ưu đãi, nội dung bài viết |
| Form tìm vé đè lên banner ảnh | Bảng giá, sơ đồ ghế, form nhập dài |
| Thanh tổng tiền dính đáy, thanh lọc dính | Footer, dải app |
| Dialog/sheet + nền mờ phía sau, popup | Mọi chữ nhỏ < 16px nằm trực tiếp trên kính |
| Chip/nhãn đặt trên ảnh (giá trên ảnh tuyến) | — |

Công thức kính (token): `--glass-bg: color-mix(in oklch, var(--color-surface) 78%, transparent)`, `--glass-blur: 16px` (mobile 12px), `saturate(160%)`, viền trong 1px trắng 60% + bóng `--shadow-float`. Bắt buộc: `@supports not (backdrop-filter: blur(1px))` và `@media (prefers-reduced-transparency: reduce)` → nền đặc; chữ trên kính luôn ≥ 4,5:1 (đo trên ảnh sáng nhất); tối đa 3 lớp kính trên một màn.

## 5. Bỏ viền đen — chiều sâu bằng ánh sáng
- Viền: chỉ còn `--line` 1px màu `rule` (xám ấm) cho ô nhập + vạch phân cách. Bỏ toàn bộ viền ink 2px; trạng thái chọn = nền `accent-soft` + vòng 2px vàng đậm (`accent-edge`) + dấu tích (không chỉ màu).
- Bóng 3 mức như Apple: `--shadow-1` (thẻ: 0 1px 2px + 0 2px 8px, 6–8%), `--shadow-2` (nổi: 0 8px 24px 10%), `--shadow-3` (dialog: 0 24px 48px 16%).
- Focus: vòng 2px `ink` + khe 2px (giữ — a11y), không phải viền thường trực.

## 6. Bước làm
1. Bản dựng `home-v4.html` + `search-results-seat-v4.html` + bảng quy chuẩn bo góc (ảnh) → anh duyệt.
2. Áp: tokens (`--r-1..4`, `--glass-*`, `--shadow-1..3`), thay ~130 viền đen, chuẩn hoá bo góc toàn Next + WP, kính cho 5 vị trí ở mục 4; script kiểm tra cấm bán kính/viền ngoài bộ token.
