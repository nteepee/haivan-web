---
title: "SEO hardening theo master audit"
status: in-progress
priority: P1
created: 2026-10-29
---

# SEO hardening

Nguồn việc: `plans/reports/seo-task-list-261029.md` (#1–#34), audit gốc `/Users/phuc/Documents/SEO works /HAIVAN-MASTER-AUDIT-FULL.md`.

## Contract
- **Outcome:** các lỗi kỹ thuật/onpage/nội dung trong danh sách được sửa trên local; việc pháp lý và ngoài site có tài liệu bàn giao.
- **Constraints:** không đổi hợp đồng apigw; không ghi production; nội dung bài chỉ sửa bằng script idempotent chạy lại được trên production (không sửa tay DB); không bịa số liệu (đánh giá, giá, pháp lý); design v4; tokens-only.
- **Non-goals:** chọn địa chỉ pháp lý đúng (#25, #26 tài khoản) — chờ anh; viết bài mới; backlink thật.
- **Acceptance:** `curl` mọi trang Next có ≥1 `<h1>` + nội dung chính trong HTML; `layout-audit --all` 0 lỗi template + lỗi nội dung giảm về 0 với các luật tràn/H1/ảnh; Rank Math/JSON-LD có Article+Breadcrumb cho bài; robots/nofollow đăng nhập; 4 landing chiều thiếu có H1 + nội dung, indexable; `pnpm verify`, contract-diff, e2e, check-tokens xanh.

## Gói việc (chủ file)
| Gói | Việc (# trong danh sách) | Chủ file |
|---|---|---|
| A Next | 1, 3, 4(Next), 5(Next), 7(Next: nút chiều ngược), 10(khung bảng), 11, 12(Next), 13(fallback), 23, 30(Next), 31(Next) | `apps/booking/**` trừ `components/search/*` khi gói corridor còn chạy |
| B WP code | 4(WP), 5(WP: hv_route + REST cho tuyến chưa có CMS), 12(WP), 13(seed menu), 14, 15, 16, 17, 18, 21, 24, 30(WP), 31(WP) | `wordpress/wp-content/themes/**` (trừ search.*), `wordpress/scripts/*` mới |
| C Nội dung | 19, 20, 22 (đề xuất), 26 (hotline, "Công ty Công ty"), 27, 28, 29 | `wordpress/scripts/content-*.php` + chạy wp-cli |
| D Hạ tầng | 2, 3 (checklist), 6 | `deploy/**`, `docs/deployment-guide.md` |
| E MKT | 8, 9 (brief), 25 (bảng mâu thuẫn), 32–34 | `docs/seo/*.md` |

## Chạy thật có duyệt (anh đồng ý 29/10/2026, sau khi các gói xong)
- Bật ghi thật ở local (`HV_LIVE_WRITES=1`, apigw production), tắt lại sau khi test.
- Đăng nhập OTP: anh tự nhập SĐT + OTP trong trình duyệt (em không nhập thay).
- Đặt 1 ghế, ngày xa, không thanh toán (dừng ở trang cổng thanh toán), huỷ ngay.
- Áp mã: mã có sẵn trong danh sách hệ thống trả cho chuyến đó, trên đơn test, rồi huỷ đơn.

### Kết quả chạy thật lần 1 (29/10/2026)
- Đăng nhập OTP: đạt (anh tự nhập).
- Giữ chỗ + tạo đơn: đạt — SG–VT Luxury 07:00 23/11/2026, ghế 1, 200.000đ, đơn B027…KZ, không thanh toán.
- Huỷ vé: đạt — "Huỷ thành công", đơn ở tab Chuyến huỷ.
- Áp mã: LỖI — schema zod chặn `available_quantity` dạng chuỗi ("không giới hạn") → danh sách mã ở xác nhận rỗng (lỗi bị nuốt), trang Ưu đãi báo lỗi. Đang sửa (gói A), test lại với mã thử nghiệm của IT trên đơn mới rồi huỷ.
- Ghi nhận khác: `v4/get-price-transit` 500, `price-ticket` (is_combo=1) 404 ở bước xác nhận — đối chiếu web cũ.
- Lần 2: danh sách mã hiện mã thử nghiệm của IT (đã sửa schema). `check-promotions` trả "Mã khuyến mại khả dụng", giảm 200.000đ, nhưng UI không cập nhật và nút Áp dụng kẹt → đang sửa xử lý kết quả + làm lại hộp mã. Chỉ giữ chỗ (chưa tạo đơn), để tự hết hạn.
- Lần 3: áp mã thử nghiệm của IT đạt (-200.000đ, tổng 0đ; server trả chậm >5 s). Tạo đơn 0đ B026…38 → hệ thống xác nhận ngay; trang thành công lỗi 422 thiếu `merchant_code` (đang sửa). Huỷ đơn: đạt.
