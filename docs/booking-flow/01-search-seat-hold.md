# 01 — Tìm chuyến → sơ đồ ghế → đăng nhập → giữ chỗ (haivan.com hiện tại)

Đặc tả hành vi web gốc (Next.js pages router, build `LI8ATpi0xeUS476WVdvJn`), đọc tĩnh bundle, không gọi API. Phạm vi: dừng ở lúc `router.push("/xe-khach/xac-nhan")`.
Bổ sung/sửa cho `researcher-261028-integration-specifics.md` và `web-vs-app-flow-parity.md` (không lặp lại phần đã đúng).

Viết tắt chunk (thư mục `scratchpad/web/js/`), offset = vị trí ký tự xấp xỉ:

| Mã | File |
|---|---|
| TC | `chunks__pages__xe-khach__tim-chuyen-324bad72754617ef27bc.js` (trang `9Cys` @34605, thẻ chuyến + ghế `gERW` @73295) |
| C5 | `chunks__5f6f733a…081052aa3b922ef79fbb.js` (form tìm `KYIF` @106547, modal login `TOkq` @181373) |
| SVC | `chunks__78bc838e…047b40e14ff1ea163d13.js` (bảng service `JnuR` @4955, màu @15938) |
| RDX | `chunks__d7f9648a…5a63cc9dd6cc3546a379.js` (redux `BXF7` @17881) |
| APP / PB / IDX | `chunks__pages___app-b3012…`, `chunks__pages__partner__booking-4ae4…`, `chunks__pages__index-f69c…` |

## 0. Sửa lại các ghi chú trước (quan trọng)
| Ghi chú cũ | Thực tế trong bundle | Bằng chứng |
|---|---|---|
| Login xong `callbackLogin(true)` gọi lại `keepSeat` | Modal login **luôn** gọi `callback(false)` (cả khi đăng nhập/đăng ký thành công lẫn khi huỷ). `callbackLogin(false)` chỉ đóng modal → **không tự giữ chỗ lại**; người dùng phải bấm "Tiếp tục" lần nữa (ghế đã chọn vẫn giữ trong state) | C5 @190357, @191925, @192792 (0 lần `callback(!0)` trong `TOkq`); TC @78940 |
| Hold `tickets[]` merge thêm `code, price, discount, is_promotion…` | Response hold live chỉ có `tickets:[{id,code}]` → merge chỉ thêm `code` | fixture Android `hold.json`; TC @78212 |
| Text i18n không có | Đã có `locales/vi/common.json`; các key trích dưới đây kèm text vi | — |
| `aff` = `log_qr.aff` | Đúng, nhưng khi `log_qr` hết hạn/không có, `aff` = `""` hoặc `undefined` (bị bỏ khỏi JSON) | TC @77352 |

## 1. URL/query & form tìm kiếm

**URL kết quả** (form `searchTrip`, C5 @125644; ghép chuỗi KHÔNG encode, `router.push`):
`/xe-khach/tim-chuyen?from=<address>,<lat>,<lng>&to=<address>,<lat>,<lng>&date=DD-MM-YYYY&numberGuest=<n>&des_start=<desc>&des_end=<desc>&type=<1|2>`

| Param | Đọc ở trang (TC @35739, @36583) | Ghi chú |
|---|---|---|
| `from`,`to` | `split(",")`: phần tử `[0]` = địa chỉ, 2 phần tử cuối = lat, lng | Địa chỉ có dấu phẩy bị cắt tại dấu phẩy đầu (vd. "159 Điện Biên Phủ, Đa Kao…" → "159 Điện Biên Phủ"). Tiêu đề h1 = `list_trip.bus` ("Xe Khách") + `addr.split("(")[0]` hai đầu |
| `date` | `moment(date,"DD-MM-YYYY")` → gửi API `YYYY-MM-DD`; thiếu → hôm nay | Không validate ngày quá khứ trên URL |
| `numberGuest` | chuỗi, mặc định 1, chuyển thẳng cho API | |
| `type` | lần đầu: `query.type` (thiếu → không gửi); khi query đổi: thiếu → `0` | 2 = tab "Xe liên tỉnh", 1 = tab "Xe sân bay" (xem dưới) |
| `des_start`,`des_end` | chỉ form đọc lại; trang không dùng | Chọn từ danh sách `api/places` (không có `description`) → URL chứa chuỗi `undefined` |

