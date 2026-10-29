# Design: Hải Vân (haivan.com)

The locked system: **v4 "kính chức năng" + logo radius** (owner-approved 2026-10-29), on top of the v3 app-style palette and rhythm. Pages share it; change it on purpose. Source of truth: `docs/design/tokens-v4.css` (verbatim copy in `apps/booking/src/app/tokens.css`). Comps: `docs/design/comps/{home-v4,search-results-seat-v4,radius-spec}.html` (rebuild with `node docs/design/comps/_src/v4/build-v4.mjs`); older v3 comps stay as history. Rationale: `docs/design/v4-glass-radius-proposal.md`. Check: `node docs/design/check-tokens.mjs` (also scans `apps/booking/src` CSS and TSX).

**v4 in six rules** (they override anything older in this file): (1) radius only `--r-1` 4 / `--r-2` 8 / `--r-3` 16 / `--r-4` 24 (media only) / `--r-round` (icon-only square buttons); content cards stop at r-3; nested = outer minus padding, minimum r-1; no pills. (2) No 2px ink or black borders anywhere except focus rings; inputs 1px `--color-edge`, separators 1px `--color-rule`. (3) Selected = `--select-bg` + `--select-ring` + tick icon, never colour alone. (4) Depth = `--shadow-1/2/3`. (5) Glass only on floating layers: sticky header once scrolled (glass-yellow), search card over the banner, sticky filter bar, sticky total or summary bar, dialogs and sheets over a scrim; fallbacks for `@supports not (backdrop-filter)` and `prefers-reduced-transparency`; text on glass is 16px or more and 4.5:1; at most three glass layers per screen. (6) Segmented tabs: grey track, raised white selected segment.

## System (Hallmark picks)
- Material: product (real photographs, real booking data) · Job: book · Tone: utilitarian, friendly, plain-spoken (the counter clerk, not the brand film) · Genre: editorial.
- Theme: **Ink**, board colourway, requested by the owner brief (shortlist Ink / Wayfind / Hum in `docs/design/hallmark-notes.md`). Ink is flat paper, hairlines, one colour that means "act", so it is light on cheap Android and reads at arm's length. Borrowed: Wayfind's plate (ink-edged booking card, big tabular times) and Hum's press (button sinks 1px).
- Draw run: `theme.mjs draw --material product --job book --theme ink` gave seed **3a5769**: Marquee Hero, Counter hero, masthead nav, mast footer, close on hours, address and the booking again. Taken: shape, hero, footer, close (`docs/design/.hallmark-log.json`).
- Swaps, with reasons: nav masthead to **slab** (seven real destinations plus hotline and login need a one-line bar, and the yellow bar is the brand field); route and content pages use a Banner posture (reference pages open onto their first block); accent teal replaced by brand yellow `#FFC20E` with dark `#333`; Nunito replaces Epilogue (owner constraint, vietnamese subset).
- Posture (v3 app-style, kept in v4; owner found v2 "vẫn hơi plain"): **Committed, with depth**. The brand yellow is the field (header, hero band, app band); promo colour lives only on offer cards, class badges and illustrated icons. Signature: the glass search card floating over the banner with `--shadow-2`; on app screens, the seat map in its bus outline with the sticky total. Rhythm: promo first, faster (`--section-pad` 32 phone, 48 desktop), conversion-focused (price, time and "Đặt vé" on every card).
- v3 rules in one list: (1) three shadow levels only (`--shadow-1/2/3`); (2) five promo colours plus soft tints, each with a fixed text pair; (3) section grounds alternate white, warm yellow tint, light grey, brand yellow, never the same twice in a row; (4) icons are lucide strokes on a coloured circle (duotone: stroke plus a pale fill), one weight; (5) every list of cards is a rail (scroll-snap, header arrows from 60rem, right-edge fade) or a grid when all items fit; (6) badges follow one recipe (r-1 rectangles); (7) display type 48 for the home hero only; (8) promo content is real: an offer card carries a route, a price and its condition from `docs/reference/route-landing/*.json`, never an invented discount.
- Keep (owner): `#FFC20E` + `#333`, Nunito, booking steps, labels and API, every content block of the old site. Label changes to approve: "Về Hải Vân" for "Về HAIVAN" (no caps rule), "Dùng mã hoặc điểm", "Giữ vé", stepper, "Chọn ghế".

