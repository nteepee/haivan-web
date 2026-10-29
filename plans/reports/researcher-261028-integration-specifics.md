# Integration specifics (2026-10-28)

Nguồn: chunk web gốc (build LI8ATpi0xeUS476WVdvJn), `web-vs-app-flow-parity.md`, test hợp đồng app Android (`PaymentContractTest.kt`), docs VNPay sandbox, npm registry. Không gọi API ghi. Nhãn: [B]=xác minh từ bundle, [A]=từ app Android/test, [D]=docs ngoài, [?]=chưa xác minh.

## 1. Payment return

### Gửi đi (trang `/xe-khach/thanh-toan`) [B]
- Type 1 (ATM) / 2 (thẻ quốc tế): bắt buộc chọn `bank_code` (logo grid tĩnh trong module `Oqsq` của web gốc, tự dựng lại). Type 5 -> `bank_code=VNPAYQR`.
- `GET apigw/api/payment/vnpay?return_url=<origin>/xe-khach/thanh-toan?booking_code=X&order_code=X&bank_code=B&merchant_code=M&trip_id=T` -> redirect `window.location.href = res.data.url` (url ở TOP-level `data.url`, không phải `data.data`).
- Bug web gốc: return_url ghép chuỗi KHÔNG encode -> `&order_code=..&bank_code=..&merchant_code=..&trip_id=..` thực chất thành query riêng của lệnh gọi; backend chỉ nhận `return_url=.../thanh-toan?booking_code=X`. Tuy vậy trang return đọc được `merchant_code` + `trip_id` -> backend phải tự gắn lại, hoặc đọc từ param riêng [?]. Không kiểm chứng được nếu không thanh toán thật.
- PayOS (type 6): `GET api/payment/payos?merchant_code&order_code` -> `window.location.href = data.data.checkoutUrl`. Web KHÔNG gửi return/cancel URL; backend tự quyết (app Android chỉ gửi `language`). [B]
- Type 3 (chuyển khoản) / 4 (tiền mặt/văn phòng): `POST api/update-booking/{code}?merchant_code {method_payment: select==3 ? 2 : 3}` -> `/xe-khach/thanh-toan/thanh-cong?booking_code&merchant_code`.
- Method hiển thị chỉ khi `info-payments[type].is_locked === false` (undefined cũng ẩn). `description` của type 6 hiển thị làm mô tả PayOS. `show_price=0` ẩn giá.

### Nhận về [B]
- `thanh-toan` componentDidMount: đọc `booking_code, merchant_code, trip_id, vnp_ResponseCode` từ URL.
  - `vnp_ResponseCode === "00"` -> `router.push(/xe-khach/thanh-toan/thanh-cong?booking_code&merchant_code)`.
  - Có mã khác (24, 51...) -> toast "Thanh toán không thành công", KHÔNG phân biệt huỷ/lỗi, rồi chạy tiếp luồng bình thường (reload methods).
  - Không đọc `vnp_TransactionStatus`, `vnp_SecureHash`, `vnp_TxnRef`. Không có xử lý PayOS (`code/status/cancel`) nào trong chunk.
  - Sau 100ms: `info-payments` + `info-payment-block`; sau 3s `GET api/bookings/{code}?merchant_code`: nếu `payment.type` truthy (đã trả) -> sang thanh-cong; nếu `method_payment_type===0` và `now - created_at >= 598000ms` -> modal hết giờ.
- `thanh-cong`: không đọc param thanh toán nào ngoài `booking_code, merchant_code`; chờ 1500ms, `GET api/bookings/{code}`; hiển thị "đã thanh toán" nếu `payment.type` truthy, nếu không "chưa thanh toán". Xoá `time_out` trong store. Nếu có `log_qr.source+aff` đẩy pixel affiliate `lacmp.net/lila.js` (event Sale). => Nguồn sự thật thực tế = server (`payment.type`), không phải query.

