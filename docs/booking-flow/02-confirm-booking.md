# 02 — Trang xác nhận `/xe-khach/xac-nhan` → `POST api/bookings`

Nguồn: đọc tĩnh bundle haivan.com (build `LI8ATpi0xeUS476WVdvJn`), không gọi API nào. Viết tắt file:
- **X** = `chunks__pages__xe-khach__xac-nhan-baa4c324e139db9a4186.js` (page module `EKY8` @88482–131300; component khuyến mãi `gERW.a` @204184–220125; modal dịch vụ `gGPm` @220125)
- **M** = `…xac-nhan__modal-47fb90c5….js` (cùng module `gGPm`), **U** = `…cap-nhat-dich-vu-4f710e21….js`, **S** = service `JnuR` trong `chunks__78bc838e….js`
- **T** = `…tim-chuyen-324bad72….js` (nơi tạo draft). Query string dùng `qs.stringify` mặc định (mảng/obj kiểu `a[0][b]=`, có encode) — module `Qyje`.
Nhãn: [B] bundle, [A] app Android/test, [L] live-verified (plan Android 2026-10-27).

## 0. Draft `booking` trong redux (đầu vào của trang) [B T, X@160631–166323]
Tạo ở component chọn ghế (`keepSeat`, X@160784) sau `POST api/hold-booking` 200:
```
{ pick_up:{address: address_start, coordinates:{lat,lng}},   // address_start = query.from.split(",")[0]; lat/lng = 2 số cuối của query.from (T@35900, T@45600)
  drop_off:{address: address_end, coordinates:{lat,lng}},
  trip:{trip_id, departure_id: trip.from.place_id, destination_id: trip.to.place_id},
  transit:{departure: !!trip.transit.start, destination: !!trip.transit.end},
  trip_info: <object chuyến từ api/el/trips>, seats:[ghế sơ đồ ⊕ hold.tickets[] merge theo id → thêm `code` (mã vé V…)],
  expire_time:"DD-MM-YYYY HH:mm:ss", order_code, is_combo (từ api/trips/{id}.is_combo), show_price (route.show_price),
  newParams? }   // newParams CHỈ khi trip_info.transit.start truthy (X@159300): {order_code, merchant_code, seats:[ticket + ticket_code=code, phone,name (user_info), pick_up/_lat/_lng, drop_off/_lat/_lng (địa chỉ tìm kiếm), number=tên ghế, quantity:1, date=start_date]}
```
Hold fixture [A]: `{message, expire_time, order_code, tickets:[{id,code}]}` → `price` của ghế lấy từ sơ đồ ghế, không từ hold. `setServiceTc([])`, `setStatusRoom(false)` rồi `router.push("/xe-khach/xac-nhan")` sau 50 ms.

## 1. Guard vào trang & đồng hồ
- Redux connect: `user_info, booking, data_transit, type_booking` (X@131060). State `booking` = deep clone props.
- **Không có booking**: render `<Spin/>` vô hạn (X@130600 nhánh `ve ? … : Spin`); KHÔNG redirect. moment(undefined, fmt) invalid → diff NaN → không bật modal. componentDidMount vẫn bắn `get-promotions` (chỉ còn `channel=1&direction=2&channel_code=WEBHAIVAN`) và `customer/customers`. Bản mới nên redirect về `/` (cải tiến, ghi rõ).
- **Hết giờ giữ chỗ**: kiểm tra ở constructor (X@95960) và mỗi lần `booking`/`user_info` props đổi (UNSAFE_componentWillReceiveProps X@96146): `moment(expire_time,"DD-MM-YYYY HH:mm:ss").diff(now,"seconds") <= 0` → `showModalTimeout(router)` (X@92897):
  1. `setTimeOut(null)`, `setBooking(null)`, `setTypeBooking(null)` (xoá trước khi hiện modal);
  2. `Modal.warning({title: t("booking_infor.msg.notifications")="Thông báo", content: t("booking_infor.msg.noti_sold_out")="Đã hết thời gian đặt vé, mời bạn chọn lại chỗ"})`;
  3. OK: nếu query `partner==1` (đọc từ `router.asPath`) → `Router.push("/")`, ngược lại `router.back()`.
