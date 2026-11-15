# Luật giá v2 (khuyến mãi linh hoạt)

Một khuyến mãi = **một văn bản JSON** theo lược đồ chung. Thêm loại khuyến mãi mới (combo, khứ hồi, sát giờ, đặt sớm, theo hạng ghế,
theo SBU/tuyến/giờ/chiều, theo trạm đón) = viết JSON khác, **không sửa code**. Kế hoạch: `plans/261111-0439-price-rules-engine/`.

## Thành phần

| Phần | Ở đâu | Việc |
|---|---|---|
| Lược đồ (nguồn sự thật) | `apps/booking/src/price-rules/schema.ts` → `wordpress/.../price-rules/schema.json` | Mô tả mọi trường bằng tiếng Việt; test chặn lệch giữa 2 bản |
| Engine | `apps/booking/src/price-rules/engine.ts` | Hàm thuần: luật + chuyến/đơn → áp luật nào, giảm bao nhiêu, lý do từ chối |
| Mẫu | `wordpress/.../price-rules/examples/*.json` | Combo VT/ĐB (nhập từ booking cũ), khứ hồi, sát giờ, hạng ghế, đặt sớm, khung giờ, SBU |
| Lưu + CMS | `wordpress/.../inc/rules.php` (menu **Luật giá (v2)**) | Soạn JSON từ mẫu, Kiểm tra, Mô phỏng, tóm tắt tiếng Việt, lịch sử, SĐT thử |
| CLI / AI | `wordpress/.../inc/cli-rules.php` (`wp hv rules …`), REST `POST /wp-json/haivan-web/v1/rules` | Tạo/sửa/kiểm/mô phỏng; mặc định chạy thử |
| Sổ hạn mức | `wordpress/.../inc/rule-quota.php` (bảng `hv_rule_quota`) | Giữ suất nguyên tử (GET_LOCK), chốt khi đặt vé, trả khi huỷ |
| Áp ở web | `apps/booking/src/lib/rule-offers.ts` (gợi ý), `src/server/rule-eligibility.ts` + `promo-substitute.ts` (quyết định) | Server dựng lại ngữ cảnh từ đơn thật rồi mới đổi token thành mã / ghi ERP |
| Công cụ Next cho WP | `POST /api/hv/rules/{validate,simulate,import}`, `GET /api/hv/rules/version` (header `X-HV-Secret`) | WP/CLI kiểm và mô phỏng bằng đúng engine |

## Cấu trúc một luật

```jsonc
{
  "schema": 2, "id": "vt-sat-gio-30k", "title": "…", "status": "draft|test|on|off",
  "priority": 100, "exclusive_group": "vt-uu-dai",          // thiếu = nhóm "default": các luật KHÔNG cộng dồn
  "scope":  { "merchants": ["02"], "corridors": ["sg-vt"], "directions": ["ab"], "products": ["royal"], "vehicle_seats": [9], "stops": { "from": ["q1"] } },
  "when":   { "book": {"from","to"}, "travel": {"from","to"}, "weekdays": [1..7],
              "departure": [{ "weekdays", "directions", "products", "vehicle_seats", "from": "05:00", "to": "06:59", "seats": [2,3] }],
              "lead": { "min_days", "min_minutes", "max_minutes" },   // đặt sớm = min, SÁT GIỜ = max_minutes
              "lead_by_product": [{ "products": ["eco"], "lead": { "min_days": 7 } }] },
  "who":    { "seats": {"min","max"}, "across_legs": false,
              "seat_match": { "ranks": ["C","D"], "numbers", "exclude_numbers", "exact_sets": [{ "seats": 3, "numbers": ["9","10","11"] }] },
              "linked_order": { "reverse": true, "paid": true, "same_customer": true, "seats_lte": true },   // khứ hồi
              "payments": ["qr"], "channels": ["web"] },
  "quota":  { "per_trip", "per_phone", "total" },
  "effect": { /* ĐÚNG MỘT */ "seat_off_vnd" | "seat_off_percent"(+cap_vnd) | "seat_set_vnd" | "total_tiers": [{ "seats", "products", "vehicle_seats", "total_vnd" }],
              "cap_vnd", "not_cheaper": true },
  "apply":  { "mode": "auto|optin", "settlement": "erp_code|erp_direct" },
  "display":{ "label": {vi,en}, "badge": {vi,en}, "headline": {vi,en}, "terms": {vi:[],en:[]}, "show_on": ["route","trip_card","form"] }
}
```

Quy ước: giờ VN, mốc cuối cửa sổ giờ tính cả; thứ 1 = thứ hai … 7 = chủ nhật; `products` là **từ khoá** có trong tên hạng xe apigw
(không phân biệt hoa thường), như hệ booking cũ; danh sách thiếu/rỗng = không giới hạn.

Cộng dồn: luật cùng `exclusive_group` chỉ áp luật ưu tiên cao nhất (hoà: giảm nhiều hơn, rồi id); các nhóm áp lần lượt trên giá đang chạy;
một đơn chỉ một cách thu tiền (`settlement`). Lưu ý: luồng đặt vé hiện chỉ tự áp MỘT luật mỗi đơn (luật thắng đầu tiên); cộng dồn nhiều luật
mới có ở engine/mô phỏng.

