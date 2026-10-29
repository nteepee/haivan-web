# Code review: phase 10 (E2E/test infra, BFF raw query, proxy, nginx, docs)

Date 2026-10-28. Read-only. Scope: the files in the brief. `wordpress/**` was not reviewed.
Checks run: `pnpm -C apps/booking test` (196 passed), `test:scripts` (35 passed), `typecheck` (ok), `lint` (0), `pnpm e2e` run once (7 passed, 22 s; "server-side production DNS lookups: 0"; ports 3100 and 4010 were free afterwards).
Live probes against :8180: 6 headerless POSTs to `/api/hv/auth/verify` (Next returns 403 before any upstream call), `nginx -T`, Host-spoof GETs. One GET of `/xe-khach/ha-noi/sa-pa` may have caused the local Next to read live CMS route-listing once (read-only).

## Critical

**C1. The nginx `hv_auth` limit (marked as a go-live blocker) is never applied. `^~ /api/hv/` hides the verify/register regex.** `deploy/nginx/conf.d/haivan.conf.template:36-49`
- Cause: nginx picks the longest matching prefix first. When that prefix has `^~`, nginx does not evaluate regex locations at all. So `location ~ ^/api/hv/auth/(verify|register)$` is unreachable. Verify and register fall into `hv_gw` (120 r/m, burst 40).
- Evidence: 6 back-to-back POSTs returned `403 403 403 403 403 403`. With `hv_auth` (6 r/m, burst 3, nodelay) the 5th request would have been a 429. `nginx -T` in `haivan-local-nginx-1` matches the file.
- Impact: OTP verify is limited only by the in-memory per-phone counter and 2 r/s per IP. Someone can try many phones from one IP, and every attempt reaches apigw from the server's IP, which risks apigw banning that IP and breaking login for everyone. The earlier note "session >6/min trips hv_auth" is also stale.
- Fix: replace the regex with exact matches, which take priority over everything:
  `location = /api/hv/auth/verify { limit_req zone=hv_auth burst=3 nodelay; ... }`, plus the same for `/register`. Alternatively, drop `^~` from `/api/hv/`. Add a curl check (6 POSTs, expect a 429) to the deploy checklist.

## High

**H1. The `gw()` UNSAFE_PATH guard can be bypassed with ASCII tab or newline, so a crafted link makes the victim's browser call a different allowlisted endpoint with their session.** `apps/booking/src/lib/http.ts:85-89`
- Cause: the WHATWG URL parser removes TAB, LF and CR from URLs before it resolves dot segments, and the regex runs before that. I checked this with node: `bookings/.\t./payment/vnpay` passes the regex, and `new URL()` turns it into `/api/hv/gw/payment/vnpay?merchant_code=02`. The server's `SEGMENT` check sees an already-normalised path, so it cannot catch this.
- Vectors (fire on page load through useQuery, no click needed):
  - `success-page.tsx:19,30`: `booking_code` is not validated (unlike `readPaymentContext`, which is).
  - `service-update-page.tsx:131` → `:21` `v4/detail-transit/${code}`.
  - PoC: `/xe-khach/thanh-toan/thanh-cong?booking_code=.%09.%2Fpayment%2Fvnpay&merchant_code=02`. This sends `GET payment/vnpay`, which `isWrite` treats as a write and which will run live in production. The same works for `payment/payos`, `price-ticket`, `customer/customers` and `bookings/download-bill`. An attacker controls only `merchant_code` and cannot read the response, so impact is bounded, but the guard's stated purpose ("block a malicious link driving GET payment/*") is defeated.
- Fix: in `gw()`, check every path segment against the server's own segment rule. Reject unless `path.split("/").every(s => /^[A-Za-z0-9_-]+$/.test(s))`; that replaces the denylist regex. Also validate `booking_code` and `code` with `/^[A-Za-z0-9]+$/` in both pages. Add unit cases for `\t`, `\n`, `\r`.

## Medium