- **Đồng hồ** (react-countdown `6Moy`): `date = moment(expire_time,…).unix()*1000`, renderer `mm:ss` (pad 2 số, không hiện giờ). Desktop: cột phải, tiêu đề `booking_infor.count_time`="Thời gian còn lại để xác nhận", 2 ô 56×56 (X@121537) có `onComplete → showModalTimeout`. Mobile: thanh sticky dưới (`xEQ+` mode bottom) "…: mm:ss" + nút Tiếp tục (X@120100), không có onComplete (nhưng bản desktop vẫn mount vì chỉ ẩn bằng CSS `d-none` → vẫn kích hoạt).
- `postBooking` KHÔNG kiểm tra lại expire_time; không yêu cầu đăng nhập lại (giữ chỗ đã cần login).

## 2. Thông tin khách (`if_customer`) & hoá đơn
Form (X@109417–116500), tiêu đề `booking_infor.your_infor`="Thông tin của bạn":
| Trường | Nhãn vi | Mặc định | Ghi chú |
|---|---|---|---|
| name | `full_name` "Họ và tên" | `user_info.name` | Input controlled |
| phone | `mobile_phone` "Số điện thoại" | `user_info.phone` | không kiểm định dạng |
| email | `email` "Thư điện tử" | `user_info.email` | không bắt buộc, không regex |
| note | `notes` "Ghi chú", placeholder `msg.pls_insert_note` "Nhập ghi chú ..." | `""` | uncontrolled |
- Web cũ: state `if_customer = user_info ? {email,phone,name} : {}`; reset mỗi khi props user_info/booking đổi (mất chỉnh sửa tay!). Validate khi bấm Tiếp tục (X@105224): `C = keys(if_customer).length===0 ? null : if_customer`; nếu `C && (!C.name || !C.phone)` → `message.warn(t("booking_infor.msg.noti_info")="Bạn cần nhập đủ thông tin người đi", 3)`. `C===null` (khách chưa có user_info và không gõ gì) → body bỏ `if_customer`.
- **Quy tắc hiện tại (bản Next, `apps/booking`)**: giữ chỗ cần token nên người đặt luôn đã đăng nhập, form luôn khởi tạo từ hồ sơ (`customer/customers`) và `if_customer` **luôn được gửi**. **Họ tên và SĐT luôn bắt buộc**: thiếu một trong hai thì chặn "Tiếp tục", hiện lỗi ngay dưới ô (`ux.need_name`, `ux.need_phone`) kèm câu `booking_infor.msg.noti_info` và focus ô sai đầu tiên. Email vẫn không bắt buộc (ô `type="email"`, gửi `null` nếu trống). Nhánh `C===null` (bỏ `if_customer`) của web cũ không còn tồn tại. Nguồn: `validateCustomer`/`buildBookingBody` trong `apps/booking/src/lib/booking-body.ts`, `fieldErrors` trong `components/confirm/customer-forms.tsx`.
- **Hoá đơn** (`invoicing_details`="Thông tin xuất hóa đơn"): checkbox `billing_select` (`get_invoices`="Tôi muốn xuất hóa đơn", mặc định false). Bật → radio `valueCheckbox`: **1 = `individual` "Khách hàng cá nhân"** (mặc định), **2 = `coporate` "Khách hàng doanh nghiệp"**. Trường: email (`e_invoice` "Email nhận hóa đơn điện tử"*), name (`customer_invoice` "Tên nhận hóa đơn"*), code (`tax_ID` "Mã số thuế", * chỉ khi ≠1), address (`invoicing_address` "Địa chỉ nhận hóa đơn"*), ghi chú đỏ `note_invoices` ("Lưu ý: … gửi vào email … trong vòng 24h … tổng đài 19006763 …").
- Mặc định invoice từ `user_info.invoice_info`: `{name: company_name, address: company_address, code: tax_code, email}`; không có → `{}`.
- Validate: `k = billing_select===false ? null : invoice`. Loại 2 cần `name&&code&&address&&email`; loại 1 cần `name&&address&&email` → sai: warn `msg.noti_info_invoice`="Bạn cần nhập đủ thông tin xuất hoá đơn". **valueCheckbox KHÔNG gửi lên**; `code` gõ ở loại 1 vẫn được gửi.

