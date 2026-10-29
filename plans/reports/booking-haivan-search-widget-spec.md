# Spec widget tìm vé booking.haivan.com (landing quảng cáo) — 261029

Nguồn: 8 trang + JS v1.73.9 (lưu ở scratchpad `booking-hv-src/`), kiểm DOM bằng browser pane, 12 GET đọc (không POST/giữ ghế). Viết tắt: RB=route-booking.js, RT=roundtrip-demo.js, CB=combo.js, BR=booking-renovate.js, DB=direct-booking.js, BH=booking-handoff.js (đều `assets/`).

**Kết luận chính (đọc trước):** widget KHÔNG dùng apigw. Nó gọi proxy WP riêng `booking.haivan.com/wp-json/haivan-booking/v1/{trips,trip/{id},trip-prices/{id},web-combo,web-bookings,web-payments}` (ERP riêng, Turnstile). "Tìm vé" không điều hướng, render danh sách ngay trên trang. Link "hệ thống chính thức" mới là `haivan.com/xe-khach/tim-chuyen?...` y hệt contract của ta. 20k khứ hồi, combo, đặt trực tiếp = logic server của họ -> không clone được qua apigw (xem §6).

## 1. Tính năng form (`form.hvr-search`, class thêm `hvr-search-unified hvr-search-with-return`)
| # | Thấy gì | Quy tắc | Nguồn dữ liệu | Code |
|---|---|---|---|---|
| F1 | Radio ẩn `route` (vd `hn-moc`) | Mỗi trang = 1 corridor 1 chiều; key `sg-vt/vt-sg/hn-moc/moc-hn/hn-sl/sl-hn/hn-db/db-hn(+md-bp/bp-md/md-mc/mc-md)`. `data-route-options` JSON: label, reverse, from/to_search, from/to_location (lat,lng), expected_*_code | HTML server-render (hardcode PHP) | RB:76-90 |
| F2 | Select Điểm đi / Điểm đến (`from_point`,`to_point`), có optgroup + `data-note` | Chỉ liệt kê điểm đón/trả TRONG tuyến. Đổi điểm -> tự tìm lại (không cần bấm). Default = option đầu; riêng SG-VT đầu Sài Gòn có option rỗng "Tất cả điểm đón · cả 2 tuyến" (VT->SG: option rỗng ở đầu trả) | hardcode HTML; slug gửi cho proxy | RB:1593-1596 |
| F3 | Nút ⇄ "Đổi chiều tuyến" | LÀ LINK sang trang tuyến ngược, mang `?ngay=YYYY-MM-DD&khach=N&diem_di=<to_point>&diem_den=<from_point>#tim-ve` (điểm đổi vai) | link server-render; trang đích đọc lại, chỉ nhận giá trị hợp lệ trong select/min-max | RB:1497-1562 |
| F4 | Điện Biên: "Điểm đến" là select ĐỔI TUYẾN (Điện Biên/Bản Phủ/Mường Chà), chiều ngược "Điểm đi" là select | đổi = đổi `route` (`hn-db/md-bp/md-mc`) rồi tải lại; `?tuyen=md-bp` chọn sẵn; không có from_point/to_point | `data-route-options` | RB:1585-1590 |
| F5 | Ngày đi (input date, hiển thị "Thứ Năm, 29/10/2026") | default = hôm nay GIỜ VN (`Asia/Ho_Chi_Minh`, ép lại nếu trang mở qua đêm); min = hôm nay; max = hôm nay+29 ngày (trang khứ hồi ĐB: +30). Đổi ngày -> tìm lại ngay | server-render min/max/value; client chốt giờ VN | RB:1096-1108 |
| F6 | Toggle "Một chiều / Khứ hồi" + nhãn treo "Tiết kiệm ngay 20k/ghế" (nút Khứ hồi), nhãn "Giảm 20k/vé về" cạnh "Ngày về", dải "Mời quý khách đặt vé khứ hồi, giảm 20.000đ/vé chiều về." dưới form, banner "Đi về cùng lúc, chiều về giảm 20.000đ/ghế" trên danh sách | 20k lấy từ SERVER: `GET web-combo?direction=..&date=..&only=rules` -> `rules.roundtrip_discount_vnd` (đo: sg-vt=20000, hn-moc/hn-sl=20000, hn-db=0 -> ĐB không hiện nhãn, thay bằng "Khứ hồi từ 500k/2 vé" nếu có combo). Không hardcode. Giảm = 20k x min(số ghế đi, số ghế về), chỉ cho chiều về, KHÔNG cộng dồn combo; server là nơi quyết | web-combo (proxy) | CB:568-600, CB:605-630, CB:226-243, DB:453-470 |
| F7 | Ô "Ngày về" luôn hiện, tùy chọn ("+ Thêm ngày về", nút × xoá) | Trống = một chiều; chọn ngày = TỰ chuyển khứ hồi; xoá = về một chiều. Bấm tab Khứ hồi khi trống -> điền `data-default-return` (= hôm nay+2) kẹp trong [min,max]. min ngày về = ngày đi (+1 nếu xe giường nằm `data-sleeper=1`, tức ĐB). Đổi ngày đi tự đẩy min ngày về | client | RT:235-262, 1146-1165, 1260-1340 |
| F8 | Khứ hồi = stepper "1 Chuyến đi - 2 Chuyến về - 3 Kiểm tra", tạm tính hai chiều | Bấm Tìm vé gọi 2 request: `trips?route=hn-moc&date=D1&from_point=A&to_point=B` + `route=moc-hn&date=D2&from_point=B&to_point=A` (chiều về đổi vai điểm). URL KHÔNG đổi. Tự bật bằng `?khu_hoi=1`; có trang riêng `/mua-ve-xe-khu-hoi-dien-bien-ha-noi/` (radio chiều, select cặp `hvrt-route-pair`, ngày về bắt buộc, default ngày về = ngày đi+1) | proxy trips | RT:400-415, 1132-1140, 1357 |
| F9 | Số vé (select 1..9, name `guests`) | Cố định 1-9; đổi -> tìm lại. Combo: tối đa 4 vé/SĐT/chuyến (`max_per_phone`) | hardcode HTML | RB:1580-1583 |
| F10 | Nút "Tìm vé" | Có `novalidate` + `reportValidity()`; preventDefault, tải lại danh sách, cuộn tới `#lich-chay`; nút disable + class `is-loading` khi đang tải | - | RB:1458-1484, 1564 |
| F11 | Trạng thái | "Đang tìm chuyến phù hợp…", "N chuyến phù hợp trong ngày.", lỗi: "Chưa tải được lịch chuyến… gọi 1900 6763". Timeout 12s, lỗi 5xx/mạng/timeout thử lại 1 lần sau 0,8s, 4xx không | - | RB:413-445 |
| F12 | Rỗng -> gợi ý ngày | Dò tối đa 7 ngày kế (bằng request tuần tự, không chen lượt khách), hiện "Ngày gần nhất còn chuyến: dd/mm" + nút "Xem chuyến ngày dd/mm" | proxy trips | RB:1077-1135 |

