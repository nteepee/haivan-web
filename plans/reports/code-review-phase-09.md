# Code review: phase 9 (WordPress) + root nginx

Scope: `wordpress/**` (child theme, scripts, compose, nginx, php ini; Flatsome excluded), `docs/wordpress.md`, `deploy/nginx/**`, `deploy/local/*`. Read-only. Live probes only against :8180/:8089 (GET; one POST to logout with no session, which got 403). DB checked with read-only SELECTs. One throwaway nginx container (since removed) was used to confirm how nested allow/deny is inherited.

## Verdict
Parity work is solid: the URL crawl matches, there are no redirect chains, and the search widget URL matches Next's parser. Not ready to ship: 2 blockers (a rate limit that locks users out, and the layout seed file missing from git), plus several cases where the docs claim a protection that the live stack does not have (kses on imported content, author enumeration, "re-running import is safe").

## Critical
**C1. The `hv_auth` rate limit also covers `/api/hv/auth/session`.** `deploy/nginx/conf.d/haivan.conf.template:21-27`, zone at `nginx.conf:17` (10r/m, burst 5).
- Verified: 9 quick GETs to `/api/hv/auth/session` returned `200×6, 429×3`.
- Every WP page calls session (`site.js:100`). So does every Next page (`hooks/use-session.ts`).
- Impact: a user who opens about 7 pages in a minute sees "Đăng nhập" on WP, and Next session checks start failing. Vietnamese mobile carriers put many users behind one shared IP (carrier-grade NAT), so they share this bucket too.
- Fix: add `location = /api/hv/auth/session` with no limit, or its own generous zone. Keep a strict zone for `register`/`verify` only (see M6).

**C2. `wordpress/.gitignore:2` uses an unanchored `data/` pattern, which also ignores `wp-content/themes/haivan-web-child/data/`.**
- Verified: `git status --ignored` lists `!! wordpress/wp-content/themes/haivan-web-child/data/`.
- Impact: the first commit and every deploy lose `layout-seed.json`. `hv_layout_seed()` (`inc/layout.php:23-38`) then falls back to empty arrays: empty header/footer whenever menus are empty, `seed-site.php` creates no menus or routes, and the REST layout returns empty `primary`.
- Fix: change the pattern to `/data/`.

## High
**H1. The importer writes unfiltered HTML. The docs say the opposite (`docs/wordpress.md:62`).** `import-old-site.php:198-205, 232-241, 264-273, 303-311`.
- WP-CLI did not apply kses. The DB holds `<script>` (post 539), a `<button onclick>`, `onclick="openNewImage…"` (669) and `<iframe src=cms.haivan.com/api/cta/25>` (762/764/768/…). They render live, e.g. `/chung-toi/bao-chi-tin-tuc/hai-van-vung-tau-tang-ma-50k-…`.
- Destination titles (`$loc['name']`) are not stripped, and `page.php:19` / `single.php:20` / `archive.php:32` print them with `the_title()`.
- Risk: anything in the CMS or archive runs on the same origin as the BFF. JS there can send `X-HV-Req` and pass the Origin check, i.e. ride the user's session. Today's payloads are benign. Also, the first time MKT saves one of these posts, kses silently strips that content.
- Fix: in the importer, run `wp_kses_post()` on content and `wp_strip_all_tags()` on every title, or call `kses_init_filters()` at the top. Then re-import with `HV_IMPORT_FORCE=1` and correct the docs.

**H2. Any WP admin can inject site-wide JS through Flatsome's Header/Footer Scripts, bypassing `DISALLOW_UNFILTERED_HTML`.**
- Code: `flatsome/inc/structure/structure-header.php:1298-1302` and `structure-footer.php:95-97` echo raw theme_mods on every front-end page. The child theme does not remove them.
- Current state: one admin account, 0 users with 2FA (no `_two_factor%` usermeta), no CSP. A phished MKT admin can therefore take over BFF sessions.
- Fix: in the child theme, `remove_action('wp_head','flatsome_custom_header_js')` and remove `flatsome_footer_scripts` plus the body-script hooks. Give MKT the Editor role, not Administrator. Enforce 2FA (block wp-admin when no provider is set). CSP `script-src 'self'` + nonce on WP pages.

**H3. Username enumeration is still open.**
- `/?author=1` returns `301 Location: /author/hvadmin`. Core `redirect_canonical` runs before the theme's hook at the same priority (`inc/hardening.php:31-39`).
- `/wp-json/oembed/1.0/embed?url=…` returns `"author_name":"hvadmin"`.
- Fix: run the hook at priority 1 (or filter `redirect_canonical` when `author` is set). Unset `author_name`/`author_url` via `oembed_response_data`. Disable the Rank Math author archive.

