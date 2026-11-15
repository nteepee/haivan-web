import "server-only";
import { identifyLeg, identifyStop } from "@/lib/corridors";
import { evaluate, type LinkedOrderFacts, type RejectReason, type RuleContext, type RuleLeg, REJECT_MESSAGE } from "@/price-rules/engine";
import type { BookingConfig, ConfigRule } from "@/schemas/booking-config";
import type { OrderFacts } from "./promo-eligibility";

/**
 * Quyết định CUỐI của luật giá v2 trước khi đổi token `@auto:<post_id>:<đơn>` thành mã ERP thật.
 * Ngữ cảnh dựng hoàn toàn từ dữ liệu server: đơn đọc bằng token của khách (`GET bookings/{code}`), tuyến/chiều theo toạ độ vé,
 * giá ghế = giá vé trong đơn, hạng ghế/số chỗ xe từ sơ đồ ghế công khai (chỉ đọc khi luật cần). Trình duyệt không quyết định được gì.
 * Token phải là luật mà engine CHỌN (cùng quy tắc cộng dồn) — khách không tự chọn luật khác.
 */

export interface SeatMapFacts {
  /** Tên ghế → hạng ghế (seat_rank). */
  ranks: ReadonlyMap<string, string | null>;
  /** Số ghế của xe (đếm ô ghế trên sơ đồ). */
  vehicleSeats: number | null;
}

export interface RuleEligibilityInput {
  config: BookingConfig;
  /** Luật đầy đủ phía server (có quota). */
  rules: readonly ConfigRule[];
  postId: number;
  current: OrderFacts | null;
  /** Mã đơn trong token: luật khứ hồi = đơn chiều đi; luật khác = chính đơn đang đặt. */
  tokenOrder: string;
  linked: OrderFacts | null;
  seatMap: SeatMapFacts | null;
  /** Số ghế mang token trong yêu cầu. */
  seats: number;
  testers: ReadonlySet<string>;
  /** Số ghế đã dùng theo luật (sổ hạn mức); thiếu = luật có quota bị từ chối. Sổ hạn mức giữ suất nguyên tử SAU khi engine đồng ý. */
  counters?: RuleContext["counters"];
  /** Dịch vụ ghi giảm trực tiếp ERP đã cấu hình (settlement.ts). */
  directEnabled?: boolean;
  nowMs?: number;
}

export type RuleVerdict = { ok: true; rule: ConfigRule; discount: number; quotaSeats: number; seats: Array<{ no: string; before: number; after: number }> } | { ok: false; reason: RejectReason | "order_unknown" | "not_owner" | "order_cancelled" | "seats_exceed" | "unsupported"; message: string };

const fail = (reason: Exclude<RuleVerdict, { ok: true }>["reason"], message?: string): RuleVerdict => ({
  ok: false,
  reason,
  message: message ?? (reason in REJECT_MESSAGE ? REJECT_MESSAGE[reason as RejectReason].vi : "Không xác minh được đơn hàng để áp ưu đãi. Vui lòng thử lại."),
});

/** Luật cần sơ đồ ghế (hạng ghế hoặc số chỗ xe) không? */
export function ruleNeedsSeatMap(rule: ConfigRule["rule"]): boolean {
  const vs = (x?: { vehicle_seats?: number[] }) => !!x?.vehicle_seats?.length;
  return (
    !!rule.who.seat_match?.ranks?.length ||
    vs(rule.scope) ||
    (rule.when.departure ?? []).some(vs) ||
    (rule.effect.total_tiers ?? []).some(vs) ||
    (rule.who.seat_match?.exact_sets ?? []).some(vs) ||
    (rule.when.lead_by_product ?? []).some(vs)
  );
}

function legOf(config: BookingConfig, facts: OrderFacts, seatMap: SeatMapFacts | null): RuleLeg | null {
  if (!facts.trip || !facts.productName) return null;
  const located = identifyLeg(config, facts.trip.dep, facts.trip.dest);
  return {
    merchant: facts.merchant ?? null,
    corridor: located?.corridor.id ?? null,
    direction: located?.chieu ?? null,
    product: facts.productName,
    vehicleSeats: seatMap?.vehicleSeats ?? null,
    fromStop: located ? identifyStop(located.corridor, located.chieu === "ab" ? "a" : "b", facts.trip.dep) : null,
    toStop: located ? identifyStop(located.corridor, located.chieu === "ab" ? "b" : "a", facts.trip.dest) : null,
    date: facts.trip.departureTime.slice(0, 10),
    departure: facts.trip.departureTime.slice(11, 16),
    seats: (facts.seats ?? []).map((s) => ({ no: s.no, price: s.price, rank: seatMap?.ranks.get(s.no) ?? null })),
  };
}

