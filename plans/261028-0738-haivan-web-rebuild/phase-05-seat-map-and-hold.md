---
phase: 5
title: "Sơ đồ ghế + giữ chỗ"
status: completed
priority: P1
effort: "2.5d"
dependencies: [3, 4]
---

# Phase 5: Sơ đồ ghế + giữ chỗ

## Overview
Mở thẻ chuyến → sơ đồ ghế → "Tiếp tục" → (đăng nhập) → giữ chỗ → nháp đặt vé → `/xe-khach/xac-nhan`. Kèm ghi nhận affiliate.

## Requirements (`01-search-seat-hold.md` §3–4, live capture bước giữ chỗ)
- Mở thẻ: song song `GET api/trips/{id}?departure_id=from.place_id&destination_id=to.place_id&merchant_code&numberGuest` + `api/el/trip_detail?trip_id&merchant_code` (trình duyệt → apigw).
- Layout: `data[0]`,`data[1]` = tầng 1/2; gộp `data[2]`/`data[3]` như web cũ; bỏ `data[4]`; `null` = lối đi.
- Trạng thái: Chỗ trống (trắng, viền `#CACBD0`), Đang đặt (vàng), Đã đặt (`rgba(202,203,208,.5)`); chỉ chọn `is_empty`; giá khi `route.show_price !== 0`.
- Quy tắc: tối đa 9 ghế (`list_trip.msg.msg_booking_select_seat`); chế độ thường không xét `numberGuest`; combo (`is_combo` của chi tiết chuyến): số ghế = `numberGuest`, giá mọi ghế = ghế bấm cuối, sai số lượng → **modal đổi số khách** (stepper 1..available_seats) rồi tải lại `api/trips/{id}`; `is_locked` → lớp phủ `list_trip.noti` + `message` + nút `link` (tab mới), chặn giữ chỗ; `note` → lớp phủ có nút tiếp tục.
- Giữ chỗ: thứ tự như web cũ (không ghế → combo → locked → đăng nhập → giữ). Chưa đăng nhập → modal; **đăng nhập xong tự giữ chỗ 1 lần** (sửa UI). Chống bấm đúp.
- `POST /api/hv/gw/hold-booking` body như live: `{trip_id, seats:[object ghế nguyên bản + is_select:true], merchant_code, channel:1, aff}` + `utm_source`/`aff_sid` khi cookie có. Giá trị `aff` giữ như web cũ: `log_qr.aff` khi còn hạn, `""` khi `log_qr` hết hạn, bỏ khoá (undefined) khi không có `log_qr`. `utm_source`/`aff_sid` không gửi chuỗi `"null"` (delta #3).
- Thành công → nháp (zustand persist **sessionStorage**, test schema):
  `{trip_info{id, merchant{code}, route{code,name,show_price}, product{code}, direction, from{place_id,place_name,location}, to{…}, node_time, price{min}, transit{start,end}, date}, trip{trip_id,departure_id,destination_id}, transit{departure: !!trip.transit.start, destination: !!trip.transit.end}, pick_up{address,coordinates}, drop_off{…} (từ URL tìm), seats (merge tickets theo id → code), order_code, expire_time (epoch), is_combo, show_price, newParams?}`
  với `newParams` (khi có transit) = `{order_code, merchant_code, seats:[{…ticket, ticket_code, phone, name, pick_up, pick_up_lat, pick_up_lng, drop_off, drop_off_lat, drop_off_lng, number, quantity:1, date}]}` đúng như body `v4/get-price-transit` live → `router.push('/xe-khach/xac-nhan')`.
- Lỗi → toast `message` (ví dụ giới hạn 2 đơn chưa thanh toán), giữ lựa chọn.
- Affiliate:
  - `/partner/booking` (Next): đặt `log_qr {source, aff, created = now+10h}` vào **localStorage** (giống redux-persist cũ), `POST qrcode/agency-qr-code-scan-logs` (body theo `01` §1), chuyển tới URL tìm chuyến.
  - Cookie `utm_source`/`aff_sid` 30 ngày, `path=/`, SameSite=Lax được đặt ở **mọi trang** (nginx `map $arg_utm_source` hoặc WP child theme + Next middleware cùng ngữ nghĩa — phase 9/10).

## Architecture
`components/seats/{seat-map,seat,legend,lock-overlay,guest-count-dialog}.tsx` · `hooks/use-hold.ts` · `stores/booking-draft.ts` · `lib/affiliate.ts` · `app/(booking)/partner/booking/page.tsx`.

## Related Code Files
- Create: các file trên + tests `seat-map.test.tsx`, `seat-rules.test.ts`, `use-hold.test.ts` (3 trạng thái `aff`), `booking-draft.test.ts`, `partner-booking.test.tsx`.

## Implementation Steps
1. Seat map thuần + test (`seats.json`, live).
2. Quy tắc chọn ghế + modal số khách combo.
3. `use-hold` + test hợp đồng body.
4. Store nháp (transit, newParams, hết hạn).
5. Tự giữ chỗ sau đăng nhập.
6. `/partner/booking` + scan-log.

## Success Criteria
- [ ] Body hold khớp từng khoá live; 3 trạng thái `aff` khớp web cũ.
- [ ] Nháp đủ dữ liệu dựng body `v4/get-price-transit` live.
- [ ] Đăng nhập giữa chừng → gọi hold đúng 1 lần.

## Risk Assessment
- Backend từ chối ghế đổi giá (combo) → giữ cách web cũ; live trả lỗi giá → ghi spec, hỏi anh.

## Kết quả (2026-10-28)
Đã dựng theo yêu cầu phase; logic thuần có test hợp đồng (xem `apps/booking/src/lib/*.test.ts`). Chờ review độc lập phase 4–7 và chạy thật có duyệt (phase 10).
