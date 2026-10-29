# Câu hỏi gửi IT Hải Vân trước khi lên haivan.com

Web mới thay web cũ trên haivan.com, giữ nguyên hợp đồng API (apigw.haivan.com, cms.haivan.com). Khác biệt chính: các lệnh cần đăng nhập (verify-otp, register, giữ chỗ, đặt vé, huỷ, hồ sơ) đi từ **IP máy chủ web** thay vì IP trình duyệt của khách. Lý do: token không còn nằm trong localStorage.

1. **Giới hạn tần suất của apigw** cho `get-otp`, `verify-otp`, `register`, `hold-booking`, `bookings`: tính theo IP hay theo user?
   - Có whitelist được IP VPS của web (sẽ gửi khi có) hoặc nâng ngưỡng không?
   - apigw có tin `X-Forwarded-For` từ một IP tin cậy không?
2. **reCAPTCHA (key web):** danh sách domain đã có `haivan.com` và `www.haivan.com` chưa? Thêm được `staging.haivan.com` không?
3. **`GET api/bookings/{code}`** có chỉ trả đơn của chủ token không?
4. **CORS apigw/cms:** đề nghị giữ `Access-Control-Allow-Origin` cho haivan.com và cho phép header `Domain`. Trình duyệt vẫn gọi thẳng `places`, `el/trips`, `trips/{id}`, CMS.
5. **VNPay/PayOS:** có callback (IPN/return) nào trỏ vào chính haivan.com thay vì apigw không? Return URL đã đăng ký là gì? Web mới giữ `https://haivan.com/xe-khach/thanh-toan?...`.
6. **Email giao dịch** nào có link về haivan.com? Web mới giữ `/email/verify?expires&hash&id&signature`.
7. **Theo dõi xe:** có endpoint HTTP đọc-only hoặc tài khoản MQTT/WSS giới hạn quyền để chạy relay phía server không? Bundle web cũ để lộ URL broker kèm user/pass, web mới không dùng lại.
8. App iOS/Android có dùng `haivan.com/.well-known/*` (universal links / app links) không? Hiện web cũ trả 404.
9. DNS và hosting haivan.com do ai giữ? Ngày chuyển, ai đổi được bản ghi A/CNAME? Cần export zone (MX/SPF/DKIM/TXT) và hạ TTL 300 trước một tuần.
