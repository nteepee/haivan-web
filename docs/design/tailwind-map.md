# Token sang tiện ích Tailwind 4 (apps/booking)

Nguồn (v4, khoá): `docs/design/tokens-v4.css` (bản sao nguyên văn: `apps/booking/src/app/tokens.css`; kiểm: `diff docs/design/tokens-v4.css apps/booking/src/app/tokens.css`). `tokens.css` v3 trong thư mục này chỉ là lịch sử.
Cầu nối: `apps/booking/src/app/theme-map.css` (`@theme inline`, tiện ích đọc thẳng `var(--...)`). Lớp thành phần: `hv-components.css`, `hv-states.css`, `hv-layout.css`, `hv-fab.css`, `hv-footer.css`, `hv-booking.css`, `hv-sticky.css`, `hv-trips.css`, `hv-trips-panel.css`, `hv-seats.css`, `hv-depth.css`, `hv-rail.css`, `hv-filters.css`, `hv-search.css`, `hv-route.css`, `hv-marketing*.css`.
Quy tắc: không px, hex, rgba thô trong component; chỉ tiện ích bên dưới hoặc `var(--token)`. Kiểm: `node docs/design/check-tokens.mjs` (quét CSS và class TSX của `apps/booking/src`, báo `file:dòng`).

## Màu (tên tiện ích = token bỏ `--color-`)
`bg-/text-/border-/ring-/outline-/fill-` + : `accent`, `accent-hover`, `accent-edge`, `select-edge`, `accent-soft`, `accent-ink`, `field`, `paper`, `surface`, `paper-2`, `paper-3`, `ink`, `ink-deep`, `text`, `muted`, `muted-on-dark`, `rule`, `rule-2`, `edge`, `sold`, `scrim`, `focus`, `error`, `error-soft`, `success`, `success-soft`, `link`.
Vàng chỉ làm nền (`bg-accent`), chữ trên vàng là `text-accent-ink`; `text-muted` không dùng trên vàng.
Tên shadcn vẫn chạy và đã trỏ về token: `bg-background`=paper, `text-foreground`=text, `bg-card/popover`=surface, `bg-primary`=accent, `text-primary-foreground`=accent-ink, `bg-secondary`=paper-2, `text-muted-foreground`=muted, `bg-accent`=accent (vàng, không còn soft), `border-border`=rule, `border-input`=edge, `text-destructive`=error. Với nền xám nhạt dùng `bg-paper-2` (không dùng `bg-muted`: `muted` là màu chữ).
Tên `hv-*` cũ (`bg-hv-yellow`...) đã gỡ; dùng tên token.

## Chữ
`text-14 text-16 text-18 text-20 text-24 text-32 text-40 text-48` (kèm line-height 20/24/28/28/32/40/48/56; `text-48` chỉ cho hero từ 60rem), `text-h1 text-h2 text-h3 text-lead` (đổi cỡ từ 60rem). `text-xs/sm` = 14, `text-base` = 16, `text-lg` = 18, `text-xl` = 20, `text-2xl` = 24, `text-3xl` = 32, `text-4xl` = 40. Độ đậm: thân 400 (mặc định), `font-semibold` 600, tiêu đề `font-extrabold` 800 (h1-h3 đã mặc định 800). `tabular-nums` cho giờ, giá, số ghế. `font-sans` / `font-display` = Nunito.

## Khoảng cách (thang 4px)
`p-1`=s-1=4, `2`=8, `3`=12, `4`=16, `6`=24, `8`=32, `12`=48, `16`=64, `24`=96 (cho mọi `p- m- gap- space- size- w- h-`). Không dùng bậc lệch thang (`p-5`, `p-7`, `gap-10`...). Khoá ngữ nghĩa: `px-gutter`, `py-section`, `p-card` (card-pad), `gap-cards` (gap-card), `gap-field` (12), `mb-title` (24), `h-control` (48), `h-control-lg` (52), `min-h-tap` (44), `h-header` (64), `size-icon` (24), `max-w-page` (1200).

