# Review mã khứ hồi ẩn + SEO (29/10/2026)
Không Critical. Kiểm: typecheck, lint, 505 test, contract-diff 9/9, check-tokens, php -l xanh; mã thật không có trong .next*/static, public config không có `code`, promo-codes 403 no-store khi sai/thiếu secret.

| Mức | Mã | Vấn đề | Chỗ | Sửa |
|---|---|---|---|---|
| High | H1 | Gõ thẳng mã thật bỏ qua mọi điều kiện | promo-substitute.ts:62 | chặn mã ẩn xuất hiện ngoài token (422); bỏ mã khỏi seed commit; đổi mã trong ERP trước go-live |
| High | H2 | Che mã chỉ ở vài endpoint | gw route.ts:12 | che mọi response gw |
| High | H3 | Tập mã che chỉ gồm chương trình đang chạy, trong RAM | booking-config.php:97, promo-secrets.ts:67 | WP trả mọi mã từng có (`mask`); Next hợp nhất, giữ mãi; rỗng → 503 cho path có đơn |
| Med | M1 | Tham số query trùng (bookingCode, merchant_code) | promo-substitute.ts:81 | 422 khi trùng / dựng lại query |
| Med | M2 | Token thay ở mọi chỗ trong body/query | promo-substitute.ts:104 | chỉ ở seats[].code / codes[i][promotion] |
| Med | M3 | Giả định quyền sở hữu đơn, paid = !!payment.type, không xét đơn huỷ | promo-substitute.ts:30-47 | so khách, `payment.type===1`, loại status 3 |
| Med | M4 | Hàng mã bị che hiện `@auto:` trong UI | promo-tabs.tsx:74, offers-page.tsx:46 | lọc |
| Med | M5 | Không cache âm khi WP chậm | promo-secrets.ts:67 | cache âm 30 s |
| Med | M6 | Regex nginx bypass cache backtracking | deploy/nginx/nginx.conf:51 | regex tuyến tính |
| Med | M7 | Thiếu tài liệu env production (HV_WP_SHARED_SECRET, WP_ROUTE_URL) | docs/deployment-guide.md | bổ sung + check-seo-golive báo lỗi |
| Low | — | timeout 30 s → 422 sai; last-good giữ mãi; nhãn WP có thể chứa mã; departure_time vs reached_at; check-ssr bỏ qua file thiếu; regex hotline với 1900 6773 000 | xem báo cáo gốc | — |
