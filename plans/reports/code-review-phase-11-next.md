# Code review phase 11 — Next (landing/SEO/footer/polish), 2026-10-28

Kiểm tra: typecheck, lint, 234 vitest xanh (chạy trong sandbox cấm mạng). Không chạy build/e2e. Sanitizer thử 45 payload không lách được; JSON-LD escape đúng; hợp đồng đặt vé (body/query/thứ tự bước) không đổi; nút "Tiếp tục"/pay-bar không gửi đúp; click đơn logo ngân hàng không thanh toán.

## High
- **H1** `src/lib/route-landing.ts:23-37`, `docs/route-landing-contract.md`: với trang ISR (10 tuyến phổ biến), `use cache` quá `revalidate` được tạo lại ở foreground, không có stale-if-error → một lần WP lỗi/chậm lúc regen là trang nhận nội dung mẫu (title/H1/FAQ) trong 1 giờ. Sửa: map "last-good" trong bộ nhớ, dùng khi fetch lỗi; sửa docs; test "lỗi sau khi đã thành công → giữ nội dung cũ".
- **H2** `src/lib/route-listing.ts:36-48` + `[start]/[end]/page.tsx:20-33`: mọi lỗi CMS (5xx, timeout, zod) → `null` → trang 200 chỉ form + `noindex`, và ghi đè cache tốt. Sửa: chỉ 404 thật → null; lỗi tạm → ném (ISR giữ HTML cũ) hoặc dùng last-good.
- **H3** `globals.css` `:focus-visible` không nằm trong layer nên thắng `focus-visible:outline-white` → footer tối, CTA band không thấy focus (WCAG 2.4.7). Sửa: đưa vào `@layer base` hoặc biến `--hv-focus` theo vùng `.on-dark`.

## Medium
- **M1** `sanitize-html.ts:14` regex tag bậc hai: 200 KB `<a ` lặp → 21 s treo tiến trình. Sửa: scanner một lượt, giới hạn độ dài thuộc tính, test hiệu năng.
- **M2** `route-schema.ts:23` `provider @id /#organization` không tồn tại (Rank Math phát `#person`). Sửa: inline `Organization{name,url}`.
- **M3** `page.tsx:22` gọi WP + CMS cho mọi cặp slug lạ → khuếch đại tải, cache rác 7 ngày. Sửa: gọi CMS trước, WP chỉ khi CMS có tuyến.
- **M4** `layout-source.ts:28-37`: WP lỗi → fallback ghi đè layout tốt 1 giờ; `!res.ok` không log. Sửa: last-good + warn.
- **M5** `pay-bar.tsx:19` `aria-live` ẩn bằng `empty:hidden` → không đọc; trùng toast. Sửa: vùng live luôn có mặt, bỏ 1 trong 2.
- **M6** Docs/comment nói quá về stale 7 ngày và `main 16px`.
- **M7** Thiếu test: gợi ý chọn ghế, `ux.need_method/need_bank`, `aria-disabled`, click đơn logo bank, outage/last-good, perf sanitizer.

## Low
- L1 `imageSrc` regex nhận `/\evil.com`. L2 `href/ios/android/hotline` chưa validate. L3 `PUBLIC_ORIGIN` có `/` cuối → `//xe-khach` trong JSON-LD. L4 title tuyến lạ bị thêm suffix. L5 sanitizer bỏ `tel:`/`mailto:` (MKT cần hotline). L6 hex thô `tracking-page.tsx:45`. L7 reduced-motion trùng 2 file; `.hv-btn-outline:hover` bỏ qua `aria-disabled`. L8 body 14px / main 16px lệch cho dialog/toast/footer. L9 "Hotline:" chưa i18n; footer dùng `<a>` cho link nội bộ. L10 comment `--hv-field-edge` 4,5:1 thực 4,48:1.

## Đã xác minh không lỗi
Sanitizer (entity/whitespace/case/data:/`//`/srcset/style/on*/svg/math/comment); 1 H1/trang; hreflang vi + x-default; `/en` noindex,follow; canonical theo locale; sitemap revalidate 1h giữ Cache-Control; tương phản muted 7,0 / blue 6,35 / danger 5,6 / white-80 on #333 8,7; touch ≥48px; không `transition: all`.

## Câu hỏi mở
- CMS sập: hiện trang noindex 200 hay trả lỗi để giữ bản ISR tốt? (đề xuất: last-good; không có last-good thì ném lỗi).
- Provider JSON-LD: inline Organization (đề xuất) hay đổi Rank Math sang Organization.
- MKT có cần `tel:`/`mailto:` trong content_html? (đề xuất: có).
