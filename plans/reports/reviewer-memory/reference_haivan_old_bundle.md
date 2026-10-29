---
name: haivan-old-bundle-archive
description: HaiVan-Web parity source of truth — old haivan.com Next bundle archived locally; grep it to verify "matches old web" claims instead of trusting spec/plan text
metadata:
  type: reference
---

Old haivan.com JS bundle is at `/Users/phuc/Documents/HaiVan-Web/archive/old-site/_next/static/chunks/` (pages/ per route, e.g. `pages/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh-*.js`, `pages/xe-khach/cap-nhat-dich-vu-*.js`, `pages/tracking-*.js`; API service `JnuR` in `78bc838e…js`; sidebar/offers `drVm` in `9348d827…js`).

**Why:** phase-08 review (2026-10-28) found plan/spec text wrong or unverified (plan said loyalty uses `reward/definition`, code correctly used `customer/definition.rank_evaluators`; implementation invented an `is_cancel` gate the old bundle never reads). Grepping the bundle settled both.

**How to apply:** for any HaiVan-Web parity question, `grep -o '.\{300\}<field>.\{300\}'` in the archive before accepting spec/plan claims. Use `cut`/short context — minified lines are huge and ugrep rejects long `\{n\}` with non-ASCII. Related: [[haivan-web-test-safety]].