## 3. Điểm đón / trả
- Điểm đón/trả = địa chỉ người dùng gõ ở trang tìm chuyến (`pick_up`/`drop_off` trong draft); bến = `trip_info.from/to.place_name`. Journey (`api/el/trip_detail…journey[]`, X@183052) chỉ để hiển thị điểm dừng ở bước chọn ghế, không chọn được.
- **Build hiện tại KHÔNG có ô đổi điểm đón/trả trên trang xác nhận**: `onSearchStart/onSearchEnd` (maps/places, >3 ký tự, debounce 500 ms) và `getDetailPlaceGoogle` (X@91730, 102238) được định nghĩa nhưng không được render/gọi (dead code). Hành vi dead code, nếu muốn khôi phục: `GET api/maps/places/detail?place_id&channel=WEBHAIVAN` → `GET api/el/is_transit?trip_id&location="<lat>, <lng>"&place_id=<trip.departure_id|destination_id>&merchant_code` (lưu ý dấu cách sau dấu phẩy) → nhận nếu `status 200 && data.is_check_transit && data.is_transit`, else warn `msg.msg_point_transit`="Điểm bạn chọn chưa hỗ trợ trung chuyển".
- `value_start = pick_up.address` nếu (`pick_up.address` && `trip_info.transit.is_check_transit_start` && `trip_info.transit.start`) else `""`; `value_end` tương tự với `_end`.
- Body `transit = {departure: pick_up.address === value_start, destination: drop_off.address === value_end}` → true = khách dùng xe trung chuyển (đón/trả tận nơi trong vùng hỗ trợ), false = tự đến bến. Bẫy: `address===""` và `value===""` cho ra `true`.
- Khối "Kiểm tra thông tin đặt vé" (`check_ticket`): ngày `from.reached_at` ("YYYY-MM-DD HH:mm") format `dddd, DD MMMM`, giờ `from.reached_at – to.reached_at`, `product.name`; dòng địa chỉ đón chỉ hiện khi `pick_up.address !== from.place_name`, icon `car_transit` + `transit_vehicle`="Xe trung chuyển" nếu `booking.transit.departure && pick_up.address===value_start`, ngược lại `walk` + "Tự di chuyển" (literal); chặng chính icon `bus_circle` + `intercity`="Xe tuyến"; điểm trả tương tự (`self_service`="Tự di chuyển").
- Thẻ đăng ký loyalty (`lD+s`, size large) hiện khi `user_info.subscribe_loyalty===0` (`register_loyalty`, `msg_ticket_free`); tự mở modal nếu `user_info.data_source===1` — ngoài luồng đặt vé.

