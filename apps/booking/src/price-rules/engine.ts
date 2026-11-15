import { addDaysIso, parseVnDateTime, todayIsoVn } from "@/lib/format";
import type { PriceRule, RuleWindow } from "./schema";

/**
 * Engine luật giá v2: hàm THUẦN (không mạng, không DB, không đọc giờ hệ thống ngoài `ctx.now`).
 * Cùng một hàm chạy ở trình duyệt (nhãn, xem trước) và ở server (quyết định cuối trước khi đổi token thành mã/ghi ERP),
 * ở WP (mô phỏng qua Next) và CLI. Hạn mức đi vào qua `ctx.counters` (sổ hạn mức là I/O duy nhất, nằm ngoài engine).
 */

export interface RuleSeat {
  /** Số/tên ghế như sơ đồ ghế ("1", "A1-1"…). */
  no: string;
  /** seat_rank của sơ đồ ghế (A, B, C, D, Thường…). */
  rank?: string | null;
  /** Giá thường hiện tại của ghế (đã gồm giảm cấp chuyến của ERP), VND. */
  price: number;
}

export interface RuleLeg {
  merchant?: string | null;
  corridor: string | null;
  direction: "ab" | "ba" | null;
  /** product.name của apigw. */
  product: string;
  /** Số chỗ của xe (dòng xe Vũng Tàu: Luxury 9 chỗ = eco, 11 chỗ = luxury); null = không rõ. */
  vehicleSeats?: number | null;
  /** Mã trạm đón/trả của tuyến (corridor stop id); null = không rõ (luật giới hạn trạm sẽ không khớp). */
  fromStop?: string | null;
  toStop?: string | null;
  /** Ngày đi "YYYY-MM-DD". */
  date: string;
  /** Giờ xuất bến "HH:mm"; null = chưa biết (luật có khung giờ/đặt trước sẽ không khớp). */
  departure: string | null;
  /** Ghế đã chọn; rỗng ở chế độ xem trước (dùng `seatCount`). */
  seats: RuleSeat[];
  seatCount?: number;
}

export interface LinkedOrderFacts {
  reverse: boolean;
  paid: boolean;
  sameCustomer: boolean;
  /** Số vé còn hiệu lực của đơn liên kết. */
  seats: number;
  /** Đơn liên kết khởi hành trước hoặc cùng lúc chặng này. */
  departsBefore: boolean;
}

export interface RuleContext {
  now: number;
  /** legs[0] = chặng đang đặt. across_legs dùng mọi chặng. */
  legs: RuleLeg[];
  linkedOrder?: LinkedOrderFacts | null;
  /** Cách thanh toán đã chọn; null/undefined = chưa chọn (không loại luật, bước thanh toán phải ép theo `payments`). */
  payment?: string | null;
  channel?: string | null;
  /** Luật optin khách đã bấm chọn. */
  requested?: readonly string[];
  /** Trạng thái được chạy: mặc định ["on"]; SĐT thử thêm "test". */
  statuses?: ReadonlyArray<PriceRule["status"]>;
  /** Số ghế đã dùng theo luật (từ sổ hạn mức). */
  counters?: Readonly<Record<string, { trip?: number; phone?: number; total?: number }>>;
  /** Xem trước (chưa chọn ghế/giá): bỏ kiểm theo số ghế cụ thể, hạn mức và lợi ích. */
  preview?: boolean;
}

export type RejectReason =
  | "status"
  | "optin"
  | "merchant"
  | "corridor"
  | "direction"
  | "product"
  | "stop"
  | "product_mix"
  | "not_running"
  | "travel_date"
  | "weekday"
  | "schedule"
  | "too_late"
  | "too_early"
  | "payment"
  | "channel"
  | "seats"
  | "linked_order"
  | "blocked_seat"
  | "exact_seats"
  | "seat_match"
  | "quota"
  | "per_phone"
  | "no_benefit"
  | "group"
  | "settlement_mix";

