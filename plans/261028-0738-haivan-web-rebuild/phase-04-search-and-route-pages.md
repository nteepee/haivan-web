---
phase: 4
title: "Tìm chuyến + trang tuyến"
status: completed
priority: P1
effort: "2.5d"
dependencies: [2]
---

# Phase 4: Tìm chuyến + trang tuyến

## Overview
Trang tuyến SEO `/xe-khach/[start]/[end]`, trang `/xe-khach/tim-chuyen`, landing `/xe-khach`, form tìm vé dùng chung, danh sách chuyến + bản đồ lộ trình.

## Requirements (nguồn `01-search-seat-hold.md` §1–2, live capture)
- Trang tuyến (đã quan sát: SSR `__NEXT_DATA__.props.pageProps.route` = kết quả CMS `route-listing?route=<start>/<end>`; trình duyệt sau đó gọi `el/trips` với `start/end_place` lat,lng, **ngày hôm nay**, không `type`): server gọi CMS `api/route-listing?route=<start>/<end>` → `start_place/end_place {name,lat,lng}`, `wayroad{name,price_avg,run_time,distance,img_path,meta_*}`; `generateMetadata` từ `meta_title/meta_desc`. Slug chỉ nhận `^[a-z0-9-]+$`; cache 1h cho slug hợp lệ, 5 phút cho slug không có dữ liệu. Web cũ trả 200 cho slug không tồn tại → giữ 200 nhưng hiện form tìm + `noindex`.
- Danh sách slug tuyến (sitemap/SSG): `homewayroads` trả `[]` → lấy từ `__NEXT_DATA__.list_route` trang chủ cũ (archive phase 1) + danh mục tuyến trong WP (phase 9); sitemap `/xe-khach/sitemap.xml`.
- `/en/xe-khach/...` phục vụ cùng trang với `locale=en`.
- `/xe-khach/tim-chuyen?from=<tên>,<lat>,<lng>&to=…&date=DD-MM-YYYY&numberGuest=N[&type]`: đọc như web cũ (tương thích link cũ, cắt tên ở dấu phẩy đầu) nhưng sinh link mới có mã hoá URL đầy đủ.
- Form tìm: tab Xe liên tỉnh/Xe sân bay/Xe hợp đồng/Xe du lịch (chỉ Xe liên tỉnh hoạt động trong phạm vi; tab khác liên kết trang WP tương ứng), Điểm xuất phát ⇄ Điểm đến (danh sách `api/places?type=0`; gõ >3 ký tự → `api/maps/places?input=&channel=WEBHAIVAN`, thiếu lat/lng → `api/maps/places/detail?place_id=&channel=WEBHAIVAN`), Ngày đi (hôm nay → +4 tháng), Số người ≥ 1, nút "Tìm vé". Thiếu điểm → báo lỗi rõ (web cũ im lặng: sửa UI).
- Danh sách: `GET api/el/trips?from_location=lat,lng&to_location=lat,lng&numberGuest&date=YYYY-MM-DD&sort_by=time&sort_mode=asc&type` (gọi thẳng apigw từ trình duyệt; bỏ tham số rỗng); "Xem thêm" theo `meta.current_page < last_page`; rỗng/lỗi → màn "RẤT TIẾC" (`list_trip.*`).
- Thẻ chuyến theo `design-guidelines.md` §3 (tuyến, hạng, "N Chỗ trống", giờ/thời lượng, điểm trung chuyển/tự di chuyển, hộp giá + % giảm, "đã gồm thuế VAT", dòng đỏ khởi hành).
- Bản đồ Leaflet lazy (`next/dynamic` ssr:false) vẽ `journey` từ `api/el/trip_detail` khi mở thẻ.
- Non-functional: LCP trang tuyến < 2.5s (SSR shell + danh sách client); không tải Leaflet trước khi mở thẻ.

## Architecture
`app/(booking)/xe-khach/page.tsx` · `xe-khach/[start]/[end]/page.tsx` (server, CMS) · `xe-khach/tim-chuyen/page.tsx` · `components/search/{search-form,place-picker,date-field,guest-field}.tsx` · `components/trips/{trip-list,trip-card,price-box,journey-map}.tsx` · `lib/search-url.ts` (parse/build).

## Related Code Files
- Create: các file trên + tests `search-url.test.ts`, `trip-list.test.tsx` (MSW fixtures trips.json, live).

## Implementation Steps
1. `search-url.ts` parse/build + test với URL cũ thật (`docs/booking-flow/00`).
2. Form + place picker (TanStack Query cache places 1 ngày).
3. Trang tuyến server + metadata + JSON-LD BreadcrumbList.
4. Danh sách + phân trang + trạng thái rỗng/lỗi.
5. Bản đồ journey lazy.

## Success Criteria
- [ ] Request `el/trips` trong test khớp từng tham số live capture.
- [ ] `/xe-khach/quan-1/vung-tau` render SSR có tiêu đề/mô tả SEO từ CMS.
- [ ] Link tìm chuyến cũ (không mã hoá) vẫn mở đúng kết quả.

## Risk Assessment
- `route-listing` đổi cấu trúc/chết → smoke phát hiện; trang tuyến hiển thị form + tên từ slug thay vì 500.
- Tile OSM bị chặn production → chọn provider (open question), cấu hình URL tile qua env.

## Kết quả (2026-10-28)
Đã dựng theo yêu cầu phase; logic thuần có test hợp đồng (xem `apps/booking/src/lib/*.test.ts`). Chờ review độc lập phase 4–7 và chạy thật có duyệt (phase 10).
