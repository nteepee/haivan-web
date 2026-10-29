import type { Trip } from "@/schemas/trip";

/** Bộ lọc/sắp xếp phía client trên danh sách chuyến đã tải (không đổi request API). */

export type TimeBucketKey = "dawn" | "morning" | "noon" | "afternoon" | "evening";
export type SortKey = "time" | "price-asc" | "price-desc" | "seats";

/** Khung giờ đi theo phút trong ngày, nửa mở [from, to): Sáng sớm 0–6, Sáng 6–11, Trưa 11–14, Chiều 14–18, Tối 18–24. */
export const TIME_BUCKETS: readonly { key: TimeBucketKey; from: number; to: number }[] = [
  { key: "dawn", from: 0, to: 6 * 60 },
  { key: "morning", from: 6 * 60, to: 11 * 60 },
  { key: "noon", from: 11 * 60, to: 14 * 60 },
  { key: "afternoon", from: 14 * 60, to: 18 * 60 },
  { key: "evening", from: 18 * 60, to: 24 * 60 },
];

export interface TripFilters {
  buckets: TimeBucketKey[];
  /** Tên hạng xe (`product.name`) được chọn; rỗng = mọi hạng. */
  classes: string[];
  /** null = giữ thứ tự API. */
  sort: SortKey | null;
}

export const EMPTY_FILTERS: TripFilters = { buckets: [], classes: [], sort: null };

/** Giờ đi hiển thị trên thẻ (from.reached_at), rơi về `trip.time`; trả phút trong ngày hoặc null nếu không đọc được. */
export function departureMinutes(trip: Trip): number | null {
  const raw = trip.from.reached_at?.slice(11, 16) || trip.time;
  const m = /^(\d{1,2}):(\d{2})/.exec(raw ?? "");
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes >= 0 && minutes < 24 * 60 ? minutes : null;
}

export function bucketOf(minutes: number): TimeBucketKey | null {
  return TIME_BUCKETS.find((b) => minutes >= b.from && minutes < b.to)?.key ?? null;
}

/** Giá đang hiện trên thẻ (cùng quy tắc PriceBox): có giảm → giá giảm; khoảng giá → thấp nhất; còn lại giá cao nhất. null = tuyến ẩn giá. */
export function displayPrice(trip: Trip): number | null {
  if (trip.route.show_price === 0) return null;
  const { price } = trip;
  const percent = price.percent ?? 0;
  const max = price.max ?? price.min;
  if (percent > 0) return price.price_discount ?? price.min;
  return price.min !== max ? price.min : max;
}

/** Các hạng xe có trong danh sách đã tải, theo thứ tự xuất hiện. */
export function classOptions(trips: readonly Trip[]): string[] {
  return [...new Set(trips.map((t) => t.product.name))];
}

export const isFiltering = (f: TripFilters) => f.buckets.length > 0 || f.classes.length > 0;
export const isActive = (f: TripFilters) => isFiltering(f) || f.sort !== null;

export function toggleIn<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Giữ thứ tự gốc khi bằng nhau; mục không có dữ liệu (giờ, giá) xuống cuối. */
function compareBy(sort: SortKey): (a: Trip, b: Trip) => number {
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => (a === null ? (b === null ? 0 : 1) : b === null ? -1 : dir * (a - b));
  switch (sort) {
    case "time":
      return (a, b) => nullsLast(departureMinutes(a), departureMinutes(b), 1);
    case "price-asc":
      return (a, b) => nullsLast(displayPrice(a), displayPrice(b), 1);
    case "price-desc":
      return (a, b) => nullsLast(displayPrice(a), displayPrice(b), -1);
    case "seats":
      return (a, b) => b.available_seats - a.available_seats;
  }
}

/** Lọc rồi sắp xếp trên bản sao; không đổi mảng đầu vào. Bộ lọc giờ và hạng xe là AND giữa hai nhóm, OR trong mỗi nhóm. */
export function applyTripFilters(trips: readonly Trip[], f: TripFilters): Trip[] {
  const out = trips.filter((trip) => {
    if (f.classes.length && !f.classes.includes(trip.product.name)) return false;
    if (f.buckets.length) {
      const minutes = departureMinutes(trip);
      const bucket = minutes === null ? null : bucketOf(minutes);
      if (!bucket || !f.buckets.includes(bucket)) return false;
    }
    return true;
  });
  return f.sort ? out.sort(compareBy(f.sort)) : out;
}