**H4. The admin IP allowlist is unsafe for production, and the WP nginx has none.** `deploy/nginx/conf.d/wp-locations.inc:3,11`.
- All RFC1918 ranges are allowed, in a file that ships as-is. Locally every request arrives as `172.25.0.1` (log), so it is always allowed.
- In production, traffic through docker-proxy (IPv6, hairpin), a load balancer or a CDN also arrives from a private IP, so everyone is allowed.
- `wordpress/nginx/default.conf` has no gate on `wp-login.php`/`wp-admin`, and `docs/wordpress.md:19` tells operators to change `WP_BIND_ADDR`.
- Fix: production allowlist = office/VPN IPs only, via env var. Configure `real_ip` if a CDN/LB is used. Keep WP nginx on an internal docker network (no host port), or add the same allow/deny there.

**H5. Re-running the importer overwrites MKT edits. The docs promise it won't (`docs/wordpress.md:58`, script header line 12).**
- The CPT `$upsert` (`import-old-site.php:101-119`) always overwrites title, content, excerpt, date and `post_status=publish` for news, destinations and offers. There is no edit check, so drafts MKT unpublished come back.
- Trashed posts are not matched (`post_status=any` skips trash), so they get re-created as duplicates.
- Static pages (`:156-172`): only the **vi** page is checked for edits, so an MKT-translated **en** page is overwritten with vi content.
- `hvs_upsert_route` (`lib/helpers.php:184-195`) overwrites route title, order and status. It is also called by `setup.sh` via `seed-site.php:88-93`.
- Fix: store `hv_imported_hash` per post (all types and languages). Skip a post when its stored content differs from that hash, or when its status is not publish. Insert only when nothing exists (including trash).

## Medium
**M1. `setup.sh` re-runs are not safe for MKT edits.**
- `configure-site.php:56-80` resets the site name and tagline, Rank Math modules and sitemap options.
- `blog_public` follows `WP_ENV_TYPE`, whose compose default is `local`. If production forgets the variable and setup is re-run, the whole site becomes **noindex**.
- `seed-site.php:66-67` resets the front page. `:18-23` hard-deletes any page with slug `privacy-policy`.
- `hv_seed_menus()` (`inc/layout.php:384-408`) reassigns the menu locations back to the "Header (vi)" menus, even if MKT assigned different menus.
- Fix: set these only on first install (store a marker option). Never touch location assignments for existing menus. Fail loudly if prod runs without `WP_ENV_TYPE=production`.

**M2. No search-replace guidance for migration.** 40 posts contain absolute `http://localhost:8180/wp-content/uploads/…` URLs (written by the importer at `:147`); attachment GUIDs are `:8089`. `docs/wordpress.md` only says "change WP_URL". Add: `wp search-replace 'http://localhost:8180' 'https://haivan.com' --all-tables --skip-columns=guid --precise --dry-run`, then run it without `--dry-run`. Better: import on staging with the final `WP_URL`.

**M3. Front-end `admin-ajax.php`/`admin-post.php` are IP-blocked too.** `wp-locations.inc:9-10`. Nested locations inherit the parent's allow/deny. Confirmed in the isolated nginx test: the nested `= /wp-admin/admin-ajax.php` returned 403. This contradicts the stated intent (`nginx-snippet.conf:28`), and the Flatsome live-search JS loaded on every page needs it. Fix: add `allow all;` in the nested blocks, or make them top-level exact-match locations.

**M4. Host header trust.** `haivan.conf.template:2-10`, `hv-*-proxy.conf:4`.
- The main server is `default_server` and forwards `$http_host` unchanged. Verified: `Host: evil.example` on `/chung-toi/gioi-thieu/` produced `301 Location: http://evil.example:8180/chung-toi/gioi-thieu` from WP.
- The `www` regex block redirects `www.<anything>` to `<anything>` (open redirect), drops the port and uses `$scheme` (http behind a TLS-terminating proxy).
- Fix: a separate `server { listen 80 default_server; return 444; }`, explicit `server_name haivan.com`, and `return 301 https://haivan.com$request_uri` for www. Then use `proxy_set_header Host $host` (safe once restricted by server_name). For the local port, rely on `WP_HOME` and Next's `PUBLIC_ORIGIN`, not the incoming Host.

**M5. `/tai-khoan/**` is served publicly cacheable.** Verified header: `Cache-Control: s-maxage=3600, stale-while-revalidate=82800`. nginx only adds `private, no-store` to `/api/hv/` (phase-10 requirement not met). Add a `/tai-khoan` (+`/en`) location with `proxy_hide_header Cache-Control; add_header Cache-Control "private, no-store" always;`. Same `proxy_hide_header` on `/api/hv/`, which currently sends two `Cache-Control` headers.

**M6. OTP abuse limit is too loose.** 10r/m per IP on register/verify allows about 14k OTP SMS per day per IP. Use a separate strict zone (e.g. 3r/m, burst 2) for `register`, plus a per-phone limit in the BFF.

**M7. PHP source is exposed on the local stack.** `/wp-config.PHP` returns 200 `application/octet-stream`, 5922 bytes: the raw config with DB password and salts. `/wp-login.PHP` also skips the IP gate. Cause: the case-sensitive `\.php$` regex combined with the macOS case-insensitive bind mount. Production on Linux is not affected. Fix anyway: `location ~* \.php$` in WP nginx and `location ~* /wp-config` deny.

