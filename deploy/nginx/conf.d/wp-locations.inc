# Theo wordpress/nginx-snippet.conf. Quản trị chỉ mở cho IP nội bộ (local: dải docker).
# PRODUCTION: thay các dải private bằng IP văn phòng/VPN cụ thể (sau proxy/CDN mọi người đều "nội bộ"),
# hoặc tách host admin.haivan.com + Two Factor.
location = /wp-login.php {
    allow 127.0.0.1; allow ::1; allow 10.0.0.0/8; allow 172.16.0.0/12; allow 192.168.0.0/16;
    deny all;
    include /etc/nginx/hv-wp-proxy.conf;
    proxy_pass http://hv_wordpress;
}
# admin-ajax/admin-post phải mở cho khách: đặt NGOÀI /wp-admin/ (location lồng nhau thừa kế deny của cha).
location = /wp-admin/admin-ajax.php { include /etc/nginx/hv-wp-proxy.conf; proxy_pass http://hv_wordpress; }
location = /wp-admin/admin-post.php { include /etc/nginx/hv-wp-proxy.conf; proxy_pass http://hv_wordpress; }
location /wp-admin/ {
    allow 127.0.0.1; allow ::1; allow 10.0.0.0/8; allow 172.16.0.0/12; allow 192.168.0.0/16;
    deny all;
    include /etc/nginx/hv-wp-proxy.conf;
    proxy_pass http://hv_wordpress;
}
location = /xmlrpc.php { return 403; }
# REST: không cache ở nginx (layout cho Next đã có Cache-Control + cache của Next; REST có thể mang Authorization).
location ^~ /wp-json/ { include /etc/nginx/hv-wp-proxy.conf; proxy_pass http://hv_wordpress; }
# Tài nguyên tĩnh của theme/plugin/uploads: cache trình duyệt 30 ngày (URL có ?ver= đổi khi cập nhật). Chỉ gắn header cho
# 2xx/3xx (không `always`) nên 404 do WP trả không bị cache 30 ngày. Không đụng /wp-admin/ (đã có allow/deny riêng).
location ~* ^/(?:wp-content|wp-includes)/.+\.(?:css|js|woff2?|ttf|svg|png|jpe?g|gif|webp|avif|ico)$ {
    include /etc/nginx/hv-wp-proxy.conf;
    proxy_hide_header Cache-Control;
    proxy_hide_header Expires;
    add_header Cache-Control "public, max-age=2592000";
    include /etc/nginx/hv-security-headers.conf;
    proxy_pass http://hv_wordpress;
}
# HTML WordPress ẩn danh: page cache 5 phút (hv-wp-cache.conf); đăng nhập/POST/query lạ bỏ qua cache.
location / {
    include /etc/nginx/hv-wp-proxy.conf;
    include /etc/nginx/hv-wp-cache.conf;
    proxy_pass http://hv_wordpress;
}