## 2. Handoff "Tìm vé" -> luồng đặt thật
- Tìm vé = `GET booking.haivan.com/wp-json/haivan-booking/v1/trips?route=<key>&date=YYYY-MM-DD&guests=N[&from_point=<slug>][&to_point=<slug>]&_hvr_ts=<ms>` (RB:395-404). Response `{data:[trip],meta:{total}}`, trip = apigw-shape (`id,time,duration,available_seats,total_seats,from/to{place_id,place_code,place_name,reached_at},price{min,max,price},product{id,name},merchant{code},transit{start,end},car_imgs,amenities`) + `hvr_detail_token` (HMAC) + `line` (q1|tsn, chỉ SG-VT). Trả HẾT trong 1 lần (SG-VT 107 chuyến), không phân trang.
- Chọn ghế: `GET trip/{id}?departure_id&destination_id&merchant_code&guests&direction&date&token` (sơ đồ), `trip-prices/{id}` (sửa khung giá theo giá ghế thật, cache 10p; RB:370-385, trip-price-fix.js).
- Tiếp tục có 2 đường: (a) `window.haivanDirectBooking.enabled` = đặt trực tiếp (§4); (b) fallback BH/RB:596: mở iframe cùng origin `booking.haivan.com/xe-khach/tim-chuyen?...` rồi DÙNG JS BẤM DOM của SPA (`.cardview`, "Xem thêm", `seat_active.svg`, "Tiếp tục") để dựng lại chuyến+ghế; OTP/giữ chỗ khách tự làm. Rất mong manh, KHÔNG nên clone.
- Link chính thức (`[data-hvr-official-link]`, RB:76-90): `https://haivan.com/xe-khach/tim-chuyen?from=<from_search>,<lat>,<lng>&to=<to_search>,<lat>,<lng>&date=DD-MM-YYYY&numberGuest=N&des_start=&des_end=&type=2` + utm (booking-attribution.js).

