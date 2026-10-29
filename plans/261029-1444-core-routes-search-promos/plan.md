---
title: "4 tuyến chính: ô tìm vé theo tuyến + chương trình giảm giá bật/tắt trong WP + khứ hồi"
status: in-progress
priority: P1
created: 2026-10-29
blockedBy: []
---

# 4 tuyến chính + ô tìm vé theo tuyến + chương trình giảm giá

## Brainstorm contract (anh duyệt 2026-10-29)
- **Outcome:** trang chủ, trang tuyến và ô tìm vé đưa 4 tuyến chính (Sài Gòn – Vũng Tàu, Hà Nội – Điện Biên, Hà Nội – Mộc Châu, Hà Nội – Sơn La) lên trước theo wireframe bản 2 (nút tuyến, điểm đi/đến là trạm thật, "+ Thêm ngày về", số vé, "Chuyến hôm nay" theo khung giờ); tuyến khác chỉ qua link "Đi tỉnh khác?". MKT bật/tắt chương trình giảm giá (khứ hồi theo ghế, combo theo ngày/giờ/ghế) trong WP; web tự gắn mã ERP ở bước xác nhận. Khứ hồi = 2 đơn liên tiếp.
- **Constraints:** không đổi hợp đồng apigw (`el/trips` query, hold, `promotion/check-promotions`, booking body) — chỉ thêm query riêng trên URL trang của mình (không gửi apigw); giá giảm thật luôn do apigw/ERP tính, web không tự trừ tiền, không hiện nhãn giảm khi chương trình chưa có mã; tests không gọi production; design v4 (`design.md`), token-only, `node docs/design/check-tokens.mjs` + `node scripts/layout-audit.mjs` sạch.
- **Non-goals:** gộp 2 chặng vào 1 đơn/1 lần thanh toán (apigw không hỗ trợ); clone ERP riêng của booking.haivan.com (`web-combo`, `web-bookings`, Turnstile); sửa nội dung bài cũ (đã có báo cáo audit riêng).
- **Acceptance:** (1) `GET /wp-json/haivan-web/v1/booking-config` đúng `contract.md`, chương trình tắt/thiếu mã/hết hạn không xuất hiện; (2) ô tìm vé WP + Next: chọn tuyến → trạm đúng theo chiều, đổi chiều, ngày về tuỳ chọn, URL `tim-chuyen` sinh ra khớp `buildSearchUrl` (test); (3) nhãn ưu đãi chỉ hiện khi có chương trình khớp; (4) xác nhận tự gọi `check-promotions` với mã + ghế đủ điều kiện, server từ chối → gỡ nhãn + báo; (5) thành công chiều đi có nút "Đặt chiều về" dẫn tới tìm chuyến chiều ngược, ngày về, đúng trạm; (6) `pnpm verify`, `pnpm contract-diff`, e2e, layout-audit 0 lỗi template.

## Nguồn dữ liệu
- Trạm từng tuyến, ghi chú, ngày tối đa, giường nằm: `plans/reports/booking-haivan-search-widget-spec.md` §1, §5 (raw HTML/JS: scratchpad `booking-hv-src/`).
- Hợp đồng WP ↔ Next: [contract.md](./contract.md).

## Phases
| # | Phase | Chủ file | Status |
|---|---|---|---|
| 1 | WP: CPT `hv_corridor` + `hv_promo`, meta box, seed 4 tuyến, REST `booking-config`; trang chủ: khối tuyến = 4 tuyến; ô tìm `[haivan_search]` chế độ tuyến | `wordpress/**` | pending |
| 2 | Next: nguồn `booking-config` (last-good + fallback json), `SearchForm` chế độ tuyến, nhãn ưu đãi (form, thẻ chuyến), tự áp mã ở xác nhận, khứ hồi 2 đơn (draft + nút "Đặt chiều về"), ghi chú trạm vào `note` | `apps/booking/**` | pending |
| 3 | Kiểm: verify, contract-diff, e2e (mock), check-tokens, layout-audit, review | — | pending |

## Rủi ro
- Mã ERP tự áp thực chất công khai (nằm trong REST và body đặt vé) → IT phải giới hạn mã theo tuyến/ngày/số lượng trong ERP. Ghi rõ trong admin WP.
- Trạm của booking.haivan.com là điểm ghi chú (trừ SG–VT: điểm Q1 vs Tân Sơn Nhất đổi toạ độ → khác chuyến). Danh sách chuyến của mình theo apigw, có thể khác trang của họ.
- Chưa chạy thật `check-promotions` (cần giữ ghế = ghi production) → chỉ mock; chạy thật khi anh cho phép.

## Quyết định anh (29/10/2026 tối)
- Pháp lý: lấy đúng thông tin footer VI làm chuẩn cho mọi trang.
- Combo: booking.haivan.com đang hand-code (không phải cơ chế ERP) → không clone; giữ loại combo trong CPT nhưng không seed, không tự áp.
- Khứ hồi: mã ERP `<MÃ_ERP>`, phải áp ẩn — mã không bao giờ tới trình duyệt. WP chỉ public `has_code`; mã nằm ở REST riêng có secret; BFF thay token `@auto:<id>` bằng mã thật trước khi gửi apigw và che mã trong response; kiểm điều kiện phía server (đơn chiều đi cùng khách, đã thanh toán, ngược chiều).
