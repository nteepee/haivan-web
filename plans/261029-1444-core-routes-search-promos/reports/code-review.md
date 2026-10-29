# Code review — 4 tuyến + ô tìm + chương trình giảm giá (261029)

Reviewer: code-reviewer (đọc, không sửa). Kiểm: typecheck, lint, 438 test, contract-diff 9/9, check-tokens, php -l, node --check: xanh. Không Critical. Hợp đồng apigw không đổi.

| Mức | Mã | Vấn đề | Chỗ | Hướng sửa |
|---|---|---|---|---|
| High | H1 | Tự áp mã chạy đua với "Tiếp tục" và với mã nhập tay (đơn đi không mã; mã tay bị ghi đè) | `confirm-form.tsx:140`, `auto-promo.tsx:31-39`, `promo-apply.ts:47-51` | khoá nút + hộp KM khi đang kiểm; bỏ kết quả nếu ghế đã đổi; test |
| Med | M1 | Khứ hồi bỏ qua ngày đi/thứ/giờ/đặt trước | `promo-match.ts:25-32`, `search.js:457-468`, `return-cta.tsx:57` | áp cùng bộ lọc |
| Med | M2 | Slug landing 3 đoạn làm Next bỏ cả tuyến | `home.php:22`, `booking-config.ts:14,65-71` | WP chỉ nhận `a/b`; log khi bỏ |
| Med | M3 | Sửa tìm kiếm mất ngày về | `corridor-form.tsx:100-101` | khởi tạo từ `ngay_ve` |
| Med | M4 | Tải lại/quay lại mất nhãn "Đã áp" dù ghế còn mã | `promo-apply.ts:29`, `auto-promo.tsx:23` | suy nhãn từ mã trên ghế |
| Med | M5 | Một lần trượt cache SG–VT ≈ 11 request dồn; retry khi 429 | `search.js:295,374-377`, `providers.tsx:23` | giới hạn 3 song song, `retry:false`, dừng khi 429/ẩn tab |
| Med | M6 | Giá combo do WP gõ tay | `trip-card.tsx:85,138` | ghi "giá tham khảo" |
| Med | M7 | CPT KM dùng quyền `post` (Author bật được) | `promos.php:42-66` | chỉ editor+ được bật |
| Low | L1–L10 | entity trong tiêu đề; số khách khi bấm chip; ngày về mặc định giường nằm lệch WP/Next; tham số tự khai; nút chiều về hiện khi chưa trả; thiếu kiểm tiêu đề/giới hạn số bài; `static $n`; giờ site vs VN; thiếu test; khoá i18n lệch | xem báo cáo gốc trong phiên | — |

Câu hỏi mở: landing tĩnh có giữ config lâu hơn 5 phút không (ISR); `en.json` `booking.order_missing_*` có từ tính năng này không.
