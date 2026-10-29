# 03 — Thanh toán, Chuyến đi của tôi, Tài khoản (spec hành vi haivan.com, 2026-10-28)

Nguồn: đọc tĩnh chunk build `LI8ATpi0xeUS476WVdvJn` (không gọi API). Offset = vị trí ký tự trong file chunk gốc.
Viết tắt chunk: **PAY** `pages__xe-khach__thanh-toan-da0959…`, **OK** `…thanh-toan__thanh-cong-5729df…`, **TRIP** `…chuyen-di-cua-toi__xe-lien-tinh-e5e2f1…`,
**INFO** `…thong-tin-ca-nhan-830c52…`, **OUT** `…dang-xuat-1d7ded…`, **APP** `pages___app-b3012d…`, **5F6F** `5f6f733a…081052…` (modal login, header, modal cập nhật `lD+s`),
**SVC** `78bc838e…047b40…` (bảng API, module `JnuR`), **SIDE** `9348d827…` (sidebar `drVm`), **STORE** `d7f9648a…` (module `BXF7`), **BANK** `c5272b95…` (module `Oqsq`).
Bổ sung/sửa cho `researcher-261028-integration-specifics.md` §1/§3/§5 (không lặp lại chi tiết đã có ở đó). [B]=bundle, [A]=app Android, [L]=quan sát live.

## 0. Nền tảng chung (APP, STORE)
- Redux + redux-persist: `{key:"primary", storage: localStorage}`, KHÔNG whitelist → toàn bộ state lưu `persist:primary` (STORE@~19500). Action: `q`=setUserLogin, `p`=setUserInfo, `h`=setLoyaltyDefine, `d`=setCarCompany, `c`=setCarAirportDefine, `a`=setBooking, `n`=setTimeOut, `o`=setTypeBooking, `g`=setLogQr.
- `user_info` trong store = `data` của `GET api/customer/customers` (không phải `api/user`). `loyalty_define` = body của `api/customer/definition` (dùng trực tiếp `titles, provinces, districts, jobs, travel_purposes`).
- axios mặc định (APP@8531-9489): `baseURL=NEXT_PUBLIC_ServiceAddress`, `timeout 60000`, headers `{Accept, Content-Type: application/json, Domain: <Domain env|"haivan.com">, Authorization: "<token_type> <access_token>"}` (khi có token, set lại trong callback persist). Không có interceptor nào trong toàn bundle.
- Component `/70b` (APP@5816): mỗi khi `user_login` đổi và truthy, sau 50ms `Promise.all[GET api/customer/customers, GET api/customer/definition, GET api/v4/definition]` → setUserInfo(`[0].data.data`), setLoyaltyDefine(`[1].data`), setCarCompany(`[2].data.data.car_company` + unshift `{id:10,name:"Tất cả"}`), setCarAirportDefine(`[2].data.data`). **401 ở đây là xử lý 401 DUY NHẤT của web**: setUserInfo(null), setUserLogin(null), `router.push("/")`. Khớp [L] (3 call này xuất hiện ở mọi trang khi đã đăng nhập).
- Cookie affiliate (APP@9572): nếu URL có `utm_source` HOẶC `aff_sid` → set CẢ HAI cookie (giá trị có thể là chuỗi `"null"`), `expires=+30 ngày; path=/; SameSite=Lax`.
- Trang tài khoản KHÔNG có guard đăng nhập (0 tham chiếu `user_login` trong TRIP/INFO/PAY). Chưa đăng nhập: request đi không token, lỗi bị nuốt.

