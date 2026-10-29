# Debug: SSR main-content hole (H1 missing) - 261029

## Root cause
`Date.now()` evaluated during prerender in a Client Component. Chain:
- `src/components/search/corridor-form.tsx:114` calls `roundtripPromoForOutbound(config, ...)` on every render (also when today="" at SSR).
- `src/lib/promo-match.ts:86` `const nowMs = ctx.nowMs ?? Date.now();` runs eagerly, before any promo check (also `isRunning` default arg, :19).
- cacheComponents (PPR): current-time read in prerender = dynamic. The nearest Suspense = `src/app/[lang]/layout.tsx` `<main><Suspense>{children}`, so the whole page content is dropped from the shell. React emits `$RX("B:0","")` (client-render fallback, empty digest).
- Same class of bug that `src/hooks/use-today.ts` doc comment describes; corridor-form is new (introduced with CorridorForm/roundtrip promo label) and uses `useToday` for `today` but not for `nowMs`.
NOT the cause: `xe-khach/layout.tsx` / `getBookingConfig` (`use cache`, cacheLife bookingConfig 60/300/900 - expire 900 >= 300 so not "short-lived"); BookingConfigProvider (pure context); [lang] layout Suspense (only the hole boundary); providers/header-shell (no time reads).

## Evidence
1. Prerendered artifacts `.next-local/server/app/vi/*.html` (copied to scratchpad/snap before the rebuild):
   FAIL (h1=0, RX=2: header + main): `xe-khach`, `xe-khach/quan-1/vung-tau`, `my-dinh/son-la`, `my-dinh/dien-bien`, `vung-tau/quan-1-san-bay`.
   OK (h1=1, RX=1 = header LanguageSwitch only): `my-dinh/ban-phu`, `my-dinh/muong-cha`, `tan-son-nhat/vung-tau`, `vung-tau/tan-son-nhat`, `yen-nghia/dien-bien`, `partner/booking`, `tracking/hv`.
   Failing set == exactly pages rendering CorridorForm: /xe-khach (SearchForm mode corridor) + the 4 main-corridor landings (config `landing.ab/ba` = my-dinh/dien-bien, my-dinh/son-la, quan-1/vung-tau, vung-tau/quan-1-san-bay; seen in `xe-khach.rsc`). Non-corridor landings (same xe-khach/layout, same getBookingConfig) still have H1 -> layout/config exonerated.
2. `.meta` of failing `/vi/...` files has no `postponed` key, and no `S:n` segment exists -> Next has nothing to resume, serves the shell as-is (x-nextjs-cache: HIT, x-nextjs-prerender: 1). Static-param route `/[lang]/...` metas do have `postponed`, irrelevant at runtime.
3. Controlled experiment (copy of app in a throwaway dir, separate distDir, :3010 untouched; dir deleted afterwards): only change = line 114 `sameLeg || !today ? null : roundtripPromoForOutbound(...)`. Result: `xe-khach`, `quan-1/vung-tau`, `my-dinh/son-la`, `my-dinh/dien-bien`, `vung-tau/quan-1-san-bay` all h1=1, RX=1 (header only). Everything else unchanged.

## Affected pages
- SEO-relevant (regression): `/xe-khach`, `/xe-khach/quan-1/vung-tau`, `/xe-khach/my-dinh/son-la`, `/xe-khach/my-dinh/dien-bien`, `/xe-khach/vung-tau/quan-1-san-bay`, and any `en` equivalents (same code).
- `/tracking`, `/tai-khoan/dang-nhap`, `/xe-khach/tim-chuyen|xac-nhan|thanh-toan|...`, `/email/verify`, account pages: also h1=0 but BY DESIGN: page content wrapped in `<Suspense>` + `useSearchParams()` (tracking/page.tsx, login-page.tsx:14), all noindex. Not part of this regression (the earlier "tracking also fails" is this separate, intended hole; the `main` shell there is `<!--$?--> B:1` nested inside page Suspense, not the layout one). Optional: pass `searchParams`-free skeleton if H1 wanted in shell.
- Header `LanguageSwitch` hole (useSearchParams in Suspense) stays a hole everywhere; harmless.

## Fix (minimal, keeps cacheComponents + 5-min freshness)
corridor-form.tsx:114
```ts
// today === "" khi prerender: chưa biết giờ -> không gọi promo-match (Date.now() làm cả Suspense bị bỏ khỏi HTML).
const roundtrip = sameLeg || !today ? null : roundtripPromoForOutbound(config, corridor.id, chieu, { returnDate, range: bounds, seatCount: guests });
```
Effect: SSR HTML has no round-trip promo label (it appears after hydration when useSyncExternalStore yields today) - no layout-critical content lost; booking-config freshness untouched (still `use cache` 5 min; `isRunning` re-check on client keeps handling stale config).
Hardening (optional): in promo-match.ts make `nowMs` lazy (`ctx.nowMs ?? Date.now()` only inside the `.find` callback after `config.promos.length` check) or require callers pass `nowMs`; grep other render-time callers: `payment/return-cta.tsx:58` (client, post-payment, dynamic - ok), `trip-card.tsx` comboPromoFor (renders only after client fetch - ok).
Regression guard: add a post-build check (layout-audit or scripts) that reads `.next*/server/app/vi/{xe-khach,xe-khach/quan-1/vung-tau}.html` and asserts `<h1` count >= 1 and no `<main id="main" class="flex-1"><!--$?-->`.

## Verify (after rebuild via deploy/local/start-next.sh)
```
for p in /xe-khach /xe-khach/quan-1/vung-tau /xe-khach/my-dinh/son-la /xe-khach/my-dinh/dien-bien /xe-khach/vung-tau/quan-1-san-bay; do
  echo $p $(curl -s http://127.0.0.1:3010$p | grep -c '<h1'); done     # expect >=1 each
curl -s http://127.0.0.1:3010/xe-khach | grep -o '<main id="main"[^>]\{0,40\}><!--\$?-->'   # expect empty
grep -c '$RX("B' .next-local/server/app/vi/xe-khach.html                                       # expect 1 (header only)
```
Then run layout-audit and `pnpm -C apps/booking test src/components/search src/lib/promo-match` (tests pass nowMs explicitly; unaffected).

## Unresolved
- Exact Next 16.4.3 internal that converts Date.now() in a client component into a silent $RX (instead of build error) not traced in node_modules; empirically proven instead.
- Build of snapshot src vs 15:40 artifacts could differ slightly (other agent editing); experiment copy used current src, baseline artifacts reproduce symptom.
- Other agent's rebuild of :3010 may already have changed served output; re-run curl check after it.
