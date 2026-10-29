# Phase 1 (WordPress) – báo cáo

## File đổi (tất cả trong `wordpress/`)
Theme `wp-content/themes/haivan-web-child/`:
- MỚI `inc/corridors.php` – CPT `hv_corridor` "Tuyến chính", meta box, validate khi lưu, `hv_corridors_enabled()`, `hv_corridor_search_url()`, `hv_admin_flash()`.
- MỚI `inc/promos.php` – CPT `hv_promo` "Chương trình giảm giá", meta box, validate khi lưu, `hv_promo_payload()`.
- MỚI `inc/booking-config.php` – `hv_booking_config()` (dùng lại) + REST `GET /wp-json/haivan-web/v1/booking-config`.
- SỬA `inc/search-shortcode.php` (chế độ tuyến + JSON inline, thêm attr `corridors="off"`), `assets/js/search.js` (initCorridor; ô tự do tách thành initFree, logic giữ nguyên, tải places lười khi form ẩn), `assets/css/search.css`, `inc/i18n-labels.php` (khoá `sc_*` vi+en), `inc/home-blocks.php` (`hv_render_corridor_cards`; `hv_render_route_cards` không filter -> 4 tuyến, không có tuyến -> rơi về hv_route cũ; trang sân bay vẫn dùng hv_route), `inc/mkt-admin.php` + `assets/css/admin-mkt.css` (CSS admin), `functions.php` (require 3 file, `HV_WEB_VERSION` 1.3.0 -> 1.4.0).
Scripts: MỚI `scripts/seed-corridors.php`, `scripts/lib/corridors-seed.php` (sinh từ HTML booking.haivan.com đã lưu bằng script scratchpad `corridors/gen-seed.py`).

