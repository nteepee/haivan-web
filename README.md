# HaiVan-Web

Dựng lại web **haivan.com** trên chính domain: WordPress cho trang nội dung (MKT tự sửa) + Next.js cho luồng đặt vé xe khách và tài khoản. Backend (`apigw.haivan.com`, `cms.haivan.com`, `api.cpn.haivanexpress.vn`) là hạ tầng production của Hải Vân — không có sandbox.

## Cấu trúc
```
apps/booking/   Next.js 16 (App Router, TS strict, Tailwind 4) — /xe-khach/**, /tai-khoan/**, BFF /api/hv/**
wordpress/      WordPress + child theme haivan-web-child (compose, setup/import scripts)
deploy/         nginx gốc (deploy/nginx) + stack local (deploy/local)
scripts/        archive-old-site.mjs (chụp lưu site cũ vào archive/, không commit)
docs/           đặc tả luồng (REA + chạy thật), design guidelines, tech stack
plans/          kế hoạch triển khai (ak plan)
```

## Chạy
Yêu cầu: Node 22, pnpm 10.
```bash
pnpm install
cp apps/booking/.env.example apps/booking/.env.local   # điền SESSION_SECRET, site key
pnpm dev          # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm test
pnpm verify         # typecheck + lint + test + build kín (không gọi CMS/apigw thật)
pnpm e2e            # Playwright với mock apigw (e2e/mock-apigw.ts), 0 request production
pnpm contract-diff  # so body/query sinh ra với live capture (docs/booking-flow/00)
HV_SMOKE_LIVE=1 pnpm -C apps/booking smoke   # đọc thật, chỉ GET theo allowlist
```
Chạy cả stack (WordPress + Next sau nginx, http://localhost:8180): `docs/deployment-guide.md`.

Phiên bản: Next.js 16.4.3 (mặc định `cacheComponents`, `partialPrefetching` bật — đọc `apps/booking/node_modules/next/dist/docs/` trước khi viết code Next), React 19.3, Tailwind 4.3, Vitest 5, MSW 3, Playwright 1.64.

## Quy tắc an toàn
- Test **không bao giờ** gọi production (`haivan.com`, `apigw/cms.haivan.com`, `haivanexpress.vn`): Vitest chặn 3 lớp — DNS (`test/dns-block.ts`), MSW catch-all (`test/msw-server.ts`), cấm XHR đồng bộ; mọi lần thử bị ghi lại và làm test fail. Lưu ý MSW 3: tuỳ chọn là `onUnhandledFrame` và nó **không** tự chặn request dạng tài sản — đừng bỏ các lớp trên.
- E2E trỏ server + trình duyệt vào mock local (`APIGW_URL`, `NEXT_PUBLIC_*`, `WP_LAYOUT_URL`), build riêng vào `.next-e2e/`, không tái dùng server đang chạy.
- `.env.example` mặc định trỏ backend thật để dev xem dữ liệu thật (chỉ đọc); không thao tác ghi khi chưa được duyệt.
- Thao tác ghi thật (giữ chỗ, đặt vé, thanh toán, huỷ, OTP) chỉ chạy khi chủ dự án duyệt từng lần.
- Không commit `.env*`, token, ảnh/tài liệu có tên/SĐT thật (`docs/screenshots/private/`), bản chụp `archive/`.

## Tài liệu
- Luồng đặt vé (nguồn sự thật): `docs/booking-flow-spec.md`, `docs/booking-flow/00-03`
- Stack & quyết định: `docs/tech-stack.md` · Thiết kế: `docs/design-guidelines.md`
- WordPress (chạy, nhập nội dung cũ, MKT sửa trang): `docs/wordpress.md` · Triển khai: `docs/deployment-guide.md`
- Câu hỏi cần IT Hải Vân trả lời trước khi lên domain: `docs/hai-van-it-questions.md`
- Kế hoạch: `plans/261028-0738-haivan-web-rebuild/plan.md`