## Tokens (`tokens-v4.css` = `apps/booking/src/app/tokens.css`; all raw px live only here; colours are hex by default, the oklch twin sits in `@supports (color: oklch(0% 0 0))`)
```css
:root {
  color-scheme: light;
  --color-accent: #FFC20E / oklch(84.6% 0.172 85);
  --color-accent-hover: #F2B600 / oklch(80.9% 0.166 85);
  --color-accent-edge: #D9A400 / oklch(74.8% 0.153 85);   /* decorative edge, pressed state; 2.2:1, never a selection cue */
  --color-select-edge: #A67C00 / oklch(61.1% 0.125 85);   /* selection ring: 3.8:1 on white, 3.4:1 on select-bg */
  --color-accent-soft: #FFF3CD / oklch(96.4% 0.051 93);
  --color-accent-ink: #333333 / oklch(32.1% 0.004 95);
  --color-field: var(--color-accent);
  --color-paper: #FAF9F5 / oklch(98.2% 0.006 95);
  --color-surface: #FEFEFB / oklch(99.6% 0.003 95);
  --color-paper-2: #F3F2EC / oklch(96% 0.008 95);
  --color-paper-3: #EAE8E1 / oklch(93% 0.010 95);
  --color-ink: #333333 / oklch(32.1% 0.004 95);
  --color-ink-deep: #252421 / oklch(26% 0.006 95);
  --color-text: #272623 / oklch(27% 0.006 95);
  --color-muted: #565552 / oklch(45% 0.006 95);
  --color-muted-on-dark: #BFBEB9 / oklch(80% 0.006 95);
  --color-rule: #DFDED8 / oklch(90% 0.008 95);
  --color-rule-2: #EEEDE8 / oklch(94.5% 0.006 95);
  --color-edge: #787773 / oklch(57% 0.006 95);
  --color-sold: #E5E4E1 / oklch(92% 0.005 95);
  --color-scrim: rgb(26 25 23 / 0.55);
  --color-focus: var(--color-ink);   --color-focus-on-dark: var(--color-accent);
  --color-error: #C62827 / oklch(53.9% 0.194 27);
  --color-error-soft: #FFEFED / oklch(96.5% 0.018 27);
  --color-success: #2E7D31 / oklch(52.3% 0.135 144);
  --color-success-soft: #E3F7E2 / oklch(95.5% 0.035 144);
  --color-link: #0E5FB4 / oklch(49% 0.153 255);
  /* v3 */
  --color-tint-warm: #FFF8E3 / oklch(97.9% 0.028 92);  --color-on-strong: #FEFEFB;
  --color-promo-orange: #F28C28 (ink text 5.2:1)   --color-promo-orange-soft: #FFE9D2
  --color-promo-teal:   #0B6F6F (surface text 5.9) --color-promo-teal-soft:   #D8F1EF
  --color-promo-coral:  #C23A3A (surface text 5.3) --color-promo-coral-soft:  #FFE4E1
  --color-promo-leaf:   #287A2E (surface text 5.3) --color-promo-leaf-soft:   #E2F4E3
  --color-promo-blue:   #1D4FA8 (surface text 7.6) --color-promo-blue-soft:   #E1EAFB
  --color-on-orange: var(--color-ink); --color-on-teal|coral|leaf|blue: var(--color-on-strong);
  --font-display: "Nunito", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-body: var(--font-display);
  --weight-body: 400; --weight-strong: 600; --weight-display: 800;
  --fs-14: 0.875rem; --lh-14: 1.25rem;
  --fs-16: 1rem;     --lh-16: 1.5rem;
  --fs-18: 1.125rem; --lh-18: 1.75rem;
  --fs-20: 1.25rem;  --lh-20: 1.75rem;
  --fs-24: 1.5rem;   --lh-24: 2rem;
  --fs-32: 2rem;     --lh-32: 2.5rem;
  --fs-40: 2.5rem;   --lh-40: 3rem;
  --fs-48: 3rem;     --lh-48: 3.5rem;   /* v3: home hero display only */
  --fs-h1: var(--fs-32); --lh-h1: var(--lh-32);
  --fs-h2: var(--fs-24); --lh-h2: var(--lh-24);
  --fs-h3: var(--fs-20); --lh-h3: var(--lh-20);
  --fs-lead: var(--fs-18); --lh-lead: var(--lh-18);
  --fs-display: var(--fs-32); --lh-display: var(--lh-32);   /* 48/56 from 60rem */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-6: 24px; --s-8: 32px; --s-12: 48px; --s-16: 64px; --s-24: 96px;
  --container: 1200px; --gutter: var(--s-4);
  --section-pad: var(--s-8);   /* s-12 from 60rem (v3: was s-12 / s-16) */
  --card-pad: var(--s-4);
  --gap-card: var(--s-4);
  --gap-field: var(--s-3);
  --title-gap: var(--s-6);
  --header-h: 64px;
  --icon-size: 24px;
  --control-h: 48px; --control-h-lg: 52px; --tap-min: 44px;
  /* Radius v4: logo corner is about 1/12 of the letter height, so r = short side / 12 snapped to a ladder */
  --r-1: 4px;      /* button, input, chip, tag, badge, seat, tab, thumbnail (short side up to 72) */
  --r-2: 8px;      /* media inset in a card, trip row, menu, small photo (73 to 144) */
  --r-3: 16px;     /* card, search form, sheet, dialog, sticky bar (145 to 240); content containers stop here */
  --r-4: 24px;     /* media only: hero banner, big photo, map frame */
  --r-round: 50%;  /* icon-only square buttons only (call, rail arrow, swap, close, avatar) */
  --r-sm: var(--r-1); --r-md: var(--r-2); --r-lg: var(--r-3); --r-pill: var(--r-1);   /* v3 aliases, do not use in new code */
  --line: 1px;            /* field edge (colour edge), row rule and divider (colour rule) */
  --line-strong: 2px;     /* focus ring and selection ring only */
  --hairline: var(--line) solid var(--color-rule);   --select-bg: var(--color-accent-soft);
  --select-ring: 0 0 0 var(--line-strong) var(--color-select-edge);   /* always with a tick icon */
  --shadow-1: 0 1px 2px + 0 2px 8px, 6% and 8%   /* rest: card, row, input group, header at rest */
  --shadow-2: 0 8px 24px, 10%                    /* raised: hover, floating glass, menu, sticky bar, rail arrows */
  --shadow-3: 0 24px 48px, 16%                   /* dialog and sheet */
  /* v3 aliases: --shadow-card = 1, --shadow-float = 2, --shadow-raise = 3 */
  --glass-bg: #FEFEFBC7 (surface 78%, color-mix when supported)   --glass-bg-yellow: #FFC20ED9 (accent 85%)
  --glass-blur: 12px (16px from 60rem)   --glass-saturate: 160%   --glass-edge: inset 1px rgb(255 255 255 / 0.6)   /* classes .glass, .glass-yellow: blur + edge + shadow-2, solid fallbacks */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --ease-in: cubic-bezier(0.7, 0, 0.84, 0); --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-micro: 120ms; --dur-short: 220ms; --dur-long: 420ms;
  --z-base: 1; --z-raised: 10; --z-dropdown: 100; --z-sticky: 200; --z-sticky-nav: 300; --z-modal: 400; --z-toast: 500;
}
@media (min-width: 40rem) { :root { --gutter: var(--s-6); } }
@media (min-width: 60rem) {
  :root { --section-pad: var(--s-12); --fs-display: var(--fs-48); --lh-display: var(--lh-48); --card-pad: var(--s-6); --fs-h1: var(--fs-40); --lh-h1: var(--lh-40); --fs-h2: var(--fs-32); --lh-h2: var(--lh-32); --fs-lead: var(--fs-20); --lh-lead: var(--lh-20); }
}
```
Contrast (checked by `check-tokens.mjs`, 27 declared pairs): promo fills with their text pair 5.2 to 7.6:1, ink on every soft tint 10:1 or more, tint-warm with ink 11.9:1. Strong colours are never text on a tint, never body copy, never states (states keep error and success). Earlier checks: ink on yellow 7.8:1, text on paper 14.4:1, muted on paper 7.1:1 (never on yellow), error 5.6:1, success on soft 4.6:1, link 6.3:1, field and seat edge on surface 4.4:1 (>= 3:1). Yellow is never text.