## Chạy / seed
```bash
cd wordpress
docker compose --profile tools run --rm -T wpcli eval-file /scripts/seed-corridors.php   # idempotent; HV_DRY_RUN=1 chỉ báo cáo; HV_FORCE=1 ghi đè 4 tuyến seed
```
Đã chạy trên local (4 tuyến #5655-5658 bật, 4 promo mẫu #5659-5662 TẮT, không mã). Theme mount trực tiếp nên không cần build. Local test: đã bật thử promo + mã rồi trả về tắt/không mã.

## REST mẫu (đối chiếu contract.md: khớp field/kiểu; promos rỗng hiện tại)
`curl localhost:8180/wp-json/haivan-web/v1/booking-config` -> 200, `Cache-Control: public, max-age=300`, `{"version":1,"corridors":[4 tuyến],"promos":[]}`. Thử bật promo có mã: `{id,type:"roundtrip",corridor:"sg-vt",direction:"both",per_seat_vnd:20000,code,label{vi,en},badge{vi,en},seats{1,9},tiers:[],...}`; combo xuất `tiers[{seats,class,price_vnd,was_vnd|null}]`. Đã kiểm lọc: tắt / thiếu mã / `book_from` tương lai / `book_to` quá khứ / tuyến tắt đều không xuất.

## Quyết định
- Stops: textarea mỗi dòng `mã | vi | en | ghi chú | tên điểm, lat, lng` (theo kiểu `hv_route_faq`), validate lúc lưu (mã, trùng, toạ độ trong VN, ≤60 điểm); sai -> giữ bản cũ + notice; thiếu dữ liệu -> tuyến tự tắt + notice.
- Promo: bật cần code hợp lệ + tuyến + (khứ hồi: mức giảm; combo: ≥1 bậc), không thì tự tắt + notice. Help text admin nói rõ: giảm thật do ERP theo mã, mã công khai, IT phải giới hạn mã theo tuyến/ngày/số lượng. Nhãn/badge trống -> dựng mặc định từ con số thật (vd. "Giảm 20k/ghế chiều về").
- Seed roundtrip: `direction:"both"` (giảm áp cho chiều về dù đi chiều nào; spec đo 20k cả hai chiều). Combo sample: seats 2-4, Luxury 419/599/789k (gốc 520/780/1040k), Royal 469/669/869k (không có giá gốc); `book_ahead_minutes` để trống (nguồn mâu thuẫn: tiêu đề "từ 1 tiếng", rule 15 phút).
- Landing đã curl (:8180): sg-vt ab `quan-1/vung-tau`, ba `vung-tau/quan-1-san-bay` (title "Xe Vũng Tàu đi Sài Gòn"); hn-db ab `my-dinh/dien-bien`; hn-sl ab `my-dinh/son-la`; hn-moc không có; `vung-tau/quan-1`, `dien-bien/my-dinh`, `son-la/my-dinh`, `my-dinh/moc-chau`, `moc-chau/my-dinh` = trang mặc định noindex nên để null. Card trang chủ hn-moc -> tim-chuyen điền sẵn (không kèm `date`, Next tự lấy hôm nay VN; tránh ngày cũ khi trang bị cache).
- sg-vt: điểm Q1 dùng Quận 1 (10.7753882,106.702825, place #983); điểm nhóm "Tuyến Tân Sơn Nhất" (T1-T3, Tân Bình, Bình Thạnh, 159 ĐBP, Vĩnh Nghiêm, Huỳnh Văn Bánh, Thảo Điền, Lexington) dùng Sân bay Tân Sơn Nhất (10.8184631,106.6588245, #75). Long Thành (2 điểm) để theo Quận 1 vì nguồn không ghi tuyến. hn-db: Điện Biên/Bản Phủ/Mường Chà mỗi điểm có point riêng, `sleeper:true`. Ghi chú điểm: bỏ tiền tố "Đón/trả <khu vực>:" và bỏ ghi chú chỉ lặp tên điểm.
- Form: 4 nút tuyến (chọn = select-bg + ring + tick), 2 select điểm + swap, Ngày đi (min hôm nay VN, max +max_days), "+ Thêm ngày về" mở date + nút × (min = ngày đi, +1 nếu sleeper, mặc định ngày đi +2 / +1 sleeper), Số vé select 1-9, nhãn khứ hồi (promo roundtrip của tuyến, `direction` = chiều về hoặc both) ở hàng nhãn "Ngày về", link "Đi tỉnh khác?" chuyển sang ô tự do (apigw places, tải lười), có link quay lại. Hàng "Chuyến hôm nay": chip Cả ngày/0-6/6-11/11-14/14-18/18-24 + số chuyến (đọc hết các trang el/trips, tối đa 15 trang, timeout 12s, retry 1 lần), chip 0 chuyến khoá, lỗi -> chip mở không số + thông báo. Tiêu đề hàng dùng 2 span (không dấu "·" theo design.md "no middle-dot strings").
- URL submit đã chạy thử: `from=<encodeURIComponent("tên,lat,lng")>&to=...&date=DD-MM-YYYY&numberGuest=N&type=2&tuyen&chieu&diem_di&diem_den[&ngay_ve=DD-MM-YYYY]` (khớp buildSearchUrl). Thêm tham số TUỲ CHỌN ngoài contract: `gio=<dawn|morning|noon|afternoon|evening>` khi bấm chip khung giờ (Next có thể chọn sẵn bộ lọc giờ, bỏ qua cũng không sao). Chip luôn tìm ngày hôm nay; `ngay_ve` bị bỏ nếu không còn hợp lệ so với hôm nay.

## Kiểm
- `php -l` mọi file inc/*.php + scripts: sạch. `node --check search.js` sạch.
- `node docs/design/check-tokens.mjs`: all clean. `node scripts/layout-audit.mjs / /en/ /xe-san-bay /dat-ve-nhanh/giave`: 0 lỗi, 0 cảnh báo (tool ghi `.layout-audit/` ở gốc repo).
- Giả lập lưu admin: promo bật không mã -> tự tắt + notice; corridor stops sai/ id trùng/ toạ độ đảo/ max_days sai -> notice, giữ dữ liệu cũ. (Lần thử làm hỏng 1 tuyến local, đã seed lại HV_FORCE=1.)
- Screenshot (trang chủ 1440 + 390, gồm đổi tuyến, swap, thêm ngày về, nhãn khứ hồi, ô tự do, EN): `/private/tmp/claude-501/-Users-phuc-Documents-REA-Android/e9a4f2ff-3447-4eef-b689-80287fc21d9a/scratchpad/corridors/wp-{desk,mob}-*.png`, `wp-{desk,mob}-home-full.png`, `wp-desk-en.png`.

## Lưu ý / câu hỏi mở
1. Rate limit apigw (`x-ratelimit-limit: 60`): mỗi lần tải trang chủ + mỗi lần đổi tuyến/chiều/điểm/số vé gọi 1-11 request el/trips (cache theo khoá trong trang). Cần chấp nhận hoặc giới hạn (vd. chỉ trang 1 + `meta.total`, bỏ đếm theo khung giờ).
2. Q1 vs TSN: el/trips ngày 30/10 cho `total` 86 cả hai toạ độ, nhưng mã đón khác (Q1HCM+SG31 vs Q1HCM+TSN) -> lọc đúng line cần lọc client theo `place_code` ở phía Next nếu muốn.
3. Long Thành thuộc tuyến nào? (đang theo Quận 1). `book_ahead_minutes` combo 60 hay 15?
4. Dữ liệu mảng `promos` hiện rỗng vì mẫu tắt; Next fallback json nên giữ `promos: []`.
5. `hv_corridor` không đăng ký Polylang (dùng chung vi/en, nhãn en nhập tay).

## Cập nhật sau review
- Giảm request el/trips: chỉ tải khi hàng chip vào khung nhìn (IntersectionObserver) + debounce 400ms; luôn `numberGuest=1`; khoá cache = tuyến+chiều+điểm tìm chuyến thực+ngày (không số vé, không mã điểm); cache bộ nhớ + sessionStorage 5 phút; đổi khoá thì huỷ (AbortController) các trang đang tải. Đo: mở trang trên mobile (hàng chip dưới màn hình) 0 request; cuộn tới hàng 4 request; đổi số vé 0; reload trong 5 phút 0.
- Ngày hiển thị "Thứ năm, 29/10/2026" / en "Thu, 29 Oct 2026" bằng nhãn phủ lên ô date gốc (giữ bộ chọn + nhãn a11y; bấm vào chữ mở bộ chọn; giá trị gửi vẫn DD-MM-YYYY). Bỏ dòng "N chuyến hôm nay" (chỉ còn thông báo khi đang tải/lỗi/hết chuyến).
- Nút tuyến < 40rem: rail một dòng, scroll-snap, không xuống dòng; từ 40rem lưới 4 cột. Mobile: Ngày đi và Ngày về mỗi ô một hàng, Số vé + Tìm vé chung hàng.
- Long Thành giữ theo Quận 1; combo `book_ahead_minutes` để trống.

## Sửa theo code review (WP)
- M1: nhãn khứ hồi trong `search.js` theo `travel_from/travel_to`, `weekdays`, `book_ahead_minutes` (+ `hours.to` cho ngày hôm nay); chưa chọn ngày về thì hiện nếu có ngày nào trong [min, max] đủ điều kiện, đã chọn thì xét đúng ngày đó. Giờ xuất bến (`hours.from`) chưa biết ở form nên không loại.
- M2: landing chỉ nhận đúng `a/b` (`hv_corridor_valid_landing`), kiểm khi lưu có notice, và khi xuất.
- M5: tải trang song song tối đa 3, dừng + huỷ các trang còn lại khi lỗi; HTTP 429 -> trạng thái "Chưa tải được", nghỉ 60 giây không gọi thêm; không gọi khi `document.hidden`, tiếp tục ở `visibilitychange`. Đo bằng mock: 11 request, tối đa 3 song song; 429 ở trang 4 -> 4 request, đổi tuyến trong 60s -> 0 request.
- M6: admin (hộp bậc giá + hướng dẫn) ghi "giá tham khảo; giá thật do hệ thống vé tính".
- M7: chỉ `edit_others_posts` được bật chương trình/đổi mã; người khác lưu -> giữ mã cũ, ép `enabled=0` + notice; ghi trong hướng dẫn admin. Đã thử với user role author.
- L1: nhãn tuyến lấy `post_title` thô + `html_entity_decode` (không qua `the_title`); nhãn/badge promo cũng giải mã.
- L3: xác nhận ngày về mặc định = ngày đi + 1 (giường nằm) / + 2 (còn lại).
- L6: tuyến thiếu tiêu đề không bật/không xuất; `numberposts => -1` cho tuyến, promo, danh sách chọn tuyến (sắp theo menu_order, ID).
- L7: vòng `for` option số vé đổi `$tix` (không đụng `static $n`).

## Hero trang chủ (yêu cầu của chủ) – theme 1.5.0
- Tab dịch vụ (sân bay/hợp đồng/du lịch) tạm ẩn hẳn: cài đặt mới Cài đặt > Trang chủ Hải Vân > "Ô tìm vé" > "Hiện tab dịch vụ khác" (mặc định tắt, lưu `show_service_tabs`); shortcode có attr `tabs="on|off"` ép riêng. Code tab giữ nguyên.
- Cấu trúc trang chủ: dải vàng H1 -> `.hv-hero-stage` (banner tràn mép + thẻ tìm vé) -> dải "Chuyến hôm nay" (section nền trắng riêng, đệm chuẩn) -> dải cam kết (đổi sang nền ấm; các khối cuộn bắt đầu trắng/xám/ấm để không trùng nền liền kề). Shortcode `[haivan_search today="strip"]` + `hv_search_today_strip()` in dải ngoài thẻ; mặc định (landing /dat-ve-nhanh, /xe-san-bay) chip vẫn nằm trong thẻ. JS nối bằng `data-today`, chuyển sang ô tự do thì ẩn cả dải.
- Từ 60rem: banner cao `clamp(37rem, 64vh, 42.5rem)` (hơi cao hơn đề xuất 35rem để thẻ không quá ~58% banner), ảnh phủ kín, thẻ kính (blur + fallback `@supports`/`prefers-reduced-transparency` đặc) căn giữa theo khung container, cách đáy `--section-pad`; mũi tên ở 22% chiều cao banner, bộ đếm góc trên phải (không đụng thẻ). 40-60rem: cùng kiểu, banner 44.5rem (thẻ ~59%); nút tuyến là rail một dòng tới 60rem. < 40rem: banner 16:9 trên, thẻ đặc đè s-6, rồi dải chip; mũi tên ẩn.
- Slide dựng sẵn thẳng hàng với khung nội dung, chữ ở dải trên, nút phụ ẩn (cả slide là liên kết). Poster cũ 2,9:1 bị cắt hai bên và thẻ che phần chữ dưới: cần banner mới theo vùng an toàn.
- Vùng an toàn ghi trong hướng dẫn banner (admin): máy tính >= 1920x680, chữ/chủ thể ở 35% trên, ~50% dưới là nền, lề hai bên ~8%; điện thoại cắt 4:3 (1000x750) hiển thị 16:9, chủ thể ở giữa.
- Kiểm: php -l, node --check, check-tokens sạch, layout-audit `/ /en/ /xe-san-bay /dat-ve-nhanh/giave` 0 lỗi 0 cảnh báo. Ảnh: `corridors/wp-hero-{1440,1024,768,390}.png`, `wp-hero-*-full.png`, `wp-hero-*-slide{2,3,4}.png`, `wp-hero-390-strip.png`.

- Nút tuyến (owner feedback): bỏ rail. Dưới 40rem lưới 2x2 thấy đủ 4 tuyến; 40-60rem 4 cột; mỗi nút 2 dòng có kiểm soát từ `ends.a` / `ends.b` (dòng 1 mờ, dòng 2 đậm có icon mũi tên aria-hidden, cùng 16px, cao bằng nhau), tick góc trên phải khi chọn; từ 60rem một dòng nhãn đầy đủ như cũ. Tên truy cập = nhãn tuyến đầy đủ (`aria-label`). Ảnh: `corridors/wp-hero-390.png`, `wp-hero-768.png`.

Status: DONE_WITH_CONCERNS
Summary: CPT, seed, REST, ô tìm vé chế độ tuyến, khối trang chủ xong và kiểm bằng lint/token/layout-audit/screenshot; chip "Chuyến hôm nay" đọc el/trips khá nhiều request.
Concerns/Blockers: rate limit apigw 60/phút (mục 1), tham số `gio` ngoài contract, Long Thành/line TSN chưa rõ nguồn.