### Mã trả về
- VNPay `vnp_ResponseCode` [D sandbox.vnpayment.vn/apis/docs/bang-ma-loi]: 00 ok; 07 trừ tiền nghi ngờ gian lận; 09 chưa đăng ký IB; 10 xác thực sai >3 lần; 11 hết hạn; 12 khoá; 13 sai OTP; 24 khách huỷ; 51 không đủ số dư; 65 quá hạn mức; 75 ngân hàng bảo trì; 79 sai mật khẩu quá số lần; 99 khác. `vnp_TransactionStatus` (00 thành công, 01 chưa xong, 02 lỗi...) [?] doc không liệt kê trong trang đã fetch; chỉ dùng nếu cần.
- PayOS return [A]: `?code=00&cancel=false&status=PAID` = thành công; `cancel=true&status=CANCELLED` = huỷ; host return app dùng `mybus.vn` (hợp đồng test app). Docs chính thức PayOS không fetch được -> các tham số chuẩn `code,id,cancel,status,orderCode` là [?].
- App coi `24`/`cancel=true` = CANCELLED, mã khác khi về return = FAILED (`gatewayOutcomeOf`).

### Khuyến nghị bản mới
1. Trang return chỉ là gợi ý UI. Quyết định = poll `GET api/bookings/{code}` (`payment.type` truthy) vài lần (IPN trễ, vd 3 x 2s) rồi mới báo; 07 hiển thị "đang xác minh" không phải lỗi.
2. Tách 24 (huỷ) / 00 / khác; giữ nút "chọn lại phương thức" vì giữ chỗ còn hạn.
3. Dựng return_url bằng `new URL()` + `searchParams` (encode đầy đủ) VÀ lưu `{booking_code, merchant_code, trip_id}` vào sessionStorage trước khi redirect, để không phụ thuộc backend echo param.
4. Cần backend/ops: domain return mới có được VNPay/PayOS merchant config chấp nhận không; PayOS return URL phía backend trỏ đâu (domain mới hay haivan.com) [?]. Đây là blocker thật.

## 2. Trạng thái luồng đặt vé [B]
Redux + redux-persist (storage cụ thể [?], có `localStorage` trong bundle). Keys: `user_login, user_info, booking, time_out, type_booking, log_qr{source,aff,created}, service_tc, status_room, lang_multi`.