Map sang tim-chuyen của ta (`lib/search-url.ts`): `from/to` <-> `SearchPoint{name,lat,lng}` (đúng format), `date` DD-MM-YYYY <-> iso, `numberGuest` <-> `numberGuest`, `type=2` <-> `type` (ta mặc định 2 từ form), `des_start/des_end` rỗng: ta bỏ qua. `route/from_point/to_point/return date` không có trong contract. -> **Không cần đổi API/contract**: form chỉ cần điền lat/lng corridor vào `from/to` (đã xác nhận apigw `el/trips` nhận đúng toạ độ này, xem §5/§6).

## 3. "Lịch xe trong ngày" (`section#lich-chay`, h2 "Giờ chạy & giá vé…")
- Bảng thẻ chuyến: Giờ đón/Đến, Loại xe (+ nhãn Limousine/Giường nằm), Thời lượng, Khoảng giá (`min - max`), Chỗ trống; mở chi tiết = ảnh xe, điểm đón/trả, tiện ích, thanh chỗ còn, nút "Chọn ghế tại đây" (sơ đồ nhúng tại chỗ). Sắp xếp mặc định theo `from.reached_at`, cùng giờ ưu tiên `merchant.code == data-prefer-merchant` (17 = Xuân Tráng ở Mộc Châu/Sơn La) (RB:147-151). Chuyến qua 0h gắn nhãn "khuya" (`quaDem`).
- Chip khung giờ (BR:189-198): Cả ngày(0-30) / Sáng sớm 0-6h / Sáng 6-11h / Trưa 11-14h / Chiều 14-18h / Tối 18-24h (+qua đêm). Nửa mở [từ,đến). Mỗi chip kèm số đếm theo (giờ ∩ hạng xe đang chọn); chip 0 chuyến bị `disabled` (trừ "Cả ngày"). Mặc định "Cả ngày", khách chọn thì giữ qua đổi ngày. (BR:380-410)
- Hàng 2: chip "Mọi hạng xe" + 1 chip/hạng xe có thật (`product.name`, tạo động, đơn chọn); select Sắp xếp: Giờ đi sớm nhất / Giá thấp nhất / Còn nhiều chỗ; dòng "N chuyến phù hợp bộ lọc"; thông báo rỗng "Khung giờ này chưa có chuyến…" (BR:340-376).
- Trang ĐB dùng thanh chip giờ cụ thể (`hv-time-chip`: 18:00, 18:30, 19:00…) thay vì khung (RB:1627-1660). Lọc 100% client trên danh sách đã tải, không gọi API.
- Khứ hồi dùng cùng bộ lọc, lưu trạng thái riêng cho chiều đi/về (khoá theo chặng). `?chi_combo=1` chỉ giữ chuyến có nhãn Combo.

