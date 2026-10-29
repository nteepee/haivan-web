---
phase: 7
title: "Thanh toán + thành công"
status: completed
priority: P1
effort: "2d"
dependencies: [6]
---

# Phase 7: Thanh toán + thành công

## Overview
`/xe-khach/thanh-toan` dựng hoàn toàn từ URL (gateway redirect về) và `/xe-khach/thanh-toan/thanh-cong`.

## Requirements (`03-payment-account.md` §1–2, live capture bước 4)
- Vào trang: `info-payments?merchant_code&trip_id&booking` (mảng), `info-payment-block?merchant_code`, `bookings/{code}?merchant_code`. Đã thanh toán (`payment.type` truthy) → thành công. `method_payment_type===0` và quá 598000 ms từ `created_at` → modal hết giờ. `info-payment-block.status===true` → ghi chú đỏ.
- Lựa chọn (ẩn `is_locked`): type 5 → VNPAY-QR; type 6 → PayOS; type 1 → "Thẻ ATM nội địa / VNPAY-QR" + "Thẻ quốc tế" (lưới ngân hàng tĩnh 33 ATM + VISA/MASTERCARD/AMEX/JCB như module `Oqsq`); type 2 → chuyển khoản (`info[0]`, ngoại lệ tuyến 10043/15725); type 3 → "Thanh toán tại nhà xe" + "Mã giữ chỗ". `route.show_price===0` → chỉ tiền mặt.
- Hành động — **giữ đúng chuỗi request web cũ**:
  - VNPay: chuỗi thô y hệt web cũ: `payment/vnpay?return_url=` + `<origin>/xe-khach/thanh-toan?booking_code=` + code + `&order_code=` + code + `&bank_code=` + bank + `&merchant_code=` + m + `&trip_id=` + t (không `encodeURIComponent` cả `return_url`; backend nhận `order_code/bank_code/merchant_code/trip_id` ở cấp ngoài). `<origin>` = `window.location.origin` (staging quay về staging). Type 5 → `bank_code=VNPAYQR`. → `window.location = data.url`.
  - PayOS: `payment/payos?merchant_code=&order_code=` → `data.data.checkoutUrl`.
  - Chuyển khoản/tiền mặt: `POST update-booking/{code}?merchant_code {method_payment: type}` (2 hoặc 3) → thành công; lỗi → hiện `message` (web cũ im lặng: sửa UI).
  - Lưu `{booking_code, merchant_code, trip_id}` sessionStorage trước khi rời trang (dự phòng khi gateway không trả đủ tham số).
- Quay về: `vnp_ResponseCode=00` → thành công; `24` → "đã huỷ thanh toán"; `07` → "đang xác minh"; khác → "Thanh toán không thành công". Luôn xác nhận bằng `bookings/{code}`; chưa thấy `payment.type` sau 3×2s → hiện "Đang xác minh thanh toán" + nút làm mới (không báo thất bại, tránh trả 2 lần).
- Thành công: chờ 1.5s, `bookings/{code}`; đã/chưa thanh toán theo `payment.type`; thẻ vé có QR mã vé; xoá nháp + `time_out`. Pixel affiliate theo quyết định của anh (open question).
- Cột phải theo ảnh `private/06-thanh-toan.jpg` (không số "0" lạc).

## Architecture
`app/(booking)/xe-khach/thanh-toan/page.tsx`, `thanh-toan/thanh-cong/page.tsx` · `components/payment/{method-list,bank-grid,transfer-info,timeout-dialog,payment-summary,verify-pending}.tsx` · `lib/payment-url.ts` (dựng chuỗi thô) · `lib/payment-return.ts` · `lib/banks.ts`.

## Related Code Files
- Create: các file trên + tests `payment-url.test.ts` (so **chuỗi query thô** với chuỗi web cũ), `payment-return.test.ts`, `method-list.test.tsx`.

## Implementation Steps
1. `banks.ts` + logo nhập qua `import` (hash dưới `/_next/static/media`, không dùng `public/`).
2. Danh sách phương thức + ẩn locked + show_price.
3. `payment-url.ts` + test chuỗi thô.
4. Hành động + xử lý quay về + thăm dò.
5. Trang thành công.

## Success Criteria
- [ ] Chuỗi request `payment/vnpay` khớp byte-for-byte mẫu web cũ (trừ origin).
- [ ] Không nhánh nào đánh dấu "đã thanh toán" chỉ từ query string.
- [ ] Bố cục khớp ảnh mẫu.

## Risk Assessment
- Trước cutover, gateway trả về site cũ (return_url tuỳ origin; staging thì về staging) → chạy thật có duyệt trên staging tới trang cổng rồi huỷ; sau cutover chạy lại 1 lần (phase 10).

## Kết quả (2026-10-28)
Đã dựng theo yêu cầu phase; logic thuần có test hợp đồng (xem `apps/booking/src/lib/*.test.ts`). Chờ review độc lập phase 4–7 và chạy thật có duyệt (phase 10).
