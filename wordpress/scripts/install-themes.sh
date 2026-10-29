#!/usr/bin/env bash
# Sao chép Flatsome (theme thương mại, license của chủ dự án) từ bản sẵn có vào
# wp-content/themes/flatsome (đã gitignore). Không bao giờ commit thư mục này.
# Nguồn chỉ đọc; không chép file nào khác (hvb-direct-booking.php, token...).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f "$ROOT/.env" ] && set -a && . "$ROOT/.env" && set +a
SRC="${FLATSOME_SRC:-/Users/phuc/Documents/HV_QR_BOOKING/deploy/local/wp-content/themes/flatsome}"
DEST="$ROOT/wp-content/themes/flatsome"

if [ ! -f "$SRC/style.css" ] || ! grep -q "^Theme Name:[[:space:]]*Flatsome" "$SRC/style.css"; then
  echo "KHÔNG tìm thấy Flatsome tại: $SRC" >&2
  echo "Đặt FLATSOME_SRC trong wordpress/.env, hoặc giải nén flatsome.zip vào $DEST" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete --exclude '.DS_Store' "$SRC/" "$DEST/"
echo "Đã chép Flatsome $(grep -m1 '^Version:' "$DEST/style.css" | sed 's/Version:[[:space:]]*//') -> $DEST"