export const REJECT_MESSAGE: Record<RejectReason, { vi: string; en: string }> = {
  status: { vi: "Chương trình chưa chạy.", en: "This offer is not active." },
  optin: { vi: "Quý khách chưa chọn ưu đãi này.", en: "You have not selected this offer." },
  merchant: { vi: "Ưu đãi không áp dụng cho nhà xe này.", en: "This offer does not apply to this operator." },
  corridor: { vi: "Ưu đãi không áp dụng cho tuyến này.", en: "This offer does not apply to this route." },
  direction: { vi: "Ưu đãi không áp dụng cho chiều đi này.", en: "This offer does not apply to this direction." },
  product: { vi: "Ưu đãi không áp dụng cho hạng xe này.", en: "This offer does not apply to this coach class." },
  stop: { vi: "Ưu đãi không áp dụng cho điểm đón/trả này.", en: "This offer does not apply to this pick-up/drop-off point." },
  product_mix: { vi: "Hai chặng phải cùng hạng xe.", en: "Both legs must be the same coach class." },
  not_running: { vi: "Chương trình đã hết hoặc chưa bắt đầu.", en: "This offer has ended or not started yet." },
  travel_date: { vi: "Ngày đi không nằm trong thời gian áp dụng.", en: "The travel date is outside the offer period." },
  weekday: { vi: "Ưu đãi không áp dụng cho thứ này.", en: "This offer does not apply on this day." },
  schedule: { vi: "Giờ xuất bến không thuộc khung áp dụng.", en: "This departure time is not covered by the offer." },
  too_late: { vi: "Đã quá hạn đặt trước để hưởng ưu đãi.", en: "Too late to book with this offer." },
  too_early: { vi: "Ưu đãi chỉ áp khi đặt sát giờ xe chạy.", en: "This offer only applies close to departure." },
  payment: { vi: "Ưu đãi chỉ áp khi thanh toán bằng cách khác.", en: "This offer requires a different payment method." },
  channel: { vi: "Ưu đãi không áp dụng trên kênh này.", en: "This offer is not available on this channel." },
  seats: { vi: "Số vé chưa đúng điều kiện ưu đãi.", en: "The number of tickets does not qualify." },
  linked_order: { vi: "Cần đơn chiều ngược lại đã thanh toán của quý khách.", en: "A paid booking in the opposite direction is required." },
  blocked_seat: { vi: "Ghế đã chọn không áp dụng ưu đãi.", en: "A selected seat is excluded from this offer." },
  exact_seats: { vi: "Ưu đãi yêu cầu chọn đúng hàng ghế quy định.", en: "This offer requires the designated row of seats." },
  seat_match: { vi: "Hạng ghế đã chọn không áp dụng ưu đãi.", en: "The selected seat class does not qualify." },
  quota: { vi: "Chuyến này đã hết suất ưu đãi.", en: "No offer seats left on this trip." },
  per_phone: { vi: "Vượt số vé ưu đãi tối đa cho mỗi số điện thoại.", en: "Exceeds the offer limit per phone number." },
  no_benefit: { vi: "Giá hiện tại đã thấp hơn giá ưu đãi.", en: "The current fare is already lower." },
  group: { vi: "Đã áp một ưu đãi tốt hơn không cộng dồn.", en: "A better non-combinable offer was applied." },
  settlement_mix: { vi: "Không cộng dồn với ưu đãi đã áp.", en: "Cannot be combined with the applied offer." },
};

export interface SeatDiscount {
  leg: number;
  no: string;
  before: number;
  after: number;
}

export interface AppliedRule {
  rule: PriceRule;
  /** Tổng tiền giảm của luật (VND); null ở chế độ xem trước khi chưa có giá. */
  discount: number | null;
  seats: SeatDiscount[];
  /** Số ghế tính vào hạn mức. */
  quotaSeats: number;
}

export interface Rejection {
  ruleId: string;
  reason: RejectReason;
}

export interface Evaluation {
  applied: AppliedRule[];
  rejected: Rejection[];
  /** Tổng giá thường và sau ưu đãi của các ghế trong ngữ cảnh (0 khi xem trước). */
  before: number;
  after: number;
}

const norm = (s: string) => s.trim().toLowerCase();
const inList = (list: readonly string[] | undefined, value: string | null | undefined) =>
  !list || list.length === 0 || (value != null && list.some((x) => norm(x) === norm(value)));
/** 1 = thứ hai … 7 = chủ nhật. */
export const isoWeekday = (iso: string) => ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
/** Khớp hạng xe: từ khoá nằm trong product.name (không phân biệt hoa thường) + số chỗ xe nếu luật ghi. */
export function vehicleMatches(spec: { products?: readonly string[]; vehicle_seats?: readonly number[] } | undefined, leg: Pick<RuleLeg, "product" | "vehicleSeats">): boolean {
  if (!spec) return true;
  if (spec.products?.length && !spec.products.some((k) => norm(leg.product).includes(norm(k)))) return false;
  if (spec.vehicle_seats?.length && (leg.vehicleSeats == null || !spec.vehicle_seats.includes(leg.vehicleSeats))) return false;
  return true;
}
const legSeatCount = (leg: RuleLeg) => (leg.seats.length ? leg.seats.length : (leg.seatCount ?? 0));

