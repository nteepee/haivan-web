/**
 * Dữ liệu ảnh hưởng giá lấy từ WordPress (chương trình giảm giá, combo, tuyến chính, luật giá, mã ERP) và cách làm mới ngay khi MKT lưu.
 *
 * - `BOOKING_CONFIG_TAG`: tag của cache `'use cache'` trong `booking-config-source.ts`; `POST /api/hv/revalidate` gọi
 *   `revalidateTag(tag, { expire: 0 })` → request kế tiếp đọc lại WP (không phục vụ bản cũ), trang ISR dùng cấu hình được tạo lại.
 * - "Thế hệ" giá WP: bộ đếm tăng mỗi lần WP báo đổi. `promo-secrets.ts` (mã ERP + luật giá đầy đủ, giữ trong bộ nhớ tiến trình,
 *   không qua cache Next) thấy thế hệ mới thì đọc lại WP trước khi trả. Bộ đếm nằm trên `globalThis` vì Next có thể nạp module
 *   này nhiều lần (mỗi route một bản): biến cấp module ở route revalidate sẽ không tới được route BFF.
 */
export const BOOKING_CONFIG_TAG = "hv:booking-config";

const EPOCH: unique symbol = Symbol.for("haivan.wpPriceEpoch");
const store = globalThis as typeof globalThis & { [EPOCH]?: number };

/** Thế hệ dữ liệu giá WP hiện tại (0 khi chưa có lần báo đổi nào trong tiến trình). */
export function wpPriceEpoch(): number {
  return store[EPOCH] ?? 0;
}

/** WP báo đổi dữ liệu giá: tăng thế hệ, trả thế hệ mới. */
export function bumpWpPriceEpoch(): number {
  const next = wpPriceEpoch() + 1;
  store[EPOCH] = next;
  return next;
}