Luồng:
1. tim-chuyen, chọn ghế -> cần đăng nhập (chưa có `user_login` -> modal login, xong gọi lại hold). `POST api/hold-booking {trip_id, seats:[<nguyên object ghế từ api/trips/{id}>], merchant_code, channel:1, aff, utm_source?, aff_sid?}`. `aff` = `log_qr.aff` (xoá nếu `log_qr.created` đã qua), `utm_source`/`aff_sid` lấy từ cookie/query.
2. Response hold dùng: `expire_time` ("DD-MM-YYYY HH:mm:ss"), `order_code`, `tickets[]` (merge theo `seat.id` vào `seats`: thêm `code, price, discount, is_promotion`...).
3. Draft `booking` = `{pick_up:{address,coordinates{lat,lng}}, drop_off:{...}, trip:{trip_id,departure_id,destination_id}, transit:{departure:bool,destination:bool}, trip_info:<object chuyến từ api/el/trips: id, merchant{code}, route{code,name,show_price}, product{code}, direction A|B, from/to{place_id,place_name,location[lng,lat]}, node_time, price{min}, transit{start,end,is_check_transit_start/end}, date>, seats, expire_time, order_code, is_combo, show_price}` -> sang `/xe-khach/xac-nhan`.
4. Confirm: nếu `expire_time <= now` -> modal "hết ghế/hết giờ", xoá booking/time_out/type_booking, `router.back()` (hoặc `/` nếu `partner=1`). Đồng hồ đếm theo `expire_time`.
5. Nút tiếp tục -> `POST api/bookings` (`pick_up,drop_off,trip{trip_id,departure_id(=trip_info.from.place_id),destination_id},transit{departure: pick_up.address===value_start, destination:...},seats:[{id,code:promotion,is_reward}] sort id,order_code,merchant_code,note,is_combo,if_customer?,invoice?}`. `is_combo` gửi: nếu draft=1 -> 0 khi có ghế dùng mã KM/điểm thưởng, ngược lại 1; còn lại giữ nguyên. Validate: `if_customer` cần name+phone; invoice cần name,address,email (+code nếu loại 2).
6. 200 -> `holdTransit(payload)` (`POST api/v4/hold-transit`, fire-and-forget, 400 chỉ toast) -> total = sum(seat không reward: price - discount); total 0 -> `thanh-toan/thanh-cong?booking_code` (không có merchant_code), else `thanh-toan?booking_code&merchant_code&trip_id`. Chống bấm đúp bằng cờ `process_booking`. Lỗi: lấy `errors` đầu tiên, hoặc `message`.
7. `thanh-toan` tự dựng lại từ URL (re-fetch booking). Hết giờ thanh toán = `created_at + 600000ms` (đồng hồ) / guard `>=598000ms` khi `method_payment_type===0`. Redux `booking.expire_time` (hold) và 10 phút thanh toán là hai đồng hồ khác nhau.

Call phụ ở confirm [B, `78bc838e…` service]:
- Mount (+300ms): `GET api/promotion/get-promotions?{merchant_code,route,product,channel:1,direction(A=1,B=2),departure_id,destination_id,departure_time:node_time,price:trip_info.price.min,channel_code:WEBHAIVAN}` (debounce 1s); `GET api/customer/customers` -> `data.account.balance` (điểm thưởng; ghế `is_reward` trừ điểm, không tính tiền).
- Nhập mã: `POST api/promotion/check-promotions?<qs>` (KHÔNG body, mọi thứ trên query: `merchant_code,route,product,channel:1,direction,departure_id,destination_id,departure_time,bookingCode,tripCode,adm_id:0,codes[{promotion,ticketCode,ticketPrice}],channel_code:WEBHAIVAN`) -> `data.codes[{ticketCode,priceDiscount}]` gán `discount` từng ghế. Mã ẩn: `GET api/admin/search-code-hide?code&channel_code=WEBHAIVAN&channel=1`.
- Đóng modal KM mà không có mã/điểm: `GET api/price-ticket?{order_code,merchant_code,seats[{id}],is_combo:0|1 (đảo),trip{trip_id,departure_id,destination_id}}` -> `data.data[{ticketCode,ticketPrice}]` cập nhật giá (combo <-> thường).
- `is_transit`: `GET api/el/is_transit?{trip_id,location:"lat, lng",place_id:departure_id|destination_id,merchant_code}` -> chỉ nhận điểm đón/trả tuỳ chọn nếu `is_check_transit && is_transit`, else cảnh báo `msg_point_transit`. Tìm địa chỉ: `GET api/maps/places?input=&channel=WEBHAIVAN` (>3 ký tự, debounce 500ms), `api/maps/places/detail?place_id&channel=WEBHAIVAN`.
- Dịch vụ trung chuyển chỉ cho merchant `02,16,17`: `GET api/v4/get-bonus-service?merchant_code` -> `POST api/v4/get-price-transit {…newParams(order_code,merchant_code,seats[ticket_code,phone,name,pick_up*,drop_off*,number,quantity,date]),services,trip_id,merchant_code}` -> `GET api/v4/get-price-ticket`, `api/v4/check-transit`, `update-transit`. Bundle có đủ; ngoài phạm vi nếu chưa cần.
- `info-payment-block?merchant_code`: CHỈ ở `thanh-toan` (không ở confirm). Response `{status, data:{use_payment_blocked_time_start,use_payment_blocked_time_end ("YYYY-MM-DD HH:mm"), configs.ticket_canceled_nums}}`; nếu `status===true` hiện ghi chú đỏ (thay xxx/yyy/zzz bằng số lần huỷ, ngày bắt đầu, ngày kết thúc). Chỉ thông tin; việc khoá từng method nằm ở `is_locked` trong `info-payments`.

Đề xuất draft (zustand persist sessionStorage): giữ đúng các field trên; chỉ cần `trip_info` các trường đã liệt kê, bỏ khi `expire_time` qua; luôn re-fetch `api/bookings/{code}` khi vào thanh-toan.

## 3. reCAPTCHA v2 + OTP
- Web gốc: `react-google-recaptcha` (checkbox, size normal, theme light) trong modal login; `sitekey` là literal cứng trong chunk `5f6f733a…` (bắt đầu `6LcJ-LYqAAAAA…`), KHÔNG phải env var. Env var trong bundle chỉ có `NEXT_PUBLIC_ServiceAddress` (axios baseURL) và `Domain_Haivan`. Site key vốn công khai, nhưng bị ràng buộc danh sách domain trong Google admin của chủ key; backend verify token bằng secret của key đó. Không dùng/thử.
- Hệ quả: web mới trên domain khác (kể cả localhost) KHÔNG lấy được token backend chấp nhận trừ khi (a) chủ key thêm domain mới (+localhost dev) vào key hiện có (không đổi backend, nhanh nhất), (b) backend đổi sang key/secret mới, hoặc (c) dùng đường `get-otp-new` như app. (c): chữ ký là `sha256(phone + 4 số cuối)` (không bí mật) [A] -> không phải kiểm soát chống lạm dụng thật; dùng được nhưng giả `channel=2` từ web là quyết định của chủ hệ thống (nên hỏi, không tự ý).
- Gọi OTP [B]: UI chỉ cho gửi khi có token captcha. Input hợp lệ: toàn số, bắt đầu `0`, đúng 10 số; hoặc email regex. `GET api/get-otp?phone=<input>&captcha=<token>&channel=1` (web không encodeURIComponent; email có `+` sẽ hỏng -> bản mới phải encode). 200: `{expire_time:"DD-MM-YYYY HH:mm:ss", email, phone, otp?}`; hết `expire_time` UI tự quay về bước nhập. Lỗi: toast `response.data.message`.
- `data.otp` trong response: UI hiển thị luôn mã thay cho dòng "kiểm tra SMS" (biến `fakeOtp`) -> backend có lúc trả OTP trong body (test/whitelist?). Không dựa vào; ghi nhận rủi ro rò rỉ cho chủ hệ thống.
- Verify: OTP 6 số, tự gửi khi đủ 6: `POST api/verify-otp {phone: phone||email, otp, channel:1}`. Có `token_type`+`access_token` -> login. Không có -> coi là khách mới, form `name,email,phone` -> `POST api/register {email,phone,otp,name}` thành công khi `status 200 && data.code===200` + token. 400 -> "sai OTP"; 500 -> hiện `data.message`.
- Phiên bản email = cùng endpoint; chỉ khác chuỗi vào `phone`. `verify-otp` dùng `phone||email` theo giá trị server trả.
- Token hết hạn: Google tài liệu verify nói token v2 sống 2 phút và dùng một lần [D, kiến thức, không re-fetch trang verify] -> gọi `reset()` sau mỗi lần gửi OTP (web gốc không reset, gửi lại phải đợi widget/`expired-callback`).
- Thư viện (npm, 2026-10-28): `react-google-recaptcha` 3.1.0 (publish 2025-01-06, peer `react>=16.4.1`, class component, giống web gốc); `@google-recaptcha/react` 2.5.3 (peer khai React 17-19, hỗ trợ v2 checkbox; độ khoẻ thấp theo depscope); `react-google-recaptcha-v3` 1.11.0 CHỈ v3 -> sai loại (token v3 không qua verify secret v2). Xếp hạng: 1) `react-google-recaptcha` trong client component `next/dynamic ssr:false` (parity, ít code; rủi ro: ngừng cập nhật, chưa chạy thử React 19); 2) `@google-recaptcha/react`; 3) hook tự viết quanh `grecaptcha.render` (không phụ thuộc, ~30 dòng). Google đánh dấu trang docs v2 là deprecated, hướng tới Google Cloud -> kiểm tra việc di chuyển key của chủ.

