import type { Locale } from "@/i18n/t";
import type { BookingConfig, CorridorDirection, Promo } from "@/schemas/booking-config";
import { parseVnDateTime, todayIsoVn } from "./format";
import { reverseChieu } from "./corridors";

/**
 * Khớp chương trình giảm giá của WP với ngữ cảnh đang xem. Chỉ quyết định HIỂN THỊ nhãn và có nên thử áp mã hay không:
 * số tiền giảm thật luôn do apigw tính (`promotion/check-promotions`), web không trừ tiền.
 */

const hhmmToMinutes = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
/** 1 = thứ hai … 7 = chủ nhật của ngày ISO. */
const isoWeekday = (iso: string) => ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

const directionMatches = (promo: Promo, chieu: CorridorDirection) => promo.direction === "both" || promo.direction === chieu;
export const seatsWithin = (promo: Promo, count: number) => count >= promo.seats.min && count <= promo.seats.max;

/** Hôm nay (giờ VN) nằm trong thời gian chạy chương trình (kiểm lại vì cấu hình có thể cũ tới 5 phút). */
export function isRunning(promo: Promo, nowMs?: number): boolean {
  return running(promo, () => nowMs ?? Date.now());
}

/**
 * Đồng hồ lười: `Date.now()` chỉ chạy khi một chương trình thật sự cần so giờ (không bao giờ khi không có chương trình khớp).
 * Đọc giờ hiện tại lúc prerender làm Next (cacheComponents) bỏ cả khối nội dung khỏi HTML tĩnh, nên không được đọc sớm.
 */
type Clock = () => number;
const clock = (given?: number): Clock => {
  let value = given;
  return () => (value ??= Date.now());
};

function running(promo: Promo, now: Clock): boolean {
  const today = todayIsoVn(now());
  return (!promo.book_from || today >= promo.book_from) && (!promo.book_to || today <= promo.book_to);
}

export interface TripWindow {
  /** Ngày đi "YYYY-MM-DD" */
  travelDate: string;
  /** Giờ xuất bến "HH:mm" (null = không đọc được → không khớp chương trình có khung giờ/đặt trước) */
  departure: string | null;
  seatCount: number;
  nowMs?: number;
}

/** Điều kiện chung của chương trình với một chuyến cụ thể: số ghế, ngày đi, thứ, khung giờ xuất bến, đặt trước tối thiểu. */
function windowMatches(p: Promo, ctx: TripWindow, now: Clock): boolean {
  if (!seatsWithin(p, ctx.seatCount)) return false;
  if (p.travel_from && ctx.travelDate < p.travel_from) return false;
  if (p.travel_to && ctx.travelDate > p.travel_to) return false;
  if (p.weekdays && !p.weekdays.includes(isoWeekday(ctx.travelDate))) return false;
  if (p.hours) {
    if (!ctx.departure) return false;
    const m = hhmmToMinutes(ctx.departure);
    if (m < hhmmToMinutes(p.hours.from) || m > hhmmToMinutes(p.hours.to)) return false;
  }
  if (p.book_ahead_minutes) {
    if (!ctx.departure) return false;
    const departAt = parseVnDateTime(`${ctx.travelDate} ${ctx.departure}`);
    if (!Number.isFinite(departAt) || departAt - now() < p.book_ahead_minutes * 60_000) return false;
  }
  return true;
}

/**
 * Còn chuyến nào TRONG NGÀY này có thể đủ điều kiện không (dùng cho nhãn khi chưa chọn chuyến): ngày/thứ khớp và,
 * nếu có đặt trước tối thiểu, chuyến muộn nhất trong khung giờ (hoặc 23:59) vẫn kịp. Không xét khung giờ cụ thể của từng chuyến.
 */
function dayCanQualify(p: Promo, date: string, seatCount: number, now: Clock): boolean {
  const latest = p.hours?.to ?? "23:59";
  return windowMatches({ ...p, hours: null }, { travelDate: date, departure: p.book_ahead_minutes ? latest : "00:00", seatCount }, now);
}