- Trang đổi query (tìm lại tại chỗ) → reset `list_trips=[]`, gọi lại trang 1 (TC @36583).
- Thiếu `from`/`to` hợp lệ → không gọi API, spinner treo (TC @37721 điều kiện `(n||i)`).

**Form (`TabSearch` = `KYIF` default, C5 @167899; trang chủ nạp động `KYIF` không có query, IDX @6797):**
- Tab: 0 "Xe liên tỉnh" (`search.intercity_bus`), 1 "Xe sân bay" (`search.airport_transfers_bus`), 4 "Xe hợp đồng", 2 "Xe du lịch" (form khác, ngoài phạm vi). `query.type`: `"1"`→tab 1, `"2"`→tab 0, `"3"`→tab 4 (C5 @168144). Tab 0 → URL `type=2` + danh sách `places_intercity`; tab 1 → `type=1` + `places_airlink`.
- Mount: `Promise.all([GET api/places?type=0, GET api/places?type=1])` → nhận nguyên body làm mảng nhóm `[{id,name,places:[{id,name,slug,lat,lng,address,business}]}]` (C5 @167899; shape theo fixture `places.json`). Chỉ set khi cả hai 200; lỗi → im lặng, dropdown rỗng.
- Dropdown (antd AutoComplete): nhóm tỉnh thu/mở bằng click tiêu đề; "Điểm đến" dùng CÙNG danh sách (không lọc theo điểm đi; `getSuggestPlace` chỉ render lại).
- Gõ > 3 ký tự (debounce 500 ms) → `GET api/maps/places?input=<q>&channel=WEBHAIVAN` (C5 @124584), hiển thị `name` + `description`; ≤ 3 ký tự → trả về danh sách nhóm.
- Chọn: `point = {address: street||name, location: "lat,lng"}`, `des = description`. Nếu không có lat/lng (kết quả Google) → `GET api/maps/places/detail?place_id=<id>&channel=WEBHAIVAN` → `data.location.lat/lng` (C5 @130010). Luôn gọi thêm CMS `api/getCity/?point=lat,lng` → `slug` (lưu nhưng không dùng cho URL).
- Đổi chiều: icon `switch.svg` chỉ hiện khi cả 2 điểm đã chọn và không loading; hoán đổi point/value/des/slug (C5 @132285).
- Ngày: antd DatePicker `DD-MM-YYYY`, chặn `> now+4 tháng` hoặc `< now−1 ngày` (C5 @133617). Mặc định hôm nay.
- Số người: InputNumber `min:1`, KHÔNG có max (C5 @133877). Nhãn `search.number_of_people` "Số người".
- Validate khi bấm "Tìm vé" (`search.searching_tickets`): cả 2 điểm có `address` và `location` khác `"undefined,undefined"`; sai → im lặng, không toast.
- Mobile: khi URL đủ from/to hiện tóm tắt "Ngày đi **DD/MM/YYYY** cho N người / Điểm xuất phát / Điểm đến" + nút "Sửa" (`search.edit`).
- Lối vào khác cùng URL: `/partner/booking?ref&source&date(YYYY-MM-DD)&origin=addr,lat,lng&destination=…&passengers` → lưu `log_qr={url,aff:ref,source,created:now+10h "YYYY-MM-DD HH:mm"}` + `POST api/qrcode/agency-qr-code-scan-logs`, rồi push `tim-chuyen?…&numberGuest=passengers&type=2` (PB @4420).

