---
phase: 1
title: "Repo & tooling"
status: completed
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Repo & tooling

## Overview
Dựng khung monorepo pnpm cho `apps/booking` (Next.js) và `wordpress/`, cấu hình chất lượng mã và test chặn mạng thật ngay từ đầu.

## Requirements
- Functional: `pnpm install` một lần; script `dev`, `build`, `typecheck`, `lint`, `test`, `e2e`, `smoke` ở gốc.
- Non-functional: Node 22, pnpm 10, TS strict; test mặc định không chạm production.

## Architecture
```
HaiVan-Web/
  package.json, pnpm-workspace.yaml (apps/*), .nvmrc, .editorconfig
  apps/booking/          # create-next-app (App Router, TS, Tailwind, ESLint)
  wordpress/             # phase 9
  deploy/                # phase 10
  docs/, plans/
```

## Related Code Files
- Create: `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.editorconfig`, `README.md`, `apps/booking/**` (scaffold), `apps/booking/vitest.config.mts`, `apps/booking/test/setup.ts`, `apps/booking/playwright.config.ts`, `apps/booking/.env.example`
- Modify: `.gitignore`

## Implementation Steps
1. `pnpm create next-app apps/booking` (TS, App Router, Tailwind, ESLint, `src/`, alias `@/*`); ghim phiên bản (next 16.x, react 19.x).
2. Vitest + Testing Library + MSW 3 (node). Chặn production 3 lớp: DNS (`test/dns-block.ts`), MSW catch-all theo host (`test/msw-server.ts`, `onUnhandledFrame` ném lỗi), cấm XHR đồng bộ; mọi lần thử bị ghi lại, `afterEach`/`afterAll` làm test fail (MSW 3 không tự chặn request dạng tài sản).
3. Playwright skeleton (chromium) chạy Next với `APIGW_URL`/`NEXT_PUBLIC_APIGW_URL` trỏ mock server local (BFF gọi từ server nên `page.route` không đủ — chi tiết phase 10).
4. `.env.example`: `APIGW_URL` (server-only, BFF), `NEXT_PUBLIC_APIGW_URL`, `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (site key công khai web cũ), `PUBLIC_ORIGIN`, `WP_LAYOUT_URL`, `SESSION_SECRET`.
5. **Chụp lưu site cũ ngay** (trước khi host cũ mất): HTML các trang trong build manifest (vi + `/en/`), `_next/data/<build>/**`, mọi chunk (đã có trong scratchpad, gồm trang tuyến), ảnh, `locales`, `__NEXT_DATA__` trang chủ → `archive/old-site/` (gitignore, nén lưu riêng).
6. README: cách chạy, cấu trúc, liên kết docs.

## Success Criteria
- [ ] `pnpm typecheck && pnpm lint && pnpm test` xanh trên app trống.
- [ ] Test cố tình gọi apigw thật bị chặn và fail rõ ràng.
- [ ] Không file `.env` nào được git theo dõi.
- [ ] `archive/old-site/` có đủ HTML + `_next/data` + chunk + ảnh, kèm danh sách URL.

## Risk Assessment
- Next 16 thay đổi mặc định (cacheComponents, PPR): ghi phiên bản cụ thể trong README; nếu create-next-app sinh cấu hình khác tài liệu → đọc docs Next 16 trước khi tiếp phase 2.

## Kết quả (2026-10-28)
- Monorepo pnpm, Next 16.4.3, Vitest 5 + MSW 3, Playwright 1.64; `pnpm verify` = typecheck+lint+test+build.
- Chặn production 3 lớp (DNS, MSW catch-all theo host, cấm XHR đồng bộ) + 10 test hồi quy. Bài học: MSW 3 `onUnhandledFrame` không tự chặn request dạng tài sản; trước khi phát hiện có 2 request rỗng lọt ra production (không token, không tạo dữ liệu).
- Chụp lưu site cũ: `archive/old-site/` 741 trang (vi+en) + 740 `_next/data` + 286 tài sản (634MB, gitignore) — cần sao lưu ra ngoài máy.
