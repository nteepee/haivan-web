---
phase: 2
title: "Nền app đặt vé"
status: completed
priority: P1
effort: "2.5d"
dependencies: [1]
---

# Phase 2: Nền app đặt vé (tokens, layout, i18n, API client, schemas)

## Overview
Các khối dùng chung cho mọi trang `/xe-khach/**` và `/tai-khoan/**`: giao diện theo design guidelines, header/footer, chuỗi vi/en, client gọi apigw/CMS, schema zod cho mọi response đã quan sát.

## Requirements
- Functional:
  - Tokens Tailwind từ `docs/design-guidelines.md` (vàng `#FFC20E`, nền `#F8F8F8`, chữ `#212529`, bo 4px, Nunito vietnamese qua `next/font`).
  - Header (logo, menu, Đăng nhập/Tài khoản dropdown, ngôn ngữ) + footer; dữ liệu menu/footer lấy từ WP `haivan-web/v1/layout` (cache 1h) với bản tĩnh dự phòng trong repo khi WP lỗi.
  - i18n vi (mặc định) / en: dictionary từ `docs/reference/locales/{vi,en}/common.json` copy vào `src/i18n/`, hàm `t(key)` kiểu an toàn; thêm khoá thiếu `login_form.msg.error_input`. Web cũ có tiền tố `/en/` cho trang đặt vé/tài khoản (đã kiểm `/en/xe-khach/...` = 200) → middleware Next rewrite `/en/:path*` → cùng trang với `locale=en`; đồng bộ với Polylang: đọc cookie `pll_language` khi không có tiền tố, link sinh ra giữ tiền tố hiện tại.
  - `lib/http.ts`: `apigw(path, {method, query, body, auth})` gắn `Accept: application/json`, `Domain: haivan.com`, `Content-Type` khi có body; **chỉ bỏ tham số `undefined`/`null`/`""`** (giữ `0`, `false`: live gửi `type=0`, `is_combo:0`, `adm_id=0`); `lib/qs.ts` serialize mảng/đối tượng kiểu `qs` mặc định (indices, ngoặc mã hoá); ném `ApiError{status, message, errors}` (lấy `errors` giá trị đầu, sau đó `message`, giống web cũ).
  - Validation form giữ ngang web cũ (không regex chặt hơn backend chấp nhận).
  - `lib/cms.ts` cho `cms.haivan.com` (không Authorization).
  - Schemas zod (`src/schemas/`): places, trips (+meta), seat map (`data[floor][row][col]`, `seat_group`, `is_locked`, `message`, `link`, `note`), trip_detail journey, hold, booking response, info-payments (mảng), info-payment-block, bookings list (`booking_info`, `booking_ticket[]`), customer/customers, customer/definition, list-reason, get-otp, verify-otp, route-listing.
  - Fixtures test: lấy từ `/Users/phuc/Documents/REA Android/app/src/test/resources/fixtures/*.json` (chỉ đọc, copy; đã ẩn danh) + body/response live trong `docs/booking-flow/00` (mã đơn/vé giả, không tên/SĐT thật).
- Non-functional: mọi file < 200 dòng; không `any`; response lạ → parse lỗi hiển thị thông báo chung + log.

## Architecture
`src/app/(booking)/layout.tsx` (header/footer server component) · `src/components/ui/*` (shadcn: button, dialog, radio-group, input, tabs, toast) · `src/lib/{http,cms,format}.ts` · `src/schemas/*` · `src/i18n/*`.

## Related Code Files
- Create: `apps/booking/src/app/(booking)/layout.tsx`, `src/components/layout/{site-header,site-footer,account-menu,language-switch}.tsx`, `src/lib/{http,cms,format,layout-source}.ts`, `src/schemas/*.ts`, `src/i18n/{vi,en}.json`, `src/i18n/t.ts`, `test/fixtures/*`, `test/schemas.test.ts`
- Modify: `apps/booking/tailwind/globals.css` (tokens)

## Implementation Steps
1. Tokens + font + shadcn init (style mặc định, màu chủ đạo = `--hv-yellow`).
2. Header/footer theo ảnh `docs/screenshots/01-tim-chuyen.jpg`; nguồn layout có fallback tĩnh.
3. i18n dictionary + `t()`; test khoá tồn tại ở cả vi/en.
4. `http.ts`/`cms.ts` + test: header đúng, bỏ tham số rỗng (backend từ chối `sort_by=`), map lỗi `{message}`/`{errors}`.
5. Schemas + test parse toàn bộ fixtures (Android + live).
6. Helpers định dạng: tiền `250.000đ`/`VNĐ`, ngày `DD-MM-YYYY` ↔ ISO, `expire_time "DD-MM-YYYY HH:mm:ss"` → epoch (Asia/Ho_Chi_Minh).

## Success Criteria
- [ ] Mọi fixture parse qua schema; test header `Domain` + không có `PartnerId`.
- [ ] Header/footer hiển thị đúng khi WP tắt (fallback).
- [ ] Lighthouse a11y ≥ 90 trên trang trống có layout.

## Risk Assessment
- Schema quá chặt làm vỡ khi backend thêm trường → dùng `.passthrough()`, chỉ bắt buộc trường đang dùng. Dấu hiệu: smoke live parse lỗi → nới schema, không sửa dữ liệu.

## Kết quả (2026-10-28)
- Định tuyến ngôn ngữ: `src/proxy.ts` rewrite `/x` → `/vi/x`, giữ `/en/x`; mọi trang dưới `app/[lang]` (root layout), `generateStaticParams` vi/en.
- Quy ước Cache Components: server component không gọi `cookies()/headers()`; phiên chỉ đọc phía client qua `/api/hv/auth/session`; client dùng `useSearchParams` phải nằm trong `<Suspense>`.
- Hợp đồng layout WP↔Next: `src/schemas/layout.ts` + bản dự phòng `src/content/layout-fallback.json` (WP phải trả đúng); `getSiteLayout()` `use cache` 1h.
- `lib/qs.ts` tái tạo `qs.stringify` của web cũ (indices, ngoặc mã hoá, %20); `lib/http.ts` (`apigw`, `cms`, `gw`, `bff`), header `Domain: haivan.com` cố định.
- shadcn (radix-nova) + tokens Hải Vân; `output: "standalone"`, `images.remotePatterns` cms/haivan.