**`/xe-khach/[start_id]/[end_id]`** (SSG, có trong `ssgManifest`): chunk `[start_id]/[end_id]-8601c806e68ec06348b9.js` CHƯA tải về → chưa đọc được. Dữ kiện gián tiếp: cùng bộ chunk phụ thuộc với tim-chuyen (leaflet, slick); link mẫu `/xe-khach/vung-tau/tan-son-nhat`, `/xe-khach/my-dinh/lao-cai`… (footer C5 @86964); `slug` của CMS `api/homewayroads` có dạng `"quan-1/vung-tau"` kèm `start_location`/`end_location` "lat,lng", `ta_search` "Quận 1/Vũng Tàu" (`index.html` `__NEXT_DATA__`). `getRouteDetail` (CMS `api/route-listing?route=`) không có caller nào trong các chunk đã tải → nhiều khả năng do trang slug dùng để lấy `detail_info` (ảnh, rating, services, statistic_wayroad, questions_wayroad) — các khối này có code trong TC nhưng ở tim-chuyen `detail_info` luôn `""` nên không bao giờ hiện.

## 2. Danh sách chuyến

- Request (SVC @6167, TC @37721): `GET api/el/trips?` + `qs.stringify({from_location:"lat,lng", to_location:"lat,lng", numberGuest, date:YYYY-MM-DD, sort_by:"time", sort_mode:"asc", type})`; trang 1 không gửi `page`.
- Phân trang: nút "Xem thêm" (chuỗi cứng, viền `#FFDD2B`) khi `meta.current_page < meta.last_page`, ẩn khi đang tải; bấm → `page=current_page+1`, `concat` (TC @38597, @46520). Cờ `this.loading` không bao giờ được bật (chỉ đặt false) → chống bấm đúp chỉ nhờ ẩn nút.
- **Không có** UI sắp xếp/lọc (giờ, giá, nhà xe): sort cứng `time asc`.
- Rỗng: `list_trips.length===0 && !process` → ảnh `/assets/images/notfound.png`, "RẤT TIẾC!" (`not_found.search.oops`), `not_found1/2` + link `tel:19006763` + `not_found3` (TC @41969). Lỗi mạng/HTTP cũng rơi vào trạng thái rỗng (catch chỉ tắt spinner, không toast).
- Thẻ chuyến (`G`, TC @98656–112500):

| Phần | Quy tắc |
|---|---|
| Tên tuyến | `route.name`; `direction==="B"` → đảo `split("-")` rồi `join(" - ")` (TC @103221); `route.is_new===1` → icon `new_router.svg` |
| Sản phẩm • chỗ | `product.name` • `available_seats`: >3 thường; 1–3 màu `#FFC20E`; 0 → "Hết chỗ" (`booking_infor.sold_out`) đỏ `#BB0000`; nhãn "Chỗ trống" (`list_trip.available_seats`) |
| Giờ | `from.reached_at`/`to.reached_at` ("YYYY-MM-DD HH:mm") → `HH:mm`, giữa là `duration`; điểm `from.place_name` / "Xe liên tỉnh" / `to.place_name` |
| Trung chuyển | Dòng phụ trên/dưới hiện trừ khi (`start && !is_check_transit_start`) hoặc (`!start && !is_check_transit_start`), tức chỉ khi `is_check_transit_start` true: "<địa chỉ tìm> (Xe trung chuyển \| Tự di chuyển)" (`booking_infor.transit_vehicle` khi `start&&is_check`, ngược lại `self_service`); tương tự `end` |
| Huy hiệu | `transit.arr_tcd.text1/text2`, `arr_tct.text1/text2` (đỏ `rgba(241,65,90,.95)`, icon `seat1.png`) (TC @109981) |
| Giá (`renderTextPrice`, TC @100518) | chỉ khi `route.show_price !== 0`. `price.percent>0` → hộp "-{percent}% Hôm nay", gạch `price_temp`, to `price_discount`₫, "đã gồm thuế VAT"; else `min===max` → `max`₫; else "Từ {min}" (`booking_infor.from`) |
| Cảnh báo ngày | `moment(from.reached_at).format("HH:mm") !== time` → "*Khởi hành: {time} Ngày {DD/MM/YYYY của date}" đỏ (TC @111596) |
| Khác | `has_discount` → `sale.png` góc phải; ảnh `car_imgs` (≤4 ô, ô 4 phủ "+N ảnh khác"), `amenities[{ame_link,ame_name}]` trong phần mở rộng (component `q`) |

