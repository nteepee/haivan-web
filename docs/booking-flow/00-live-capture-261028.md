# Ghi nhận chạy thật trên haivan.com (2026-10-28, anh duyệt)

Trình duyệt tích hợp, tài khoản của anh đã đăng nhập sẵn (token `Bearer`, redux-persist `localStorage["persist:primary"].user_login`). Ghi XHR bằng hook trong trang; đã che SĐT, tên, token.

## Header mọi request apigw
`Accept: application/json`, `Domain: haivan.com`, `Authorization: Bearer <token>` (khi đã đăng nhập), thêm `Content-Type: application/json` khi POST. Không có `PartnerId`.

## Tìm chuyến (URL trang)
`/xe-khach/tim-chuyen?from=<tên>,<lat>,<lng>&to=<tên>,<lat>,<lng>&date=DD-MM-YYYY&numberGuest=1`
→ `GET api/el/trips?from_location=10.7753882,106.702825&to_location=10.3391989,107.0710401&numberGuest=1&date=2026-11-01&sort_by=time&sort_mode=asc&type=0`
Trang cũng gọi `api/places?type=0`, `api/places?type=1`; khi đã đăng nhập thêm `api/customer/customers`, `api/customer/definition`, `api/v4/definition`.

## Mở sơ đồ ghế (bấm mũi tên trên thẻ chuyến)
Song song: `GET api/trips/41389806?departure_id=95&destination_id=12&merchant_code=02&numberGuest=1` và `GET api/el/trip_detail?trip_id=41389806&merchant_code=02` (→ `journey[]` có `address, location{lat,lng}, place_id, place_name, place_time`).
UI: chú thích "Chỗ trống / Đang đặt / Đã đặt"; ô ghế hiện tên + giá "250.000 VNĐ"; ghế chọn viền/đáy vàng; nút "Tiếp tục".

## Giữ chỗ (bấm "Tiếp tục")
`POST api/hold-booking`
```json
{"trip_id":41389806,
 "seats":[{"id":503528630,"ticket_code":null,"name":"11","price":250000,"priceNy":230000,"is_empty":true,"color":"#86D5BE","seat_rank":"Hạng B","seat_type":0,"customer":null,"order":null,"ticket_status":null,"is_edit":0,"is_payment":null,"expire_time":null,"is_select":true}],
 "merchant_code":"02","channel":1}
```
- Ghế gửi nguyên object từ `api/trips/{id}` + `is_select: true`. `aff` không có thì bị JSON bỏ đi (undefined); không có `utm_source/aff_sid`.
- Kết quả lần này: **HTTP 400** `{"message":"Bạn chỉ được đặt tối đa 2 đơn hàng với trạng thái chưa thanh toán. Xin hãy hoàn tất thanh toán và xác nhận với tổng đài hoặc hủy đơn hàng chưa thanh toán để tiếp tục đặt vé. xin cám ơn."}` → web hiện toast lỗi `message`, ở lại trang. Không tạo đơn.

## Dữ liệu đọc khi đã đăng nhập (chỉ cấu trúc)
- `api/bookings?booking-status[0]=1` (sắp đi) / `=2` (lịch sử): `data[]{merchant{code,hotline,id,name,partner_id}, booking{VNPAY_status_booking, VNPAY_status_booking_text, VNPAY_transaction_code, booking_info{code,status,status_text,created_at,method_payment,total_money,num_ticket,…}, booking_rating_trip[], booking_ticket[{agency,is_cancel,is_rating,url,trip_id,code,reward_points,base_money,discount*,money,channel_code,channel_name,start_date,start_datetime,ticket_no,status,status_text,payment_*,source,order_vnpay_id,customer,direction,from,to,product,route,cancel_note,…}], did_time}, booking_ticket:null}` + `links`, `meta` (Laravel paginator). Khớp fixture Android `my_bookings.json`.
- `booking_ticket[].is_cancel`: web gốc KHÔNG đọc trường này (0 tham chiếu trong bundle); fixture có `true` trên vé đã huỷ → nghĩa nghiêng về "đã huỷ", không phải "được huỷ". Web mới không dùng để ẩn nút huỷ (backend tự từ chối huỷ muộn, như web gốc); đơn kênh `RESELLER`/`AGENCYHVHO` cũng hiện trong danh sách của khách.
- `api/user` → `{id,phone,email,language,device_token,install_app,created_at,updated_at,deactive,deleted_at}`.
- `api/user-info` → **404** (web gốc vẫn gọi: endpoint chết).
- `api/customer/customers` → `data{…, account{balance,given,transactions[]}, rank{rank_code,rank_icon,next_rank{…}}, invoice_info, …}`.
- `api/customer/definition` → `{titles[], jobs[], travel_purposes[], provinces[], districts[], rank_evaluators[]}` (danh mục cho form hồ sơ).
- `api/v4/definition` → `data{car_company[], vehicle_type[]}`.