## Consistency table (the rule behind every component)
Radius: r-1 4, r-2 8, r-3 16, r-4 24 (media only), r-round (icon-only squares). Nested inner = outer minus padding, minimum r-1 (card r-3 + padding s-2 + photo r-2; sticky bar r-3 + padding s-3 + chip r-1). Space: 4 8 12 16 24 32 48 64 96 only. Shadow: 1, 2, 3 only. Borders: none except input edge 1px edge and separators 1px rule. Section pad: s-8 phone, s-12 desktop.

| Component | Radius | Padding | Border | Shadow | Glass | Type |
|---|---|---|---|---|---|---|
| Button (primary yellow) | r-1 | s-3 s-6 (48 high, 52 large, 44 small) | none | none, press sinks 1px | no | 16/24 800 |
| Button (secondary, grey) | r-1 | same | none (grey `paper-2` fill, inset 1px rule) | none | no | 16/24 800 |
| Input, select, textarea | r-1 | 0 s-4 (48 high) | 1px edge, error 1px error | none | no | 16/24 400 |
| Tab (segmented, search type) | track r-2, segment r-1 | track s-1, segment 0 s-4 (44 high) | none | selected: shadow-1 on white | no | 16/24 600, 800 selected |
| Filter chip | r-1 | 0 s-4 (44 high) | none; pressed = select ring | none | no | 16/24 600 |
| Tag, badge (status, promo) | r-1 | s-1 s-2 | none; tag-in inset 1px accent-edge | none | no | 14/20 600 or 800 |
| Icon tile | r-1 | 0, 48 (44 small) | none | none | no | icon 24, stroke 2 |
| Icon-only round button (call, rail arrow, swap, close) | r-round | 0 (44 to 52) | none | shadow-1 (call: shadow-2) | no | icon 24 |
| Card (route, class, news, order, form, trip) | r-3 | card-pad (s-4, s-6 desktop); trip card s-2 around an inset photo | none (shadow carries it) | shadow-1, hover shadow-2 | no | title 18/28 to 20/28, body 16/24 |
| Selected card or row (trip open, payment method) | r-3 | same | select ring 2px select-edge | shadow-1 | no | + tick icon |
| Promo card (offer) | r-3 | card-pad | none | shadow-1, hover shadow-2 | no | route 18/28 800, price 32/40 800 |
| Photo, thumbnail | r-3 big, r-2 inset in a card, r-1 tiny | none | none | shadow-1 when free-standing | no | caption 14/20 |
| Hero banner, map frame | r-4 | 0 | none | shadow-2 | no | slide title 24 to 40 |
| Hero search card | r-3 | card-pad | none | shadow-2 | **yes** (`.glass`, over the banner) | label 14/20 (on solid chips), fields 16/24 |
| Seat | r-1 | 0 (64x52) | 1px edge; selected accent fill + ring + tick; sold fill `sold` + strike | none | no | no 16 800, price 14 |
| Bus outline (seat map) | r-3 | s-4 | 1px edge | none | no | 14/20 labels |
| Sticky header | none | row min-height `header-h` | none | shadow-1 | **yes**, glass-yellow once scrolled more than 8px | 16/24 |
| Sticky filter bar | r-3 | s-3 | none | shadow-2 | **yes** (`.glass`) | chips 16/24 |
| Sticky total (phone bar) and summary card (desktop) | r-3 top corners (bar), r-3 (card) | s-3 gutter, card-pad | none | shadow-2 | **yes** (bar and card are floating) | total 32/40 800 |
| Menu, popover, dropdown | r-2 | s-2 | none | shadow-2 | no (solid, text under 16px risk) | 16/24 |
| Dialog, sheet | r-3 | card-pad | none | shadow-3 over scrim | **yes** (sheet is glass over the scrim) | 16/24 |
| Toast | r-2 | s-3 s-4 | none | shadow-2 | no | 16/24 |
| Section, footer, app band | none | s-8 phone, s-12 desktop each side | 1px rule separators | none | no | h2 24 / 32 |

