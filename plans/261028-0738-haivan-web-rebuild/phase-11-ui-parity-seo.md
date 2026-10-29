---
phase: 11
title: "Khớp 100% giao diện gốc + landing tuyến + SEO từng trang"
status: completed
priority: P1
effort: "3d"
dependencies: [9, 10]
---

# Phase 11: Khớp giao diện gốc, landing tuyến kiểu booking.haivan.com, SEO từng trang con

## Hợp đồng (brainstorm, 2026-10-28)
- **Kết quả:** web mới có đủ mọi khối của haivan.com gốc (banner chính, 3 USP, tuyến phổ biến đúng kiểu thẻ, dải tải app + QR, footer 3 tầng đầy đủ logo đối tác/thành viên/thanh toán/chứng nhận/mạng xã hội/app); trang tuyến `/xe-khach/<a>/<b>` thành landing theo mẫu booking.haivan.com (đang chạy quảng cáo) với nội dung MKT sửa được trong WP; mỗi trang con có title/H1/meta/JSON-LD riêng, từ khoá nổi theo tuyến/điểm đến.
- **Ràng buộc:** giữ nguyên hợp đồng API đặt vé; ảnh lấy từ chính haivan.com (`/assets/**`, GET chỉ đọc) và CMS; WP là nơi MKT sửa; không ghi production; không commit; agent con chạy haiku/sonnet.
- **Không làm:** luồng xe sân bay/hợp đồng, haivanplus, app; không đổi URL đang có.
- **Nghiệm thu:** (1) checklist khối giao diện gốc → mới đều có, chụp so sánh desktop + mobile; (2) không còn markup Flatsome thừa; (3) mỗi trang tuyến/điểm đến có title + H1 + meta description duy nhất, JSON-LD (BreadcrumbList, FAQPage, Service); `/xe-khach/sitemap.xml`; Lighthouse SEO ≥ 95 trang chủ + trang tuyến; (4) `pnpm verify`, e2e, parity URL cũ vẫn xanh.