**M8. LCP / extra assets.** `flatsome.css`, render-blocking jQuery + migrate in `<head>`, `flatsome.js`, live-search and hoverIntent load on every page although the child header/footer don't use them. LCP was never measured (acceptance gap). Dequeue them on templates that don't use UX Builder.

**M9. No CSP/HSTS/frame protection** (the plan requires CSP). Production needs:
- `Content-Security-Policy` per location. WP: `script-src 'self' 'nonce-…'`, `connect-src 'self' https://apigw.haivan.com`, `frame-src https://cms.haivan.com` (CTA iframe), `img-src 'self' data: https://cms.haivan.com https://cdn.24h.com.vn` (hotlinked images in news).
- `frame-ancestors 'self'` (the login/OTP page can currently be framed).
- `Strict-Transport-Security` once TLS is stable.
- `Permissions-Policy`.

## Low
- L1 `inc/layout.php:70-89` `hv_relative_href()` turns `tel:1900…` / `mailto:` menu links into `/1900…`. Return early for URLs with a scheme and no host.
- L2 `search-shortcode.php:90`: `results_path="\evil.com"` becomes `/\evil.com`, which `location.assign` (`search.js:252`) treats as an off-site redirect. Whitelist `^/[a-z0-9/-]+$`. `$href[0]` on an empty attribute gives a PHP warning (`:103`).
- L3 `site.js:63-68`: logout ignores non-2xx responses (e.g. a 403 Origin mismatch) and redirects as if the user had logged out. Check `res.ok`.
- L4 A client-sent `x-hv-rewritten: 1` makes every Next page return 404 (verified on `/xe-khach`). Add `proxy_set_header X-HV-Rewritten "";` in `hv-next-proxy.conf`.
- L5 Information leaks: `/readme.html` and `/license.txt` return 200; `X-Powered-By: PHP/8.3.36` and `Next.js` headers; `wp-cron.php` is public (`DISABLE_WP_CRON` + system cron).
- L6 `/favicon.ico` (Next pages request it) goes to WP and 302s to the WP logo; Next's `src/app/favicon.ico` is unreachable. Route it to Next, or set a WP site icon.
- L7 Two different `hv-wp-proxy.conf` files (`wordpress/nginx` uses `$host`, `deploy/nginx` uses `$http_host`). The WP proxy appends the client's XFF while the Next proxy overwrites it. Keep one source of truth.
- L8 `/en/diem-den/x/<article>` redirects to the vi news post via `suppress_filters` (`content-types.php:221-235`). Fine today; revisit when en translations exist (Polylang free adds a `-en` slug suffix).

## Acceptance criteria (phase 09)
- AC1 old content URLs return 200 or an intentional 301: **met.**
  - My crawl source: `archive/old-site/log.jsonl`, 711 non-Next pages (the agent reported 705).
  - Results: 311×200, 395×301, every 301 a single hop ending in 200, no loops.
  - 5×404:
    - `/xe-san-bay/tim-chuyen-car-airport` (+`/en`): documented as out of scope.
    - `/en/sentry-example-page`, `/en/test`: junk pages.
    - `/favicon.png`: consider a 301.
  - Trailing-slash, uppercase and `/en//` variants each take one hop.
- AC2 MKT menu change updates the REST layout: **code path correct** (live `wp_get_nav_menu_items`, no cache). `check-layout.mjs` passes against :8180. A real menu edit was not tested (read-only review).
- AC3 search widget submits the correct Next URL: **met.** `from=<enc>,<lat>,<lng>&…&date=DD-MM-YYYY&numberGuest=N` parses with `apps/booking/src/lib/search-url.ts:20-49`. It calls `apigw` directly with the `Domain` header, the same as the Next client (`lib/http.ts:5`).
- Plan requirements still open: CSP (M9), enforced 2FA (H2), production IP restriction (H4), LCP measurement (M8), backups (phase 10).
- Secrets: `admin-credentials.txt` and `.env` are git-ignored (mode 600). No HV_QR_BOOKING tokens or `hvb-*` files copied. Salts are unique.

## Recommended order
C1 → C2 → H1 (fix the importer, re-import) → H2/H3 → H5/M1 (idempotency) → H4/M3/M4/M5 (nginx, done together in phase 10) → M2 docs → the rest.

## Unresolved questions
1. Will production nginx sit behind a CDN or load balancer? This decides `real_ip`, the `limit_req` key, the allowlist, and whether the `X-Forwarded-Proto`/`$scheme` handling is correct.
2. Will MKT accounts be Administrator or Editor? H2's severity depends on it.
3. Keep the `cms.haivan.com/api/cta/25` iframe and the inline scripts from old news, or strip them?
4. Which list produced the agent's "705 URLs, 310×200"? This crawl finds 711 / 311.
5. Was `import-old-site.php` ever run with `--user`? It matters for knowing which kses path ran.
