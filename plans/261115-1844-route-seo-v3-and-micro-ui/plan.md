# Route SEO v3 + micro UI (15/11/2026)

Status: in progress. Local first; stg deploy only after user approval.

## Quyết định của anh (chủ sản phẩm, người chốt mọi mâu thuẫn)

1. Có trung chuyển tới bệnh viện. Có trả tận nơi ở Sơn La và Mộc Châu.
2. Chuyến cuối từ Vũng Tàu: 21h45.
3. Hạng xe: Royal (22/24 giường), Luxury (34–36 giường), Eco (44 giường). Diễn giải bằng tiếng Việt cho hợp insight khách (vd. Royal = cabin riêng ít chỗ, Eco = tiết kiệm).
4. Đổi/hoàn vé: theo đúng chính sách đang có trên web (tuỳ rule từng SBU) → không viết con số tuyệt đối trong FAQ, dẫn link chính sách. Trẻ em: từ 6 tuổi trở lên hoặc trên 25 kg phải mua ghế riêng.
5. Tích điểm 10%: chỉ khi đặt qua kênh của Hải Vân và đã đăng ký chương trình "Tôi yêu Hải Vân" → luôn kèm link đăng ký.
6. Chiều về: Bản Phủ → Mỹ Đình và Mường Chà → Mỹ Đình có; Điện Biên → Yên Nghĩa chưa có.
7. Đi xe miễn phí cho người bệnh: đang áp dụng tại Điện Biên, Mộc Châu – Sơn La, với các phường/xã đã đồng hành tổ chức.
8. `/bus-app/[id]` vẫn dùng để tải app → phải giữ.
9. Comment trong 13 doc = chốt phase 1; sửa tiếp sau.
10. 5 tuyến trang mỏng (03, 04, 07, 08, 09) dựng đủ bố cục như tuyến chính.
11. Sửa giá, combo, ưu đãi trong WP phải hiện ngay trên Next, không cần sync (giá linh hoạt).
12. Bỏ khối "Chuyện có thật" (đoàn 6 khách lỡ chuyến bay) ở trang chủ; thay bằng đánh giá thật của khách (Google / trang booking.haivan.com/mua-ve-xe-sai-gon-vung-tau/).
13. Chữ vàng ở tiêu đề lớn: giữ họ màu brand nhưng không chói/không đục.

## Phần việc (subagent, tách file)

| Phần | File được sửa |
|---|---|
| A. Nội dung 4 tuyến Vũng Tàu | `wordpress/scripts/route-copy-v3-south.php` |
| B. Nội dung 9 tuyến Bắc + 2 chiều về mới | `wordpress/scripts/route-copy-v3-north.php`, sitemap tuyến nếu cần |
| C. Trang chủ: bỏ story, thêm đánh giá, màu chữ vàng | theme `inc/home-v2.php`, `front-page.php`, `assets/css/v2.css`, `app-v3.css`; `apps/booking/src/app/v2.css` |
| D. `/bus-app/[id]` | `inc/redirects.php` hoặc route Next + nginx |
| E. Giá/combo WP → Next tức thì | cache của promo/rules trong `apps/booking/src/lib` |

Nguồn: báo cáo `plans/reports/seo-261115-1449-*.md`, 13 doc (ID trong báo cáo chi tiết).
Backup DB local trước khi sửa: scratchpad `local-wp-before-route-v3-261115.sql.gz`.

## Tiêu chí xong

- 15 trang tuyến có title/meta mới, FAQ đúng chính sách trên, không còn "Mường Trà", "Bán Phủ", "thuật tiện", câu chính sách cũ.
- Script idempotent, chạy được trên local và stg.
- Trang chủ không còn story; có khối đánh giá thật; màu chữ vàng mới đạt ≥ 3:1 cho chữ lớn.
- `/bus-app/<id>` hoạt động như web gốc.
- Sửa giá/combo trong WP thấy trên Next không cần thao tác sync (có bằng chứng).
- typecheck, lint, test, build Next qua.
