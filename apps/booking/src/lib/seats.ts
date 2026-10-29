import type { Seat, SeatMapResponse } from "@/schemas/trip";

export const MAX_SEATS = 9;
export type SeatGrid = (Seat | null)[][];

const nullRows = (rows: (Seat | null)[][]) => rows.map((row) => row.map(() => null));

/** Gộp tầng phụ như web cũ: data[2] vào tầng 1, data[3] vào tầng 2 (thiếu thì chèn hàng trống); bỏ data[4]. */
export function mergeFloors(data: SeatMapResponse["data"]): [SeatGrid, SeatGrid] {
  const floor1: SeatGrid = (data[0] ?? []).map((row) => [...row]);
  const floor2: SeatGrid = (data[1] ?? []).map((row) => [...row]);
  if (data[2]) floor1.push(...data[2].map((row) => [...row]));
  else if (data[3]) floor1.push(...nullRows(data[3]));
  if (data[3]) floor2.push(...data[3].map((row) => [...row]));
  else if (data[2]) floor2.push(...nullRows(data[2]));
  return [floor1, floor2];
}

export interface Selection {
  seats: Seat[];
  /** "max" → toast tối đa 9 ghế; "guest" → mở modal đổi số khách (combo). */
  error?: "max" | "guest";
}

/** Bấm một ghế. Thường: tối đa 9, không xét numberGuest. Combo: tối đa numberGuest, mọi ghế lấy giá ghế vừa bấm. */
export function toggleSeat(current: Seat[], seat: Seat, opts: { isCombo: boolean; numberGuest: number }): Selection {
  if (!seat.is_empty) return { seats: current };
  if (current.some((s) => s.id === seat.id)) return { seats: current.filter((s) => s.id !== seat.id) };
  if (opts.isCombo) {
    if (current.length + 1 > opts.numberGuest) return { seats: current, error: current.length >= MAX_SEATS ? "max" : "guest" };
    return { seats: [...current, seat].map((s) => ({ ...s, price: seat.price })) };
  }
  if (current.length >= MAX_SEATS) return { seats: current, error: "max" };
  return { seats: [...current, seat] };
}

export interface Affiliate {
  aff?: string;
  utm_source?: string;
  aff_sid?: string;
}

/**
 * Body `POST api/hold-booking` đúng như web cũ (live 2026-10-28):
 * ghế nguyên object từ api/trips theo thứ tự id tăng dần (+ is_select:true ở chế độ thường).
 */
export function buildHoldBody(trip: { id: number; merchant: { code: string } }, seats: Seat[], isCombo: boolean, affiliate: Affiliate) {
  const ordered = [...seats].sort((a, b) => a.id - b.id).map((s) => (isCombo ? { ...s } : { ...s, is_select: true }));
  const body: Record<string, unknown> = { trip_id: trip.id, seats: ordered, merchant_code: trip.merchant.code, channel: 1, aff: affiliate.aff };
  if (affiliate.utm_source) body.utm_source = affiliate.utm_source;
  if (affiliate.aff_sid) body.aff_sid = affiliate.aff_sid;
  return body;
}