export function checkRuleEligibility(input: RuleEligibilityInput): RuleVerdict {
  const { config, rules, postId, current, linked, seatMap, seats } = input;
  const target = rules.find((r) => r.post_id === postId);
  if (!target) return fail("status");
  const rule = target.rule;
  const settles = (r: ConfigRule["rule"]) => r.apply.settlement === "erp_code" || (r.apply.settlement === "erp_direct" && !!input.directEnabled);
  if (!settles(rule)) return fail("unsupported", "Ưu đãi này chưa áp được tự động trên web. Vui lòng liên hệ 1900 6763.");
  // Lúc áp mã chưa biết khách trả bằng gì / kênh nào: luật ràng buộc hai điều này chưa kiểm được → không áp (không bao giờ bỏ qua điều kiện).
  if (rule.who.payments || rule.who.channels || rule.apply.mode !== "auto" || rule.who.across_legs) return fail("unsupported", "Ưu đãi này chưa áp được tự động trên web. Vui lòng liên hệ 1900 6763.");
  if (rule.quota && !input.counters) return fail("unsupported", "Hệ thống tạm thời chưa kiểm tra được suất ưu đãi. Vui lòng thử lại sau ít phút.");
  if (!current?.trip || !current.seats?.length) return fail("order_unknown");
  if (current.cancelled) return fail("order_cancelled", "Đơn đã huỷ nên không áp dụng được ưu đãi.");
  if (seats > current.liveTickets) return fail("seats_exceed", "Số ghế áp ưu đãi nhiều hơn số vé của đơn.");

  let linkedFacts: LinkedOrderFacts | null = null;
  if (rule.who.linked_order) {
    if (!linked || linked.code === current.code) return fail("linked_order");
    if (!linked.trip) return fail("order_unknown");
    const sameCustomer = current.customerKeys.some((k) => linked.customerKeys.includes(k));
    if (!sameCustomer) return fail(current.customerKeys.length && linked.customerKeys.length ? "not_owner" : "order_unknown", "Đơn chiều đi không thuộc cùng khách hàng với đơn này nên chưa áp dụng được ưu đãi.");
    const here = identifyLeg(config, current.trip.dep, current.trip.dest);
    const there = identifyLeg(config, linked.trip.dep, linked.trip.dest);
    linkedFacts = {
      reverse: !!here && !!there && here.corridor.id === there.corridor.id && here.chieu !== there.chieu,
      paid: linked.paid && !linked.cancelled,
      sameCustomer,
      seats: linked.liveTickets,
      departsBefore: linked.trip.departureTime <= current.trip.departureTime,
    };
  } else if (input.tokenOrder !== current.code) {
    return fail("order_unknown");
  }

  const leg = legOf(config, current, seatMap);
  if (!leg) return fail("order_unknown");
  const phones = current.customerKeys.filter((k) => k.startsWith("phone:")).map((k) => k.slice(6));
  const tester = phones.some((p) => input.testers.has(p));
  // Đánh giá MỌI luật tự áp mã ERP (cùng tập với client) để giữ đúng quy tắc cộng dồn; token chỉ hợp lệ nếu luật của nó thắng.
  const pool = rules.map((r) => r.rule).filter((r) => r.apply.mode === "auto" && settles(r) && !r.who.across_legs && !r.who.payments && !r.who.channels);
  const result = evaluate(pool, {
    now: input.nowMs ?? Date.now(),
    legs: [leg],
    linkedOrder: linkedFacts,
    statuses: tester ? ["on", "test"] : ["on"],
    counters: input.counters,
  });
  const hit = result.applied.find((a) => a.rule.id === rule.id);
  if (!hit) {
    const why = result.rejected.find((r) => r.ruleId === rule.id)?.reason ?? "group";
    console.info(`[rule-eligibility] từ chối ${rule.id} (post ${postId}) đơn ${current.code}: ${why}`);
    return fail(why);
  }
  if (seats > hit.seats.length) return fail("seats_exceed", "Số ghế áp ưu đãi nhiều hơn số ghế đủ điều kiện.");
  return { ok: true, rule: target, discount: hit.discount ?? 0, quotaSeats: hit.quotaSeats, seats: hit.seats.map((s) => ({ no: s.no, before: s.before, after: s.after })) };
}