## 4. Khuyến mãi, điểm thưởng, combo, tổng tiền
**Tải lúc mount (+300 ms, X@101278)**:
- `GET api/promotion/get-promotions?` qs `{merchant_code, route, product, channel:1, direction: A→1 else 2, departure_id: from.place_id, destination_id: to.place_id, departure_time: trip_info.node_time, price: trip_info.price.min, channel_code:"WEBHAIVAN"}` (debounce 1 s, X@89900). 200 → `list_promotion = data.data[]` (dùng `code,name,date_end,available_quantity`; `discount_route` chỉ cho autocomplete không render).
- `GET api/customer/customers` → `total_point = data.data.account.balance || 0`.
**Component `gERW.a` (X@204184)**, props `{booking, list_promotion, total_point, onCallBack}`; state cục bộ `O`=bản sao seats, `D`=đang combo (`booking.is_combo===1`), `z`=số ghế đã áp mã.
- Bấm thẻ "Khuyến mãi và đổi điểm" (`promotions`/`use_points`): nếu `D && booking.is_combo===1` → modal xác nhận `noti` + `ask_use_promotions` ("Giá vé niêm yết sẽ được áp dụng khi sử dụng chung với mã khuyến mại.Bạn có muốn tiếp tục?") → OK: `changeCombo(is_combo:0)` → cập nhật giá cục bộ, `D=false`, mở modal; ngược lại mở modal `HV_promotion`="Hải Vân khuyến mãi".
- `changeCombo` = `GET api/price-ticket?` qs `{order_code, merchant_code, seats:[{id}], is_combo: D?0:1, trip:{trip_id: trip_info.id, departure_id, destination_id}}` → `data.data[{ticketCode,ticketPrice}]` → `seat.price=parseInt(ticketPrice)` khi `seat.code===ticketCode`; lỗi 400 → `data.message`, khác → `msg.msg_error_occurred`="Có lỗi xảy ra!"; lỗi thì giữ `D`.
- Tab "Mã khuyến mãi" (`promo_code`) / "Đổi điểm" (`redeem_points`); đổi tab hoặc bấm "Sử dụng" một mã → `H()` xoá `promotion/discount/is_promotion` mọi ghế (không xoá `is_reward`).
- **Mã ẩn**: ô `msg.pls_insert_promo` onChange debounce 500 ms → `GET api/admin/search-code-hide?code=<raw, không encode>&channel_code=WEBHAIVAN&channel=1` → `data.data` khác rỗng thay danh sách; rỗng/lỗi → warn `msg.no_found_code`="Không tìm thấy mã phù hợp". Danh sách hiển thị = kết quả tìm (nếu có) else `list_promotion`; bỏ item `available_quantity===0`; hiển thị `name`, "HSD: Đến DD/MM/YYYY" (`date_end`), badge `x{available_quantity}`.
- Chọn ghế áp mã (`select_seat_use_code`): toggle `is_promotion` (ghế `is_reward` bị khoá). **Áp dụng**:
  - 0 ghế chọn: nếu `booking.is_combo===1` và không ghế reward → `changeCombo` (đảo về combo), xoá mã, `onCallBack`; else xoá mã, `onCallBack`.
  - ≥1 ghế: gán `seat.promotion=code`; `POST api/promotion/check-promotions?` qs `{merchant_code, route, product, channel:1, direction, departure_id, destination_id, departure_time: node_time, bookingCode: order_code, tripCode: trip_info.id, adm_id:0, codes:[{promotion, ticketCode: seat.code, ticketPrice: seat.price}], channel_code:"WEBHAIVAN"}` **không body**. 200 → `data.codes[]` (TOP-level `data.codes`, không phải `data.data`) → `seat.discount=parseInt(priceDiscount)` khi `seat.code===ticketCode`; `onCallBack(seats)`, toast `msg.applied_code_success`, `z=count`. Không 200 → `msg.invalid_promo_code`; 400 → `data.message`.
- **Đổi điểm** (1 điểm = 1 đ, hiển thị `seat.price` + "điểm"): toggle `is_reward` từng ghế; ghế có `promotion` bị khoá; ghế chưa chọn bị khoá nếu `total_point − Σprice(ghế reward) − seat.price < 0`. Áp dụng: nếu `booking.is_combo>0` và KHÔNG ghế reward → `changeCombo` + `onCallBack`; else đóng + `onCallBack(O)`.
- **Đóng modal (×)** khi `z===undefined` và không ghế reward → `changeCombo(is_combo: D?0:1)` cho MỌI chuyến (kể cả không combo), chỉ cập nhật state cục bộ + đảo `D`, không gọi onCallBack.
- Parent `onCallBack(seats)` → `booking.seats = clone` (X@93300). Discount lưu ở `seat.discount` (số), mã ở `seat.promotion`, điểm ở `seat.is_reward`.
**Tổng tiền** (chỉ hiện khi `show_price !== 0`, X@116700):
- `getTotalMoney = Σ_{seat !is_reward} (price − (discount||0))` (không chặn âm). Mỗi ghế: `seats` "Ghế {name}" + giá, `surcharge`="Phụ thu" = Σprice dataTicket cùng `id`, dòng `exchange_points` "-price" nếu reward, else `promotion` "-min(discount,price)".
- `total` "Tổng giá tiền" = `getTotalMoney + Σ dataTicket.price` (phụ thu trung chuyển). Quyết định redirect chỉ dùng `getTotalMoney` (không tính phụ thu).