## 1. Trang thanh toán `/xe-khach/thanh-toan` (PAY)
**Tham số URL**: `booking_code`, `merchant_code`, `trip_id`, tuỳ chọn `vnp_ResponseCode` (return VNPay), `partner` (=1 → về `/` khi hết giờ). Đọc bằng `qs.parse(asPath.split("?")[1])` (PAY@15538).
**Trình tự mount** (PAY@15497-17029):
1. Có `vnp_ResponseCode`: `"00"` → push `/xe-khach/thanh-toan/thanh-cong?booking_code&merchant_code` (dừng). Khác → toast warning cứng "Thanh toán không thành công", chạy tiếp.
2. +100ms: `Promise.all[GET api/info-payments?merchant_code&trip_id&booking=<booking_code>, GET api/info-payment-block?merchant_code]`. Chỉ khi CẢ HAI 200 mới làm bước 3-4 (một cái lỗi → spinner mãi, không toast). Luôn `scrollTo(0,0)`.
3. Nếu block `data.status===true` → ghi chú đỏ `payment.msg.msg_block_booking` (thay `xxx`=configs.ticket_canceled_nums, `yyy`/`zzz`=blocked_time_start/end đổi "YYYY-MM-DD HH:mm"→"DD-MM-YYYY"). Text vi: "Quý khách đã vi phạm chính sách huỷ vé… thanh toán 100% giá vé trong khoảng thời gian từ yyy đến zzz…19006763". `info_payment` = mảng body info-payments (mảng trần [A fixture]).
4. +3000ms (tính từ lúc 2 call xong): `GET api/bookings/{booking_code}?merchant_code` → `payment.type` truthy → sang thanh-cong; else `state.booking=data`; nếu `now - created_at("DD-MM-YYYY HH:mm:ss") >= 598000ms` và `method_payment_type===0` → modal hết giờ. Trước khi booking về: spinner toàn trang (~3,1s tối thiểu).

**Render danh sách phương thức** (PAY@18504-24508). Radio antd, bấm lại radio đang chọn = bỏ chọn (về 0). Mỗi khối chỉ hiện khi `find(info,{type:X}).is_locked === false` (undefined/không có → ẩn). ÁNH XẠ TYPE → RADIO KHÔNG 1:1:
| info `type` gate | Radio value | Nhãn vi (key) | disabled khi `booking.payment.type!==0` |
|---|---|---|---|
| 5 | 5 | "Thanh toán bằng mã QR qua VNPAY-QR" (`payment.VNPAY_QR`, dùng cả tiêu đề lẫn mô tả) | có |
| 6 | 6 | `name` / `description` từ API (PayOS) | có |
| 1 | 1 | "Thanh toán bằng thẻ ATM Nội địa / VNPAY-QR" + hint "Sử dụng Mobile Banking hỗ trợ VNPAY" | KHÔNG |
| 1 (cùng gate!) | 2 | "Thanh toán bằng thẻ quốc tế" + hint ATM_hint | KHÔNG |
| 2 | 3 | "Thanh toán bằng chuyển khoản" + hint + khối TK + "Chú ý…" đỏ `#BB0000` | có |
| 3 | 4 | "Thanh toán tại nhà xe" + cash_hint + "Mã giữ chỗ" `booking_code` IN HOA | có |
- `show_price` (lấy từ draft redux `booking.show_price`, mặc định 1 nếu không có draft) `===0` → CHỈ hiện khối tiền mặt (gate type 3), ẩn tổng tiền/giá ghế.
- Lưới ngân hàng chỉ hiện khi radio đang chọn = 1 (ATM) hoặc 2 (quốc tế). Nguồn: JSON tĩnh BANK `Oqsq` (BANK@9141), logo `https://sandbox.vnpayment.vn/apis/assets/images/bank/<x>_logo.png`.
  - ATM (33): ABBANK, ACB, AGRIBANK, BACABANK, BIDV, DONGABANK, EXIMBANK, HDBANK, IVB, MBBANK, MSBANK, NAMABANK, NCB, OCB, OJB, PVCOMBANK, SACOMBANK, SAIGONBANK, SCB, SHB, TECHCOMBANK, TPBANK, VPBANK, SEABANK, VIB, VIETABANK, VIETBANK, VIETCAPITALBANK, VIETCOMBANK, VIETINBANK, BIDC, LAOVIETBANK, WOORIBANK. Cột xs8/sm8/md8/lg6.
  - VISA (4): VISA, MASTERCARD, AMEX, JCB. Cột xs24/sm12/md8/lg6. Ô chọn viền `1px primaryColor`, ảnh cao 60 contain.
  - Click logo (PAY@4088): click đơn (debounce 100ms) = chọn `select_bank=code`; **double-click = chọn + gọi thanh toán ngay**.