- Bấm thẻ: toggle mở/đóng; lần đầu gọi song song `GET api/trips/{id}?departure_id=from.place_id&destination_id=to.place_id&merchant_code&numberGuest` và `GET api/el/trip_detail?trip_id&merchant_code` (TC @98656). Cả hai 200 → `journey[]` cắt từ `from.place_id` đến `to.place_id` → polyline bản đồ. Lỗi → tắt loading, không toast.
- Bản đồ (desktop `lg:8`, ẩn mobile): react-leaflet, tile OSM, 2 CircleMarker (điểm đi `#FFC20E`, điểm đến `#58595B`, tooltip địa chỉ), polyline `#58595B` weight 2 + `fitBounds` padding 30 (TC @114525, @118728).

## 3. Sơ đồ ghế (component `I`, TC @75162–94456)

- Dữ liệu: `detail_trip` = nguyên body `api/trips/{id}`; lưới = `body.data` (deep copy). Gộp tầng phụ (TC @82013): có `data[2]` → nối các hàng vào `data[0]`, không thì nếu có `data[3]` → nối hàng `null` cùng độ dài vào `data[0]`; có `data[3]` → nối vào `data[1]`, không thì nếu có `data[2]` → nối hàng `null` vào `data[1]`. Chỉ render tầng 0,1 (bỏ `data[4]`); ô `null` = ô trống trong suốt.
- Desktop: hai tầng cạnh nhau, khung bo 32, icon vô lăng, nhãn "Tầng 2" cho tầng 2; ghế 51×75. Mobile: tab "Tầng 1 / Tầng 2" chỉ khi `data[1]` không rỗng; ghế 34×50 (TC @89443).
- Trạng thái ghế: `is_empty` false → `seat_disabled.svg`, không click; trống → `seat_default.svg`; đang chọn → `seat_active.svg`. Legend: "Chỗ trống" (viền `#CACBD0`), "Đang đặt" (`list_trip.progress`, `#FFC20E`), "Đã đặt" (`list_trip.booked`, `rgba(202,203,208,.5)`) (TC @84574). `seat_group`, `arrCabin`, `color`, `seat_rank` KHÔNG dùng.
- Giá trên ghế: `price.toLocaleString("vi-VN")` + "VNĐ", chữ đen nếu trống, `#9E9E9E` nếu đã đặt; ẩn khi `show_price` (state = `route.show_price || 0`) bằng 0. Lưu ý thẻ chuyến hiện giá khi `show_price` undefined nhưng ghế thì ẩn.
- Chọn ghế (TC @87801 desktop, @91059 mobile):
  - Thường (`is_combo` = 0): toggle cờ `seat.is_select` (ghi thẳng vào object ghế); thêm khi `count ≤ 8`, nếu đã 9 → toast "Chỉ được đặt tối đa 9 ghế với từng booking!" (`list_trip.msg.msg_booking_select_seat`). **Không kiểm tra numberGuest** ở chế độ thường. Quirk: sau toast `is_select` vẫn true → lần bấm sau là "bỏ chọn" rỗng.
  - Combo (`body.is_combo` truthy): mỗi lần bấm, gán `price` của mọi ghế đã chọn = giá ghế vừa bấm (mutate). Thêm khi `count+1 ≤ numberGuest`; vượt → mở modal đổi số khách (kèm toast tối đa 9 nếu đã > 8). Bấm ghế đang chọn → bỏ.
- Modal đổi số khách (TC @93567): "Thông báo" / "Bạn chưa chọn đủ số lượng vé!" / "Bạn có muốn thay đổi số lượng vé không?"; stepper min 1, max `trip.available_seats`. "Cập nhật" (`handleOk`): nếu số mới < số ghế đã chọn thì xoá lựa chọn trong state, rồi gọi lại `api/trips/{id}` với `numberGuest` mới — nhưng truyền lựa chọn CŨ vào nên sau khi tải lại lựa chọn cũ quay lại (quirk). "Đóng" chỉ đổi số trong state, không tải lại.
- Overlay (`renderBlockSeat`, TC @79048) phủ vùng sơ đồ, nền `#000000A0`:
  - `body.is_locked === true`: tiêu đề "Thông báo" (`list_trip.noti`), `body.message`, nếu có `body.link` nút "Xem chi tiết" (`list_trip.view_details`) mở tab mới. Không tắt được.
  - Ngược lại nếu `body.note` và chưa tắt: hiện `note` + nút "Tiếp tục" để tắt; mở lại thẻ → hiện lại. Nút giữ chỗ nằm ngoài overlay nên vẫn bấm được khi đang hiện note.