/** Cửa sổ giờ khớp chặng; trả danh sách số vé được phép (null = mọi số vé) hoặc false = không khớp cửa sổ nào. */
export function windowsFor(windows: readonly RuleWindow[] | undefined, leg: RuleLeg): Set<number> | null | false {
  if (!windows || windows.length === 0) return null;
  if (!leg.departure) return false;
  const day = isoWeekday(leg.date);
  let any = false;
  const sizes = new Set<number>();
  let unlimited = false;
  for (const w of windows) {
    if (w.directions?.length && (!leg.direction || !w.directions.includes(leg.direction))) continue;
    if (w.weekdays?.length && !w.weekdays.includes(day)) continue;
    if (!vehicleMatches(w, leg)) continue;
    if (leg.departure < w.from || leg.departure > w.to) continue;
    any = true;
    if (w.seats) w.seats.forEach((n) => sizes.add(n));
    else unlimited = true;
  }
  if (!any) return false;
  return unlimited ? null : sizes;
}

/** Điều kiện của MỘT chặng không phụ thuộc ghế. */
function legProblem(rule: PriceRule, leg: RuleLeg, now: number): RejectReason | null {
  const { scope, when } = rule;
  if (!inList(scope.merchants, leg.merchant ?? null)) return "merchant";
  if (scope.corridors?.length && (!leg.corridor || !scope.corridors.includes(leg.corridor))) return "corridor";
  if (scope.directions?.length && (!leg.direction || !scope.directions.includes(leg.direction))) return "direction";
  if (!vehicleMatches(scope, leg)) return "product";
  if (scope.stops?.from?.length && (!leg.fromStop || !scope.stops.from.includes(leg.fromStop))) return "stop";
  if (scope.stops?.to?.length && (!leg.toStop || !scope.stops.to.includes(leg.toStop))) return "stop";
  // Đặt trước kiểm TRƯỚC khoảng ngày đi (như hệ cũ: ngày sớm nhất đặt được = max(hôm nay + N, ngày bắt đầu) → "quá hạn").
  const lead = when.lead_by_product?.find((x) => vehicleMatches(x, leg))?.lead ?? when.lead;
  if (lead?.min_days !== undefined && leg.date < addDaysIso(todayIsoVn(now), lead.min_days)) return "too_late";
  if (when.travel?.from && leg.date < when.travel.from) return lead?.min_days !== undefined ? "too_late" : "travel_date";
  if (when.travel?.to && leg.date > when.travel.to) return "travel_date";
  if (when.weekdays?.length && !when.weekdays.includes(isoWeekday(leg.date))) return "weekday";
  if (windowsFor(when.departure, leg) === false) return "schedule";
  if (lead && (lead.min_minutes !== undefined || lead.max_minutes !== undefined)) {
    if (!leg.departure) return "too_late";
    const departAt = parseVnDateTime(`${leg.date} ${leg.departure}`);
    if (!Number.isFinite(departAt)) return "too_late";
    const minutes = (departAt - now) / 60_000;
    if (lead.min_minutes !== undefined && minutes < lead.min_minutes) return "too_late";
    if (lead.max_minutes !== undefined && minutes > lead.max_minutes) return "too_early";
  }
  return null;
}

/** Chia tổng tiền combo cho từng ghế theo bội 1.000đ, phần lẻ dồn vào các ghế đầu (đúng `split_total` của hệ booking cũ: 599k/3 = 200k+200k+199k). */
export function splitTotal(total: number, count: number, unit = 1000): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / unit / count) * unit;
  const shares = Array.from({ length: count }, () => base);
  let remainder = total - base * count;
  for (let i = 0; i < count && remainder > 0; i++) {
    const step = Math.min(unit, remainder);
    shares[i] += step;
    remainder -= step;
  }
  shares[count - 1] += remainder;
  return shares;
}

interface Candidate {
  rule: PriceRule;
  legs: number[];
  /** Ghế được tính (chỉ số chặng + ghế), theo thứ tự đơn. */
  seats: Array<{ leg: number; seat: RuleSeat }>;
  count: number;
  /** Chặng đại diện để khớp hạng xe (bậc giá, tập ghế đúng). */
  lead: RuleLeg;
}