## Đăng xuất (menu "Tài khoản" → "Đăng xuất")
- Menu là antd Dropdown mở khi hover; mục "Đăng xuất" có key `/`.
- **Không gọi API nào** (không có `api/logout` dù service có hàm `logout()`): chỉ set redux `user_login = null`, `user_info = null` (redux-persist ghi lại `persist:primary`), đặt lại axios headers `Authorization: ""`, rồi `router.push("/")`. Trang chủ tải lại `api/places?type=0/1`.
- Hệ quả: JWT cũ vẫn còn hạn phía server (claim `exp` rất xa, `expires_in` 46656000000). Giống app Android (đăng xuất không gọi mạng).
- Route `/tai-khoan/dang-xuat` có trong manifest nhưng menu không dùng.

## Đăng nhập (số thứ hai; anh tự tick reCAPTCHA và nhập OTP)
1. Header "Đăng nhập" → modal "Vui lòng nhập vào số điện thoại hoặc email", reCAPTCHA v2 checkbox, nút "Tiếp tục".
2. `GET api/get-otp?phone=<sđt>&captcha=<token reCAPTCHA>&channel=1` (header `Accept`, `Domain`; không Authorization) → 200 `{phone, email:null, expire_time:"28-10-2026 14:30:00", install_app, is_new:0}` (lần này không trả `otp`).
3. Nhập 6 số → `POST api/verify-otp` body `{phone, otp, channel:1}` → 200 `{code:200, status:"success", access_token, token_type:"Bearer", expires_in:46656000000}`.
4. Ngay sau đó: `api/customer/customers`, `api/customer/definition`, `api/v4/definition` với `Authorization: Bearer …` nhưng **không còn header `Domain`** (axios headers bị thay toàn bộ, tới khi tải lại trang).

## Vòng đầy đủ với số thứ hai (không có đơn treo), 14:28–14:31
Chuyến 41389806 (Quận 1 → TP Vũng Tàu, 01/11 05:45, merchant 02, Luxury), ghế 11, 250.000đ. Đơn `B02SAMPLE00001` đã huỷ, không mở cổng thanh toán.

1. **Giữ chỗ** `POST api/hold-booking` (body như trên) → 200 `{"message":"Giữ chỗ thành công!","expire_time":"28-10-2026 14:38:29","order_code":"B02SAMPLE00001","tickets":[{"id":503528630,"code":"V02SAMPLE000001"}]}` → `router.push("/xe-khach/xac-nhan")`. Hạn giữ = 10 phút.
2. **Trang xác nhận** tự gọi:
   - `GET api/v4/get-bonus-service?merchant_code=02` → mảng `[{dvbs_id:1,dvbs_code:"TCDON",dvbs_name:"Trung chuyển đón",…},{dvbs_id:2,dvbs_code:"TCTRA",dvbs_name:"Trung chuyển trả",…}]`.
   - `GET api/customer/customers`.
   - `POST api/v4/get-price-transit` body `{order_code, merchant_code, seats:[{id,code,ticket_code,phone,name,pick_up,pick_up_lat,pick_up_lng,drop_off,drop_off_lat,drop_off_lng,number,quantity,date}], services:[{…dvbs, check:false, seat:1, seatCheck:1, address:[{number,address}], title:"Đón tận nhà"|"Trả tận nhà", transit_location, transit_lat, transit_lng}], trip_id}` → mảng `[{dvbs_id,dvbs_code,dvbs_name,dvbs_description,dvbs_check_discount,dvbs_text_discount,dvbs_tickets:[{…,price:0}]}]`.
   - `GET api/promotion/get-promotions?merchant_code=02&route=VTA-TSN&product=LUXURY&channel=1&direction=2&departure_id=95&destination_id=12&departure_time=2026-11-01 05:30:00&price=200000&channel_code=WEBHAIVAN` (phản hồi rỗng).
   UI: "Thông tin của bạn" (Họ và tên, Số điện thoại điền sẵn; Thư điện tử; Ghi chú), "Thông tin dịch vụ bổ sung" (Đón tận nhà / Trả tận nhà - 0/1 khách + nút Cập nhật), "Thông tin xuất hóa đơn" (checkbox), "Chi tiết giá" (Ghế 11, Phụ thu 0đ, Tổng), đồng hồ "Thời gian còn lại để xác nhận" mm:ss, "Kiểm tra thông tin đặt vé" (lộ trình), "Khuyến mãi và đổi điểm", nút "Tiếp tục".
