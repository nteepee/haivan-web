#!/usr/bin/env bash
# Build + chạy Next standalone cho stack local (127.0.0.1:3010). PID lưu ở deploy/local/next.pid.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/apps/booking"
PID_FILE="$ROOT/deploy/local/next.pid"
LOG="$ROOT/deploy/local/next.log"
PORT="${PORT:-3010}"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Đang dừng Next cũ (PID $(cat "$PID_FILE"))"; kill "$(cat "$PID_FILE")"; sleep 1
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then echo "Cổng $PORT đang bị tiến trình khác dùng" >&2; exit 1; fi

# Build riêng vào .next-local (không đụng .next của dev/CI).
export NEXT_DIST_DIR=.next-local
[[ "${SKIP_BUILD:-0}" == "1" ]] || pnpm -C "$APP" build
STANDALONE="$APP/.next-local/standalone/apps/booking"
rm -rf "$STANDALONE/.next-local/static" "$STANDALONE/public"
cp -R "$APP/.next-local/static" "$STANDALONE/.next-local/static"
[[ -d "$APP/public" ]] && cp -R "$APP/public" "$STANDALONE/public"

set -a; source "$APP/.env.local"; set +a
cd "$STANDALONE"
PORT="$PORT" HOSTNAME=127.0.0.1 NODE_ENV=production nohup node server.js >"$LOG" 2>&1 &
echo $! >"$PID_FILE"
echo "Next standalone PID $(cat "$PID_FILE") trên http://127.0.0.1:$PORT (log: $LOG)"