- Khối chuyển khoản (`renderPayment`, PAY@4840): nếu `tickets[0].trip.node.route.id` ∈ {10043, 15725} → TK cứng: STK `1556355555`, tên "CN CONG TY LD VCQT HAI VAN", ngân hàng "Ngân hàng quân đội MB bank", chi nhánh "MB bank chi nhánh Huế". Ngược lại lấy `find(info,{type:2}).info[0]` → `code`(STK), `name_cp`(tên TK), `name`(ngân hàng), `branch`. Nội dung CK: `"<booking_code> <customer.phone>"` in hoa đậm.

**Hành động nút "Thanh toán"** (`updatePayment`, PAY@1763-4088):
- 0 → toast "Vui lòng chọn hình thức thanh toán!"; 1/2 thiếu bank → "Bạn chưa chọn ngân hàng thanh toán!".
- 1/2 → `GET api/payment/vnpay?return_url=…&bank_code=<code>` (return_url như report §1, ghép không encode); 5 → như trên với `bank_code=VNPAYQR`; 200 → `location.href=data.url`.
- 6 → `GET api/payment/payos?merchant_code&order_code=<booking_code>` → `location.href=data.data.checkoutUrl`.
- 3 → `POST api/update-booking/{code}?merchant_code {method_payment:2}`; 4 → `{method_payment:3}`. Tức `method_payment` = đúng `type` của info-payments (2=CK, 3=tiền mặt), lệch radio do radio 2 dành cho thẻ quốc tế. Thành công → setBooking(`{...draft, statusUpdate:false}`) → push thanh-cong. **Không có catch** cho update-booking (lỗi im lặng).
- Lỗi vnpay/payos: chỉ HTTP 400 → toast warning `response.data.message`; mã khác im lặng. Không có chống bấm đúp (trừ debounce bank).
**Đồng hồ / modal hết giờ**: chỉ hiện khi `method_payment_type===0`. Đích = `created_at + 600000ms`, mm:ss. Desktop (cột phải): ô 56×56 + `onComplete` → modal; mobile (sticky bottom, kèm "Thanh toán {price}đ"): không có onComplete. `showModalTimeout` (PAY@4501): setTimeOut(null), setBooking(null), setTypeBooking(null), `Modal.warning` "Thông báo"/"Đã hết thời gian đặt vé, mời bạn chọn lại chỗ" → OK: `partner==1` ? push("/") : `router.back()` ×2.
**Tóm tắt giá** (cột phải, ẩn khi show_price 0): mỗi vé "Ghế {name}" = `price+price_discount`; dòng "Phụ thu" = sumBy(`transit_price`,`tcp_price`) — bug: tổng phụ thu cả đơn =0 thì React in chữ "0"; `is_reward` → "Đổi điểm" `-price` (xanh `#349D0E`), else `price_discount>0` → "Khuyến mãi" `-price_discount`; "Tổng giá tiền" = `parseInt(booking.price)`.
**Thẻ vé** (mỗi `tickets[]`): tuyến `trip.node.route.name` (đảo khi `direction==="B"`), `trip.departure_time` "dddd, DD MMMM", `trip.product.name`, giá vé, giờ đi/đến `HH:mm`, thời lượng `"{h}h{m}p"`, `departure.name`/`destination.name`, "Xe liên tỉnh", điểm đón/trả (chỉ khi khác tên bến; nhãn "(Xe trung chuyển|Tự di chuyển)" theo `transit.departure/destination`; chỉ hiện khi merchant `"02"` hoặc `booking.room!==null` — undefined cũng tính là có), mã vé `code` + ghế `name`.
**Pixel affiliate CartView** (PAY@14076): lần đầu khi draft redux `booking` có và `log_qr.source && log_qr.aff` → inject `window._lea.push({id:"pqz0D06BmU6J0pJYWVzZ", event:"CartView", totalPrice:Σseats.price, totalQuantity, currency:"VND", tax:info_invoice.code, products:[{productId:seat.code, productName:ascii("pick_up-drop_off"), productPrice, productQuantity:1, productCategory:"Bus-Ticket"}], refererUrl:log_qr.source})` + `//www.lacmp.net/lila.js`.

