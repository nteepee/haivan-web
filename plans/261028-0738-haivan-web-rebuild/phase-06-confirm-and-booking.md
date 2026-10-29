---
phase: 6
title: "Xác nhận + đặt vé"
status: completed
priority: P1
effort: "4d"
dependencies: [5]
---

# Phase 6: Xác nhận + đặt vé

## Overview
Trang `/xe-khach/xac-nhan`: thông tin khách, dịch vụ đón/trả tận nhà, hoá đơn, khuyến mãi & đổi điểm, chi tiết giá, đồng hồ → `POST api/bookings` → thanh toán hoặc thành công.

## Requirements (`02-confirm-booking.md`, live capture bước 2–3)
- Guard: không có nháp → về trang tìm (web cũ quay vòng mãi: sửa UI); quá `expire_time` → modal "Đã hết thời gian đặt vé…", xoá nháp, OK → quay lại (hoặc `/` nếu `partner=1`). Đồng hồ mm:ss từ `expire_time`.
- Tải khi vào: `customer/customers`; `promotion/get-promotions?merchant_code&route&product&channel=1&direction(A=1,B=2)&departure_id&destination_id&departure_time&price&channel_code=WEBHAIVAN`; **chỉ khi merchant ∈ {02,16,17}**: `v4/get-bonus-service?merchant_code` và `POST v4/get-price-transit` body `{...newParams, services, trip_id, merchant_code}` như live.
- Thông tin của bạn: Họ và tên, Số điện thoại (bắt buộc, chỉ kiểm có giá trị như web cũ — không regex), Thư điện tử, Ghi chú. `if_customer = {email: email || null, phone, name}` (live gửi `email: null`); không có thông tin → bỏ khoá.
- Dịch vụ bổ sung (khối chỉ hiện khi `transit.departure || transit.destination` và merchant ∈ {02,16,17}): "Đón tận nhà - n/N khách", "Trả tận nhà" + "Cập nhật" mở modal địa chỉ (maps/places, `v4/check-transit`, nhiều điểm như `02` §5); giá qua `v4/get-price-transit`.
- `transit` trong body bookings = `{departure: pick_up.address === value_start, destination: drop_off.address === value_end}` đúng công thức web cũ (kể cả trường hợp `""===""` → true); test cả nhánh có/không transit.
- Sau bookings 200: `POST v4/hold-transit {order_code, merchant_code, pick_up, pick_up_lat, pick_up_lng, drop_off, drop_off_lat, drop_off_lng, services}` (mọi merchant, `[]` nếu không chọn) — không chờ.
- Hoá đơn: checkbox "Tôi muốn xuất hóa đơn"; loại 1 cá nhân (tên, địa chỉ, email), loại 2 công ty (+ mã số thuế); `invoice = {name,address,code,email}` (không gửi loại).
- Khuyến mãi & đổi điểm:
  - Nhập mã → `admin/search-code-hide?code=<thô>&channel_code=WEBHAIVAN&channel=1`.
  - Áp mã → `POST promotion/check-promotions?<qs>` **không body**, query (định dạng `qs` indices, ngoặc mã hoá) gồm đủ: `merchant_code, route, product, channel=1, direction, departure_id, destination_id, departure_time=node_time, channel_code=WEBHAIVAN, codes[i][promotion|ticketCode|ticketPrice], bookingCode, tripCode=trip_info.id, adm_id=0` → đọc `data.codes[{ticketCode, priceDiscount}]` khớp `ticketCode === seat.code`.
  - Đổi điểm `is_reward` (1 điểm = 1đ, số dư `account.balance`).
  - Đóng modal không áp → `GET price-ticket?order_code&merchant_code&seats[i][id]&is_combo(đảo)&trip[trip_id]&trip[departure_id]&trip[destination_id]` (query `qs`) như web cũ.
  - Snapshot test chuỗi query thô cho check-promotions và price-ticket.
- Tổng hiển thị = Σ(price − discount) ghế không đổi điểm + phụ thu dịch vụ; **điều kiện "miễn phí" dùng Σ(price − discount) ghế không đổi điểm (không gồm phụ thu)** như web cũ; phụ thu 0 → không in "0".
- `POST /api/hv/gw/bookings` body đúng thứ tự & khoá live: `{pick_up, drop_off, trip{trip_id,departure_id,destination_id}, transit, seats:[{id, code?, is_reward}] sort id, order_code, merchant_code, note, is_combo, if_customer?, invoice?}`; `seats[].code` = mã KM (bỏ khoá nếu rỗng); `is_combo` theo đúng quy tắc web cũ (chỉ xét ghế id nhỏ nhất có mã).
- Thành công (status 200): miễn phí → `/xe-khach/thanh-toan/thanh-cong?booking_code=`; ngược lại → `/xe-khach/thanh-toan?booking_code&merchant_code&trip_id`. Lỗi → giá trị đầu của `errors` hoặc `message`. Chống bấm đúp.
- Điểm đón/trả tự chọn (`el/is_transit`) web cũ không dùng → không làm.

## Architecture
`app/(booking)/xe-khach/xac-nhan/page.tsx` · `components/confirm/{customer-form,bonus-services,service-address-dialog,invoice-form,promo-dialog,price-summary,countdown,trip-summary}.tsx` · `lib/{booking-body,totals,promo-query,qs}.ts` (thuần).

## Related Code Files
- Create: các file trên + tests `booking-body.test.ts`, `totals.test.ts`, `promo-query.test.ts` (chuỗi thô), `transit.test.ts`, `confirm-page.test.tsx`.

## Implementation Steps
1. `qs.ts` (serializer định dạng `qs` indices) + `booking-body`/`totals`/`promo-query` + test.
2. Form khách + hoá đơn (parity validation).
3. Dịch vụ đón/trả + modal địa chỉ + get-price-transit + hold-transit.
4. Khuyến mãi/đổi điểm/price-ticket.
5. Ghép trang, guard, đồng hồ, điều hướng.

## Success Criteria
- [ ] Body `api/bookings`, `v4/get-price-transit`, `v4/hold-transit` khớp live (snapshot, PII thay thế).
- [ ] Query check-promotions/price-ticket khớp chuỗi tái dựng từ bundle (`02` §4).
- [ ] Merchant ngoài {02,16,17} không gọi bonus-service/get-price-transit.

## Risk Assessment
- Khuyến mãi/đổi điểm/dịch vụ có phí chưa chạy live → test hợp đồng; 1 lần chạy thật có duyệt ở phase 10. Backend trả khác spec → sửa spec trước, rồi code.

## Kết quả (2026-10-28)
Đã dựng theo yêu cầu phase; logic thuần có test hợp đồng (xem `apps/booking/src/lib/*.test.ts`). Chờ review độc lập phase 4–7 và chạy thật có duyệt (phase 10).