## Type scale (one, with fixed line-heights)
14/20 label, tag, fine print · 16/24 body, input, button · 18/28 reading copy, row title · 20/28 h3, card title · 24/32 price, time, h2 phone · 32/40 total, h1 phone, h2 desktop, hero display phone · 40/48 h1 desktop, banner slide title · **48/56 hero display, home from 60rem only (v3 extra step)**. Headings 800 in one colour; body 400, strong 600. Line-height 1.2 or more keeps stacked Vietnamese marks clear. `tabular-nums` on times, prices, seat numbers. `text-wrap: balance` on heads.

## Component rules
- **Buttons.** One filled yellow primary per screen ("Tìm vé", "Chọn ghế", "Tiếp tục", "Thanh toán"), text `#333`, verb labels. Secondary = grey `paper-2` fill, no border (inset 1px rule). States: hover darker yellow, `:active` sinks 1px, focus ring 2px ink offset 2px (instant), disabled = 55% + not-allowed + attribute, loading = label "Đang xử lý ..." and `aria-busy`. Never disabled while idle; a missing input shows an `aria-live` line instead.
- **Fields.** Label above (never placeholder as label), 16px, constant 1px `--color-edge` edge (focus: 2px ink outline), error under the field with icon plus one sentence (what, why, what to do), `aria-invalid` + `aria-describedby`, helper line keeps `min-height: 1lh`, correct `type`, `inputmode`, `autocomplete`; paste allowed. Phone gap `--gap-field` s-3. Counter = stepper with 48px buttons.
- **Cards.** `--shadow-1` at rest, no border, whole card is the target (stretched link on the button), hover = `--shadow-2`, never zoom or lift. Photo 16:9 on top, title, facts, price, one yellow button. Never a card inside a card.
- **Trip row.** Thumbnail, big pick-up time + duration, two stops on a rail (filled dot, hollow dot, arrival time), tags (class, availability), price (strike list price, big price, "đã gồm thuế VAT"), "Chọn ghế" with chevron. Open row gets the select state (`--select-bg` + `--select-ring` + chevron/tick), a yellow-soft "Khởi hành" band, 4 photos, legend, seat map.
- **Seat.** 64x52, number plus price. Free: white, 1px edge, r-1. Selected: yellow, `--select-ring`, check icon. Booked: grey, strike-through number, word "Đã đặt". Legend uses the same boxes. Price tiers are text, not colours.
- **Stepper (proposal).** Chọn ghế, Thông tin của bạn, Thanh toán; done steps use a check icon, current has a yellow number. Needs owner approval (new element).
- **Tabs.** Search type: grey segmented control (track `paper-2` r-2, selected segment white r-1 with shadow-1), 2x2 grid on phones, row from 40rem. Account and page nav: scroll sideways, never wrap. State in the URL.
- **Sticky bars.** Phone: fixed bottom glass bar (total, button), one sticky element per edge. Desktop: the same markup becomes a card in the right column (`position: sticky`). Held-seat timer sticks to the top on phones. Call button sits above the bar.
- **Dialogs.** Last resort: inline disclosure first (order cancel opens in the row). `<dialog>`/sheet: 28rem, r-3, glass over the scrim, shadow-3, no border, focus trapped, first field focused, actions "Giữ vé" and "Huỷ vé" with the consequence in one sentence.
- **Toasts.** Only for system errors the user cannot see otherwise (`role="alert"`, ink, r-2). Success is silent; copy buttons change their own label for 2.5s.