## 2. Trang thành công `/xe-khach/thanh-toan/thanh-cong` (OK)
- Mount (OK@8319): +1500ms `GET api/bookings/{booking_code}?merchant_code` (merchant_code có thể vắng khi tổng tiền 0) → state; `setTimeOut(null)`; scrollTop. Lỗi: spinner mãi. KHÔNG xoá `booking`/`log_qr`/`type_booking`.
- Hiển thị: tiêu đề "Đặt chỗ thành công", "Cảm ơn quý khách đã sử dụng dịch vụ của HAIVAN" / "Kính chúc quý khách thượng lộ bình an…"; "Hành khách" `customer.name`, "Số điện thoại" `customer.phone`; "Tổng giá tiền" `parseInt(price)` xanh `#2196F3` (ẩn khi show_price 0); trạng thái `payment.type` truthy → "Đã thanh toán" (xanh) else "Chưa thanh toán".
- Thẻ vé như §1 + **QR code** (`qrcode.react`, value=`ticket.code`, size 72) + "Phụ thu : X₫" LUÔN hiện (kể cả 0). Điểm đón/trả hiện khi khác tên bến (không có điều kiện merchant).
- Khối "Lưu ý": `confirmed.msg_note1` ("…ấn “Yêu cầu hủy” trước giờ khởi hành 3 giờ, hoặc liên hệ … 19006763…") + link `tel:19006763` + "Để kiểm tra trạng thái đặt vé… Chuyến đi của tôi" → `/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh`; mobile có nút sticky cùng đích.
- Pixel Sale (OK@6931): cùng điều kiện draft+`log_qr.source&&aff` → `{id:"pqz0D06BmU6J0pJYWVzZ", event:"Sale", site:"checkout", oid:draft.order_code, ocurrency:"VND", basket:"true", lea_source:"", ochannel:draft.trip_info.date, products:[{cid:"Sale", productId, productName, productPrice, productQuantity:1, productCategory:"Bus-Ticket"}]}`. Không kiểm tra đã thanh toán → bắn cả khi "Chưa thanh toán"/tiền mặt.