**M1. Rate-limit sizing behind carrier NAT.** `deploy/nginx/nginx.conf:17-19`, template `:37,44`
- `hv_gw` allows 2 r/s per IP and also covers `/api/hv/auth/session`, which runs on every WP and Next page view. Vietnamese mobile carrier NAT puts very many users behind one IPv4, so users will get false 429s at peak.
- Once C1 is fixed, `hv_auth` at 6 r/m per IP will block logins for everyone behind a shared office or mobile IP.
- nginx returns its 429 as an HTML body, so the UI shows the generic "Lỗi 429".
- Fix: give `session` its own generous zone (or no limit). Set `hv_auth` to about 20–30 r/m with burst 10 and rely on the app's per-phone counter. Add `error_page 429` returning JSON. Set `real_ip_header` if a CDN sits in front.

**M2. `Host $http_host` plus an absolute-form request target gets past the `return 444` default server.** `hv-next-proxy.conf:4`, `hv-wp-proxy.conf:4`
- nginx picks the server block from the host in the request line, but forwards the raw `Host` header.
- Verified: `curl --request-target 'http://localhost/vi/xe-khach' -H 'Host: evil.example'` returned 301 with `Location: http://evil.example:8180/vi/xe-khach` (from WordPress).
- Next is safe: its redirects are relative (`location: /xe-khach`). The exposure is WordPress-generated absolute URLs (reset links, canonical redirects), and cache poisoning if a CDN is added later.
- Fix: `proxy_set_header Host $host;` (add the port only for local, via a `map`), or pin the Host value per server block.

**M3. E2E does not test the production server mode.** `playwright.config.ts:45`
- E2E runs `next start` against `output: "standalone"`; the run itself prints "next start does not work with output: standalone". Production and `start-next.sh` run `server.js`, which is where the 308 loop that `proxy.ts:15` fixes actually happens.
- `proxy.test.ts` only feeds the header in by hand, so a regression of the loop would not be caught.
- Fix: in E2E, copy static assets like `start-next.sh` does, then run `node .next-e2e/standalone/apps/booking/server.js` with `HOSTNAME=127.0.0.1 PORT=3100`. Add assertions that `/xe-khach` returns 200 with no redirect and `/vi/xe-khach` returns exactly one 308.

**M4. Deploy guide topology does not work on a Linux VPS.** `docs/deployment-guide.md:43-44`, `deploy/local/compose.yaml:10-15`
- nginx runs in Docker and reaches the host through `host.docker.internal:host-gateway`. On Linux that traffic arrives on the bridge IP (172.17.0.1), not on loopback.
- The guide says to bind Next to `127.0.0.1:3010` (and WP is on 127.0.0.1:8089). That combination only works on Docker Desktop.
- TLS is only a TODO. When 443 is added, the default server needs `listen 443 ssl default_server; ssl_reject_handshake on;`, the www redirect needs a 443 server too, and `$scheme` will be wrong behind a load balancer that terminates TLS.
- Fix: document either `network_mode: host` for nginx or binding to the bridge IP, and write out the 443 server blocks.

## Low

- **L1. `X-HV-Query` equivalence is not byte-safe.** `src/server/raw-query.ts:6,16-17`. Comparing URLSearchParams entries treats as equal: `a=1#x` ≡ `a=1%23x` (upstream fetch then drops the fragment, so the param is truncated), `%FF` ≡ `%FE` (both decode to U+FFFD), `?a=1` ≡ `a=1` (upstream gets `??a=1`), and `a=1;b=2` ≡ `a=1%3Bb%3D2`. This is not an escalation: the client controls the URL anyway, no server-side policy reads the query, and CR/LF header injection is impossible. Hardening: reject a raw value containing `#`, starting with `?`, or containing non-printable characters, and compare using fatal UTF-8 decoding. Queries over 4096 bytes silently fall back to the normalised form (`+`, `%5B`); that is fine for PHP, but log it once. `+` vs `%2B`, duplicate keys and empty values behave correctly.
- **L2. `x-hv-rewritten`.** nginx blanks it (`hv-next-proxy.conf:9`). If :3010 were reachable directly, a spoofed header gives `/xe-khach` → `[lang]=xe-khach` → 404, and `/vi/*` is served without the redirect. The larger risk of direct exposure is spoofing `X-Forwarded-For` (the OTP counter) and bypassing the rate limits, so keep Next on loopback and behind ufw. `/` and `/en` are fine, static files and `/api` are skipped, and `/` itself goes to WP by nginx design.
- **L3. Duplicate `Cache-Control` headers on `/api/hv/*`** (nginx `add_header` plus `BFF_HEADERS`). Verified, same values, harmless. Drop the nginx `add_header` or use `proxy_hide_header` there.
- **L4. E2E flake vectors.**
  - `booking-flow.spec.ts:18,47`: `vnToday()` is evaluated when asserting, so a run crossing midnight VN time fails.
  - `:42,62`: `only()` expects exactly 1 trips/trip_detail call, which breaks if React Query refetches.
  - `:144`: `[0].rawQuery` throws a TypeError instead of a readable failure.
  - `E2E_MOCK_APIGW=http://localhost:…` passes the guard, but the mock binds only 127.0.0.1, so the URL may resolve to `::1` and fail.
