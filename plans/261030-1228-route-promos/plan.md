---
title: "Khuyến mãi kiểu booking trên trang tuyến, điều khiển trong WP"
status: completed
created: 2026-10-30
---

# Khuyến mãi trên trang tuyến (combo + khứ hồi), bật/tắt trong WP

## Khung mục tiêu
- **Kết quả:** trang `/xe-khach/<tuyến>` có khối "Ưu đãi đang diễn ra" như booking.haivan.com (giá combo, giá gốc gạch, điều kiện, nút đặt);
  thẻ chuyến đủ điều kiện có nhãn Combo + giá "từ"; combo tự gắn mã ở bước xác nhận như khứ hồi. Bật/tắt, giá hiển thị, điều kiện,
  tiêu đề đều sửa trong WP (bài "Chương trình giảm giá").
- **Ràng buộc:** giảm giá thật vẫn do ERP tính theo mã; mã không xuống trình duyệt; chương trình không có mã thì không hiện;
  server kiểm lại điều kiện combo (tuyến, chiều, ngày/giờ, đặt trước, số vé) trước khi đổi token thành mã. Không ghi gì lên production.
- **Thay đổi quyết định cũ (ghi rõ):** kế hoạch 261029-1444 tắt combo bằng cờ cứng `AUTO_COMBO_ENABLED` vì combo của booking.haivan.com
  là code riêng. Nay chuyển quyền bật/tắt sang WP: combo chỉ chạy khi MKT bật bài + có mã ERP do IT tạo. Mặc định mọi combo mẫu đều tắt.
- **Không làm:** clone backend `web-combo` của booking; tự trừ tiền ở web; giữ chỗ hàng cuối theo số ghế (ghế do khách chọn).
- **Điều kiện xong:** test đơn vị cho khối ưu đãi, combo eligibility phía server, payload WP; typecheck/lint/test xanh; ảnh chụp
  trang tuyến có khối ưu đãi khi bật một chương trình (chỉ trên DB local), không có khối khi tắt.

## Bước
1. WP `inc/promos.php`: ô tiêu đề, điều kiện (vi/en), "hiện trên trang tuyến"; xuất `headline`, `terms`, `show_on_route` trong booking-config.
2. Seed combo mẫu (tắt, chưa mã) theo booking cũ: SG–VT đặt trước 1 giờ; HN–ĐB đặt trước 3 ngày / 7 ngày.
3. Next: schema promo thêm trường; bỏ cờ cứng combo; token combo dùng mã đơn hiện tại; server `checkComboEligibility`.
4. Next: khối `RoutePromos` trên trang tuyến (sau thẻ tìm vé).
5. Test, review, build, chụp, commit; cập nhật contract.

## Kết quả (30/10/2026)
- Xong bước 1–5. Review: siết combo theo hạng xe + đúng số vé (client và server), server chỉ nhận combo khớp đầu tiên; WP bỏ chương trình quá `travel_to`.
- Kiểm: 532 test xanh; bật thử combo SG–VT bằng mã giả trên DB local để chụp khối ưu đãi (mã không lọt HTML), sau đó tắt và xoá mã.
- Còn mở: IT tạo mã ERP cho từng combo; xác nhận ERP từ chối mã sai hạng/số vé; `POST bookings` có cố định tập ghế theo `order_code` không.