- Nút "Tiếp tục" (`list_trip.continue`): nền `#FFC20E` chữ `#58595B` khi có ghế; nền `#58595B` chữ trắng khi chưa; bấm khi 0 ghế → không làm gì.
- Object ghế gửi đi = **nguyên object từ `api/trips`** (theo fixture: `id,ticket_code,name,price,priceNy,is_empty,color,seat_rank,seat_type,customer,order,ticket_status,is_edit,is_payment,expire_time`) + `is_select:true` (chế độ thường) + `price` có thể bị ghi đè (combo). Thứ tự = thứ tự `Object.values(list_choose)` (key = seat id).

## 4. Giữ chỗ (`keepSeat`, TC @77186)

Thứ tự kiểm tra:
1. 0 ghế → thoát im lặng.
2. Combo và `số ghế !== numberGuest` → mở modal đổi số khách.
3. `body.is_locked === true` → toast cảnh báo "Chuyến đi đã bị chặn đặt vé. Vui lòng không thao tác!" (`list_trip.msg.msg_block_booking`).
4. Chưa có `user_login` (redux) → mở modal login; xong/huỷ đều chỉ đóng modal (mục 0). Modal: reCAPTCHA v2 sitekey cứng (C5 @195505), `api/get-otp` → `api/verify-otp` / `api/register`; thành công set `axios.defaults.headers={Accept,Content-Type,Authorization}` (**mất header `Domain`** tới khi tải lại trang, so với APP @8894) + `setUserLogin`.
5. Đã login → toast loading "Đang xử lý ..." (`list_trip.msg.in_progress`) → `POST api/hold-booking`.

- Nguồn affiliate: `aff = log_qr.aff`; nếu `moment(log_qr.created).isBefore(now)` → `setLogQr(null)`, `aff=""` (TC @77352). `utm_source`, `aff_sid` đọc cookie (js-cookie, TC @77844); cookie do `_app` ghi từ query URL, hạn 30 ngày, `path=/; SameSite=Lax`; nếu URL chỉ có một trong hai thì cookie kia thành chuỗi `"null"` → web gửi `utm_source:"null"` (APP @9670).
- Body (SVC @7802): `{trip_id: trip.id, seats:[…mục 3], merchant_code: trip.merchant.code, channel:1, aff}` + `utm_source` / `aff_sid` nếu truthy. Token qua header `Authorization` mặc định của axios.
- Thành công (chỉ khi `status===200`): `data_save.expire_time = data.expire_time` ("DD-MM-YYYY HH:mm:ss"), `order_code`, `is_combo` (state), `show_price` (state), `seats = seats.map(s => ({...s, ...tickets.find(t=>t.id===s.id)}))` → `setBooking({...data_save})`; `setServiceTc([])`, `setStatusRoom(false)`; đóng toast.
  - `trip_info.transit.start` truthy → nhánh trung chuyển `getPriceTransit(data)` (TC @75702): KHÔNG gọi API; với mỗi `ticket` thêm `ticket_code=code, phone/name` (từ `user_info`), `pick_up/pick_up_lat/pick_up_lng` (địa chỉ + toạ độ tìm kiếm điểm đi), `drop_off*`, `number` = tên ghế, `quantity:1`, `date` = ngày tìm (YYYY-MM-DD) → `setBooking({...booking, order_code, newParams:{order_code, merchant_code, seats}})`.
  - Sau 50 ms `router.push("/xe-khach/xac-nhan")` rồi `scrollTo(0,0)`.
- Lỗi: đóng loading; nếu có `response.data.message` → toast error; không tải lại sơ đồ, không xoá lựa chọn. Mỗi lần bấm là một hold mới (không tái dùng order cũ).