## v3 app-style components
- **Depth.** Level 1 `--shadow-1` rests under cards, rails and the header; level 2 `--shadow-2` on hover, floating glass layers and menus; level 3 `--shadow-3` on dialogs and sheets. Cards have no border; the shadow holds them on grey grounds. Blur exists only as functional glass (see the six rules); no glow, no decorative blobs.
- **Section grounds.** `--color-surface` white, `--color-tint-warm`, `--color-paper-2` grey, `--color-field` yellow. Order on home: yellow hero, white trust, warm offers, white routes, grey destinations, white classes, warm news, yellow app, white rooms, ink footer. Never the same ground twice in a row.
- **Promo cards.** One fill per card (orange with ink text; teal, coral, leaf, blue with surface text), no decoration shapes, one badge, route in 18/28, price 32/40 with its unit, one condition line, one surface action (stretched link), a 4:3 real photo or a duotone icon. Only offers that exist in the data; the condition is shown on the card.
- **Illustrated icons.** lucide, stroke 2, 24px, on a 48px r-1 square tile: yellow fill with ink stroke for brand facts (trust strip, rooms, perks); soft tint with the matching strong stroke for category (teal, coral, leaf, blue); orange fill with ink stroke. Pale fill (`--color-surface` at 55%) inside the shapes gives the duotone. Never two weights, never a second icon set.
- **Rails.** `ul.hrail` in `.rail-wrap`: `scroll-snap-type: x mandatory`, items keep their width (promo 320, route 280, destination 176 to 160 on phones, 82% on phones for cards), 16px gap, 8px padding so shadows are not clipped, right-edge fade in the section ground (`--rail-bg`), prev and next 44px round icon-only buttons in the section head from 60rem (hidden until JS runs, disabled at the ends). Phones: swipe, no arrows. Grids (3 columns) replace a rail from 60rem when every item fits. Keyboard: the rail is focusable (`tabindex=0`) and scrolls with arrow keys.
- **Banner carousel.** Slides keep the 3334:1156 poster ratio, frame r-4; phones show the next slide peeking (88% wide); desktop is one framed slide with float shadow, arrows hanging half outside the frame, a "1/3" counter, no autoplay. Built slides (not images) are allowed when the offer exists in the data: blue fill, vehicle cut-out, price in the display step.
- **Search card.** Floats over the banner's lower edge and the yellow band (glass, `--shadow-2`, `--r-3`, no border). Tabs are a grey segmented control with an icon each (selected: raised white segment; the yellow stays on "Tìm vé"). Phones: 2x2 tabs, stacked fields, swap button on its own row.
- **Trust strip.** Four items, icon circle beside the claim, one line each, only claims Hải Vân publishes (hotline 1900 6763 and "gọi điện trực tiếp 24/7", vé QR, "giữ đúng giường chọn", VNPay-QR and cash). No count, rating or guarantee that is not on the old site.
- **Badges.** Promo: `.badge` r-1, 14/20 800, one of sale (coral), new (teal), class (orange, blue, leaf), on-fill (surface on a promo card). Format: "-20%", "Tiết kiệm 101k", "Mới", "Còn ít chỗ" only when the number or fact is in the data (the "-20%" and "Mới" in the rules are format examples, not claims). Status: r-1 rectangle, "Còn ít chỗ" = soft coral, clock icon, word plus ring 3:1; "Còn N chỗ" = yellow soft with check; "Hết chỗ" struck out. On a photo: top-left, `--s-3` inset, card shadow. One badge per card edge.
- **Filter chips (proposal).** "Giờ đi", "Hạng xe", "Giá", sort: 44px, r-1, grey fill, icon plus chevron; pressed = `--select-bg` + `--select-ring` + tick, on a sticky glass bar. A visible "Đề xuất" badge says the old flow had no filtering. Phones: one scrolling row.
- **Seat map in a bus outline.** Outline r-3 (1px edge), four wheel bars, a cab strip (driver circle and "Đầu xe"), rows of 64x52 r-1 seats, "Cuối xe" under a dashed rule; legend above; selected seat yellow with ring and check. Summary card (desktop) lists the chosen seats as chips and the total at 32/40; phones keep the fixed bottom bar.