Combo (`total_tiers`) tính trên mọi ghế của đơn: không dùng cùng `seat_match.ranks/numbers` (lược đồ chặn).

## Quy trình

**MKT trên CMS:** Luật giá (v2) → Thêm luật → chọn mẫu → sửa → **Kiểm tra** → **Mô phỏng** (nhập tuyến, giờ, ghế: `số:giá:hạng`)
→ Lưu ở "Thử" → thêm SĐT ở "SĐT thử", đặt cookie `hv_rule_test=1` trên trình duyệt thử → Biên tập viên chuyển "Đang chạy".

**AI / kỹ thuật (WP-CLI):**

```bash
wp hv rules schema                       # lược đồ + danh sách mẫu
wp hv rules schema --example=sat-gio     # một mẫu
wp hv rules validate luat.json
wp hv rules simulate luat.json --scenario=chuyen.json
wp hv rules save luat.json --source=ai --apply          # lưu nháp/thử ("on" tự hạ thành "test")
wp hv rules set-status vt-sat-gio-30k on --apply --user=<biên tập viên> [--code=<MÃ_ERP>]
wp hv rules import-legacy v1 --apply                    # bài "Chương trình giảm giá" cũ → luật v2 (test)
wp hv rules import-legacy program.json --schedule=lich.csv --apply   # chương trình booking.haivan.com
wp hv rules list | get <id> | export <thư mục>
```

Trên docker local: `cd wordpress && docker compose --profile tools run --rm -T wpcli hv rules list` (tệp JSON đặt trong `wordpress/scripts/` → `/scripts/…`).

## Điều kiện để luật chạy thật

1. Next đã kiểm đúng bản JSON hiện tại (WP lưu hash; sửa JSON = phải kiểm lại; luật chưa kiểm **không** xuất ra web).
2. `status` = `on` (hoặc `test` + SĐT trong danh sách thử), bật bởi Biên tập viên trở lên.
3. `settlement: erp_code` → có **Mã ERP** (IT tạo, giới hạn trong ERP theo tuyến/ngày/số lượng).
   `settlement: erp_direct` → Next có `HV_ERP_DIRECT_URL` + `HV_ERP_DIRECT_SECRET` (dịch vụ ghi giảm trực tiếp ERP, xem `src/server/settlement.ts`).
4. Có `quota` → sổ hạn mức hoạt động (`HV_WP_SHARED_SECRET` + WP). Thiếu điều kiện 3/4 thì Next ẩn luật khỏi web.
5. Chưa áp được ở web mới (Next ẩn khỏi khách, server từ chối): `apply.mode: optin` (khách tự chọn), `who.across_legs` (combo 2 chặng),
   `who.payments` / `who.channels` (lúc áp mã chưa biết khách trả bằng gì). Luật nhập từ combo booking cũ có `payments: ["qr"]`,
   `optin` và `erp_direct` → cần bổ sung giao diện chọn combo + ép thanh toán QR trước khi bật.
6. Thu bằng mã ERP: sau bước kiểm mã, BFF so tiền giảm ERP trả về với engine (lệch > 1.000đ/vé → từ chối, trả suất). Cấu hình mã
   trong ERP phải đúng mức giảm của luật.

## Bảo vệ

- Luật đang chạy (`on`) chỉ Biên tập viên trở lên sửa/tắt (CMS, CLI `--user`); REST/AI chỉ tạo/sửa nháp, thử.
- Mã ERP không bao giờ công khai: chỉ đi qua `/promo-codes` (secret), không hiện với người không đủ quyền trên CMS.
- `booking-config` công khai bỏ `quota`, `notes` (còn `has_quota`); luật ngoài thời gian đặt vé/ngày đi không xuất.
- Client chỉ gắn token vào đúng ghế engine chọn; server tự dựng lại ngữ cảnh từ đơn thật và sơ đồ ghế.

## Thứ tự deploy

Next trước (đọc được `booking-config` v1 và v2), rồi theme WP (xuất v2). Biến môi trường mới: Next `HV_ERP_DIRECT_URL`, `HV_ERP_DIRECT_SECRET`
(tuỳ chọn), `HV_WP_QUOTA_URL` (tuỳ chọn, mặc định `<WP>/wp-json/haivan-web/v1/rule-quota`); WP `HV_NEXT_INTERNAL_URL` (đã có).

## Đối chiếu với hệ booking cũ (local)

```bash
python3 apps/booking/scripts/legacy-quote.py ~/Documents/HV_QR_BOOKING combo-programs.json lich-csv/ > cases.json
pnpm -C apps/booking shadow-rules combo-programs.json lich-csv/ cases.json
```

Chạy engine cũ (`app/combo.py quote()`) và engine mới trên cùng lưới chuyến, in chỗ lệch. Dùng cấu hình/lịch CSV thật chép từ máy chủ booking.
