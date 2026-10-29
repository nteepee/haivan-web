import type { Trip } from "@/schemas/trip";
import { displayPrice } from "./trip-filters";

/** Dòng bảng giá/giờ của trang tuyến: chỉ dữ liệu thật (hạng xe + giá từ bài WP; giờ xuất bến, thời gian, giá từ chuyến apigw). */
export interface FareRow {
  name: string;
  /** Giờ xuất bến "HH:mm" tăng dần, không trùng; rỗng = chưa biết. */
  times: string[];
  /** true khi `times` chỉ là phần đầu danh sách (chưa tải hết các trang chuyến). */
  timesPartial: boolean;
  duration: string | null;
  /** Số VND, null = chưa biết (không hiện). */
  minPrice: number | null;
  /** Chuỗi giá từ WP ("485.000đ") khi chưa có số. */
  priceLabel: string | null;
}

export interface WpClass {
  name: string;
  price_from?: string | null;
}

const hhmm = (t: Trip) => (t.from.reached_at?.slice(11, 16) || t.time.slice(0, 5)).trim();

/**
 * Gộp hạng xe của bài WP với chuyến đã tải từ apigw. Thứ tự: hạng của WP trước, hạng chỉ có trong chuyến sau.
 * Giá "từ": chuỗi của WP nếu có (đã được MKT chốt); nếu không thì giá thấp nhất của hạng đó CHỈ khi đã tải hết chuyến (`complete`).
 * `hours` = số giờ chạy của tuyến (CMS) dùng làm thời gian khi hạng chưa có chuyến nào.
 */
export function buildFareRows(classes: readonly WpClass[], trips: readonly Trip[], opts: { complete: boolean; hours: string | null }): FareRow[] {
  const byClass = new Map<string, Trip[]>();
  for (const trip of trips) byClass.set(trip.product.name, [...(byClass.get(trip.product.name) ?? []), trip]);
  const names = [...new Set([...classes.map((c) => c.name), ...byClass.keys()])];
  return names.map((name) => {
    const own = byClass.get(name) ?? [];
    const wp = classes.find((c) => c.name === name);
    const prices = own.map(displayPrice).filter((p): p is number => p !== null);
    return {
      name,
      times: [...new Set(own.map(hhmm).filter(Boolean))].sort(),
      timesPartial: !opts.complete,
      duration: own.find((t) => t.duration?.trim())?.duration?.trim() ?? (opts.hours ? `${opts.hours}h` : null),
      minPrice: opts.complete && prices.length ? Math.min(...prices) : null,
      priceLabel: wp?.price_from?.trim() || null,
    };
  });
}