## 3. Chuyến đi của tôi — Xe liên tỉnh `/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh` (TRIP)
**Bố cục**: cột trái sidebar `drVm` (tên/SĐT từ `user_info`; link Thông tin cá nhân, Ưu đãi, Khách hàng thân thiết [chỉ khi `subscribe_loyalty`], Xe liên tỉnh, Xe sân bay, Xe hợp đồng, Đăng xuất); cột phải tabs.
**Tabs** (TRIP@5622): "Chuyến đi sắp tới" `booking-status=1`, "Hoàn thành" `2`, "Chuyến huỷ" `3`. Đổi tab: xoá list (spinner) → page 1.
**Gọi API**: mount +1000ms `GET api/bookings?booking-status[0]=1` (qs indices, KHÔNG page_size/language) + `GET api/list-reason`. "Xem thêm" (TRIP@3553/30625): chỉ khi `meta.current_page<last_page`, gọi `?page=N+1&booking-status[0]=<tab>`, nối vào list; spinner khi đang tải. Rỗng → "Bạn chưa có chuyến đi nào!".
**Header item (accordion antd, mở 1 item)** — map từ `api/bookings`:
- "Mã đơn hàng" `booking.booking_info.code`; "Ngày tạo đơn" `booking_info.created_at` ("YYYY-MM-DD HH:mm"→"DD/MM/YYYY").
- Badge phải (ưu tiên): `booking_info.status===3` → "Đã huỷ"; `status_payment` truthy → "Đã thanh toán"; item đang mở có detail → `detail.price` truthy ? nút "Thanh toán {detail.price}đ" : trống; còn lại `booking_info.total_money` truthy → nút "Thanh toán {total_money}đ". Giá ẩn khi `booking_ticket[0].route.code` ∈ {DLA-SBLK, BLO-SBLK}. Hiện ở MỌI tab nếu chưa trả & chưa huỷ.
- **Pay-now**: `<Link href="/xe-khach/thanh-toan?booking_code=<booking_info.code>&merchant_code=<merchant.code>&trip_id=<booking.booking_ticket[0].trip_id>">`.
- Không dùng: `VNPAY_*`, `booking_rating_trip`, `did_time`, top-level `booking_ticket:null`.
**Mở item** (`ke`, TRIP@4273): reset detail → +500ms refetch page 1 tab hiện tại (bug: mất các trang đã "Xem thêm") và song song `GET api/bookings/{code}?merchant_code=<merchant.code>` → detail = `{...data, merchant_code}`.
**Thẻ vé detail** (`detail.tickets[]`, TRIP@11551): như §1/§2 (QR `code`, phụ thu luôn hiện, giá ẩn với tuyến SBLK); vé `status.type===5` nền xám kẻ sọc. Cuối thẻ: mã vé + ghế; tab 2 thêm icon hoá đơn; cột hành động:
- `payment.type===0` và `status.type ∈ {1,2,3}` → nút "Huỷ vé" (mở modal huỷ ghế); else `status.type ∈ {1,2,3}` → "Đã thanh toán"; else `status.type_name`.
**Huỷ ghế** (TRIP@18621): modal 780px "Bạn có chắc chắn muốn huỷ vé?" + "Trước khi bạn huỷ, hãy cho chúng tôi biết lý do…"; radio từ list-reason (`reason_vi`, `id`); textarea "Bạn có điều muốn chia sẻ với chúng tôi?" CHỈ bật khi chọn reason `id===1`; chưa chọn → nút "Đồng ý" xám không bấm được. Đồng ý → `POST api/cancel-seat {order_code:detail.code, seat_code:ticket.code, merchant_code, reason_cancel_id, reason_cancel_note:""|text}` (KHÔNG có `type`); đóng modal ngay; 200 → reload detail (`ke`), không toast thành công; 400/422 → toast `message`.
**Huỷ đơn** (TRIP@27788): nút đỏ "Huỷ đơn hàng" chỉ khi `detail.payment.type===0 && detail.price>0 && tickets.length>1 && detail.status.type!==3` (đơn 1 vé → chỉ có "Huỷ vé"). Modal giống hệt; `POST api/cancel-booking {order_code, merchant_code, reason_cancel_id, reason_cancel_note, type:0}`; xử lý kết quả như huỷ ghế. Quy tắc "trước 3 giờ" KHÔNG kiểm ở client (backend trả 400/422).
**Tải hoá đơn** (TRIP@18241, chỉ tab Hoàn thành): `GET api/bookings/download-bill?ticket_code=<ticket.code>&merchant_code` → `data.base64pdf` → `<a download="<code>.pdf" href="data:application/pdf;base64,…">.click()`. Không xử lý lỗi.
**Phòng chờ / trung chuyển TCO** (TRIP@21131): khi detail có `room` hoặc `tco_ticket` → thẻ thêm: `room.info.hub_name` "(Phòng chờ)", `room.info.check_in_date`, "Số lượng khách: " = số vé `status.type!==5`, `tco_ticket.don_info/tra_info.address`, "Thời gian : " `tco_ticket.check_in_date`, mã `tco_ticket.code`; `ord_is_phong_cho===2||ord_is_trung_chuyen===2` → xám + chữ "Huỷ"; else nút "Huỷ dịch vụ" → modal "Vui lòng nhập lí do huỷ" (bắt buộc) → `DELETE api/transit/cancel-order/{detail.code}` body `{reason, type:0}` (bug: gọi `onRefreshList` không tồn tại → ReferenceError sau thành công).
**Dịch vụ bổ sung**: merchant `"02"`, có vé, status ≠2,3 → nút "Thông tin dịch vụ bổ sung": nếu đã trả (`payment.type===1` ở đơn/vé) hoặc có vé `status.type===11` → toast `trip.note_cancel` ("…quá thời gian thay đổi… 1900 6763"); else push `/xe-khach/cap-nhat-dich-vu?code&merchant_code`.
**Không có**: đánh giá chuyến, link theo dõi xe. `api/trip/search-location-detail?operator_id&ticket_code` chỉ dùng ở trang độc lập `/tracking?operator_id&ticket_code` (chunk `pages__tracking`), không link từ TRIP.