## 4. Nhóm / Combo / Early-bird VT / Direct booking
- **Đi nhóm, đặt trước từ 1 tiếng? ("hvt", combo-early-vt.js + inc/combo-early-vt.php, chỉ SG-VT):** vé "2 vé Luxury 419k (gốc 520k), 3 vé 599k, 4 vé 789k; Royal 469/669/869k". Bấm "Có, chọn ngày đi" -> dải ngày (30 ngày, `data-days` JSON gồm khung giờ có combo mỗi ngày, vd 29/10 5h-23h, 31/10 6-7h,9h,19h) -> "Xem chuyến combo ngày dd/mm" điền ngày, bấm Tìm vé, cuộn tới chuyến `.is-combo` đầu. Điều kiện: đặt trước giờ chạy >=15 phút (`min_minutes_ahead`), trả QR, không hoàn, không ghế 1-2, 3 vé = trọn hàng cuối, quota 10 suất/chuyến, không cộng dồn 20k. Giá+điều kiện do `web-combo` (rules.totals/regular/windows/first_days) trả, trang không hardcode (CB header).
- **combo.js:** gắn nhãn Combo + "Còn ít suất ưu đãi" lên thẻ chuyến đủ điều kiện, banner "Ưu đãi đặt sớm", gạch giá thường, đếm ngược hạn đặt ("Còn X ngày h giờ m phút") (CB:454-530). ĐB: combo 2 vé Eco 500k, Lux 900k, Royal 1,2tr (đặt trước 3 ngày Lux/Royal) + landing `/combo-dien-bien-500k/`; Mộc Châu/Sơn La: chương trình `mcsl` per_seat, bắt đầu từ 05/11 (>=7 ngày).
- **direct-booking.js:** thay iframe: hộp nhập tên + SĐT (quốc tế được) + ghi chú (prefill `data-note` của điểm đón/trả đã chọn, DB:421-431) + Cloudflare Turnstile -> `POST web-bookings` (Idempotency-Key, legs[{trip_ref,merchant_code,date,direction,pickup_address,seats}], combo flag) -> trả QR PayOS (`web-payments`, poll 3s) hoặc mã đặt chỗ trả tại nhà xe. Upsell "Thêm chiều về" (trong ngày/hôm sau/ngày kia) khi đơn 1 chiều (DB:453-520). Không đăng nhập.
- **roundtrip-demo.js:** engine 2 chặng dùng chung (§1 F6-F8). **booking-sections.js/renovate/i18n/site-header:** khối nội dung/FAQ, trust VT, dịch EN, header. **Log/tracking:** `web-client-log` (bước, ms, lỗi), event `roundtrip_promo_shown, return_date_set, combo_*, booking_created, payment_paid`, GTM/Ads.

