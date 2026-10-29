#!/usr/bin/env bash
# Cài đặt WordPress lần đầu (idempotent, chạy lại an toàn):
#   core install, ngôn ngữ vi, permalink /%postname% (không "/" cuối), Polylang + Rank Math + Two Factor,
#   child theme, trang với slug cũ, menu mẫu, tuyến phổ biến mẫu.
# Chạy lại không đặt lại thứ MKT có thể đã sửa (tên site, module Rank Math, trang chủ, menu đang gán, múi giờ/định dạng,
# tuyến phổ biến): các bước đó chỉ chạy ở lần cài đầu (option hv_site_configured). Ép cấu hình lại: HV_RECONFIGURE=1.
# blog_public: noindex chỉ khi WP_ENV_TYPE là local/development/staging; thiếu biến = production (cho lập chỉ mục).
# Yêu cầu: docker compose; Flatsome đã có (scripts/install-themes.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
[ -f .env ] && set -a && . ./.env && set +a

WP_URL="${WP_URL:-http://localhost:8089}"
ADMIN_USER="${WP_ADMIN_USER:-hvadmin}"
ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.invalid}"
ADMIN_PASSWORD="${WP_ADMIN_PASSWORD:-}"

# Môi trường: chỉ noindex khi WP_ENV_TYPE đặt RÕ là local/development/staging. Thiếu biến: URL loopback => local
# (máy dev chưa có .env), còn lại => production (cho lập chỉ mục). Xuất ra để docker compose nhận cùng giá trị.
if [ -z "${WP_ENV_TYPE:-}" ]; then
  case "$WP_URL" in
    http://localhost*|http://127.*|http://\[::1\]*) WP_ENV_TYPE=local
      echo "    WP_ENV_TYPE chưa đặt, WP_URL là loopback: dùng local (noindex). Đặt WP_ENV_TYPE trong .env để cố định." ;;
    *) WP_ENV_TYPE=production
      echo "    WP_ENV_TYPE chưa đặt: dùng production (cho lập chỉ mục)." ;;
  esac
fi
export WP_ENV_TYPE

dc() { docker compose "$@"; }
wp() { docker compose --profile tools run --rm -T -e HV_RECONFIGURE="${HV_RECONFIGURE:-0}" wpcli "$@"; }

echo "==> Flatsome"
if [ ! -f wp-content/themes/flatsome/style.css ]; then
  ./scripts/install-themes.sh || {
    echo "Thiếu Flatsome: child theme cần theme cha. Xem docs/wordpress.md (đổi dòng Template để dùng theme khác)." >&2
    exit 1
  }
fi

echo "==> Khởi động container"
dc up -d
for i in $(seq 1 60); do
  [ -f data/wp/wp-config.php ] && break
  sleep 1
done
[ -f data/wp/wp-config.php ] || { echo "WordPress chưa sẵn sàng (data/wp/wp-config.php)." >&2; exit 1; }
# Đợi php-fpm + db nhận kết nối.
for i in $(seq 1 60); do
  wp db check >/dev/null 2>&1 && break
  sleep 2
done

echo "==> Cài core"
if ! wp core is-installed >/dev/null 2>&1; then
  if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD="$(openssl rand -hex 16)"
    mkdir -p data
    umask 077
    printf 'user=%s\npassword=%s\n' "$ADMIN_USER" "$ADMIN_PASSWORD" > data/admin-credentials.txt
    echo "    Mật khẩu quản trị được sinh ngẫu nhiên và lưu ở wordpress/data/admin-credentials.txt (gitignore)."
  fi
  wp core install --url="$WP_URL" --title="Hải Vân" --admin_user="$ADMIN_USER" \
    --admin_email="$ADMIN_EMAIL" --admin_password="$ADMIN_PASSWORD" --skip-email
fi

# Lần đầu? (đồng bộ với hvs_is_first_run trong scripts/lib/helpers.php)
FIRST=1
if [ "${HV_RECONFIGURE:-0}" != "1" ]; then
  CONFIGURED="$(wp option get hv_site_configured 2>/dev/null || true)"
  FRONT="$(wp option get page_on_front 2>/dev/null || true)"
  if [ -n "$CONFIGURED" ]; then FIRST=0; fi
  case "$FRONT" in ""|0) ;; *) FIRST=0 ;; esac
fi

echo "==> Ngôn ngữ, múi giờ, permalink"
if [ "$FIRST" = 1 ]; then
  wp language core install vi --activate >/dev/null 2>&1 || echo "    (không tải được gói ngôn ngữ vi, giữ en_US)"
  wp option update timezone_string "Asia/Ho_Chi_Minh" >/dev/null
  wp option update date_format "d/m/Y" >/dev/null
  wp option update time_format "H:i" >/dev/null
  wp option update start_of_week 1 >/dev/null
else
  echo "    (site đã cấu hình: giữ ngôn ngữ/múi giờ/định dạng hiện có)"
fi
# Không "/" cuối: tránh 301 hàng loạt so với URL cũ (cấu trúc URL là hợp đồng, luôn đặt lại).
wp option update permalink_structure "/%postname%" >/dev/null
wp option update category_base "" >/dev/null

echo "==> Plugin (wordpress.org)"
wp plugin install polylang seo-by-rank-math two-factor --activate
wp plugin auto-updates enable --all >/dev/null 2>&1 || true
# Gỡ plugin mẫu không dùng.
wp plugin delete hello akismet >/dev/null 2>&1 || true

echo "==> Theme"
wp theme activate haivan-web-child
for t in twentytwentythree twentytwentyfour; do
  wp theme delete "$t" >/dev/null 2>&1 || true
done

echo "==> Polylang, Rank Math, trang, menu"
wp eval-file /scripts/configure-site.php
wp eval-file /scripts/seed-site.php

echo "==> Flush rewrite"
wp rewrite flush >/dev/null

echo
echo "Xong. Site: $WP_URL   Admin: $WP_URL/wp-admin  (user: $ADMIN_USER)"
echo "Tiếp theo (tuỳ chọn): docker compose --profile tools run --rm -T wpcli eval-file /scripts/import-old-site.php"
echo "SEO (sau khi đã import nội dung, theo thứ tự; chạy lại an toàn): seed-corridors, seed-route-posts, seo-setup, seo-hardening, seed-menus-seo"