## 4. Thông tin cá nhân `/tai-khoan/thong-tin-ca-nhan` (INFO)
- Không gọi API khi mount; đọc `user_info` (từ /70b) + `loyalty_define`. Hiển thị (nhãn cứng tiếng Việt): Danh xưng `title.text`, Họ và tên (`name===phone` → hiện chữ "Họ và tên"), SĐT `phone`, Ngày sinh `date_of_birth`→DD/MM/YYYY, Địa chỉ, Tỉnh/Thành phố `province.name`, Quận/Huyện `district.name`, Thư điện tử, Nghề nghiệp `occupation.text`, Mục đích đi lại `travel_purpose.text`; khối "Thông tin xuất hoá đơn": `invoice_info.{email, company_name, tax_code, company_address}`. Mỗi khối có nút "Sửa".
- Modal "Đổi thông tin cá nhân" (INFO@~9000): initial `{title:title.key, date_of_birth, name (rỗng nếu =phone), phone, email, address, province_code:province.code, district_code:district.code, occupation:occupation.key, travel_purpose:travel_purpose.key}`. Rule: title bắt buộc; name bắt buộc 2-30 ("Tên không nhỏ hơn 2 ký tự!"/"…lớn hơn 30…"); date_of_birth bắt buộc (DatePicker DD/MM/YYYY); address bắt buộc ≤60; province/district bắt buộc (district lọc `districts.code.startsWith(province_code)`); email type email ≤30 (không bắt buộc); occupation/travel_purpose bắt buộc (options `jobs`/`travel_purposes`, `titles`, `provinces`). Name + DOB disabled trừ khi `data_source===1 || subscribe_loyalty===0`. Không có ô phone → không gửi phone.
- Submit: body = giá trị form, `date_of_birth` → "YYYY-MM-DD". `subscribe_loyalty` truthy → `PUT api/customer/customers/update-profile` (INFO@11393); else `POST api/customer/customers` (= **đăng ký KH thân thiết**, INFO@12114). Thành công khi `200 && data.status==="OK"` → đóng; toast "Cập nhật thông tin thành công" (update: nếu email đổi → "Vui lòng kiểm tra email để xác thực thông tin!") → `GET api/customer/customers` → setUserInfo. Lỗi: 500 → `message`; khác → "Có lỗi xảy ra trong quá trình cập nhật".
- Modal "Đổi thông tin xuất hoá đơn": KHÔNG GET tax (getTax có trong SVC nhưng 0 call site). `POST api/customer/customers/tax {email, company_name, tax_code, company_address}`; rule email type; company_name bắt buộc ≤50; tax_code bắt buộc ≤30; company_address bắt buộc ≤200; thành công `200 && data.status==="success"` → gán trực tiếp `user_info.invoice_info=values` (mutate store). Ghi chú cứng về tuyến Điện Biên/Sơn La/Bản Phủ/Mường Chà/Hà Giang phải báo 19006763 để xuất hoá đơn.
- Modal dùng chung `lD+s` (5F6F@252777): cùng form/logic. Ở chế độ `change_info` (do header gắn): TỰ MỞ, không đóng được, tiêu đề "Cập nhật thông tin cá nhân" khi `user_info.data_source===1`; không phải 1 → gọi `callback(true)`. Chế độ thường: nút "Đăng ký khách hàng thân thiết" khi `subscribe_loyalty===0`.

