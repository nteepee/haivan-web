# Competitor bus-booking reference captures

Captured 2026-10-29. Public GET pages only. No login, no personal data, no seat/passenger/payment steps.

## Method

- Playwright via system Chrome (`channel: "chrome"`), headless.
- Viewports: desk 1280x900, mob 390x844 (mobile emulation on, so meta viewport is honored).
- `fullPage: true`, `networkidle` + 2s wait, one scroll pass to trigger lazy images, scroll back to top.
- Cookie banners: declined non-essential ("Từ chối"), never accepted.
- redbus.in: default UA hit `ERR_HTTP2_PROTOCOL_ERROR`; retried once with a normal Chrome UA string, then 200.
- Outlines (`<name>.md`): h1/h2/h3, nav labels, CTA labels, per viewport.

## Captures

| Files | Page | Notes |
|---|---|---|
| `vexere-home-{desk,mob}.png`, `vexere-home.md` | vexere.com home (vi) | Search hero + SEO route sections |
| `vexere-route-vungtau-{desk,mob}.png`, `vexere-route-vungtau.md` | Sài Gòn → Vũng Tàu route | Live bus cards at top, then 30k px SEO article. No seat map (see gaps) |
| `redbus-home-{desk,mob}.png`, `redbus-home.md` | redbus.in home | Hero + search, offers, long SEO copy |
| `redbus-route-bangalore-chennai-{desk,mob}.png`, `.md` | Bengaluru → Chennai results | Filters, operator rows. Desk `.md` also has the seat-step outline |
| `redbus-seat-desk.png` | Seat layout modal (desk) | Viewport shot. Mob not reached |
| `traveloka-home-{desk,mob}.png`, `traveloka-home.md` | traveloka.com/vi-vn/bus-and-shuttle | Hero + search card, route SEO links |
| `traveloka-route-hcm-danang-{desk,mob}.png`, `.md` | Sài Gòn → Đà Nẵng route page | SEO/content page, no live results |
| `booking-haivan-home-{desk,mob}.png`, `booking-haivan-home.md` | booking.haivan.com | Route chooser, booking card, trust copy |
| `booking-haivan-sai-gon-vung-tau-{desk,mob}.png`, `.md` | Sài Gòn → Vũng Tàu route | Booking card + schedule table + stations + reviews |

## Gaps

- vexere seat selection: "Xem giá" on a bus card opens a date picker first. Price and seat map stay locked until a date is chosen. Not captured (would need a date pick, out of scope).
- traveloka: route pages are content pages. No results list or seat map reached.
- redbus mob: "View Seats" not found in mobile layout. Desk only.
- haivan: no seat map captured. "Xem chi tiết" and "Đặt vé ngay" not opened (stop before booking).
- Mobile layout: vexere and traveloka render at ~1,020 and ~1,230 CSS px wide on a 390 px phone (horizontal overflow, zoomed-out desktop layout). Their mob PNGs are that full width, so the left 390 px is what a phone user sees at 100%. redbus and haivan are flat 390 px.
- vexere route page is 30,679 px tall (SEO article under the list). Viewer will be slow.

## Above the fold

- **vexere (desk):** top bar with "Cam kết hoàn 150%" guarantee and Hotline 24/7. Flash-sale hero. Search card inside hero at ~y 250-380: tabs (Xe khách / Máy bay / Tàu hỏa / Thuê xe), From, To, Ngày đi, "Thêm ngày về", yellow **Tìm kiếm**. Trust strip under hero: Chắc chắn có chỗ, Hỗ trợ 24/7, Nhiều ưu đãi, Thanh toán đa dạng.
- **redbus (desk):** promo hero banner. Search widget sits on the hero's lower edge (From, To, Date with today/tomorrow, red **Search buses**). Offers row below the fold. Mobile: search form is first, offers under it, bottom tab bar (Home/Bookings/Help/Account).
- **traveloka (desk):** hero headline "Đặt vé xe khách online trên Traveloka", search card with Từ/Đến/Ngày/Hành khách and blue **Tìm kiếm**. Default route is Jakarta → Bandung (Indonesian defaults on a VN page). Mobile header overflows.
- **haivan home (desk):** headline + search card. Tabs: Xe liên tỉnh / Xe sân bay / Xe hợp đồng / Xe du lịch. Route chips HCM ↔ Vũng Tàu, Hà Nội ↔ Điện Biên. Fields: Điểm xuất phát, Điểm đến, Ngày đi, Số người, yellow **Tìm vé**. Strip below: "Một chiều/khứ hồi", "1900 6763 hỗ trợ đặt vé", "Chọn chỗ trước khi đặt vé". Header carries route dropdowns and a second yellow **Tìm vé**.
- **haivan route (desk):** H1 "Đặt vé xe Sài Gòn đi Vũng Tàu giờ nào cũng có xe". Booking card right under the H1: one-way/return, Điểm đi (all pickups), Điểm đến, date, return with "Giảm 20k/ghế" nudge, passengers, **TÌM VÉ**. Trust bullets: "Mở bến gần suốt ngày", "Được Bộ GTVT cấp phép chạy sân bay". Floating Zalo chat and "Gọi đặt vé ngay!" bottom-right.

## Search form and CTA placement

