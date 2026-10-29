# Đặc tả luồng đặt vé (nguồn sự thật cho bản dựng lại)

Ràng buộc: luồng đặt vé **giống web haivan.com hiện tại** (bước, API, body, điều kiện, thông báo). Ngày lập: 2026-10-28.

## Nguồn bằng chứng
| Mã | Nguồn | Độ tin |
|---|---|---|
| [L] | `booking-flow/00-live-capture-261028.md`: chạy thật trên haivan.com (anh duyệt): đăng nhập OTP, giữ chỗ, xác nhận, đặt vé, trang thanh toán, huỷ vé, đăng xuất | Quan sát |
| [B1] | `booking-flow/01-search-seat-hold.md`: REA bundle: tìm chuyến, sơ đồ ghế, giữ chỗ | Đọc tĩnh, có offset |
| [B2] | `booking-flow/02-confirm-booking.md`: REA bundle: trang xác nhận, khuyến mãi, combo, trung chuyển, `api/bookings` | Đọc tĩnh |
| [B3] | `booking-flow/03-payment-account.md`: REA bundle: thanh toán, thành công, chuyến đi của tôi, hồ sơ, đăng nhập/đăng xuất | Đọc tĩnh |
| [A] | REA Android (`/Users/phuc/Documents/REA Android/plans/261026-1920-production-flow-parity/plan.md`, fixtures): chạy thật 2026-10-27 | Quan sát (kênh app) |
| [R] | `plans/reports/researcher-261028-*.md` | Tổng hợp |
REA Evidence (phiên phân tích): `ev_7c5055511315c0ca98a01fe16b6741e60fa3b03555446a2d6ff7c1d3e8417d8c` (9 chunk đặt vé).

## Luồng (thứ tự bước)
1. **Trang chủ / trang tuyến** `/xe-khach/[start]/[end]`: SSR gọi CMS `route-listing?route=<start>/<end>` → `start_place/end_place {name,lat,lng}` [L]. Form tìm: điểm đi/đến (`api/places?type=0|1`, gõ >3 ký tự → `api/maps/places` + `detail`), ngày (hôm nay → +4 tháng), số người ≥1 [B1].
2. **Tìm chuyến** `/xe-khach/tim-chuyen?from=<tên>,<lat>,<lng>&to=…&date=DD-MM-YYYY&numberGuest=N[&type]` → `GET api/el/trips?from_location=lat,lng&to_location=lat,lng&numberGuest&date=YYYY-MM-DD&sort_by=time&sort_mode=asc&type` + "Xem thêm" theo `meta` [L][B1].
3. **Sơ đồ ghế** (bấm mũi tên thẻ chuyến): song song `api/trips/{id}?departure_id&destination_id&merchant_code&numberGuest` + `api/el/trip_detail?trip_id&merchant_code`; tối đa 9 ghế; chỉ ghế `is_empty`; combo: số ghế = numberGuest; `is_locked` chặn giữ chỗ [L][B1].
4. **Giữ chỗ** "Tiếp tục": chưa đăng nhập → modal đăng nhập (xong phải bấm lại "Tiếp tục"); `POST api/hold-booking {trip_id, seats:[object ghế + is_select:true], merchant_code, channel:1, aff?, utm_source?, aff_sid?}` → `{message, expire_time "DD-MM-YYYY HH:mm:ss" (+10 phút), order_code, tickets[{id,code}]}` → `/xe-khach/xac-nhan` [L][B1]. Lỗi → toast `message` (ví dụ giới hạn 2 đơn chưa thanh toán) [L].
5. **Xác nhận** `/xe-khach/xac-nhan`: tự gọi `v4/get-bonus-service`, `customer/customers`, `v4/get-price-transit`, `promotion/get-promotions`; form tên/SĐT/email/ghi chú; dịch vụ đón/trả tận nhà (merchant 02/16/17); hoá đơn; khuyến mãi & đổi điểm; đồng hồ theo `expire_time` [L][B2].
6. **Đặt vé** `POST api/bookings {pick_up, drop_off, trip{trip_id,departure_id,destination_id}, transit{departure,destination}, seats:[{id, code?=mã KM, is_reward}] (sort id), order_code, merchant_code, note, is_combo, if_customer?, invoice?}` → 200 `data{code, price, surcharge_price, tickets[…], status, …}`; sau đó `POST api/v4/hold-transit` (không chờ); tổng 0 → `/xe-khach/thanh-toan/thanh-cong?booking_code`, ngược lại → `/xe-khach/thanh-toan?booking_code&merchant_code&trip_id` [L][B2].
7. **Thanh toán**: `info-payments` (mảng; ẩn `is_locked`), `info-payment-block`, `bookings/{code}`; VNPay QR (type 5, `bank_code=VNPAYQR`), ATM/thẻ quốc tế (type 1 + chọn ngân hàng), PayOS (type 6 → `data.checkoutUrl`), tiền mặt/chuyển khoản → `POST update-booking/{code}?merchant_code {method_payment}`; quá 10 phút từ `created_at` → modal hết giờ; trả về `vnp_ResponseCode=00` → thành công [L][B3][R].
8. **Thành công**: `bookings/{code}` sau 1,5 s; `payment.type` quyết định đã/chưa thanh toán; QR mã vé [B3].
9. **Chuyến đi của tôi**: tab `booking-status[0]=1|2|3`; huỷ từng vé `POST api/cancel-seat {order_code, seat_code, merchant_code, reason_cancel_id, reason_cancel_note}`; huỷ cả đơn `cancel-booking {…, type:0}` (đơn >1 vé); lý do `api/list-reason` (`reason_vi`); tải hoá đơn PDF; "Thanh toán" → trang thanh toán [L][B3].
10. **Đăng nhập**: `GET api/get-otp?phone=&captcha=<reCAPTCHA v2>&channel=1` → `{phone,email,expire_time,install_app,is_new}`; `POST api/verify-otp {phone,otp,channel:1}` → `{access_token, token_type:"Bearer", expires_in, code, status}`; không token → form đăng ký `api/register {email,phone,otp,name}`. **Đăng xuất**: không gọi API, xoá store [L][B3].