/** Kiểm mọi điều kiện của một luật (trừ cộng dồn). */
function qualify(rule: PriceRule, ctx: RuleContext): Candidate | RejectReason {
  const statuses = ctx.statuses ?? ["on"];
  if (!statuses.includes(rule.status)) return "status";
  if (rule.apply.mode === "optin" && !ctx.requested?.includes(rule.id)) return "optin";
  const today = todayIsoVn(ctx.now);
  if (rule.when.book?.from && today < rule.when.book.from) return "not_running";
  if (rule.when.book?.to && today > rule.when.book.to) return "not_running";
  if (rule.who.payments && ctx.payment && !rule.who.payments.includes(ctx.payment as never)) return "payment";
  if (rule.who.channels && ctx.channel && !rule.who.channels.includes(ctx.channel as never)) return "channel";

  const legIdx = rule.who.across_legs ? ctx.legs.map((_, i) => i) : ctx.legs.length ? [0] : [];
  if (!legIdx.length) return "seats";
  for (const i of legIdx) {
    const problem = legProblem(rule, ctx.legs[i], ctx.now);
    if (problem) return problem;
  }
  const lead = ctx.legs[legIdx[0]];
  // Combo trên nhiều chặng: mọi chặng phải thuộc CÙNG dòng xe (cùng mục bậc giá khớp đầu tiên), như `line_of` của hệ cũ.
  if (rule.effect.total_tiers && legIdx.length > 1) {
    const lineOf = (l: RuleLeg) => rule.effect.total_tiers!.findIndex((t) => vehicleMatches(t, l));
    if (legIdx.some((i) => lineOf(ctx.legs[i]) !== lineOf(lead))) return "product_mix";
  }
  const count = legIdx.reduce((n, i) => n + legSeatCount(ctx.legs[i]), 0);
  if (count < 1) return "seats";
  if (rule.who.seats && (count < rule.who.seats.min || count > rule.who.seats.max)) return "seats";
  for (const i of legIdx) {
    const allowed = windowsFor(rule.when.departure, ctx.legs[i]);
    if (allowed && !allowed.has(count)) return "schedule";
  }

  const link = rule.who.linked_order;
  if (link) {
    const o = ctx.linkedOrder;
    if (!o || !o.reverse || !o.sameCustomer || !o.departsBefore || (link.paid && !o.paid) || o.seats < 1) return "linked_order";
  }

  const all = legIdx.flatMap((leg) => ctx.legs[leg].seats.map((seat) => ({ leg, seat })));
  const match = rule.who.seat_match;
  let seats = all;
  if (!ctx.preview && all.length) {
    const chosen = new Set(all.map((s) => s.seat.no));
    if (match?.exclude_numbers?.some((n) => chosen.has(n))) return "blocked_seat";
    const exact = match?.exact_sets?.find((e) => e.seats === count && vehicleMatches(e, lead));
    if (exact && (exact.numbers.length !== chosen.size || exact.numbers.some((n) => !chosen.has(n)))) return "exact_seats";
    seats = all.filter(({ seat }) => (!match?.numbers?.length || match.numbers.includes(seat.no)) && inList(match?.ranks, seat.rank ?? null));
    if (!seats.length) return "seat_match";
    if (link?.seats_lte && ctx.linkedOrder) seats = seats.slice(0, ctx.linkedOrder.seats);
  }

  if (!ctx.preview) {
    const used = ctx.counters?.[rule.id];
    const n = seats.length || count;
    if (rule.quota?.per_trip !== undefined && (used?.trip ?? 0) + n > rule.quota.per_trip) return "quota";
    if (rule.quota?.total !== undefined && (used?.total ?? 0) + n > rule.quota.total) return "quota";
    if (rule.quota?.per_phone !== undefined && (used?.phone ?? 0) + n > rule.quota.per_phone) return "per_phone";
  }
  if (rule.effect.total_tiers && !tierFor(rule, count, lead)) return "seats";
  return { rule, legs: legIdx, seats, count, lead };
}

const tierFor = (rule: PriceRule, count: number, leg: RuleLeg) =>
  rule.effect.total_tiers?.find((t) => t.seats === count && vehicleMatches(t, leg)) ?? null;