| Site | Form location | Primary CTA | Pattern |
|---|---|---|---|
| vexere | Hero, centered, mixed-mode tabs | Yellow "Tìm kiếm" | Multi-product tabs (bus/flight/train/car) |
| redbus | Bottom edge of hero, mobile-first | Red "Search buses" | Form + Today/Tomorrow quick dates |
| traveloka | Hero card | Blue "Tìm kiếm" | Pax field + defaults to Indonesian cities |
| haivan | Hero card and route page top | Yellow "Tìm vé" (x2 on home) | Route chips + one-way/return toggle |

## Results cards: time, price, seats

- **vexere:** operator photo (with "Xác nhận tức thì" instant-confirm ribbon), name, star rating + review count, seat config lines ("Limousine 9 chỗ / Ghế ngồi 16 chỗ"), pickup → drop with duration (e.g., 2h45m), review snippet, yellow **Xem giá** button. Price hidden until date chosen. Banner: "Chọn ngày để xem giá, số ghế trống và ưu đãi".
- **redbus:** left filter column with count chips (Primo Bus, Free Cancellation, AC, Sleeper, Single seats, time buckets). "225 buses found", sort-by. Rows: operator, rating badge (4.9 / 1484 ratings), departure → arrival bold, duration, seats left, price on row, "Show buses".
- **traveloka:** SEO page, no cards.
- **haivan:** table with columns Giờ đón / Loại xe / Thời lượng / Khoảng giá / Chỗ trống. Time chips (Cả ngày 73, Sáng sớm, Sáng, Trưa, Chiều, Tối, each with count), class chips (Mọi hạng xe, Economy, Luxury, Royal), sort dropdown. Price shows as range with promo chip ("419k / 2 vé · Còn ít suất ưu đãi"). Seats left in green, red when low (2 chỗ còn). Row ends with "Xem chi tiết" expander.

## Seat selection

- **redbus:** full-screen modal, 3 tabs (Select seats / Board-Drop point / Passenger Info). Two-deck map (Lower / Upper) with a driver icon, a price label on each seat, colour states (sold grey, available, selected). Right column: operator name, departure, bus type, photos, rating, "83% on time", cancellation policy.
- **vexere:** not reached without a date.
- **haivan:** not captured.

## Trust elements

- **vexere:** 150% guarantee in top bar, instant-confirm ribbon, per-operator review counts (4,749 / 5,278), Hotline 24/7, "Thanh toán đa dạng".
- **redbus:** app-store ratings and install counts, Free Cancellation, Instant Refund, 24/7 support, live bus tracking, per-bus punctuality and comfort scores.
- **traveloka:** "Vé chính thức được đảm bảo Traveloka", 4-step how-to-book, pickup-point explainer ("Phân biệt bến xe, văn phòng và điểm đón"), rules for changes and refunds.
- **haivan:** "Hơn 30 năm đưa đón", state licence for airport runs, "Không nhồi nhét, không ghế phụ" (no overcrowding), amenity icons (USB, AC, wifi, massage seats), testimonials, Google reviews link, Zalo + hotline buttons.

## Five patterns to borrow (Vietnamese bus booking, all ages)

1. **Search above the fold, with plain defaults.** Default origin from the user's location (or Hà Nội / TP.HCM), date chips "Hôm nay / Ngày mai" (redbus), large 16 px+ labels, big tap targets. Avoid foreign defaults (traveloka's Jakarta → Bandung).
2. **Time-of-day and class chips with counts, in Vietnamese.** "Sáng sớm / Sáng / Trưa / Chiều / Tối" plus "Ghế ngồi / Giường nằm / Limousine" with counts (haivan, redbus). Older users filter without a sort menu.
3. **One result row, five fixed columns, one button.** Big departure time, duration, price on the row, "Còn X chỗ" coloured (red when few), one "Chọn chuyến" button for the whole row (haivan table). Keep the row tappable on phone; stack columns vertically below 400 px.
4. **Deck-aware seat map with a stepper.** Lower/upper deck, price per seat, legend "Đã bán / Còn trống / Đang chọn". Sticky summary bar: "Đã chọn 2 ghế · 420.000đ · Tiếp tục". Stepper (Chọn ghế → Điểm đón → Thông tin) so people know where they are (redbus).
5. **Always-visible human help.** Hotline and Zalo floating buttons (haivan), a "Gọi đặt vé ngay" phone CTA for people who prefer calling, pickup-point and cancellation rules stated next to the price, and no horizontal scroll on phone (vexere and traveloka fail this).

## Status

Done: 16 full-page captures across 4 sites (8 pages x 2 viewports), redbus seat modal (desk), 8 outline `.md` files, this README. Nothing committed.

Summary: vexere, redbus and haivan show live results and price/seat cues. traveloka route pages are SEO-only. vexere hides price until a date is picked, so no seat map. Mobile vexere and traveloka are not responsive at 390 px.

Concerns:
- Traveloka and vexere mob captures are full desktop-width (1,017-1,232 px). Left 390 px is a crop for quick viewing; the full PNG is the real layout.
- Cookie banners declined, not accepted, on each site. Banner layout may differ for a real user who accepts.
- Results and prices are a snapshot for 2026-10-29 and will change.

Unresolved questions:
- Do we want a vexere capture with a chosen date to see the seat map? Needs a date pick (one more step than the brief allowed).
- Is a haivan seat map capture wanted? It needs a click past the schedule row.