## Header
`Accept: application/json`, `Domain: haivan.com`, `Authorization: Bearer <token>` khi đã đăng nhập, `Content-Type: application/json` cho POST. Không gửi `PartnerId` (khác app) [L].

## Khác với app Android (tóm tắt)
OTP (`get-otp`+captcha, channel 1 vs `get-otp-new`+signature, channel 2); hold body (web không có token/phone/language); booking seats gọn `{id,code,is_reward}`; web có huỷ từng vé, tải hoá đơn, thẻ quốc tế, dịch vụ đón/trả tận nhà, combo; `return_url` về chính trang web (app: `mybus.vn`); app có thông báo + FCM, web không. Chi tiết: mục "Khác biệt" trong [B1][B2][B3].

## Lỗi/khác thường của web gốc (cần quyết khi dựng lại)
- Sau đăng nhập mất header `Domain` tới khi tải lại; đăng nhập xong không tự giữ chỗ lại [B1][B3].
- `api/user-info` 404 nhưng vẫn được gọi ở một số nơi [L]; `api/logout` không bao giờ gọi → token không bị thu hồi [L].
- Số "0" lạc dưới giá ghế khi phụ thu 0 [L]; `is_combo` chỉ xét ghế id nhỏ nhất [B2]; khoá i18n `login_form.msg.error_input` thiếu [B3]; `onRefreshList` không tồn tại khi huỷ dịch vụ trung chuyển [B3].
- Query tìm chuyến không mã hoá URL, địa chỉ cắt ở dấu phẩy đầu tiên [B1].

## Chưa xác minh live
`api/payment/vnpay|payos` (tạo link), `update-booking`, `cancel-booking` nhiều vé, `check-promotions`, đổi điểm, dịch vụ đón/trả tận nhà có phí, hành vi `return_url` trên domain mới.