## 5. Danh sách điểm 4 corridor (slug -> hiển thị; ghi chú = `data-note`)
Corridor: place apigw `api/places?type=0` (đã GET) + toạ độ widget gửi qua `from/to`.
- **SG-VT** (merchant 02, `sg-vt`/`vt-sg`; toạ độ SG `Quận 1`=10.7706593,106.7012444 (khác place apigw #983 10.7753882,106.702825 nhưng apigw vẫn trả đủ 107 chuyến), VT `TP Vũng Tàu (Gành Hào)`=10.3391989,107.0710401 = apigw place #74):
  - Sài Gòn, tuyến Quận 1: `q1` Phòng chờ 34 Nguyễn Thái Bình; `luong-dinh-cua` Thủ Đức 6 Lương Định Của. Tuyến TSN: `tsn-t1` TSN ga nội địa T1; `tsn-t2` ga quốc tế T2; `tsn-t3` ga nội địa T3 (có note); `tan-binh` 307 Nguyễn Văn Trỗi; `binh-thanh` 607 Điện Biên Phủ; `dbp-159` 159 ĐBP Q1; `vinh-nghiem` Chùa Vĩnh Nghiêm Q3; `huynh-van-banh` Phú Nhuận; `thao-dien` Vincom Thảo Điền; `lexington` Lexington (Mai Chí Thọ). Long Thành: `long-thanh`, `long-thanh-stop`.
  - Vũng Tàu: `vt` Phòng chờ 156B Lê Hồng Phong; `vt-hotel` Khách sạn/nhà riêng (note yêu cầu ghi địa chỉ); `ganh-hao`, `hoang-hoa-tham`, `lotte`, `paradise`, `gieng-nuoc`, `dau-khi`, `seaview`, `nguyen-huu-canh`, `luu-chi-hieu`, `khang-linh`, `dong-xuyen`, `cua-lap`, `eo-ong-tu`. Bà Rịa: `ba-ria`, `nga-ba-ba-ria`, `tan-thanh`.
  - VT->SG đối xứng (cùng slug, đổi vai). Map đã đo: `tsn-t1` -> place 1 `TSN` (line tsn, transit trả), `gieng-nuoc` -> 151 `VT15`, `q1` -> 222 `34NTB` (line q1), rỗng -> `SG31` 95 (tsn) + 34NTB 222 (q1) -> `GHAO` 12; `vt` -> 131 `VT10`. Proxy tự gộp 2 tuyến (Q1 + TSN) làm 1 danh sách.
- **HN-Mộc Châu** (merchant 17; `hn-moc`/`moc-hn`; MDI=62, MCH=70 Mộc Châu, BXM=96 Bến xe Mộc Châu; toạ độ Mỹ Đình 21.0284297,105.7782687, Mộc Châu 20.8461723,104.6415738 = apigw #7/#39): HN (3): `my-dinh` Bến xe Mỹ Đình, `nguyen-tuan` 35 Nguyễn Tuân, `chau-van-liem` 10 Châu Văn Liêm. Mộc Châu (8): `nong-truong`, `muong-thanh`, `truong-giang`, `ben-xe-mc`, `tran-huy-lieu` (VP 254 Trần Huy Liệu), `ban-ang`, `pa-hang` (ngã 3), `muong-sang` (cây xăng). Đã đo: đổi from/to_point KHÔNG đổi kết quả (21 chuyến, cùng size 34275B) -> điểm chỉ mang tính chọn/ghi chú; API tự báo place gần nhất (RB:395 comment).
- **HN-Sơn La** (merchant 17; `hn-sl`/`sl-hn`; SOL=78 Bến xe Sơn La; toạ độ 21.3014976,103.9435128 = apigw #14): HN 3 điểm như trên; Sơn La: `don-tan-noi` Đón trả tận nơi (trung tâm TP), `ben-xe-sl` Bến xe Sơn La. Trang ngược `/mua-ve-xe-son-la-ha-noi/` (không fetch).
- **HN-Điện Biên** (merchant 01; xe giường nằm 34-44 chỗ; không có from/to_point, chọn bằng route): `hn-db` MDI(id 2)->DBI(7) Điện Biên [toạ độ 21.392683719524,103.010258674622 = apigw #12]; `md-bp` ->BPH(8) Bản Phủ [21.3174085589382,103.010549797354 = #13]; `md-mc` ->MCA(65) Mường Chà [21.7547891787249,103.088819161293 = #65]; chiều ngược `db-hn/bp-md/mc-md`. Điểm đi cố định "Bến xe Mỹ Đình". Lưu ý place_id theo merchant: Mỹ Đình = 2 (m.01) vs 62 (m.17) vs apigw places list #7.

## 6. Gap vs form hiện tại + rủi ro
Hiện có: `SearchForm` (PlacePicker tự do từ `places?type=0` + Google; counter số khách >=1 không trần; ngày -1 ngày..+4 tháng; swap trong form; submit -> `/xe-khach/tim-chuyen`), `RouteSearchForm` (điền sẵn 2 đầu tuyến từ CMS), `RouteTripList` (hôm nay, 1 khách), `TripFilterBar` (khung giờ nhiều lựa chọn kèm hạng xe + sắp xếp, lọc client), WP `[haivan_search]` (cùng contract).
| Tính năng | Ta | Công | Ghi chú |
|---|---|---|---|
| Form corridor cố định + select điểm đón/trả (config hardcode 4 tuyến) | thiếu | M | Chỉ UI/prefill. Giữ `from/to` = toạ độ corridor; điểm đón/trả -> `note` đặt vé (`buildBookingBody` đã có `note`) + hiển thị. Không map được sang apigw place (điểm trung gian không có trong places) |
| Link đổi chiều mang ngày/khách/điểm (`ngay,khach,diem_di,diem_den,tuyen`) + prefill an toàn | thiếu | S | Validate theo min/max + danh sách điểm như RB:1522 |
| Ngày: giờ VN, 0..+29 ngày, default hôm nay | khác (-1..+4th) | S | Preset theo landing; giữ hàm giờ VN sẵn có |
| Số vé select 1-9 | counter vô hạn | S | UI-only |
| Một chiều/Khứ hồi + ngày về tùy chọn + default +2 | thiếu | L | Booking flow của ta 1 chặng (không có order 2 chặng); khả thi: 2 lần search tuần tự + giữ chuyến đi trong state, KHÔNG có giảm 20k |
| Nhãn "20k/ghế", combo, early-bird VT, nhóm | thiếu | không làm | Giá do `web-combo`/ERP của họ quyết; hiển thị mà đơn không áp = quảng cáo sai. Cần Hải Vân xác nhận/endpoint trên apigw |
| Direct booking (Turnstile, `web-bookings`, PayOS không login) | thiếu | không làm | Khác contract apigw `hold-booking/bookings`; vi phạm ràng buộc |
| Chip khung giờ có số đếm + disable chip rỗng + "Cả ngày" đơn chọn + trạng thái "N chuyến" | có bản dropdown nhiều chọn, không đếm | S | Tái dùng `TIME_BUCKETS`, thêm count |
| Gợi ý ngày gần nhất còn vé (dò 7 ngày) | thiếu | S-M | 7 GET `el/trips` tuần tự; cân nhắc giới hạn/ cache |
| Thanh chip giờ cụ thể (ĐB) | thiếu | S | Sinh từ danh sách chuyến |
| Retry 1 lần + timeout 12s + lỗi gọi 1900 6763 | không rõ | S | |
| Nhãn line Q1/TSN trên thẻ (SG-VT) | thiếu | S | Suy từ `place_code`, vì apigw không có `line` |

Rủi ro:
1. Proxy khác apigw: cùng tuyến HN-MC 31/10, apigw trả 27 chuyến (3 trang x10, `meta.last_page`), proxy 21 -> proxy lọc bớt (không rõ luật: chuyến không bán web/đã đóng?). Kết quả của ta sẽ khác landing của họ; cần hỏi Hải Vân luật lọc trước khi hứa "giống".
2. SG-VT: apigw trả điểm đón Q1 là `Q1HCM`(220), proxy remap thành `34NTB`(222) và gắn `line`. Lọc theo điểm TSN/Q1/điểm VT cụ thể trên apigw chỉ làm được client-side theo `place_code`, chưa kiểm chứng đủ điểm. Toạ độ "Quận 1" của họ khác place #983 của ta -> chọn 1 bộ và test.
3. Các endpoint `trips, trip, trip-prices, web-combo, web-bookings, web-payments` nằm ở WP booking.haivan.com, KHÔNG có trong allowlist BFF (`gw-allowlist.ts`) và không phải apigw. Đừng gọi từ app (CORS, ToS, đơn tạo ở ERP họ).
4. `hvr_detail_token` HMAC + `trip_ref` ERP: không dùng được với apigw `trips/{id}`.
5. Handoff bằng bấm DOM iframe (RB:596, BH:224) phụ thuộc class antd của SPA -> không clone.
6. Trang ĐB khứ hồi min ngày về +1 (giường nằm qua đêm) vs SG-VT/Mộc Châu cùng ngày: giữ khi làm round-trip.
7. Đã GET (read-only): 3x web-combo rules, 6x proxy trips, 1x apigw places, 2x apigw el/trips. Không POST, không giữ ghế.

Unresolved questions
- Luật lọc của proxy (27 vs 21 chuyến)? Có cần giữ y hệt không?
- 20k khứ hồi/combo có định áp ở web mới (cần endpoint ERP/apigw) hay chỉ làm search UI?
- Điểm đón/trả trung gian (HN 35 Nguyễn Tuân, MC 8 điểm...) có đi vào `note` đơn hàng hay chỉ hiển thị?
- Trang ngược Sơn La và `mua-ve-xe-ha-noi-dien-bien` pair md-bp/md-mc chiều về chưa đo kỹ.
