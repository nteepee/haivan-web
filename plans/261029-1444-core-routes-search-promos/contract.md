# Hợp đồng `GET /wp-json/haivan-web/v1/booking-config` (WP → Next, WP shortcode JS)

Công khai (không có mã ERP, xem mục "Mã ERP" cuối), `Cache-Control: public, max-age=300`. `version: 1`. Next đọc phía server (cacheLife ≤ 5 phút, last-good khi WP lỗi, fallback `apps/booking/src/content/booking-config-fallback.json` = seed, promos rỗng). JS của `[haivan_search]` nhận cùng dữ liệu qua JSON inline (`wp_json_encode` của cùng hàm build), không gọi REST lần nữa.

```jsonc
{
  "version": 1,
  "corridors": [                       // chỉ tuyến đang bật, theo menu_order
    {
      "id": "hn-moc",                  // slug ổn định: sg-vt | hn-db | hn-moc | hn-sl
      "label": { "vi": "Hà Nội – Mộc Châu", "en": "Hanoi – Moc Chau" },
      "ends": {                        // "a" = đầu thứ nhất của nhãn, "b" = đầu thứ hai
        "a": { "vi": "Hà Nội", "en": "Hanoi", "point": { "name": "Mỹ Đình", "lat": 21.0284297, "lng": 105.7782687 } },
        "b": { "vi": "Mộc Châu", "en": "Moc Chau", "point": { "name": "Mộc Châu", "lat": 20.8461723, "lng": 104.6415738 } }
      },
      "landing": { "ab": "my-dinh/moc-chau", "ba": null },   // slug /xe-khach/<..>; null = chưa có trang tuyến
      "sleeper": false,                // true → ngày về tối thiểu = ngày đi + 1
      "max_days": 29,                  // ngày đi tối đa = hôm nay (giờ VN) + max_days
      "stops": {                       // trạm ở mỗi đầu; dùng cho cả hai chiều
        "a": [ { "id": "my-dinh", "vi": "Bến xe Mỹ Đình", "en": "My Dinh Bus Station", "note": "", "point": null } ],
        "b": [ { "id": "nong-truong", "vi": "Nông trường Mộc Châu", "en": "Moc Chau Farm", "note": "", "point": null } ]
      },
      "default_stop": { "a": "my-dinh", "b": "nong-truong" }
      // stop.point != null → tìm chuyến bằng toạ độ trạm (SG–VT: Q1 vs Tân Sơn Nhất); null → dùng ends.x.point
    }
  ],
  "promos": [                          // chỉ chương trình: đã xuất bản + bật + có code + hôm nay trong [book_from, book_to]
    {
      "id": 123,
      "type": "roundtrip",             // "roundtrip" | "combo"
      "corridor": "hn-moc",
      "direction": "ba",               // chiều được giảm: "ab" | "ba" | "both" (roundtrip: chiều về)
      "book_from": "2026-10-29", "book_to": null,      // thời gian chạy chương trình (ngày đặt)
      "travel_from": null, "travel_to": null,          // ngày đi được áp
      "weekdays": null,                // [1..7] (1 = thứ hai) | null
      "hours": null,                   // { "from": "05:00", "to": "23:00" } giờ xuất bến | null
      "book_ahead_minutes": null,      // đặt trước tối thiểu
      "seats": { "min": 1, "max": 9 },
      "per_seat_vnd": 20000,           // roundtrip: mức hiển thị/ghế
      "tiers": [],                     // combo: [{ "seats": 2, "class": "Luxury", "price_vnd": 419000, "was_vnd": 520000 }] — chỉ để hiển thị
      "has_code": true,                // luôn true (chương trình không có mã thì không xuất). KHÔNG có trường "code" trong dữ liệu công khai
      "label": { "vi": "Giảm 20k/ghế chiều về", "en": "20k off per return seat" },
      "badge": { "vi": "Khứ hồi -20k", "en": "Return -20k" }
    }
  ]
}
```

## Mã ERP: endpoint riêng, không công khai
Mã chương trình (vd. `<MÃ_ERP>`) không nằm trong `booking-config`, không nằm trong JSON inline của `[haivan_search]` hay HTML nào của WP. Server Next lấy mã bằng:

```
GET /wp-json/haivan-web/v1/promo-codes
X-HV-Secret: <HV_WP_SHARED_SECRET>
→ 200 {"codes": {"<promo.id>": "<MÃ_ERP>", ...}, "mask": ["<mọi mã của mọi bài hv_promo, kể cả tắt/hết hạn>", ...]}     // `codes`: đúng bộ lọc của booking-config: xuất bản + bật + có mã + trong [book_from, book_to] + tuyến đang bật
→ 403 {"code":"hv_forbidden",...}                      // thiếu/sai header, hoặc WP chưa cấu hình bí mật (<16 ký tự)
Cache-Control: no-store, private (cả 200 lẫn 403)
```
- `mask` để BFF che mã trong mọi response/log, kể cả mã của chương trình đang tắt hoặc hết hạn.
- Seed mã: biến `HV_SEED_ROUNDTRIP_CODE` khi chạy `seed-corridors.php` (không có thì để trống); mã không nằm trong mã nguồn.
- Bí mật: biến môi trường (hoặc hằng) `HV_WP_SHARED_SECRET` ở container WP; so sánh `hash_equals`. Local: `wordpress/.env` (gitignored) → `wordpress/compose.yaml`; cùng giá trị đặt ở `apps/booking/.env.local`. Production: đặt riêng, ngẫu nhiên, ≥ 16 ký tự.
- Next ghép `promo.id` của `booking-config` với `codes[id]` ở server, chỉ gửi mã vào `check-promotions`/đặt vé từ BFF; không đưa mã xuống trình duyệt ngoài đơn đặt vé.
- Mã vẫn nằm trong yêu cầu đặt vé của khách (xem được trong công cụ trình duyệt): IT phải giới hạn mã trong ERP theo tuyến, ngày, số lượng.

## Query riêng trên URL của mình (không gửi apigw)
`/xe-khach/tim-chuyen?<from,to,date,numberGuest,type như cũ>&tuyen=hn-moc&chieu=ab&diem_di=my-dinh&diem_den=nong-truong&ngay_ve=31-10-2026[&chang=ve&don_di=<order_code>]`
- `tuyen/chieu/diem_*`: chọn sẵn lại form, ghi chú trạm vào `note` ở xác nhận ("Đón: …; Trả: …", khách sửa được).
- `ngay_ve`: lưu ý định khứ hồi; sau khi chiều đi thanh toán xong, trang thành công hiện "Đặt chiều về" → `tim-chuyen` chiều ngược, `date=ngay_ve`, đổi vai trạm, `chang=ve`.
- `chang=ve`: chương trình roundtrip của tuyến/chiều này được tự áp ở xác nhận chiều về.
- `gio=dawn|morning|noon|afternoon|evening`: bấm chip "Chuyến hôm nay" → chọn sẵn bộ lọc khung giờ ở kết quả; giá trị lạ bỏ qua.
