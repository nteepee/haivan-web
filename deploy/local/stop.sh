#!/usr/bin/env bash
# Dừng stack local do start-next.sh + compose dựng (không đụng container khác).
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$ROOT/deploy/local/next.pid"
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then kill "$(cat "$PID_FILE")" && echo "Đã dừng Next"; fi
rm -f "$PID_FILE"
docker compose -f "$ROOT/deploy/local/compose.yaml" down