## 5. Đăng nhập / đăng ký / đăng xuất (5F6F, OUT, SIDE)
**Nút**: header chưa đăng nhập → "Đăng nhập" mở modal (5F6F@236305, mount `visible, callback:()=>close, show_update:true` @237031); đã đăng nhập → dropdown "Tài khoản": Thông tin cá nhân, Ưu đãi của tôi, Khách hàng thân thiết (chỉ khi `user_info.subscribe_loyalty`), Chuyến đi của tôi, Đăng xuất. Mobile drawer có nút tương tự.
**Bước 1 — nhập** (5F6F@~190700): Input "Vui lòng nhập vào số điện thoại hoặc email" + reCAPTCHA v2 (`onExpired` xoá token) + "Tiếp tục". Kiểm tra theo thứ tự: không phải toàn số và không phải email → "Số điện thoại hoặc email không hợp lệ"; số không bắt đầu `0` → key `login_form.msg.error_input` (THIẾU trong vi/en json → hiện nguyên key); số ≠10 ký tự → "Số điện thoại không hợp lệ"; chưa captcha → "Bạn chưa xác thực Captcha". Không trim, không chuẩn hoá +84.
- `GET api/get-otp?phone=<raw>&captcha=<token>&channel=1`. HTTP 200 → `{position:1, expire_time, email, phone, fakeOtp:data.otp}`. **2xx khác 200** → `is_new_customer = data.is_new` (mở thẳng form đăng ký, otp rỗng). Lỗi → toast error `response.data.message`. Captcha KHÔNG reset sau gửi.
**Bước 2 — OTP**: "Vui lòng nhập mã xác nhận được gửi tới" + chuỗi người dùng nhập (nếu `data.otp` có → thay bằng "Vui lòng nhập mã xác nhận" + hiện mã). `react-otp-input` 6 ô số, autofocus. **Không có đếm ngược hiển thị, không có nút gửi lại**; khi component update mà `now > expire_time` → về bước 1 (chỉ kiểm khi có re-render). Đủ 6 số → `POST api/verify-otp {phone: phone||email (giá trị server trả), otp, channel:1}`:
  - 200 + `token_type&&access_token` → `axios.defaults.headers={Accept, Content-Type, Authorization}` (**mất header `Domain`** tới khi reload), `setUserLogin(data)` (persist), `callback(false)`, reset state.
  - 200 không token → `is_new_customer=true` (modal "Đăng ký tài khoản").
  - 400 → "Mã OTP bạn nhập vào chưa đúng"; lỗi khác im lặng.
**Đăng ký**: form Họ và tên (bắt buộc 2-30), Thư điện tử (type email, ≤30; disabled nếu server trả email khác null), Số điện thoại (pattern `([0-9]{8,11})\b`, maxLength 12; disabled tương tự). `POST api/register {email, phone, otp, name}` → `200 && data.code===200` → toast "Đăng ký thông tin thành công" + headers + setUserLogin + callback(false); else "Có lỗi xảy ra trong quá trình đăng ký"; 500 → `message`.
**Sau đăng nhập**: /70b gọi 3 API (§0); header `lD+s` mở modal bắt buộc nếu `data_source===1`. Ở tim-chuyen/xac-nhan `callbackLogin(e)` chỉ `keepSeat()` khi `e` truthy — modal luôn gọi `callback(false)` → **không tự giữ chỗ lại**, người dùng bấm "Tiếp tục" lần nữa (sửa report §2/§4 cũ).
**Đăng xuất** — 3 đường, KHÔNG đường nào gọi `api/logout` (service có, 0 call site; sửa parity note):
- Header menu (5F6F@~222900): setUserLogin(null), setUserInfo(null), `axios.defaults.headers={Accept, Content-Type, Authorization:""}`, push "/".
- Sidebar (SIDE@~4839) và trang `/tai-khoan/dang-xuat` (OUT@833, push sau 100ms): chỉ xoá `user_info`+`user_login`; **không reset axios header** (Bearer cũ còn tới khi reload).
- Không xoá `booking/time_out/log_qr/type_booking`.
- `api/user` và `api/user-info` (getUserInfo/getUserLoyalty) không có call site nào trong bundle.