/** Giá sau luật cho các ghế của ứng viên, trên giá đang chạy `price(leg,no)`. */
function priceCandidate(c: Candidate, price: (leg: number, no: string) => number): SeatDiscount[] {
  const e = c.rule.effect;
  const rows = c.seats.map(({ leg, seat }) => ({ leg, no: seat.no, before: price(leg, seat.no) }));
  let afters: number[];
  if (e.total_tiers) {
    const tier = tierFor(c.rule, c.count, c.lead)!;
    afters = splitTotal(tier.total_vnd, rows.length);
  } else if (e.seat_off_vnd !== undefined) {
    afters = rows.map((r) => Math.max(0, r.before - e.seat_off_vnd!));
  } else if (e.seat_off_percent !== undefined) {
    afters = rows.map((r) => r.before - Math.round((r.before * e.seat_off_percent!) / 100));
  } else {
    afters = rows.map(() => e.seat_set_vnd!);
  }
  let out = rows.map((r, i) => ({ ...r, after: afters[i] }));
  if (e.not_cheaper) {
    if (e.total_tiers) {
      const before = out.reduce((s, r) => s + r.before, 0);
      const after = out.reduce((s, r) => s + r.after, 0);
      if (after > before) out = out.map((r) => ({ ...r, after: r.before }));
    } else {
      out = out.map((r) => ({ ...r, after: Math.min(r.after, r.before) }));
    }
  }
  if (e.cap_vnd !== undefined) {
    let over = out.reduce((s, r) => s + (r.before - r.after), 0) - e.cap_vnd;
    for (let i = out.length - 1; i >= 0 && over > 0; i--) {
      const give = Math.min(over, out[i].before - out[i].after);
      out[i] = { ...out[i], after: out[i].after + give };
      over -= give;
    }
  }
  return out;
}

/** Luật không ghi `exclusive_group` thuộc nhóm chung này: mặc định KHÔNG cộng dồn (tránh vô tình giảm hai lần). */
export const DEFAULT_GROUP = "default";

/**
 * Đánh giá mọi luật cho ngữ cảnh. Cộng dồn: nhóm theo `exclusive_group` (thiếu = nhóm chung "default", không cộng dồn với nhau); trong nhóm chọn ưu tiên cao nhất,
 * hoà thì giảm nhiều hơn, hoà nữa thì id nhỏ hơn. Các nhóm áp lần lượt theo ưu tiên trên giá đang chạy. Một đơn chỉ một cách thu tiền.
 */
export function evaluate(rules: readonly PriceRule[], ctx: RuleContext): Evaluation {
  const rejected: Rejection[] = [];
  const candidates: Candidate[] = [];
  for (const rule of rules) {
    const q = qualify(rule, ctx);
    if (typeof q === "string") rejected.push({ ruleId: rule.id, reason: q });
    else candidates.push(q);
  }

  const base = new Map<string, number>();
  ctx.legs.forEach((leg, i) => leg.seats.forEach((s) => base.set(`${i}|${s.no}`, s.price)));
  const priceOf = (m: Map<string, number>) => (leg: number, no: string) => m.get(`${leg}|${no}`) ?? 0;
  const gain = (c: Candidate) => (ctx.preview && !c.seats.length ? 0 : priceCandidate(c, priceOf(base)).reduce((s, r) => s + r.before - r.after, 0));

  const groups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const key = c.rule.exclusive_group ?? DEFAULT_GROUP;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const winners: Candidate[] = [];
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => b.rule.priority - a.rule.priority || gain(b) - gain(a) || a.rule.id.localeCompare(b.rule.id));
    winners.push(sorted[0]);
    sorted.slice(1).forEach((c) => rejected.push({ ruleId: c.rule.id, reason: "group" }));
  }
  winners.sort((a, b) => b.rule.priority - a.rule.priority || a.rule.id.localeCompare(b.rule.id));

  const running = new Map(base);
  const applied: AppliedRule[] = [];
  let settlement: string | null = null;
  for (const c of winners) {
    if (settlement && c.rule.apply.settlement !== settlement) {
      rejected.push({ ruleId: c.rule.id, reason: "settlement_mix" });
      continue;
    }
    if (ctx.preview && !c.seats.length) {
      applied.push({ rule: c.rule, discount: null, seats: [], quotaSeats: c.count });
      settlement = c.rule.apply.settlement;
      continue;
    }
    const seats = priceCandidate(c, priceOf(running));
    const discount = seats.reduce((s, r) => s + r.before - r.after, 0);
    if (discount <= 0) {
      rejected.push({ ruleId: c.rule.id, reason: "no_benefit" });
      continue;
    }
    seats.forEach((r) => running.set(`${r.leg}|${r.no}`, r.after));
    applied.push({ rule: c.rule, discount, seats, quotaSeats: seats.length });
    settlement = c.rule.apply.settlement;
  }
  const sum = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0);
  return { applied, rejected, before: sum(base), after: sum(running) };
}

/** Lý do (vi/en) cho khách. */
export const rejectMessage = (reason: RejectReason, locale: "vi" | "en" = "vi") => REJECT_MESSAGE[reason][locale];
