import type { Locale } from "@/i18n/t";
import type { BookingConfig, Corridor, CorridorDirection, CorridorEnd, CorridorStop } from "@/schemas/booking-config";
import { addDaysIso } from "./format";
import { appendCorridorParams, buildSearchUrl, type CorridorParams, type SearchPoint } from "./search-url";

/** Các hàm thuần cho ô tìm vé theo tuyến: chiều, trạm theo chiều, điểm tìm chuyến, giới hạn ngày, ghi chú đón/trả. */

export const reverseChieu = (chieu: CorridorDirection): CorridorDirection => (chieu === "ab" ? "ba" : "ab");

export const findCorridor = (config: BookingConfig, id: string | null | undefined): Corridor | undefined =>
  id ? config.corridors.find((c) => c.id === id) : undefined;

/** Trang tuyến `/xe-khach/<a>/<b>` thuộc tuyến chính nào và chiều nào (khớp `landing.ab` / `landing.ba`). */
export function corridorForLanding(config: BookingConfig, slug: string): { corridor: Corridor; chieu: CorridorDirection } | null {
  for (const corridor of config.corridors) {
    if (corridor.landing.ab === slug) return { corridor, chieu: "ab" };
    if (corridor.landing.ba === slug) return { corridor, chieu: "ba" };
  }
  return null;
}

/** Đầu đi / đầu đến theo chiều ("ab": a → b). */
export function endsFor(corridor: Corridor, chieu: CorridorDirection): { from: CorridorEnd; to: CorridorEnd } {
  return chieu === "ab" ? { from: corridor.ends.a, to: corridor.ends.b } : { from: corridor.ends.b, to: corridor.ends.a };
}

/** Danh sách trạm đón (đầu đi) và trạm trả (đầu đến) theo chiều. */
export function stopsFor(corridor: Corridor, chieu: CorridorDirection): { from: CorridorStop[]; to: CorridorStop[] } {
  return chieu === "ab" ? { from: corridor.stops.a, to: corridor.stops.b } : { from: corridor.stops.b, to: corridor.stops.a };
}

/** Trạm theo đầu (a/b) — dùng chung hai chiều: đổi chiều chỉ đổi vai, không đổi trạm đã chọn. */
export interface StopPick {
  a: string;
  b: string;
}

export const defaultStops = (corridor: Corridor): StopPick => ({ a: corridor.default_stop.a, b: corridor.default_stop.b });

/** `diem_di` (trạm ở đầu đi) / `diem_den` (đầu đến) của URL → trạm theo đầu a/b; id lạ hoặc thiếu → trạm mặc định. */
export function stopsFromParams(corridor: Corridor, chieu: CorridorDirection, diemDi: string | null, diemDen: string | null): StopPick {
  const fallback = defaultStops(corridor);
  const has = (list: CorridorStop[], id: string | null) => !!id && list.some((s) => s.id === id);
  const fromEnd = chieu === "ab" ? "a" : "b";
  const toEnd = chieu === "ab" ? "b" : "a";
  const out = { ...fallback };
  if (has(corridor.stops[fromEnd], diemDi)) out[fromEnd] = diemDi!;
  if (has(corridor.stops[toEnd], diemDen)) out[toEnd] = diemDen!;
  return out;
}

/** Trạm theo đầu a/b → `diem_di` / `diem_den` theo chiều. */
export function stopsToParams(chieu: CorridorDirection, picks: StopPick): { diemDi: string; diemDen: string } {
  return chieu === "ab" ? { diemDi: picks.a, diemDen: picks.b } : { diemDi: picks.b, diemDen: picks.a };
}

const pointOf = (end: CorridorEnd, stop: CorridorStop | undefined): SearchPoint => {
  const p = stop?.point ?? end.point;
  return { name: p.name, lat: p.lat, lng: p.lng };
};

/** Điểm tìm chuyến: trạm có toạ độ riêng → toạ độ trạm, ngược lại toạ độ đầu tuyến (apigw `el/trips` chỉ nhận toạ độ). */
export function corridorSearchPoints(corridor: Corridor, chieu: CorridorDirection, picks: StopPick): { from: SearchPoint; to: SearchPoint } {
  const ends = endsFor(corridor, chieu);
  const stops = stopsFor(corridor, chieu);
  const ids = stopsToParams(chieu, picks);
  return {
    from: pointOf(ends.from, stops.from.find((s) => s.id === ids.diemDi)),
    to: pointOf(ends.to, stops.to.find((s) => s.id === ids.diemDen)),
  };
}