## 5. Dịch vụ trung chuyển tận nhà (merchant `02`,`16`,`17`)
- **apiPrice** (X@98295): gọi ở didMount VÀ mỗi lần props đổi, khi merchant ∈ {02,16,17} và `dataBonus` rỗng (rủi ro gọi lặp nếu API trả rỗng).
  1. `GET api/v4/get-bonus-service?merchant_code` → mảng ở `response.data` (top-level). Mỗi service gắn `check:false, seat=seatCheck=#seats, address:[{number:#seats, address: TCDON? pick_up.address : drop_off.address}], title: TCDON? pick_up_transit "Đón tận nhà" : drop_off_transit "Trả tận nhà", transit_location/lat/lng = from (TCDON) hoặc to (location[1]=lat,[0]=lng)`.
  2. `POST api/v4/get-price-transit` body `{...booking.newParams, services:<mảng trên>, trip_id: trip_info.id, merchant_code}` → `response.data[]` service có `dvbs_code, dvbs_tickets[], dvbs_text_discount, dvbs_id…`; reset `check=false`, `address=[]`, `addressOld`, ticket `check=false` → `dataBonus`; lỗi → toast `data.message`.
- Khối "Thông tin dịch vụ bổ sung" (`add_service`) chỉ render khi merchant ∈ {02,16,17} VÀ (`booking.transit.departure || booking.transit.destination`). Mỗi service: checkbox, "{title} - {seatCheck}/{seat} khách", danh sách "n khách : địa chỉ", nút `update`="Cập nhật", badge `dvbs_text_discount`.
- **onCheckGroup** (X@107328): tick khi `address.length<=1` → `GET api/v4/check-transit?{pick_up,pick_up_lat,pick_up_lng,drop_off,drop_off_lat,drop_off_lng,code}` (của `dvbs_tickets[0]`) `+merchant_code,type_transit: TCDON?1:2` → 200: `check=true, dvbs_is_group=0`, address = groupBy(pick_up|drop_off) → `{number,address}`, mọi ticket `check=true`; 400 → warn message. Bỏ tick: không gọi API, `address=[]`, `seatCheck=0`. `dataTicket` = mọi ticket check.
- **Modal Cập nhật** (`gGPm`, M@1500–15000): form mỗi vé (`booking_infor.seats` {number} – {price}đ). Switch `pick_up_multiple_points`="Đón nhiều điểm" (chỉ khi >1 vé). Nhiều điểm: `name_i` (required "Vui lòng nhập họ và tên"), `phone_i`, `address_i`; một điểm: `name, phone, address` áp cho mọi vé. Ô địa chỉ: AutoComplete `api/maps/places?input=<raw>&channel=WEBHAIVAN` (debounce 500 ms, >3 ký tự) → chọn → `api/maps/places/detail` → `GET api/v4/get-price-ticket?` `{pick_up,pick_up_lat,pick_up_lng, drop_off,…}` (TCDON: drop_off = bến đi `from`; trả: pick_up = bến đến `to`) `+date: trip_info.date, quantity:1, code: mã vé, merchant_code, type_transit}` → `data.price` gán vào vé (1 vé nếu nhiều điểm, mọi vé nếu một điểm). Checkbox từng vé: tick → `check-transit` như trên. Submit (`list_trip.update`) → `onSetDataBonus(tickets, values, dvbs_code, multi)`: `check = có vé tick`, address = multi ? vé tick (number=1) : `[{number: seatCheck, address: values.address}]`, `dvbs_is_group = check?0:1` (áp cho mọi service), `dataTicket` = vé tick.
- **updateBooking** (nút Tiếp tục, X@103319) luôn chạy cho mọi merchant: `o = {order_code, merchant_code, pick_up: pick_up.address, pick_up_lat, pick_up_lng, drop_off, drop_off_lat, drop_off_lng, services: dataBonus.filter(check) với dvbs_tickets.filter(check)}` → `postBooking(o)`; sau `api/bookings` 200 → `holdTransit(o)` = `POST api/v4/hold-transit` body `o` fire-and-forget (không await, điều hướng ngay; 400 → warn message). Merchant khác: vẫn gửi với `services: []`.
- `/xe-khach/xac-nhan/modal` và `/xe-khach/cap-nhat-dich-vu/modal` là component nằm nhầm trong `pages/` (Next tự tạo route), không phải bước luồng → bản mới KHÔNG tạo route. `/xe-khach/cap-nhat-dich-vu?code&merchant_code` (U) là trang SAU đặt vé (từ "Chuyến đi của tôi"): `GET api/v4/detail-transit/{code}?merchant_code` → nếu service chưa có vé `GET api/v4/get-info-ticket?{order_id: dvbs_order_id, service_code: dvbs_code, merchant_code}` → `POST api/v4/update-transit {order_code, merchant_code, seats:[vé check + is_group, dvbs_id]}` → toast "Cập nhật thông tin thành công" → `/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh`. Thuộc spec "vé của tôi".