## 4. Quy tắc chọn ghế [B tim-chuyen/xac-nhan]
- Tham số: `numberGuest` (mặc định 1, nằm trên URL tìm chuyến), truyền vào `api/el/trips` và `api/trips/{id}`. Stepper trong modal: min 1, max `trip.available_seats`; giảm nhỏ hơn số ghế đã chọn -> xoá lựa chọn; đổi -> refetch chi tiết chuyến.
- Tối đa: chế độ thường cho thêm khi đang chọn <=8 -> tối đa 9 ghế; chọn thêm -> toast `list_trip.msg.msg_booking_select_seat` (text i18n không nằm trong bundle [?]).
- Chỉ click được ghế `is_empty`. Bấm lại = bỏ chọn.
- Combo: `data.is_combo` (từ `api/trips/{id}`) truthy -> chọn đúng `numberGuest` ghế: vượt -> mở modal đổi số khách (kèm toast nếu đã >8); khi "Tiếp tục", số ghế != numberGuest -> mở modal; giá mọi ghế đã chọn bị gán bằng giá ghế vừa bấm (giá đồng nhất).
- `is_locked === true` (từ `api/trips/{id}`): overlay mờ (đen 0xA0) tiêu đề `list_trip.noti` + `message` của API + nút "xem chi tiết" -> `link` (mở tab mới); chặn hold với toast `list_trip.msg.msg_block_booking`. Nếu có `note` (không lock): overlay note + nút "Tiếp tục" (tắt được).
- Dữ liệu sơ đồ: `data[0]`,`data[1]` = tầng 1/2 (hàng -> cột); `data[2]`/`data[3]` là hàng bổ sung được gộp: có `data[2]` -> push vào `data[0]`; ngược lại `data[3]` -> push hàng null vào `data[0]`; ghép tương tự cho `data[1]`. Chỉ render index 0,1; ô `null` = khoảng trống. Mobile: tab "Tầng 1/2".
- Màu/legend: trống (nền trắng, viền `#CACBD0`, icon `seat_default`), đang chọn (`seat_active`, legend `#FFC20E` nhãn `list_trip.progress`), đã đặt (xám `rgba(202,203,208,.5)`, `seat_disabled`, chữ giá `#9E9E9E`; ghế trống chữ giá `#000`). Giá chỉ hiện khi `route.show_price !== 0`. `seat_group`, `arrCabin` KHÔNG xuất hiện trong web gốc (0 hit) -> bản mới có thể bỏ qua hoặc dùng để nhóm, tự quyết.
- Giữ chỗ cần đăng nhập; chưa có `user_login` -> modal login -> `callbackLogin(true)` gọi lại `keepSeat`.

