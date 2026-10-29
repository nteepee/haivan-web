#!/usr/bin/env bash
# Kiểm SEO trước/sau go-live bằng curl (chỉ GET/HEAD, không ghi gì):
#   deploy/check-seo-golive.sh https://staging.haivan.com
#   EXPECT_ORIGIN=https://haivan.com deploy/check-seo-golive.sh https://staging.haivan.com   # canonical/sitemap phải trỏ domain thật
#   deploy/check-seo-golive.sh http://localhost:8180     # local: FAIL noindex là đúng (blog_public=0), dùng để thấy script bắt lỗi
# Thoát mã 1 nếu có FAIL. WARN không làm fail.
# Mỗi trang mẫu: HTTP 200 (không redirect), không noindex (meta + X-Robots-Tag), có canonical đúng origin, đúng 1 <h1>.
# Thêm: robots.txt, 2 sitemap, trang tài khoản PHẢI noindex, header bảo mật + Cache-Control của HTML WP; HSTS khi base là https.
set -u

BASE="${1:-}"
if [[ -z "$BASE" || ! "$BASE" =~ ^https?://[^/]+$ ]]; then
  echo "Dùng: $0 <base-url>   (vd. https://staging.haivan.com, không có dấu / cuối)" >&2
  exit 2
fi
EXPECT="${EXPECT_ORIGIN:-$BASE}"
EXPECT="${EXPECT%/}"
UA="Mozilla/5.0 (compatible; hv-seo-golive-check)"
CURL=(curl -sS --max-time 30 -A "$UA")

FAILS=0; WARNS=0
fail() { echo "  FAIL  $*"; FAILS=$((FAILS + 1)); }
warn() { echo "  WARN  $*"; WARNS=$((WARNS + 1)); }
ok()   { echo "  ok    $*"; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# fetch <url> <tên-file>: ghi $TMP/<tên>.body và $TMP/<tên>.hdr, in mã HTTP.
fetch() {
  "${CURL[@]}" -D "$TMP/$2.hdr" -o "$TMP/$2.body" -w '%{http_code}' "$1" 2>"$TMP/$2.err" || echo 000
}
hdr() { grep -i "^$2:" "$TMP/$1.hdr" | tail -1 | sed -E 's/^[^:]+:[[:space:]]*//; s/\r$//'; }
count() { { grep -o -i -E "$1" "$2" || true; } | wc -l | tr -d ' '; }

check_page() { # <đường dẫn> <tên> [expect=index|noindex]
  local path="$1" name="$2" want="${3:-index}" code body robots_tags canon h1
  echo "[$name] $BASE$path"
  code="$(fetch "$BASE$path" "$name")"
  body="$TMP/$name.body"
  if [[ "$code" != "200" ]]; then fail "HTTP $code (cần 200, không redirect)"; return; fi

  robots_tags="$({ grep -o -i -E "<meta[^>]*name=[\"']robots[\"'][^>]*>" "$body" || true; })"
  local xrt; xrt="$(hdr "$name" x-robots-tag)"
  local noindex=0
  if echo "$robots_tags" | grep -qi 'noindex' || echo "$xrt" | grep -qi 'noindex'; then noindex=1; fi
  if [[ "$want" == "index" ]]; then
    [[ $noindex -eq 0 ]] && ok "không noindex" || fail "noindex (meta: ${robots_tags:-—} / X-Robots-Tag: ${xrt:-—})"
  else
    [[ $noindex -eq 1 ]] && ok "noindex như mong đợi" || fail "trang này phải noindex"
    return
  fi

  canon="$({ grep -o -i -E "<link[^>]*rel=[\"']canonical[\"'][^>]*>" "$body" || true; } | head -1 \
    | sed -E "s/.*href=[\"']([^\"']*)[\"'].*/\1/")"
  if [[ -z "$canon" ]]; then fail "thiếu <link rel=canonical>"
  elif [[ "$canon" != "$EXPECT"* ]]; then fail "canonical sai origin: $canon (cần bắt đầu bằng $EXPECT)"
  elif [[ "$canon" == *"?"* ]]; then fail "canonical có query string: $canon"
  else ok "canonical $canon"; fi

  h1="$(count '<h1[ >]' "$body")"
  [[ "$h1" == "1" ]] && ok "1 <h1>" || fail "$h1 thẻ <h1> (cần đúng 1)"
}

# Lấy 1 URL đầu của mỗi sitemap con (trừ sitemap có URL Next) để phủ nhiều template WP.
sample_urls() {
  local idx="$1" limit="$2" child
  { grep -o -E '<loc>[^<]+</loc>' "$idx" || true; } | sed -E 's#</?loc>##g' | head -"$limit" | while read -r child; do
    local path="${child#"$EXPECT"}"; path="${path#"$BASE"}"
    "${CURL[@]}" -o "$TMP/child.xml" "$BASE$path" 2>/dev/null || continue
    { grep -o -E '<loc>[^<]+</loc>' "$TMP/child.xml" || true; } | sed -E 's#</?loc>##g' | awk 'NR==1{f=$0} NR==2{p=$0} END{print (p != "" ? p : f)}'
  done
}

echo "== Base $BASE | origin kỳ vọng trong canonical/sitemap: $EXPECT =="

# ---- robots.txt ---------------------------------------------------------------------------------------
echo "[robots.txt]"
code="$(fetch "$BASE/robots.txt" robots)"
if [[ "$code" != "200" ]]; then fail "robots.txt HTTP $code"; else
  ct="$(hdr robots content-type)"
  [[ "$ct" == text/plain* ]] && ok "content-type $ct" || warn "content-type '$ct' (nên text/plain)"
  grep -qiE '^[[:space:]]*Disallow:[[:space:]]*/[[:space:]]*$' "$TMP/robots.body" && fail "có 'Disallow: /' (chặn toàn site)" || ok "không chặn toàn site"
  grep -qi '^User-agent:' "$TMP/robots.body" || fail "thiếu User-agent"
  for sm in sitemap_index.xml xe-khach/sitemap.xml; do
    grep -qiE "^Sitemap:[[:space:]]*$EXPECT/$sm[[:space:]]*\$" "$TMP/robots.body" && ok "Sitemap: $EXPECT/$sm" || fail "thiếu dòng 'Sitemap: $EXPECT/$sm' (origin phải là domain thật)"
  done
  grep -qiE '^Disallow:[[:space:]]*/tai-khoan' "$TMP/robots.body" && ok "Disallow /tai-khoan" || warn "chưa có 'Disallow: /tai-khoan/' (tránh crawl trang đăng nhập ?next=)"
  grep -qiE '^Disallow:[[:space:]]*/wp-admin/?' "$TMP/robots.body" || warn "chưa Disallow /wp-admin/"
fi

# ---- sitemap ----------------------------------------------------------------------------------------
for sm in sitemap_index.xml xe-khach/sitemap.xml; do
  echo "[sitemap] $BASE/$sm"
  code="$(fetch "$BASE/$sm" "sm-${sm//\//-}")"
  f="$TMP/sm-${sm//\//-}.body"
  if [[ "$code" != "200" ]]; then fail "HTTP $code"; continue; fi
  n="$(count '<loc>' "$f")"
  [[ "$n" -gt 0 ]] && ok "$n <loc>" || fail "không có <loc>"
  bad="$({ grep -o -E '<loc>[^<]+</loc>' "$f" || true; } | sed -E 's#</?loc>##g' | { grep -v -F "$EXPECT/" || true; } | head -3)"
  [[ -z "$bad" ]] && ok "mọi <loc> trên $EXPECT" || fail "<loc> sai origin, vd: $(echo "$bad" | tr '\n' ' ')"
done

# ---- trang mẫu ----------------------------------------------------------------------------------------
check_page "/" home
check_page "/xe-khach" xe-khach
corridor="$({ grep -o -E "<loc>$EXPECT/xe-khach/[^/<]+/[^/<]+</loc>" "$TMP/sm-xe-khach-sitemap.xml.body" 2>/dev/null || true; } | head -1 | sed -E "s#</?loc>##g; s#^$EXPECT##")"
[[ -n "$corridor" ]] && check_page "$corridor" corridor || warn "không tìm thấy trang tuyến trong /xe-khach/sitemap.xml"
i=0
while read -r u; do
  [[ -z "$u" ]] && continue
  i=$((i + 1)); p="${u#"$EXPECT"}"; p="${p#"$BASE"}"
  check_page "$p" "wp-sample-$i"
done < <(sample_urls "$TMP/sm-sitemap_index.xml.body" 5)
[[ $i -eq 0 ]] && warn "không lấy được URL mẫu từ sitemap_index.xml"
check_page "/tai-khoan/dang-nhap" login noindex

# ---- header ---------------------------------------------------------------------------------------------
echo "[headers] trang chủ WP + /xe-khach"
for n in home xe-khach; do
  [[ -f "$TMP/$n.hdr" ]] || continue
  [[ -n "$(hdr $n x-content-type-options)" ]] && ok "$n nosniff" || fail "$n thiếu X-Content-Type-Options"
  [[ -n "$(hdr $n x-frame-options)" ]] && ok "$n X-Frame-Options" || fail "$n thiếu X-Frame-Options"
  [[ -n "$(hdr $n referrer-policy)" ]] && ok "$n Referrer-Policy" || fail "$n thiếu Referrer-Policy"
  if [[ "$BASE" == https://* ]]; then
    hsts="$(hdr $n strict-transport-security)"
    [[ -n "$hsts" ]] && ok "$n HSTS ($hsts)" || fail "$n thiếu Strict-Transport-Security"
  fi
done
cc="$(hdr home cache-control)"
echo "$cc" | grep -qi 's-maxage' && ok "home Cache-Control: $cc" || fail "home thiếu s-maxage trong Cache-Control ('$cc')"
cs="$(hdr home x-cache-status)"
[[ -n "$cs" ]] && ok "home X-Cache-Status: $cs" || warn "home chưa có X-Cache-Status (page cache nginx chưa bật?)"
if [[ "$BASE" == https://* ]]; then
  httpurl="http://${BASE#https://}/"
  loc="$("${CURL[@]}" -o /dev/null -D - "$httpurl" 2>/dev/null | grep -i '^location:' | tr -d '\r' | head -1)"
  echo "$loc" | grep -qi "https://" && ok "http → https ($loc)" || warn "http không chuyển sang https ($loc)"
fi

# ---- Mã khuyến mãi ẩn không được lộ ra công khai ----------------------------------------------------------
echo "[promo] route riêng + booking-config công khai"
code="$(fetch "$BASE/wp-json/haivan-web/v1/promo-codes" promo)"
case "$code" in
  401|403|404) ok "promo-codes không bí mật -> HTTP $code" ;;
  200) fail "promo-codes trả 200 khi KHÔNG có X-HV-Secret (lộ mã khuyến mãi)" ;;
  *) warn "promo-codes không bí mật trả HTTP $code (mong đợi 403)" ;;
esac
code="$(fetch "$BASE/wp-json/haivan-web/v1/booking-config" bcfg)"
if [[ "$code" != "200" ]]; then warn "booking-config HTTP $code"; else
  if grep -q -E '"code"[[:space:]]*:' "$TMP/bcfg.body"; then fail "booking-config công khai có khoá \"code\" (lộ mã khuyến mãi; chỉ được có has_code)"
  else ok "booking-config không có khoá code"; fi
fi

echo
echo "== Kết quả: $FAILS FAIL, $WARNS WARN =="
[[ $FAILS -eq 0 ]]