## Khảo sát (bằng chứng)
- Web gốc (ảnh `scratchpad/shots/parity/old-*.png`, JS trên tab haivan.com):
  - Home: carousel banner (`ant-carousel`, CMS `list-banner` type `web_banner`/`mobile_banner`; hiện desktop rỗng, mobile có ảnh "Mặc định"); form tìm; 3 USP (`usp1-3.png`: Ứng dụng đặt vé / Theo dõi lộ trình / Tích điểm); "Các tuyến phổ biến ›" thẻ ảnh + đồng hồ + "Từ giá"; dải app (`logo-yellow.jpg`, `checkbox.png`, `appstore.png`, `playstore.png`, `qrcode_haivan.png` "Hoặc quét mã QR"); footer tầng 1 (5 cột + Đối tác `partner1-6.png` + Thành viên `member.png`→gpn.travel + Thanh toán `vnpay.jpg`, `icontien.jpg`), tầng 2 nền `#333` (`logo_white.svg`, công ty, Chứng nhận `verify_info.png`→online.gov.vn/Home/WebDetails/70573, Theo dõi `facebook.svg` `youtube.svg`, Ứng dụng `playstore.svg` `appstore.svg`, "Bản quyền © 2020"); nút gọi nổi `phone.png`; popup `web_popup` 1 lần/ngày.
  - Trang tuyến: H1 "Xe Khách Bến xe A - Bến xe B", danh sách chuyến, không có nội dung SEO.
  - Web mới thiếu: banner, USP, QR, logo/chứng nhận/mạng xã hội ở footer, nút gọi; có markup Flatsome thừa (#main-menu, Newsletter, social placeholder) cuối trang.
- booking.haivan.com (quảng cáo): mỗi hướng tuyến một landing (`mua-ve-xe-<a>-<b>`), + khứ hồi; H1 kiểu "Đặt vé xe A đi B …"; khối: hero + form, thống kê, ưu đãi nhóm, lịch chạy & giá, vì sao chọn, loại xe, tiện ích, phòng chờ/bến, điểm đón trả, đánh giá, FAQ; JSON-LD BreadcrumbList + Service + FAQPage. Có 10 landing: SG↔VT, HN↔ĐB (+khứ hồi), HN↔Mộc Châu, HN↔Sơn La.
- CMS `route-listing` có sẵn: `wayroad.meta_title/meta_desc/meta_keyword`, `services` (tiện ích + icon), `questions_wayroad` (FAQ), `images`, `rating`.

## Bản đồ từ khoá theo trang
| Trang | Từ khoá chính | Title | H1 |
|---|---|---|---|
| `/` | hãng xe Hải Vân, vé xe khách | giữ gốc: "Hãng xe Hải Vân - xe liên tỉnh, xe hợp đồng, xe sân bay" | "Hãng xe Hải Vân – Đặt vé xe khách liên tỉnh, xe sân bay, xe hợp đồng" |
| `/xe-khach/<a>/<b>` | vé xe A đi B, xe khách A B, giá vé, giờ chạy | "Vé xe {A} đi {B} – Giá vé, giờ chạy | Hải Vân" (WP ghi đè) | "Đặt vé xe {A} đi {B}" + phụ đề giá/thời gian |
| `/diem-den/<x>` | kinh nghiệm du lịch X, xe đi X | giữ CMS | giữ + khối "Xe Hải Vân đi X" link tuyến |
| `/chung-toi/*`, `/dich-vu/*` | theo meta cũ (Rank Math đã nhập) | | |
| `/xe-khach` | đặt vé xe khách online | "Đặt vé xe khách Hải Vân online" | |

## Thiết kế
- **Hợp đồng layout v1 → thêm trường tuỳ chọn** (không phá v1): `partners[]{img,href,alt}`, `members[]`, `payments[]`, `social{facebook,youtube}`, `certificate{href,img}`, `qr`, `badges{appstore,playstore}`, `copyright`. WP REST trả; Next fallback JSON có sẵn; ảnh đặt ở `apps/booking/public/assets/**` (Next) và `wp-content/themes/haivan-web-child/assets/img/**` (WP).
- **Banner:** CPT `hv_banner` (ảnh desktop + mobile, link, loại web/popup, ngày hiệu lực, thứ tự) + carousel trang chủ + popup 1 lần/ngày (cookie) như web cũ; seed từ CMS `list-banner` (ảnh "Mặc định" + popup đang Active).
- **Landing tuyến (Next):** dữ liệu `GET /wp-json/haivan-web/v1/route/<a>/<b>` (cache 1h, fallback template) gồm: seo_title, meta_description, h1, intro, why[], vehicle_classes[], pickup_points[], offices[], faq[] (mặc định `questions_wayroad`), related_routes[], reverse_route; Next render các khối theo mẫu booking.haivan.com + lịch chạy (TripList) + tiện ích từ `services`; JSON-LD BreadcrumbList + FAQPage + Service; canonical/alternates; `/xe-khach/sitemap.xml`.
- **WP:** meta box trên `hv_route` cho các trường trên (MKT sửa); seed 10 hướng từ nội dung booking.haivan.com (của Hải Vân); Rank Math title template theo CPT; điểm đến cross-link tuyến.

## Thứ tự làm (agent WP nhập CMS đang chạy → không đụng `wordpress/**` tới khi xong)
1. **A (Next, sonnet):** tải asset gốc; footer + dải app + nút gọi parity; schema layout v1.1; landing tuyến + sitemap + JSON-LD; test.
2. **B (WP, sonnet, sau khi nhập CMS xong):** footer/REST v1.1; banner CPT + carousel + popup; USP + thẻ tuyến; bỏ markup Flatsome thừa; route meta + REST + seed 10 hướng; điểm đến cross-link; khôi phục ảnh 36 trang tĩnh từ `/assets/**`; Rank Math template.
3. **C:** review (sonnet), chụp so sánh lại, Lighthouse, kongming checkpoint, cập nhật docs.

## Quyết định sau kongming (2026-10-28)
- Nội dung landing: WP `hv_route` (1 bài/hướng, `hv_route_path`) → REST `haivan-web/v1/route/<a>/<b>` → Next hàm cache riêng (stale 1h / expire 7d) với ưu tiên WP > CMS `route-listing` > mẫu; WP sập không được làm trang đổi sang noindex. Hợp đồng chốt bằng fixture `test/fixtures/wp-route.json` + zod trước khi hai bên làm.
- Trường: `seo_title, meta_description, h1, schedule_text, faq[], pickup_points[], vehicle_classes[], related_routes[], reverse_route, content_html` (allowlist chặt). Chỉ vi; `/en` noindex,follow khi chưa có nội dung en; hreflang có `x-default` → vi.
- URL: chỉ `/xe-khach/<a>/<b>`; không alias `mua-ve-xe-*`, không trang khứ hồi riêng (chỉ 1 khối "khứ hồi"); A→B và B→A nội dung khác nhau, link chéo.
- JSON-LD tuyến: BreadcrumbList + FAQPage + `Service{provider: Organization inline {name,url}, offers}`; không AggregateRating.
- Title: WP > CMS meta_title > "Xe {A} đi {B} – Vé từ {giá} | Hải Vân"; H1 "Đặt vé xe {A} đi {B}". Home: H1 nhìn thấy được (không ẩn như web cũ). `/xe-khach`: "Đặt vé xe khách Hải Vân online – Lịch chạy & giá vé".
- Layout: giữ `version: 1`, thêm trường tuỳ chọn; fallback JSON đủ bộ.
- Ảnh: một bản ở `apps/booking/public/assets/**`; nginx thêm `location ^~ /assets/` → Next (giữ URL cũ); WP tham chiếu cùng `/assets/...` (bỏ bản copy trong theme).
- Banner: CPT WP, seed 1 lần từ CMS; popup 1 lần/ngày cookie, tắt trên mobile mặc định; carousel CSS scroll-snap.
- robots.txt (Rank Math) thêm dòng `Sitemap:` tới `/xe-khach/sitemap.xml`.
- Không dán nguyên văn booking.haivan.com; viết lại theo cấu trúc, khuyên chủ site sau này đặt canonical từ booking.haivan.com về haivan.com.
- Thứ tự B: route meta + REST + seed → footer/banner/USP → dọn Flatsome + ảnh 36 trang tĩnh.

## Success Criteria
- [ ] Checklist khối gốc đủ (desktop + mobile).
- [ ] Trang tuyến: title/H1/meta/JSON-LD riêng, nội dung ≥ 6 khối, FAQ.
- [ ] Sitemap tuyến; Lighthouse SEO ≥ 95.
- [ ] Không markup Flatsome thừa; verify/e2e/parity xanh.

## Đổi hướng 2026-10-29: redesign toàn bộ (anh yêu cầu)
- Anh xem bản "parity + polish" và bác: "web mới thua web gốc, ít ảnh, spam chữ". Yêu cầu redesign hết bằng hallmark (`archive/ref/hallmark`) + ak-ui-ux-pro-max, tham khảo Vexere/redBus/Traveloka (`docs/design/ref/`), và **thống nhất bo góc/margin/padding**.
- Hệ thống khoá: `design.md` (root) + `docs/design/tokens.css` (bo góc 6/12/20 + pill; khoảng cách 4px: 4/8/12/16/24/32/48/64/96; 1 viền + 1 viền đậm; 2 bóng; chữ 14–40) + `docs/design/check-tokens.mjs`. Theme hallmark Ink (board) + plate của Wayfind + nút ấn của Hum; nav slab vàng; dẫn bằng ảnh thật.
- Comps 7 màn `docs/design/comps/*.html` (sloplint 0 FAIL), ảnh `comps/shots/`. Trang chủ bản 2 (dẫn ảnh) đã gửi anh xem.
- Đang áp vào Next: agent A (tokens/@theme, layout, search/trips/seats, route-landing, /xe-khach), agent B (confirm/payment/account/auth/booking/email/tracking). WP (trang chủ, banner CPT, nội dung, REST route) làm sau khi nhập CMS xong.
- Nhãn đổi cần anh xác nhận: "Về Hải Vân", "Dùng mã hoặc điểm", "Giữ vé", stepper 3 bước, "Chọn ghế". Dữ liệu mẫu trong comps có ghi "Bản mẫu".

## Kết quả redesign (2026-10-29)
- Next: token `src/app/tokens.css` (= `docs/design/tokens.css`) + `theme-map.css` (@theme) + `hv-*.css`; header slab, mast footer, stepper, tìm/kết quả/ghế, landing tuyến, xác nhận, thanh toán, tài khoản, đăng nhập theo comps. Review redesign đã sửa: VNPay 00 → trang thành công có cảnh báo "không thanh toán lại" + poll; combobox bàn phím; `--bar-h` cho thanh dính; trả lại nhãn nghiệp vụ cũ; chi tiết chuyển khoản/tiền mặt luôn hiện; tabs Radix; font biến thiên; bản đồ bỏ toạ độ (0,0).
- WP: header/footer giống Next; trang chủ v2 (CPT `hv_banner`, popup 1 lần/ngày); templates nội dung; `[haivan_cta]` thay 1.259 iframe CMS (640 bài); REST `haivan-web/v1/route/<a>/<b>` + 4 hướng seed; robots `Sitemap`; Rank Math Organization; ảnh 26 trang tĩnh.
- Kiểm: `pnpm verify` 311 test, contract-diff 9/9, e2e 13/13 (0 DNS production), check-layout giống hệt fallback, parity URL cũ không 404 mới (chỉ `/favicon.png`, `/404` như cũ), CMS 1.001/1.001 URL 200.
- Còn mở: 5 hướng landing chưa có slug (ĐB→HN, khứ hồi, Mộc Châu 2 chiều, SL→HN); giá hạng xe SG–VT trong seed cần MKT đọc; nhãn đổi đề xuất ("Về Hải Vân"…) chờ anh duyệt; Lighthouse chưa đo; kongming checkpoint cuối bỏ qua theo yêu cầu dùng model nhẹ.
