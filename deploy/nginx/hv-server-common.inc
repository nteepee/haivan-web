# Phần dùng chung của khối server haivan.com (cổng 80 local và cổng 443 production include file này).
# Đặt trong server { }. Header bảo mật mặc định cho mọi location không có add_header riêng:
include /etc/nginx/hv-security-headers.conf;

# Host gửi xuống WP/Next là $http_host (giữ cổng khi chạy local) → chỉ nhận đúng các host đã khai (map trong nginx.conf),
# kể cả khi request line là URL tuyệt đối với Host khác.
if ($hv_host_ok = 0) { return 444; }

# --- Next.js: đặt vé, tài khoản, BFF, tài nguyên (bản vi và /en) ---
# Trang tài khoản: không cho cache dùng chung (Next gửi s-maxage cho vỏ HTML tĩnh).
location ~ ^/(en/)?tai-khoan(/|$) {
    proxy_hide_header Cache-Control;
    add_header Cache-Control "private, no-store" always;
    include /etc/nginx/hv-security-headers.conf;
    include /etc/nginx/hv-next-proxy.conf;
    proxy_pass http://hv_next;
}
location ~ ^/(en/)?(xe-khach|partner|tracking|email)(/|$) {
    include /etc/nginx/hv-next-proxy.conf;
    proxy_pass http://hv_next;
}
# Ảnh tĩnh của web cũ giữ nguyên URL /assets/** (đã được index), phục vụ từ public/ của Next.
location ^~ /assets/ {
    add_header Cache-Control "public, max-age=604800, immutable";
    include /etc/nginx/hv-security-headers.conf;
    include /etc/nginx/hv-next-proxy.conf;
    proxy_pass http://hv_next;
}
location ^~ /_next/ {
    include /etc/nginx/hv-next-proxy.conf;
    proxy_pass http://hv_next;
}
# Exact match (ưu tiên hơn mọi prefix): đăng nhập/đăng ký giới hạn chặt theo IP; app còn giới hạn theo SĐT.
location = /api/hv/auth/verify {
    limit_req zone=hv_auth burst=5 nodelay;
    include /etc/nginx/hv-next-api.conf;
}
location = /api/hv/auth/register {
    limit_req zone=hv_auth burst=5 nodelay;
    include /etc/nginx/hv-next-api.conf;
}
# Gọi ở mọi trang (WP + Next), chỉ đọc cookie, không gọi apigw → không giới hạn (tránh khoá người dùng sau NAT nhà mạng).
location = /api/hv/auth/session {
    include /etc/nginx/hv-next-api.conf;
}
location ^~ /api/hv/ {
    limit_req zone=hv_gw burst=60 nodelay;
    include /etc/nginx/hv-next-api.conf;
}
location @hv_429 {
    default_type application/json;
    add_header Cache-Control "private, no-store" always;
    include /etc/nginx/hv-security-headers.conf;
    return 429 '{"message":"Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút"}';
}

# --- WordPress: mọi đường dẫn còn lại ---
include /etc/nginx/conf.d/wp-locations.inc;