## v4: bo góc, viền, bóng, chọn, kính (khoá, thay mục v3 cũ)
**Bo góc** (chỉ 4 bậc + tròn; nội dung dừng ở bậc 3; lồng đồng tâm: trong = ngoài − padding, tối thiểu bậc 1):
| Class | Token | Giá trị | Dùng cho |
|---|---|---|---|
| `rounded-1` | `--r-1` | 4 | nút, ô nhập, chip, nhãn, huy hiệu, ghế, tab, thumbnail nhỏ |
| `rounded-2` | `--r-2` | 8 | ảnh trong thẻ, hàng chuyến, menu/popover, ô tab nền |
| `rounded-3` | `--r-3` | 16 | thẻ, form tìm, dialog/sheet, thanh dính, khung xe |
| `rounded-4` | `--r-4` | 24 | CHỈ ảnh/banner/bản đồ |
| `rounded-round` | `--r-round` | 50% | CHỈ nút vuông chỉ-có-icon (gọi, mũi tên rail, swap, đóng, avatar) |
Có hướng: `rounded-t-3`, `rounded-tl-2`... cùng bậc. Tên Tailwind/shadcn cũ vẫn biên dịch nhưng `check-tokens.mjs` báo lỗi: `rounded-xs|sm` → `rounded-1`, `md` → `rounded-2`, `lg|xl|2xl+` → `rounded-3`, `full` → `rounded-round` (cũ `rounded-full` đã được ánh xạ thành 50%, nên chỉ đúng với ô vuông), `pill` → `rounded-1`. Cấm `rounded-[...]`, `rounded` trần, `style={{ borderRadius }}`.

**Viền** (không còn viền đen/2px):
| Cần | Dùng |
|---|---|
| Ô nhập, select, textarea | `border border-edge` (1px) |
| Vạch phân cách | `border-t border-rule` (1px; `border-rule-2` mờ hơn) |
| Lỗi ô nhập | `border-error` |
| Đang chọn | `bg-select select-ring` + icon tick (không bao giờ chỉ màu) |
| Focus | vòng 2px ink có sẵn ở `:focus-visible` (đừng `outline-none`) |
Cấm: `border-2`, `border-t-2`..., `border-ink|black|text|foreground`, `border-[...]`.

**Bóng** (`shadow-1/2/3`; `shadow-card|float|raise` là bí danh cũ, cùng giá trị):
| Class | Dùng cho |
|---|---|
| `shadow-1` | nghỉ: thẻ, hàng, nhóm ô, header nghỉ, tab chọn, nút tròn nhỏ |
| `shadow-2` | nổi: hover thẻ, kính nổi, menu, popover, thanh dính, nút gọi, toast |
| `shadow-3` | dialog, sheet |
| `shadow-none` | còn lại. `shadow-sm|xs` = none, `shadow-md` = 1, `shadow-lg|xl` = 2, `shadow-2xl` = 3 |

**Chọn**: `bg-select` (= `--select-bg`, accent-soft) + `select-ring` (= `--select-ring`, vòng 2px select-edge, 3,8:1 trên trắng) + tick. Ví dụ ghế đang chọn: `bg-accent select-ring` + icon Check.

**Kính** (chỉ lớp nổi; chữ ≥16px, ≥4.5:1; tối đa 3 lớp/màn):
| Lớp | Class | Ghi chú |
|---|---|---|
| Header đã cuộn > 8px | `glass-yellow` | bật bằng listener scroll `passive`, chỉ đổi nền + bóng nên không xô layout |
| Form tìm đè banner, thanh lọc dính, thanh tổng/tóm tắt dính, dialog/sheet | `glass` | dialog/sheet thêm scrim `bg-scrim` |
`.glass`, `.glass-yellow` nằm trong `tokens.css` (có `@supports not (backdrop-filter)` và `prefers-reduced-transparency` về nền đặc). Biến: `--glass-bg`, `--glass-bg-yellow`, `--glass-blur`, `--glass-saturate`, `--glass-edge`. Tiện ích phụ trong `theme-map.css`: `select-ring`, `hairline` (= `border: var(--hairline)`), `bg-select`, `blur-glass`.