## 6. `POST api/bookings` (postBooking, X@104246–106800)
Thứ tự: (1) mutate `booking.trip.departure_id = trip_info.from.place_id`, `destination_id = trip_info.to.place_id`; (2) validate khách; (3) validate hoá đơn; (4) build seats; (5) guard đúp; (6) gửi.
```
{ pick_up: booking.pick_up,            // {address, coordinates:{lat,lng}} nguyên trạng
  drop_off: booking.drop_off,
  trip: {trip_id, departure_id, destination_id},
  transit: {departure: bool, destination: bool},     // §3
  seats: sortBy([{id, code: seat.promotion, is_reward: !!seat.is_reward}], "id"),  // code = MÃ KM (không phải mã vé); undefined bị JSON bỏ, "" nếu đã xoá
  order_code, merchant_code: trip_info.merchant.code,
  note, is_combo: R,
  if_customer?: {email, phone, name},   // chỉ khi object không rỗng
  invoice?: {name, address, code, email} }  // chỉ khi billing_select
```
- **is_combo R**: `P` = `true` nếu có ghế reward; `N` = `E.find(e => e.code!==undefined || e.code!=="")?.code` — điều kiện luôn đúng (bug) nên `N` = code của **ghế id nhỏ nhất**. `R = booking.is_combo===1 ? ((N!==undefined&&N!=="") || (P!==undefined&&P!=="") ? 0 : 1) : booking.is_combo`. `booking.is_combo` không bị đổi bởi changeCombo.
- **Chống bấm đúp**: thuộc tính instance `this.process_booking` (không phải state) set true trước request, false ở then/catch; kèm `message.loading(t("list_trip.msg.in_progress")="Đang xử lý ...", 0)` đóng ở cả hai nhánh. Validate chạy trước guard.
- **Thành công**: chỉ khi `status===200` (2xx khác: đóng loading, đứng yên). Không đọc body. Thứ tự: `holdTransit(o)` → `setBooking({...booking, info_invoice: invoice|null, statusUpdate:true})` (trang thanh-toan dùng `statusUpdate`, `info_invoice.code` cho pixel) → `getTotalMoney(booking)===0` ? `router.push("/xe-khach/thanh-toan/thanh-cong?booking_code="+order_code)` (không merchant_code) : `router.push("/xe-khach/thanh-toan?booking_code=${order_code}&merchant_code=${merchant}&trip_id=${trip.trip_id}")`.
- **Lỗi**: `errs = err.response.data.errors; a = errs && Object.values(errs)[0]; msg = Array.isArray(a) ? a[0] : (a || err.response.data.message); msg && message.warn(msg)`. Không có thông báo mặc định khi lỗi mạng.

