---
name: haivan-web-test-safety
description: HaiVan-Web rebuild (/Users/phuc/Documents/HaiVan-Web) — backend is production-only; MSW 3.0.3 guard holes verified empirically 2026-10-28
metadata:
  type: project
---

HaiVan-Web (Next 16 + MSW 3.0.3 + Vitest 5/jsdom 30) talks to apigw.haivan.com / cms.haivan.com / api.cpn.haivanexpress.vn, which have no sandbox. Tests must never reach them; reviewer must not hit them either.

**Why:** a probe once reached production because MSW 3 `onUnhandledFrame` callback calling `defaults.error()` still passes through.

**How to apply (verified 2026-10-28 via sandbox-exec + dns.lookup->127.0.0.1 probe in scratchpad):**
- Safe probe recipe: `sandbox-exec -p '(version 1)(allow default)(deny network-outbound (remote ip "*:*"))(allow network-outbound (remote ip "localhost:*"))'` + setupFile patching dns.lookup for haivan hosts.
- MSW 3 bypasses: `fetch` captured at import time (listen in beforeAll runs after test-file import); jsdom sync XHR (child process); `undici` package direct; `passthrough()` handlers; `resetHandlers(...args)` permanently replaces initial handlers (catch-all lost for rest of file); `'error'` strategy exempts asset-like paths (.json/.png/...) and CONNECT.
- A THROWING `onUnhandledFrame` callback does block (synthetic 500 response), unlike `defaults.error()`.
- afterEach `expect` in setupFiles reliably fails the test, but misattributes late requests and misses ones after the last test.
- `pnpm e2e` (phase 10) is safe to run once when ports 3100/4010 free: env overrides all .env.local keys + DNS guard (covers fetch/http/workers, verified) + browser host-resolver-rules; ~25s.
- `pnpm verify` was NOT hermetic before phase 10 (now uses build:verify with :9 URLs): its `next build` step prerenders `/[lang]/xe-khach/[start]/[end]` (generateStaticParams from popular-routes.json) and fetches live `cms.haivan.com/api/route-listing` via `.env.local` (verified 2026-10-28: CMS meta_title baked into .next HTML). Read-only GETs, but tell the lead / override NEXT_PUBLIC_CMS_URL before running build.
- Local stack (phase 09/10, verified 2026-10-28): root nginx :8180 → Next 127.0.0.1:3010 + WP nginx :8089. As of phase 10 (2026-10-28) `hv_auth` regex is shadowed by `^~ /api/hv/` (verify/register only hit `hv_gw` 120r/m) — if that gets fixed, >4 rapid POSTs to verify trip 429 for ALL local clients; headerless POSTs get 403 at Next before any upstream call (safe probe). Curling Next route pages (`/xe-khach/<a>/<b>`) on :8180 can make local Next read live CMS — avoid; inspect `.next-e2e/server/app/**.html` instead. `/wp-config.PHP` on :8180/:8089 serves raw wp-config (macOS case-insensitive mount) — never print it. Read DB via `docker exec haivan-wp-db-1 sh -c 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -e SELECT…'`. Phase-09 docs claimed kses/author-enum/import-idempotency protections that live checks disproved — always verify docs claims against DB/curl.
