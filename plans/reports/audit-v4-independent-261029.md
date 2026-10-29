# Audit độc lập v4 — 2026-10-29 (31 mẫu + luồng mock, 1440 & 390)
Ảnh/số đo: scratchpad `v4-audit/` (phiên e9a4f2ff). Không Critical.

## High
- H1 Header WP luôn là kính ở scroll 0 (`chrome.css:4`), Next đặc → lệch màu với băng hero. → đặc ở 0, kính khi cuộn > 8px (`site.js` data-scrolled).
- H2 Tab tìm vé EN ở 390px chồng chữ/icon (WP `search.css:5`, Next `hv-search.css:14`). → nhãn EN ngắn + wrap/min-width:0.
- H3 Chữ < 16px trên kính ở thanh tổng (`.hv-hint` `hv-components.css:139`, `.hv-tag-on`).
- H4 Dialog kính còn chữ 14px muted (`dialog.tsx:149`). → text-16 ink.

## Medium
- M1 Search card WP khác Next (không stepper, không icon ghim); nút "Tìm vé" 52 vs ô 48 lệch đỉnh (cả hai).
- M2 Dòng nút đổi chiều trống ~100px trên mobile.
- M3 `/tuyen-duong/*` "GỌI NGAY" là link 24px.
- M4 `/?s=` ô ảnh xám rỗng; link tiêu đề 27px.
- M5 Menu điện thoại WP kính, Next đặc → đặc cả hai (design.md: menu đặc).
- M6 Ảnh lớn kéo giãn mờ (`/diem-den/vung-tau`, member_card) → giới hạn theo naturalWidth; xin ảnh lớn từ MKT.
- M7 `/xe-san-bay` chỉ có H1.
- M8 Thẻ tuyến Next lệch hàng giá.
- M9 Giá ghế tràn ô ≤ 58px → ô ghế 64px theo spec.
- M10 `/tracking` (không tham số), `/partner/booking`: không h1/CTA.
- M11 Footer Next cao hơn WP, khoảng trắng thừa → một nguồn CSS, gap token.

## Low
L1 vùng chạm 38–43px (breadcrumb, footer EN); L2 link tiêu đề danh sách 27px; L3 dấu "/" mồ côi breadcrumb; L4 `/uu-dai` h1→h3→h2; L5 2 link 89×32 không nhãn ở landing; L6 Leaflet zoom 30px r-2px; L7 EN "Searching"→"Search", "Number"→"Guests"; L8 stepper mobile xuống 3 dòng; L9 FAB che nội dung; L10 kính search /xe-khach trên nền vàng phẳng; L11 header /uu-dai cùng màu nền.

## Code
check-tokens sạch nhưng mặc định không quét theme WP (chạy tay: sạch) → đưa vào mặc định. 0 radius px thô, 0 transition:all, 0 emoji icon; !important WP 7, app 5.

## Quyết định mặc định (chưa có ý anh, theo spec v4/design.md)
Header: đặc lúc nghỉ, kính khi cuộn. Menu mobile: đặc. EN: rút nhãn tab + "Search"/"Guests". `/xe-san-bay`: giữ URL, thêm nội dung CTA tuyến sân bay + tổng đài (không 301). Giá ghế: ô 64px, giữ "240.000". Leaflet: ghi đè nút zoom 44px r-1.