Redux `booking` (persist `localStorage` key `persist:primary`, RDX @19552/@22288) trước khi sang xác nhận:
```
{ pick_up:{address:<from addr từ URL>, coordinates:{lat,lng}}, drop_off:{address, coordinates:{lat,lng}},
  trip:{trip_id, departure_id: trip.from.place_id, destination_id: trip.to.place_id},
  transit:{departure: !!trip.transit.start, destination: !!trip.transit.end},
  trip_info: <nguyên object chuyến từ api/el/trips>,
  seats:[<object ghế mục 3> + code], expire_time, order_code, is_combo:0|1, show_price,
  newParams?:{order_code, merchant_code, seats:[…]} /* chỉ nhánh transit.start */ }
```
(TC @82723 khởi tạo `data_save`; toạ độ = điểm người dùng tìm, không phải `trip.from.location`.)

## 5. Khác biệt so với app Android (REA Android, chỉ đọc)
| Bước | Web gốc | App Android | Nguồn app |
|---|---|---|---|
| Tìm chuyến | `type`, sort cứng `time asc`, không lọc | `language`, `pickup_time_range` (4 khung giờ), 4 kiểu sort, không `type` | `BusBookingRepository.kt` L14-27, `BookingFlowStore.kt` L14-29 |
| Ngày | DatePicker hôm nay → +4 tháng | dải 14 ngày | `TripListScreen.kt` L37 |
| Số khách | min 1, không max | 1–9 | `TripSearchViewModel.kt` L79 |
| Điểm chọn | places + Google search + getCity CMS | places / tìm vị trí riêng | `SearchLocationScreen.kt` |
| Sơ đồ | gộp `data[2]/[3]` vào tầng 1/2, bỏ `data[4]` | mỗi index = 1 tầng riêng, có màu `color`/hạng; query thêm `trip_id,phone,language` | `LiveTripSeatModels.kt` L66-95, repo L29-38 |
| Quy tắc khách | thường: không ràng buộc; combo: đúng bằng numberGuest | phải chọn ≥ numberGuest; combo chưa làm (luôn 0) | `SeatMapViewModel.kt` L64-75, plan "Open gaps" |
| `is_locked` / `note` | overlay; locked chặn bằng toast; note tắt được | nút disabled khi locked; note là thẻ văn bản | `SeatMapScreen.kt` L60-103 |
| Login chặn | modal OTP, không tự hold lại | hộp thoại → màn login | `SeatMapScreen.kt` L35-59, `BookingGraph.kt` L85 |
| Hold body | `channel:1`, ghế nguyên bản (+`is_select`), `aff/utm_source/aff_sid`, token ở header | `?language=`, `token, phone, channel:2`; ghế thêm `ticketPrice, checkPromotion, is_reward, priceDiscount` | repo L40-72 |
| Sau hold | luôn hold mới; lỗi chỉ toast | tái dùng hold nếu cùng ghế; lỗi → toast + tải lại sơ đồ | `SeatMapViewModel.kt` L76-96 |
| Trung chuyển | lưu `newParams` cho xác nhận nếu `transit.start` | không có nhánh này ở bước hold | — |

## Chưa rõ
1. Trang `/xe-khach/[start_id]/[end_id]`: chunk chưa tải → chưa biết slug → lat/lng/địa chỉ được giải ở `getStaticProps` (có thể từ CMS `homewayroads.start_location/end_location/ta_search` hoặc `route-listing`), có `fallback` không, giá trị `type` truyền vào. Cần tải tĩnh file `[start_id]/[end_id]-8601c806e68ec06348b9.js` (GET asset, không phải API) để xác nhận.
2. Ý nghĩa backend của `type` (1/2/0/thiếu) trong `api/el/trips`; khác biệt kết quả chưa đối chiếu live.
3. `body.is_combo` của `api/trips/{id}`: fixture không có → chưa thấy giá trị thật cho tuyến combo.
4. Backend có chấp nhận/bỏ qua `is_select` và `price` bị ghi đè trong `seats` khi hold combo không (giá có được tính lại phía server?).
5. Mã/response lỗi thực tế của `api/hold-booking` (ghế vừa bị người khác giữ, token hết hạn 401) – web chỉ hiện `message`.
6. Phạm vi ngày thực tế phía backend (web cho chọn tới +4 tháng).
7. `api/places` có trả `street`/`description` cho mục nào không (nếu không, `des_start=undefined` luôn xuất hiện trên URL).
