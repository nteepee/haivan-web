# Red-team plan haivan-web-rebuild (2026-10-28)

Reviewer độc lập (code-reviewer). Kết luận ban đầu: chưa được triển khai, 4 critical. Đã xử lý trong plan như sau.

| Mã | Phát hiện | Xử lý |
|---|---|---|
| C1 | Playwright không chặn được request BFF phía server → E2E ghi production | Phase 1/10: `APIGW_URL` server-only, mock server, guard BFF khi `E2E=1`, DNS override chứng minh 0 request thật |
| C2 | Mã hoá cả `return_url` VNPay đổi tham số backend nhận | Phase 7: dựng chuỗi thô y hệt web cũ + test chuỗi |
| C3 | Proxy `[...path]` prefix-only → SSRF, lộ token | Phase 3: allowlist method+regex, kiểm segment, assert origin, test tấn công |
| C4 | WP cùng origin + không CSRF | Phase 3: CSRF (Origin, Sec-Fetch-Site, X-HV-Req, JSON); phase 9: khoá unfiltered_html, wp-admin giới hạn IP, CSP; ghi nhận rủi ro còn lại |
| H1 | OTP qua BFF dồn 1 IP | `get-otp` trình duyệt → apigw trực tiếp; limit_req nginx |
| H2 | Quy tắc chuyển tiếp header/body chưa rõ | Phase 3: header cố định, `Accept` JSON, query thô, `redirect:'manual'`, không chép header upstream, no-store |
| H3 | `check-promotions` thiếu 9 tham số | Phase 6: đủ khoá + `qs` + snapshot |
| H4 | Nháp thiếu `transit`/`newParams`; gate merchant | Phase 5/6 |
| H5 | `api/logout` chưa quan sát | Anh quyết bỏ hẳn (giống web cũ) |
| H6 | Affiliate thiếu scan-log, cookie trên mọi trang, trạng thái `aff` | Phase 5/9/10 |
| H7 | Tài sản `public/`, sitemap Next rơi vào WP | Import asset qua `_next/static`; `/xe-khach/sitemap.xml` |
| H8 | `/en/` cho trang đặt vé (đã kiểm: 200) | Phase 2/4/10: middleware locale, nginx `/en/(xe-khach|tai-khoan|partner|tracking)` |
| H9 | Trạng thái đăng nhập trên trang WP | Phase 9: header gọi `/api/hv/auth/session`, `/tai-khoan/dang-nhap` |
| H10 | Thiếu `cap-nhat-dich-vu`, modal số khách combo, body huỷ trung chuyển, `reward/definition`, `/tracking` | Phase 5/8, allowlist |
| H11 | Hành vi trang tuyến chưa xác minh | Đã kiểm: SSR `route-listing`, `el/trips` ngày hôm nay không `type`, slug sai trả 200 → phase 4 |
| M1–M9, L1–L4 | Bỏ tham số rỗng, smoke allowlist, CSP theo location, mã thật trong docs (đã thay mã giả, ảnh 06 chuyển private), cutover DNS, chụp lưu site cũ, effort (18.5 → ~30 ngày), session Max-Age, permalink WP, xác minh thanh toán chậm | Đã đưa vào phase tương ứng |

Câu hỏi còn mở: owner-scope của `bookings/{code}`; throttle apigw theo IP; quản trị DNS/hosting cũ.