export const localized = (value: { vi: string; en: string }, locale: Locale) => (locale === "en" ? value.en : value.vi);

/** Ngày đi tối đa = hôm nay (giờ VN) + max_days; "" khi chưa biết hôm nay (prerender). */
export const maxTravelDate = (today: string, corridor: Corridor) => addDaysIso(today, corridor.max_days);

/** Giới hạn ngày về: tối thiểu = ngày đi (+1 nếu xe giường nằm); tối đa = ngày đi tối đa nhưng không nhỏ hơn tối thiểu. */
export function returnBounds(corridor: Corridor, date: string, today: string): { min: string; max: string } {
  const min = corridor.sleeper ? addDaysIso(date, 1) : date;
  const limit = maxTravelDate(today, corridor);
  return { min, max: limit && limit < min ? min : limit };
}

/** Kẹp `value` vào [min, max]; max rỗng = không có trần. */
export function clampDate(value: string, min: string, max: string): string {
  if (value < min) return min;
  return max && value > max ? max : value;
}

/** Ngày về mặc định khi bấm "Thêm ngày về" (như ô WP): giường nằm ngày đi + 1, còn lại + 2, kẹp trong giới hạn. */
export const defaultReturnDate = (corridor: Corridor, date: string, today: string) => {
  const { min, max } = returnBounds(corridor, date, today);
  return clampDate(addDaysIso(date, corridor.sleeper ? 1 : 2), min, max);
};

/** "Đón: <trạm>; Trả: <trạm>" cho ô ghi chú của đơn (tiếng Việt: nhà xe đọc). Thiếu trạm thì bỏ vế đó; không có gì → "". */
export function pickupNote(corridor: Corridor, own: Pick<CorridorParams, "chieu" | "diemDi" | "diemDen">): string {
  const stops = stopsFor(corridor, own.chieu);
  const from = stops.from.find((s) => s.id === own.diemDi)?.vi;
  const to = stops.to.find((s) => s.id === own.diemDen)?.vi;
  return [from ? `Đón: ${from}` : "", to ? `Trả: ${to}` : ""].filter(Boolean).join("; ");
}

/**
 * Liên kết tìm chuyến cho thẻ tuyến chính chưa có trang tuyến (landing null): chiều a → b, trạm mặc định, 1 vé, không ghi ngày
 * (`tim-chuyen` lấy hôm nay giờ VN khi thiếu `date`). Link = `buildSearchUrl` + query riêng, như form.
 */
export function corridorSearchHref(corridor: Corridor, prefix = ""): string {
  const picks = defaultStops(corridor);
  const points = corridorSearchPoints(corridor, "ab", picks);
  const base = buildSearchUrl({ ...points, date: "2000-01-01", numberGuest: 1, type: 2 }, prefix).replace(/&date=[^&]*/, "");
  const ids = stopsToParams("ab", picks);
  return appendCorridorParams(base, { tuyen: corridor.id, chieu: "ab", diemDi: ids.diemDi, diemDen: ids.diemDen, ngayVe: null, chang: null, donDi: null, gio: null });
}

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
/** Khoảng cách đường chim bay (km) giữa hai toạ độ. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Bán kính coi một điểm của chuyến thuộc một đầu tuyến (đầu tuyến hoặc bất kỳ trạm có toạ độ riêng của đầu đó). */
export const END_RADIUS_KM = 8;

function nearEnd(corridor: Corridor, end: "a" | "b", point: { lat: number; lng: number }): boolean {
  const anchors = [corridor.ends[end].point, ...corridor.stops[end].flatMap((s) => (s.point ? [s.point] : []))];
  return anchors.some((anchor) => distanceKm(anchor, point) <= END_RADIUS_KM);
}

/**
 * Chuyến (điểm đi → điểm đến theo toạ độ của vé) thuộc tuyến chính nào và chiều nào; null nếu không khớp tuyến nào.
 * Dùng phía server để tự xác định tuyến/chiều của đơn từ dữ liệu apigw (không tin tham số do client gửi).
 */
export function identifyLeg(config: BookingConfig, dep: { lat: number; lng: number }, dest: { lat: number; lng: number }): { corridor: Corridor; chieu: CorridorDirection } | null {
  for (const corridor of config.corridors) {
    if (nearEnd(corridor, "a", dep) && nearEnd(corridor, "b", dest)) return { corridor, chieu: "ab" };
    if (nearEnd(corridor, "b", dep) && nearEnd(corridor, "a", dest)) return { corridor, chieu: "ba" };
  }
  return null;
}
