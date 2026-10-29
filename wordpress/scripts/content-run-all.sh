#!/usr/bin/env bash
# Chạy toàn bộ script sửa nội dung (content-*.php) theo đúng thứ tự, dùng được cho local và production sau khi DB đã chuyển.
#
#   cd wordpress
#   ./scripts/content-run-all.sh                  # chạy thử: in bảng tóm tắt từng bước, không ghi
#   HV_APPLY=1 ./scripts/content-run-all.sh       # ghi thật (sao lưu DB trước: xem dưới)
#   HV_REPORT=1 ./scripts/content-run-all.sh      # thêm danh sách cần người quyết (số liệu mâu thuẫn, link chết/mồ côi, bài lặp)
#
# Thứ tự có chủ ý: chuẩn hoá Unicode/chính tả trước (các luật sau so khớp chuỗi NFC), rồi thông tin thương hiệu, thanh toán/email (policy), bỏ khối lặp, gộp bài trùng (merge, cần 301 trong theme),
# dựng link nội bộ, cuối cùng chèn hộp bắc cầu (thay khối gợi ý giữa bài của đúng các bài đó).
# Mỗi script idempotent: chạy lần hai phải báo 0 bài đổi. Ghi thẳng DB (không đổi post_modified, không tạo bản sửa đổi).
# Bài sau khi bị script ghi khác dấu nhập của importer nên import-cms.php coi là "MKT đã sửa" và không ghi đè.
#
# Sao lưu trước khi ghi (MariaDB trong compose):
#   docker compose exec -T db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' > data/backups/pre-content-$(date +%y%m%d-%H%M).sql
# (data/ nằm trong .gitignore của wordpress/.) Production: dùng công cụ sao lưu của máy chủ, chạy wpcli với đúng biến DB.
# Dùng DB khác (thử trên bản sao): thêm  -e WORDPRESS_DB_NAME=<tên>  vào docker compose run, hoặc đặt HV_DB_NAME.
# Sau khi ghi: xoá cache trang của nginx (fastcgi_cache, s-maxage=300) hoặc đợi hết hạn, nếu không trang cũ còn hiện tới 5 phút.
set -euo pipefail
cd "$(dirname "$0")/.."

STEPS=(content-typos content-facts content-policy content-dedupe content-merge content-relink content-bridge)
ENV_ARGS=()
for v in HV_APPLY HV_REPORT HV_SAMPLE HV_IDS HV_RELINK_REBUILD HV_BRIDGE_REBUILD HV_RELINK_CSV; do
  if [ -n "${!v:-}" ]; then ENV_ARGS+=(-e "$v=${!v}"); fi
done
if [ -n "${HV_DB_NAME:-}" ]; then ENV_ARGS+=(-e "WORDPRESS_DB_NAME=$HV_DB_NAME"); fi

for s in "${STEPS[@]}"; do
  echo ">>> $s"
  docker compose --profile tools run --rm -T "${ENV_ARGS[@]}" wpcli eval-file "/scripts/$s.php"
done