/** Các ngày ISO trong [min, max] (tối đa 62 ngày, đủ cho max_days). */
function daysBetween(min: string, max: string): string[] {
  const out: string[] = [];
  for (let d = min; d && d <= max && out.length < 62; ) {
    out.push(d);
    const next = new Date(`${d}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    d = next.toISOString().slice(0, 10);
  }
  return out;
}

export interface ReturnLabelContext {
  /** Ngày về đã chọn, hoặc khoảng có thể chọn khi chưa chọn. */
  returnDate?: string | null;
  range?: { min: string; max: string };
  seatCount: number;
  nowMs?: number;
}

/**
 * Nhãn khứ hồi ở form: chương trình bật cho tuyến này với chiều VỀ = ngược chiều đi `outbound`, cùng điều kiện ngày/thứ/đặt trước
 * như combo. Chưa chọn ngày về → hiện nếu có ít nhất một ngày trong khoảng đủ điều kiện (khung giờ để chặn lúc chọn chuyến).
 */
export function roundtripPromoForOutbound(config: BookingConfig, corridorId: string, outbound: CorridorDirection, ctx: ReturnLabelContext = { seatCount: 1 }): Promo | null {
  const now = clock(ctx.nowMs);
  const dates = ctx.returnDate ? [ctx.returnDate] : ctx.range ? daysBetween(ctx.range.min, ctx.range.max) : null;
  return (
    config.promos.find(
      (p) =>
        p.type === "roundtrip" &&
        p.corridor === corridorId &&
        directionMatches(p, reverseChieu(outbound)) &&
        running(p, now) &&
        (dates === null || dates.some((d) => dayCanQualify(p, d, ctx.seatCount, now))),
    ) ?? null
  );
}

/** Khứ hồi cho một chuyến chiều về cụ thể (`chieu` = chiều của chính chuyến đó): cùng bộ điều kiện như combo. */
export function roundtripPromoForReturnLeg(config: BookingConfig, corridorId: string, chieu: CorridorDirection, trip: TripWindow): Promo | null {
  const now = clock(trip.nowMs);
  return config.promos.find((p) => p.type === "roundtrip" && p.corridor === corridorId && directionMatches(p, chieu) && running(p, now) && windowMatches(p, trip, now)) ?? null;
}

export interface ComboContext extends TripWindow {
  corridorId: string;
  chieu: CorridorDirection;
  /** Hạng xe của chuyến/đơn (`product.name`). Có thì combo phải có bậc giá đúng hạng này và đúng số vé (xem `comboTierExact`). */
  productName?: string;
}

/** Bậc giá combo đúng hạng xe (bậc không ghi hạng = mọi hạng) và ĐÚNG số vé; null = chương trình không bán cho tổ hợp này. */
export function comboTierExact(promo: Promo, productName: string, seatCount: number): Promo["tiers"][number] | null {
  const name = productName.trim().toLowerCase();
  return promo.tiers.find((t) => t.seats === seatCount && (!t.class.trim() || t.class.trim().toLowerCase() === name)) ?? null;
}

/**
 * Combo: tuyến + chiều + ngày đi/thứ/khung giờ xuất bến + đặt trước tối thiểu + số ghế trong [min, max] (+ bậc giá đúng hạng và số vé khi biết hạng).
 * Nhiều chương trình cùng khớp → chương trình đứng trước trong cấu hình WP; server áp đúng quy tắc này nên client không tự chọn được chương trình khác.
 */
export function comboPromoFor(config: BookingConfig, ctx: ComboContext): Promo | null {
  const now = clock(ctx.nowMs);
  return (
    config.promos.find(
      (p) =>
        p.type === "combo" &&
        p.corridor === ctx.corridorId &&
        directionMatches(p, ctx.chieu) &&
        running(p, now) &&
        windowMatches(p, ctx, now) &&
        (ctx.productName === undefined || comboTierExact(p, ctx.productName, ctx.seatCount) !== null),
    ) ?? null
  );
}

export const promoLabel = (promo: Promo, locale: Locale) => (locale === "en" ? promo.label.en : promo.label.vi);
export const promoBadge = (promo: Promo, locale: Locale) => (locale === "en" ? promo.badge.en : promo.badge.vi);

/**
 * Chương trình hiện ở khối "Ưu đãi" của trang tuyến (chiều `chieu` của tuyến `corridorId`): WP cho hiện trên trang tuyến; combo đúng chiều;
 * khứ hồi luôn liên quan (đặt hai chiều từ trang nào cũng được). Thời gian chạy do WP lọc (cấu hình cũ tối đa 5 phút).
 */
export const routePromos = (config: BookingConfig, corridorId: string, chieu: CorridorDirection): Promo[] =>
  config.promos.filter((p) => p.corridor === corridorId && p.show_on_route && (p.type === "roundtrip" || directionMatches(p, chieu)));