## Page anatomy
- **Home (v3).** Yellow band (header, display head 48 with one sentence, banner carousel of 3 slides: built offer slide with vehicle cut-out, limousine poster, app 50k poster); search card floating over the banner edge; trust strip (4 claims); "Ưu đãi hôm nay" rail of 5 coloured offer cards; "Tuyến phổ biến" photo rail (9 routes, price, time, "Đặt vé"); "Điểm đến" photo rail on grey; "Tin tức" 3 cards; yellow app band (phone, QR, badges); waiting-room mosaic with six address cards; mast footer.
- **Route landing.** Banner hero with the route's own bus, facts (price, hours, km), compact plate; offers (cards plus conditions in a disclosure); schedule rows; why (photo plus six rows); class cards plus interior strip; stop map on an ink band; rooms and addresses; cargo and community; FAQ (5 open, rest folded); call-back form (no fake send); app band.
- **Results and seat map (v3).** Yellow strip (steps, title with real count, trip summary card with "Sửa"), filter chips (proposal), trip cards (photo and class badge, big times with duration line, two stops, seats badge, price 32/40 with struck list price, "Chọn ghế"), open card with bus-outline seat map, legend, photos and perks, right summary card (phone: fixed bottom bar). Seats left, booked seats and the chosen seat are labelled "Bản mẫu".
- **Confirm.** Steps, timer bar, form cards (you, pick-up and drop-off, invoice and codes), policy line above "Tiếp tục", summary with price table (1px rule above the total).
- **Payment.** Whole-row method cards (VNPAY-QR, ATM, PayOS, bank transfer with copyable details, cash), sticky total plus "Thanh toán".
- **Account.** Tabs (sắp tới, hoàn thành, chuyến huỷ), order rows with status badge, actions, inline cancel confirmation; loading, empty and error states drawn.
- **Content page.** Page title, three-photo mosaic, sub-nav (rail on phones), reading column 68ch at 18/28, each service beside a real photo, owner text verbatim.

