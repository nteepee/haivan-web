---
phase: 8
title: "Tài khoản: vé của tôi, hồ sơ"
status: completed
priority: P2
effort: "3.5d"
dependencies: [3]
---

# Phase 8: Tài khoản — Chuyến đi của tôi, Thông tin cá nhân

## Overview
`/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh`, `/tai-khoan/thong-tin-ca-nhan`, `/tai-khoan/uu-dai`, `/tai-khoan/khach-hang-than-thiet`, `/tai-khoan/dang-xuat`, sidebar tài khoản.

## Requirements (`03-payment-account.md` §3–4, live capture bước 5–6)
- Sidebar: tên + SĐT, Thông tin cá nhân · Ưu đãi của tôi · Chuyến đi của tôi (Xe liên tỉnh; Xe sân bay/Xe du lịch → giữ link, trang "đang cập nhật" vì ngoài phạm vi) · Đăng xuất.
- Chuyến đi: tab Chuyến đi sắp tới / Hoàn thành / Chuyến huỷ = `booking-status[0]=1|2|3`, "Xem thêm" theo meta; hàng đơn (mã đơn, ngày tạo, nút xanh "Thanh toán" + số tiền khi chưa thanh toán → `/xe-khach/thanh-toan?booking_code&merchant_code=merchant.code&trip_id=booking_ticket[0].trip_id`).
- Mở đơn: `bookings/{code}?merchant_code`; thẻ vé (tuyến, ngày, hạng, giá, phụ thu, giờ/điểm, QR mã vé, số ghế), "Thông tin dịch vụ bổ sung".
- Huỷ: lý do `list-reason` (`reason_vi`/`reason_en` theo ngôn ngữ, ô ghi chú chỉ bật cho "Lý do khác"); huỷ vé `POST cancel-seat {order_code, seat_code, merchant_code, reason_cancel_id, reason_cancel_note}` (khi `booking_ticket[].is_cancel`); huỷ cả đơn `POST cancel-booking {order_code, merchant_code, reason_cancel_id, reason_cancel_note, type:0}` (đơn chưa thanh toán, giá > 0, > 1 vé, chưa huỷ). Thành công → tải lại danh sách.
- Tải hoá đơn (tab Hoàn thành): `bookings/download-bill?ticket_code&merchant_code` → `base64pdf` → tải file.
- Huỷ dịch vụ trung chuyển: modal bắt buộc lý do → `DELETE transit/cancel-order/{code}` body `{reason, type:0}` rồi tải lại (sửa lỗi `onRefreshList`).
- Trang `/xe-khach/cap-nhat-dich-vu?code&merchant_code` (nút "Thông tin dịch vụ bổ sung"): `v4/detail-transit/{code}`, `v4/get-info-ticket`, `POST v4/update-transit` theo `02-confirm-booking.md` mục cập nhật dịch vụ.
- Trang `/tracking` (+ `/tracking/hv`, `/tracking/hshv`): tra vị trí xe theo mã vé `trip/search-location-detail?operator_id&ticket_code` (công khai, trình duyệt → apigw) — đọc chunk cũ trước khi dựng để giữ hành vi.
- Thông tin cá nhân: đọc từ `customer/customers` (+ `customer/definition` cho danh mục); thành viên thân thiết → `PUT customer/customers/update-profile`, chưa → `POST customer/customers` (đăng ký); hoá đơn `POST customer/customers/tax` (đọc `invoice_info`); modal bắt cập nhật khi `data_source===1` như web cũ.
- Ưu đãi: `promotion/promotional_code_list_all?source=1`; Khách hàng thân thiết: `reward/definition` + rank.

## Architecture
`app/(booking)/tai-khoan/layout.tsx` (yêu cầu phiên; chưa đăng nhập → modal/redirect) · `components/account/{sidebar,booking-row,booking-detail,ticket-card,cancel-dialog,bill-download,profile-form,tax-form}.tsx`.

## Related Code Files
- Create: các file trên + tests (fixtures `my_bookings.json`, `cancel.json`, `cancel_reasons.json`, live).

## Implementation Steps
1. Layout + sidebar + guard phiên.
2. Danh sách 3 tab + phân trang + mở đơn.
3. Huỷ vé/huỷ đơn + test body (live `cancel-seat`).
4. Tải hoá đơn.
5. Hồ sơ + hoá đơn + ưu đãi + khách hàng thân thiết.

## Success Criteria
- [ ] Body `cancel-seat` khớp live; `cancel-booking` có `type:0`.
- [ ] Nút huỷ chỉ hiện đúng điều kiện; nút "Thanh toán" dẫn đúng URL.
- [ ] Hồ sơ lưu đúng endpoint theo trạng thái thành viên.

## Risk Assessment
- `cancel-booking` nhiều vé, `download-bill`, `update-profile` chưa chạy live → test hợp đồng; chạy thật có duyệt ở phase 10.

## Kết quả (2026-10-28)
- Trang: `tai-khoan/(account)/*` (chuyến đi của tôi 3 tab, thông tin cá nhân + hoá đơn, ưu đãi, khách hàng thân thiết; xe sân bay/trung chuyển/hợp đồng/hàng hoá là placeholder), `tai-khoan/dang-xuat`, `xe-khach/cap-nhat-dich-vu`, `tracking`.
- `ForceProfileDialog` gắn ở root layout (chỉ hiện khi đã đăng nhập và `data_source===1`).
- Test: unit + MSW (cancel-seat byte-exact với live capture, cancel-booking `type:0`, PUT/POST hồ sơ, tax, update-transit, download-bill) + component; `pnpm verify` xanh (127 test).
- Chưa làm (cố ý): vị trí xe realtime ở `/tracking` (web cũ dùng MQTT, `uri:"useMap"` có vẻ hỏng) và `/tracking/hv`, `/tracking/hshv` (web cũ để lộ URL broker + user/pass trong bundle công khai) → hiện thông báo "đang cập nhật". Cần quyết: có đưa màn hình đội xe nội bộ lên web công khai không; nếu có, lấy broker/credential qua env phía server.
- Chưa chạy thật: cancel-booking nhiều vé, download-bill, update-profile, shape `detail-transit`/`get-info-ticket`/`customer/definition` (phase 10 Tier C).
- Code review (`plans/reports/code-review-phase-08.md`) đã sửa:
  - H1: bỏ chặn theo `is_cancel` (web cũ không đọc; fixture cho thấy `true` trên vé đã huỷ).
  - H2: 401 ở `customer/customers` → làm mới session, về "/".
  - M1: `gw()` từ chối path có `..`/`?`/`#`/`\\`/`//`/dạng mã hoá; sửa luôn lỗ tương tự ở phase 7.
  - M2: nút thử lại khi `customer/definition` lỗi.
  - M3: chặn huỷ đúp.
  - M4: không bắt nhập tên/ngày sinh khi bị khoá.
  - M5: làm mới cache sau cập nhật dịch vụ.
- Còn mở: nghĩa thật của `is_cancel` trên đơn đang hoạt động; `trip/search-location-detail` có cần token; `customer/definition` có bọc `data` (sẽ kiểm ở Tier C).