## 6. Khác biệt so với app Android (REA, [A])
| Hạng mục | Web | Android |
|---|---|---|
| Danh sách PTTT | Ẩn method `is_locked!==false`; radio 2 (thẻ quốc tế) gate theo type 1; lưới bank tĩnh 33+4 | Hiện mọi method, khoá cái `is_locked`; không có thẻ quốc tế; bank lấy từ `info` (thường rỗng → `bank_code` rỗng) |
| return_url VNPay | `<origin>/xe-khach/thanh-toan?...` (không encode) | `http://mybus.vn`, WebView + `gatewayOutcomeOf` (24/cancel=true = huỷ) |
| update-booking body | `{method_payment}` | + `token, merchant_code, id_booking, language`; giá trị `method_payment` = type (giống web) |
| Đồng hồ | `created_at+10'` (khi `method_payment_type===0`), modal hết giờ | đếm theo `expire_time` giữ chỗ |
| Danh sách vé | 3 tab 1/2/3, `booking-status[0]=` | 2 tab: `[1]` / `[2,3]`, `page_size=10, language` |
| Huỷ | cancel-booking `type:0` (chỉ đơn >1 vé), cancel-seat từng vé, note rỗng trừ reason 1 | chỉ cancel-booking, không `type`, note mặc định = tên lý do |
| Hoá đơn / TCO / dịch vụ bổ sung | download-bill, huỷ phòng chờ/trung chuyển, cap-nhat-dich-vu | không có |
| Đăng nhập | get-otp + reCAPTCHA, `channel:1`, verify trước → register kèm `otp` | get-otp-new + signature, `channel:2`, register trước (gửi OTP) rồi verify |
| Sau login | customer/customers + customer/definition + v4/definition | api/user + definition + customer/customers |
| Hồ sơ | PUT `update-profile` (đủ trường loyalty) hoặc POST `customer/customers` (đăng ký KHTT) | PUT `api/customer/customers {name,email,address}` |
| Logout / 401 | local; 401 chỉ ở /70b → về `/` | local; 401 ở refreshProfile → logout |
| Thông báo/FCM | không | có |

## Chưa rõ
1. HTTP code thực tế khi `get-otp` trả `is_new` (nhánh "2xx khác 200") — chưa quan sát; có thể là nhánh chết.
2. Ý nghĩa `booking_info.status` ngoài 3 (=huỷ) và `ticket.status.type` 1/2/3/5/11; `payment.type` 1 vs khác — suy từ code, chưa có bảng enum.
3. Backend có kiểm hạn "trước 3 giờ" ở cancel-seat/cancel-booking và mã lỗi 400 vs 422 cụ thể.
4. Định dạng `created_at` của booking detail (code parse "DD-MM-YYYY HH:mm:ss"; fixture có "DD-MM-YYYY HH:mm") → guard 598s có thể lệch nếu thiếu giây.
5. `api/customer/definition`: body top-level có `titles/provinces/...` (code dùng trực tiếp) hay bọc `data` — chưa đối chiếu response live.
6. reason `id===1` có đúng là "Khác" trong `api/list-reason` hiện tại không (fixture đầu danh sách là id 11, 9…).
7. Phone có bị gửi trong update-profile không (dựa vào hành vi rc-field-form bỏ field không có Form.Item — suy luận).
8. `route.id` 10043/15725 (TK MB Huế cứng) còn hiệu lực không; nên lấy hoàn toàn từ `info-payments` type 2.
9. Nguồn live của call `api/user` đã thấy [L] — bundle không gọi; có thể do công cụ khác/trang khác.