## 5. Bảo mật
- Web gốc: `user_login` (token_type + access_token) nằm trong redux-persist (storage phía trình duyệt, XSS đọc được); gán `axios.defaults.headers.Authorization` GLOBAL -> mọi request qua instance mặc định (kể cả `cms.haivan.com`, `api/maps/*`) kèm Bearer. Chỉ gọi CPN dùng `axios.create({headers:{Authorization:""}})` (vẫn thừa hưởng `Domain` header; preflight CPN cho `domain` hay không [?]). Không refresh token. Prod gỡ `console.log` (`console.log=function(){}`) để khỏi lộ.
- Khuyến nghị: một wrapper fetch duy nhất, allowlist origin: chỉ `apigw.haivan.com` nhận `Authorization` + `Domain`; `cms.haivan.com` và CPN (`api.cpn.haivanexpress.vn`) KHÔNG gửi Authorization (đúng với web gốc cho CPN; cải thiện cho CMS). 401 -> xoá token, mở lại login, giữ draft.
- Lưu token (xếp hạng): 1) cookie httpOnly qua route handler Next (BFF, allowlist path) - không đọc được bằng XSS, nhưng thêm hop + cần hosting; 2) bộ nhớ + sessionStorage với CSP chặt (phù hợp nếu gọi apigw trực tiếp từ trình duyệt, vốn CORS `*`); 3) localStorage (parity, rủi ro XSS cao nhất; script bên thứ ba: reCAPTCHA, pixel lacmp.net, bản đồ). Phù hợp với khuyến nghị stack trước (BFF).
- Tham số return `vnp_*`/`code`/`cancel` do client tự đặt được; web gốc chỉ dùng để điều hướng và trang cuối đọc lại từ server, nên mất ít. Bản mới: coi là gợi ý, xác nhận bằng `api/bookings/{code}`; không bao giờ tự đánh dấu "đã thanh toán" chỉ từ query.
- CSP: `script-src/frame-src` google.com/recaptcha + gstatic; `connect-src` apigw, cms, cpn, (maps tiles); chuyển hướng gateway là điều hướng top-level (vnpayment.vn, pay.payos.vn), không cần frame. Pixel affiliate `lacmp.net` là tuỳ chọn: chỉ giữ nếu đối tác còn dùng.
- `get-otp` rate/abuse nằm ở backend; encode mọi tham số, không nhúng secret nào trong bundle (chữ ký app không phải secret thực).

## Hạn chế
- Không thanh toán thật nên không quan sát được URL return thực tế của VNPay/PayOS cho web mới, hay param `vnp_TransactionStatus`.
- Docs PayOS không lấy được; i18n JSON (text thông báo) không nằm trong chunk.
- Redux-persist storage backend/key chưa đối chiếu runtime.

## Câu hỏi chưa giải quyết
1. Ai sở hữu Google reCAPTCHA key của haivan.com; có thêm domain web mới + localhost được không (hay cần `get-otp-new`)?
2. PayOS và VNPay return/cancel URL: backend có cấu hình theo domain, có nhận `return_url` cho PayOS, có chấp nhận domain mới?
3. Backend có echo `merchant_code`/`trip_id` lên return_url VNPay (vì web gốc ghép không encode)?
4. `get-otp` trả `otp` trong body: ở môi trường/số nào?
5. CPN CORS có chấp nhận header `domain` không (nếu bản mới gửi qua wrapper)?
6. Có cần luồng dịch vụ trung chuyển (merchant 02/16/17) và `v4/*` ở phase đầu không?