3. **Đặt vé** `POST api/bookings`
   ```json
   {"pick_up":{"address":"Quận 1","coordinates":{"lat":10.7753882,"lng":106.702825}},
    "drop_off":{"address":"Vũng Tàu","coordinates":{"lat":10.3391989,"lng":107.0710401}},
    "trip":{"trip_id":41389806,"departure_id":95,"destination_id":12},
    "transit":{"departure":true,"destination":false},
    "seats":[{"id":503528630,"is_reward":false}],
    "order_code":"B02SAMPLE00001","merchant_code":"02","note":"","is_combo":0,
    "if_customer":{"email":null,"phone":"<sđt>","name":"<tên>"}}
   ```
   → 200 `data{id,code,status{type:1,type_name:"Chưa xếp chỗ"},price:250000,surcharge_price:0,customer{…},tickets[{id,code,price,price_discount,name,number,is_payment,is_payment_text,customer,trip{id,product,node{code,direction,route},date,time,departure_time,destination_time,…},departure,destination,pick_up,drop_off,transit,payment{type:0,type_name:"Chưa thanh toán"},status{type:2,type_name:"Cập nhật"},…}]}`.
   Ngay sau đó (không chờ): `POST api/v4/hold-transit` `{order_code,merchant_code,pick_up,pick_up_lat,pick_up_lng,drop_off,drop_off_lat,drop_off_lng,services:[]}` → `{data:{ord_id,ord_ma,ord_phone,ord_ten_khach_hang,transit:[]}}`. Chuyển tới `/xe-khach/thanh-toan?booking_code=B02SAMPLE00001&merchant_code=02&trip_id=41389806`.
4. **Trang thanh toán**: `GET api/info-payments?merchant_code=02&trip_id=41389806&booking=B02SAMPLE00001` → mảng 5 phần tử (type 5 VNPay QR, 1 VNPay online, 2 chuyển khoản `is_locked:true`, 6 PayOS, 3 tiền mặt khi lên xe); `GET api/info-payment-block?merchant_code=02` → `{data:[],status:false}`; `GET api/bookings/{code}?merchant_code=02`.
   UI "Lựa chọn thanh toán": VNPAY-QR · PayOS · thẻ ATM nội địa / VNPAY-QR · thẻ quốc tế · Thanh toán tại nhà xe (kèm "Mã giữ chỗ"). Chuyển khoản bị ẩn (locked). Cột phải: nút "Thanh toán", đồng hồ, giá ghế, **số "0" lạc** (lỗi phụ thu), tổng, thẻ chuyến + mã vé + số ghế.
5. **Chuyến đi của tôi** → mở đơn (`GET api/bookings/{code}?merchant_code`) → thẻ vé có QR, nút **"Huỷ vé"** theo từng vé; nút "Thông tin dịch vụ bổ sung". Hộp "Bạn có chắc chắn muốn huỷ vé?" với 6 lý do từ `api/list-reason` (radio) + ô ghi chú + "Đồng ý".
6. **Huỷ vé** `POST api/cancel-seat` `{"order_code":"B02SAMPLE00001","seat_code":"V02SAMPLE000001","merchant_code":"02","reason_cancel_id":3,"reason_cancel_note":""}` → 200 `data{…,status{type:3,type_name:"Xử lý xong"},price:0,…}`; danh sách "sắp tới" trống sau khi tải lại.

Chưa chạy thật (sẽ tạo link/đổi trạng thái thanh toán): `api/payment/vnpay`, `api/payment/payos`, `update-booking`, `cancel-booking` (đơn nhiều vé), khuyến mãi/đổi điểm, dịch vụ đón/trả tận nhà.