## 7. Khác biệt so với app Android & dữ liệu live
| Mục | Web [B] | Android [A] |
|---|---|---|
| bookings query | không query | `?language=` |
| Khoá thêm | — | `token`, `language` trong body |
| `if_customer` | chỉ khi không rỗng; cần name+phone | luôn gửi |
| `seats` | `{id, code: mã KM, is_reward}` sort id | nguyên object ghế + `ticketPrice, checkPromotion, is_reward:false, priceDiscount, code/ticketCode=mã KM` |
| `is_combo` | công thức R §6 | luôn 0 (chưa làm `api/price-ticket`) |
| Điểm thưởng | có (`is_reward`, balance) | không |
| check-promotions | POST không body, mọi tham số trên query; `channel:1`, `WEBHAIVAN`, `tripCode=trip_info.id`; đọc `data.codes` khớp `ticketCode===seat.code` | POST JSON body + query `merchant_code,language`; `channel:2`, `APPHAIVAN`, `tripCode=68264` (hằng trong bundle RN), `phone`, token; đọc `data.codes` theo `id` |
| is_transit | `location="lat, lng"` (dead code ở xe-khách) | `location="lat,lng"`, `type` 1/2, `language` |
| hold-booking | `channel:1`, `aff`, `utm_source`, `aff_sid` | `channel:2`, `token`, `phone`, `language` |
| Dịch vụ trung chuyển v4 | có (02/16/17) + `hold-transit` sau booking | không |
| Quyết định tổng 0 | tính local `Σ(price−discount)` bỏ ghế reward | đọc response `data.price + data.surcharge_price` |
- Live [L] (order `B02ELR3J6PD62D`, 2026-10-27): response `api/bookings` có `data.code` (= order_code của hold), `data.price`, `data.surcharge_price`, `data.tickets[]` (mỗi vé `code, price, price_discount, pick_up/drop_off{address,id,coordinates}, transit{departure,destination}, channel`), `payment{type:0,type_name:"Chưa thanh toán"}`, `method_payment_type:0`, `created_at:"DD-MM-YYYY HH:mm"`, `merchant_code`. Hold `expire_time` ≈ created_at + 10–11 phút. Web bỏ qua toàn bộ body này.
- Khuyến nghị bản mới: giữ đúng body web (channel 1/WEBHAIVAN); có thể đối chiếu `data.price` để quyết định thanh-cong thay vì tính local (cải tiến, vẫn bám web nếu cần 1:1).

## Đính chính so với báo cáo trước
- `is_transit`/maps cho điểm đón-trả: KHÔNG hoạt động trên confirm xe khách build này (dead code); maps chỉ dùng trong modal dịch vụ.
- `is_combo`: điều kiện mã KM chỉ xét ghế id nhỏ nhất (bug `||`).
- check-promotions: response `data.codes` top-level; parseInt; khớp theo mã vé.
- `price-ticket` khi đóng modal: gọi cho mọi chuyến, chỉ đổi state cục bộ.
- `hold-transit` bắn sau MỌI booking thành công (services rỗng nếu không phải 02/16/17).
- Thiếu booking → spinner vô hạn (không redirect). Redirect tổng 0 không tính phụ thu trung chuyển.

## Chưa rõ
1. `api/price-ticket` với `is_combo=1` trên chuyến không combo trả gì (web vẫn gọi khi đóng modal).
2. Backend dùng `seats[].code` (mã KM) hay `discount` đã check để tính giá; ghế có `promotion` nhưng không có trong `data.codes` vẫn gửi mã.
3. Giá trị `dvbs_code` của dịch vụ trả (chỉ thấy so sánh `"TCDON"`); schema đầy đủ `get-price-transit` / `hold-transit` response.
4. `newParams` thiếu khi chuyến chỉ có trung chuyển chiều trả (`transit.end` mà không `start`) → `get-price-transit` thiếu `order_code/seats`: backend xử lý ra sao.
5. Backend có kiểm `transit.departure=true` với `is_transit` không (web không kiểm lại ở confirm).
6. `api/bookings` có trả 201/khác 200 ở trường hợp nào (web đứng yên).
7. Ảnh hưởng của `api/v4/hold-transit` với `services: []` cho merchant ngoài 02/16/17.