**Tab phân đoạn** (tìm vé): track `bg-paper-2 rounded-2 p-1 gap-1`, đoạn `rounded-1 min-h-tap`, chọn = `bg-surface shadow-1 font-extrabold`. **Chip lọc**: `bg-paper-2 rounded-1 min-h-tap`, bấm = `aria-pressed` → `bg-select select-ring` + tick.

## Chuyển động và vạch khác
- `border` = `--line` 1px; chuyển động: `duration-(--dur-micro)`, `ease-(--ease-out)`; chỉ màu và lún 1px. z-index: `z-(--z-sticky)` / `--z-dropdown` / `--z-modal` / `--z-toast`.
- Màu phụ v3: `bg-promo-{orange,teal,coral,leaf,blue}` đi với `text-on-{...}` (cam dùng chữ ink), tông nhạt `bg-promo-*-soft` dùng chữ ink; `bg-tint-warm` cho nền section vàng ấm. Chữ cỡ hero: `text-display` (32, 48 từ lg).

## Lớp dựng sẵn (`@layer components`)
Nút `hv-btn` + `hv-btn-primary|hv-btn-outline|hv-btn-ghost` + `hv-btn-lg|sm|block` · ô `hv-field`, nhãn `hv-label`, lỗi `hv-err`, gợi ý `hv-hint` · thẻ `hv-card`, biển `hv-plate`, ảnh `hv-photo` · `hv-tag` (+`-in|-out|-ok|-bad`) · `hv-notice` (+`-error`) · `hv-link` · `hv-container` · bước `hv-steps` (React: `components/ui/stepper.tsx`).

## Lớp v3 (app-style)
- Nền section (`hv-depth.css`): `hv-section-white|warm|grey|yellow`; `hv-ground` tự xoay trắng, ấm, xám theo thứ tự các section liền kề (SectionCard dùng lớp này, nên khối tuỳ chọn vắng mặt vẫn không có hai nền giống nhau liền nhau). `hv-section-soft` = nền ấm, `hv-band` = nền xám (tên cũ còn chạy).
- Huy hiệu: `hv-badge` + `-sale|-new|-orange|-blue|-leaf|-few|-photo` (chữ nhật `rounded-1`; `-few` = san hô nhạt cho "Còn ít chỗ", cũng r-1); trạng thái cũ `hv-tag-*` giữ nguyên, thêm `hv-tag-on` (ghế đang chọn).
- Icon: `hv-ico` (+ `-teal|-coral|-leaf|-blue|-sm`), ô vuông 48 `rounded-1` chứa icon lucide nét 2. Chip lọc: `hv-chip` (`aria-pressed` = `bg-select` + vòng chọn + tick).
- Rail (`hv-rail.css`, component `components/ui/rail.tsx`): `hv-rail` scroll-snap + mép mờ phải (`--rail-bg` theo nền), mũi tên `hv-rail-btn` ở `hv-sec-head` từ 60rem; `hv-rail-3` thành lưới 3 cột từ 60rem.
- Thẻ: `hv-card`, `hv-trip`, `hv-rcard`, `hv-ccard` có `shadow-1` lúc nghỉ, hover `shadow-2`, không viền; `hv-plate` (thẻ tìm vé nổi) là kính (`glass`, `shadow-2`), không viền.

## Cho WordPress
`tokens.css` dùng nguyên; tên lớp `hv-*` trong `hv-components.css` có thể chép sang theme (cùng biến `--color-*`, `--s-*`, `--r-1..4`, `--shadow-1..3`, `.glass`).
