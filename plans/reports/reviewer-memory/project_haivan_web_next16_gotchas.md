---
name: haivan-web-next16-gotchas
description: HaiVan-Web (Next 16.4.3, cacheComponents) verified gotchas from phase-11 review 2026-10-28 - use-cache stale-if-error does not exist during ISR regen; unlayered :focus-visible beats Tailwind outline utilities
metadata:
  type: project
---

- `'use cache'` + throw does NOT give stale-if-error during prerender/ISR regeneration: `willConsumerServerCache('prerender')` is true in `node_modules/next/dist/server/use-cache/use-cache-wrapper.js` (~L2285), so an entry past `revalidate` is regenerated in the foreground and a throw propagates. Stale-while-revalidate only applies to request-time renders. Popular routes are ISR (`.next-e2e/prerender-manifest.json`: revalidate 3600, expire 86400 = layout `hours` profile), so "7-day stale on WP outage" claims in docs/route-landing-contract.md are wrong for them.
- `src/app/globals.css` has UNLAYERED `:focus-visible{outline:2px solid var(--hv-focus)}`; unlayered beats `@layer utilities`, so `focus-visible:outline-white` on dark bg (footer-bottom, route-cta) computes to #333 (verified headless Chromium with built CSS in scratchpad). Check any new focus utility on dark backgrounds.
- `sanitize-html.ts` TAG_RE is quadratic on many unclosed `<a ` (200KB = ~21s); no XSS bypass found with ~45 vectors. Probe: copy file to scratchpad, `node --experimental-strip-types`.
- Playwright headless works offline for CSS probes: import from `node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core/index.mjs`, run under sandbox-exec deny-network.
- Rank Math home JSON-LD emits `/#person` (Person+Organization), not `/#organization`.

**How to apply:** when reviewing HaiVan-Web caching/outage claims or dark-surface focus styles, re-verify these rather than trusting docs.