- **L5. E2E env override list is hand-maintained.** It covers all 9 `.env.local` keys today (checked key names only) and the DNS guard does cover `fetch`, `http` and worker threads (checked in a sandbox). But a new upstream key added to `.env.local` would silently leak into the build. Fix: make `playwright.config.ts` read the `.env.local` key names and throw on any key it does not override. `CPN_URL` and `NEXT_PUBLIC_CPN_URL` are overridden but unused in `src`.
- **L6. `email-verify.tsx:15`.** Missing params become `""`; the old bundle sends `"undefined"` (old bundle checked: `qs.parse` then raw concat). Raw concatenation of decoded values allows param injection into the public verify endpoint. This matches the old site and is harmless.
- **L7. `deploy/local/start-next.sh`.**
  - `:23`: `source .env.local` runs the file as shell, so `$(` or a backtick in a value would execute.
  - `:11-13`: `sleep 1` after `kill` races with the port check.
  - It kills whatever PID is in the PID file, even if that PID has been reused by another process.
- **L8. Route page.** Canonical, alternates and metadataBase are correct (checked in the `.next-e2e` HTML). In the PPR shell the BreadcrumbList appears only inside the RSC payload; I did not confirm it renders as an HTML `<script type=application/ld+json>` tag at request time (see Questions). Slugs are lowercase via `SLUG`, so the canonical cannot drift on case.

## Edge cases from scouting (verified, no defect)
- Smoke: `redirect:"error"`; GET only; origin and path allowlist rejects userinfo, port, trailing-dot host, `%2e%2e` (normalised and then rejected), `%2F`. The `HV_SMOKE_LIVE` check runs after the (side-effect-free) imports. Node does not load `.env.local` here.
- contract-diff / test:scripts: pure functions, Node environment, no network. The root vitest config excludes `e2e/**`.
- Browser layer: `--host-resolver-rules` maps everything except loopback to NOTFOUND, plus `context.route` blocks external and production hosts. Server layer: the DNS guard is inherited by worker threads and child processes, and `callApigw` refuses non-loopback upstreams when `E2E=1`.
- `.gitignore` covers `.next*/`, `.e2e-output/`, `test-results/`, `deploy/local/next.{pid,log}`.

## Plan follow-ups
- The phase-10 E2E, contract-diff, smoke and docs items look done.
- Must fix before go-live: C1, H1. Then M2, M3, M4. M1 needs a product decision.

## Unresolved questions
1. What is the right `hv_auth` / `hv_gw` sizing for carrier NAT? Is a CDN or Cloudflare planned (it changes the rate-limit key)?
2. Does the route-page JSON-LD render as an HTML script tag on a real request (crawler-visible without JS)? Needs one GET against the E2E/mock server.
3. Production topology: nginx in Docker or on the host? M4's fix depends on it.
4. Will `:3010` ever be reachable from outside (container network)? That decides whether L2 needs a shared-secret header.

Status: DONE_WITH_CONCERNS
Summary: Tests, lint, typecheck and E2E pass, and I found no path to production in E2E, smoke, contract-diff or vitest. But the nginx OTP rate limit (`hv_auth`) is dead config because of `^~` precedence (verified live), and gw()'s path guard can be bypassed with a tab or newline from unvalidated URL codes.
Concerns/Blockers: C1 and H1 block go-live; M4 blocks a Linux VPS deploy as documented.