## Older-user and cheap-phone rules
- Body and inputs 16px or more, labels 14px minimum, nothing under 14px. Targets 48px (44 minimum), 8px between targets, whole card or row is the target.
- Text contrast 4.5:1 or more, edges and rings 3:1 or more, never colour alone: state = word plus icon (selected has a check, sold is struck and says "Đã đặt", errors have an icon and a sentence).
- No motion dependence: no autoplay, parallax, reveal or spring; only colour, shadow and 1px press (rails and the carousel scroll with the user; smooth scrolling is off under reduced motion); `prefers-reduced-motion` honoured; the timer is words ("Thời gian còn lại để xác nhận").
- Weight: Nunito latin and vietnamese woff2 (about 52 KB, 400 to 800 variable, `font-display: swap`), no texture, backdrop blur only on the few glass layers (solid fallback when unsupported or transparency is reduced), shadows in three levels (rest, raised, dialog), images with width, height, lazy except the first banner (`fetchpriority="high"`), `srcset` on the hero photo, rails and disclosures work without JS.
- Offline-ish: key facts (hotline 1900 6763, addresses) are plain text and `tel:` links; the call button is always one tap away; errors say what to do and offer "Thử lại".

## Floor and Reflex checklist (Hallmark, plus our rules)
- [ ] Rendered pages pass `node scripts/layout-audit.mjs` (0 errors: overflow, broken images, JS errors, gaps between sections, one H1; warnings cover same-ground neighbours, off-token radius, dark borders, small text on glass, tap targets). `--all` crawls every sitemap URL, `--selftest` proves each rule fires.
- [ ] Tokens only: no raw colour, font-family, radius, padding, margin, gap, font-size, border or shadow outside `:root`; no `border-2`, `border-ink`, `rounded-[...]` or off-ladder `rounded-*` in TSX/CSS (`check-tokens.mjs` exits 0).
- [ ] No `transition: all`, no animated width, height, top, left; reduced-motion fallback; visible with scripting off.
- [ ] `overflow-x: clip` on `html` and `body`, no `100vw`, no horizontal scroll at 320, 360, 768, 1440.
- [ ] `:focus-visible` on everything interactive, instant, ring 3:1 or more; all eight states on controls.
- [ ] No eyebrow, tracked caps, middle-dot strings, arrows in link text, status dots, emoji or glyph icons, card in card, purple gradient.
- [ ] No invented metric, quote, logo or count; sample values (route-page departure times, "3 chỗ", "hết chỗ", account rows) are marked in the README.
- [ ] Hero: headline, primary action visible at 1280x800; about 80 words per screen on marketing pages (owner text pages stamp `copy: verbatim`).
- [ ] Container 1200 centred; one primary button style; concentric radius per nesting level (inner = outer minus padding); at most three glass layers per screen, text on glass 16px+ and 4.5:1; sections 96px apart at 1440 (v3).
- [ ] Images have size and a real file; first banner not lazy; every library or stock image credited (none used).
- [ ] Reflex: accent under 5% outside the declared field, 3 equal icon tiles, hover on non-interactive, bounce, toast for visible success, text under 12px, 2 icon sets, 39b control heights, thin sections, photo share.
- [ ] v3/v4: three shadow tokens only (`--shadow-1/2/3`); promo fills only with their `--color-on-*` text; promo cards and trust claims exist in the data; no badge claim without a source; sections alternate grounds; rails scroll without JS.
- [ ] Run: `sloplint <comp> --genre editorial --render` (`--scope app` for results, confirm, payment, account).

## Outcome (honest)
v3: Floor 0 FAIL and Reflex 0 open on home and results (sloplint `--render`, results with `--scope app`); the other five comps rebuilt on the shared layer, Floor 0 FAIL, Reflex 0 open (route landing waives 59 for the 96px section rhythm). Waived: 83 photo share and 78 h2 under the 48px display (home), 59 section gap (route landing), 77 thin map section and 44c Banner posture (route landing), 49b one legal link title at 320px (all). Answered: F4, F5 (icon circle is the owner-picked style), F7, F20. Dismissed with reasons: 3, 23, 42, 58, 59, 77. The Hallmark fresh-context review was not run (no reviewer agent in this session).

## Exports
`tokens-v4.css` in this project. Tailwind 4: `apps/booking/src/app/theme-map.css` maps `--r-*` to `--radius-*` (`rounded-1/2/3/4/round`), `--shadow-1/2/3` (`shadow-1/2/3`), `--fs-*` to `--text-*`, `--color-promo-*` to `--color-*`; class lookup in `docs/design/tailwind-map.md`.
