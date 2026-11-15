import { evaluate, type RuleContext, type RuleLeg } from "@/price-rules/engine";
import type { PriceRule } from "@/price-rules/schema";
import type { BookingConfig, ConfigRule, CorridorDirection, Promo } from "@/schemas/booking-config";
import type { Trip } from "@/schemas/trip";
import type { BookingDraft } from "@/stores/booking-draft";

/**
 * Cầu nối luật giá v2 (src/price-rules) với giao diện đang dùng `Promo` v1: khi WP gửi `rules`, mọi quyết định "có ưu đãi không"
 * đi qua engine, còn thẻ chuyến/khối ưu đãi/tự áp mã dùng lại component cũ qua `ruleAsPromo`. Không có `rules` → mọi thứ như cũ.
 * Đây chỉ là gợi ý ở trình duyệt; server (src/server/rule-eligibility.ts) đánh giá lại bằng dữ liệu đơn thật trước khi đổi token thành mã.
 */

/** Khách thử luật `test`: cookie `hv_rule_test=1` (server vẫn chỉ áp cho SĐT trong danh sách thử của WP). */
export function ruleTester(): boolean {
  try {
    return typeof document !== "undefined" && /(?:^|;\s*)hv_rule_test=1(?:;|$)/.test(document.cookie);
  } catch {
    return false;
  }
}

const statuses = (): Array<PriceRule["status"]> => (ruleTester() ? ["on", "test"] : ["on"]);
export const hasRules = (config: BookingConfig) => config.rules.length > 0;
const rulesOf = (config: BookingConfig) => config.rules.map((r) => r.rule);
const byRuleId = (config: BookingConfig, id: string) => config.rules.find((r) => r.rule.id === id) ?? null;

/** Luật v2 trình bày như `Promo` v1 cho component cũ: `id` = post_id (số trong token), loại suy từ hiệu ứng. */
export function ruleAsPromo({ post_id, rule }: ConfigRule): Promo {
  const roundtrip = !!rule.who.linked_order;
  const dir = rule.scope.directions?.length === 1 ? rule.scope.directions[0] : "both";
  return {
    id: post_id,
    type: roundtrip ? "roundtrip" : "combo",
    corridor: rule.scope.corridors?.[0] ?? "",
    direction: dir,
    book_from: rule.when.book?.from ?? null,
    book_to: rule.when.book?.to ?? null,
    travel_from: rule.when.travel?.from ?? null,
    travel_to: rule.when.travel?.to ?? null,
    weekdays: rule.when.weekdays ?? null,
    hours: null,
    book_ahead_minutes: rule.when.lead?.min_minutes ?? null,
    seats: { min: rule.who.seats?.min ?? 1, max: rule.who.seats?.max ?? 60 },
    per_seat_vnd: rule.effect.seat_off_vnd ?? null,
    tiers: (rule.effect.total_tiers ?? []).map((t) => ({ seats: t.seats, class: t.products?.[0] ?? "", price_vnd: t.total_vnd, was_vnd: null })),
    label: { vi: rule.display.label.vi, en: rule.display.label.en || rule.display.label.vi },
    badge: { vi: rule.display.badge.vi, en: rule.display.badge.en || rule.display.badge.vi },
    headline: rule.display.headline ? { vi: rule.display.headline.vi, en: rule.display.headline.en || rule.display.headline.vi } : null,
    terms: { vi: rule.display.terms.vi, en: rule.display.terms.en.length ? rule.display.terms.en : rule.display.terms.vi },
    show_on_route: rule.display.show_on.includes("route"),
    has_code: true,
  };
}

const hhmm = (t: string | null | undefined) => (t && /\d{2}:\d{2}/.test(t) ? (t.match(/(\d{2}:\d{2})/)?.[1] ?? null) : null);

/** Chặng của nháp đặt vé (ghế đã giữ, giá ghế từ sơ đồ ghế). */
export function draftLeg(draft: BookingDraft): RuleLeg {
  const own = draft.search.corridor;
  return {
    merchant: draft.trip_info.merchant.code,
    corridor: own?.tuyen ?? null,
    direction: own?.chieu ?? null,
    product: draft.trip_info.product.name,
    vehicleSeats: draft.trip_info.total_seats ?? null,
    fromStop: own?.diemDi ?? null,
    toStop: own?.diemDen ?? null,
    date: draft.trip_info.date.slice(0, 10),
    departure: hhmm(draft.trip_info.from.reached_at) ?? hhmm(draft.trip_info.time),
    seats: draft.seats.map((s) => ({ no: s.name, rank: s.seat_rank ?? null, price: s.price })),
  };
}

/** Chặng xem trước của một thẻ chuyến (chưa chọn ghế). */
export function tripLeg(trip: Trip, corridor: { tuyen: string; chieu: CorridorDirection; diemDi?: string | null; diemDen?: string | null } | null, seatCount: number): RuleLeg {
  return {
    merchant: trip.merchant.code,
    corridor: corridor?.tuyen ?? null,
    direction: corridor?.chieu ?? null,
    product: trip.product.name,
    vehicleSeats: trip.total_seats ?? null,
    fromStop: corridor?.diemDi ?? null,
    toStop: corridor?.diemDen ?? null,
    date: trip.date.slice(0, 10),
    departure: hhmm(trip.from.reached_at) ?? hhmm(trip.time),
    seats: [],
    seatCount,
  };
}

/**
 * Luật tự áp ở bước xác nhận (hoặc null): đánh giá mọi luật `auto` với ghế đã giữ; chặng về (`chang=ve` + `don_di`) được coi là có đơn
 * chiều đi hợp lệ để gợi ý — server kiểm thật. Cấu hình đã chỉ còn luật bản deploy này áp được (booking-config-source).
 */
function autoHit(config: BookingConfig, draft: BookingDraft, nowMs?: number) {
  const own = draft.search.corridor;
  if (!hasRules(config) || draft.is_combo === 1 || draft.seats.some((s) => s.promotion || s.is_reward)) return null;
  const linked = own?.chang === "ve" && own.donDi ? { reverse: true, paid: true, sameCustomer: true, seats: draft.seats.length, departsBefore: true } : null;
  const ctx: RuleContext = { now: nowMs ?? Date.now(), legs: [draftLeg(draft)], linkedOrder: linked, statuses: statuses() };
  const usable = rulesOf(config).filter((r) => r.apply.mode === "auto" && !r.who.across_legs);
  return evaluate(usable, ctx).applied[0] ?? null;
}

export function autoRuleFor(config: BookingConfig, draft: BookingDraft, nowMs?: number): Promo | null {
  const hit = autoHit(config, draft, nowMs);
  const found = hit ? byRuleId(config, hit.rule.id) : null;
  return found ? ruleAsPromo(found) : null;
}

/**
 * Tên ghế engine áp luật `promoId` (post_id) cho nháp này — chỉ gắn token vào ĐÚNG các ghế đó (luật theo hạng ghế, khứ hồi giới hạn số ghế):
 * gắn thừa ghế thì server từ chối cả đơn. null = không phải luật v2 (chương trình v1: giữ cách gắn cũ).
 */
export function autoRuleSeatNames(config: BookingConfig, draft: BookingDraft, promoId: number, nowMs?: number): string[] | null {
  const target = config.rules.find((r) => r.post_id === promoId);
  if (!target) return null;
  const hit = autoHit(config, draft, nowMs);
  return hit && hit.rule.id === target.rule.id ? hit.seats.map((s) => s.no) : [];
}

/** Nhãn ưu đãi trên thẻ chuyến: luật hiện ở `trip_card` khớp chuyến này với số khách đang tìm (xem trước, chưa có ghế). */
/** Chỉ đọc giờ khi có luật (đọc Date.now() lúc prerender làm Next bỏ khối nội dung khỏi HTML tĩnh). */
export function tripRuleBadge(config: BookingConfig, trip: Trip, corridor: { tuyen: string; chieu: CorridorDirection; diemDi?: string | null; diemDen?: string | null } | null, seatCount: number, nowMs?: number): Promo | null {
  if (!hasRules(config)) return null;
  const rules = rulesOf(config).filter((r) => r.display.show_on.includes("trip_card") && !r.who.linked_order && r.apply.mode === "auto");
  if (!rules.length) return null;
  const hit = evaluate(rules, { now: nowMs ?? Date.now(), legs: [tripLeg(trip, corridor, seatCount)], statuses: statuses(), preview: true }).applied[0];
  const found = hit ? byRuleId(config, hit.rule.id) : null;
  return found ? ruleAsPromo(found) : null;
}

/** Khối "Ưu đãi đang diễn ra" trên trang tuyến: luật `on` hiện ở `route`, đúng tuyến (+ chiều; khứ hồi liên quan mọi chiều). */
export function routeRuleOffers(config: BookingConfig, corridorId: string, chieu: CorridorDirection): Promo[] {
  return config.rules
    .filter(({ rule }) => rule.status === "on" && rule.display.show_on.includes("route"))
    .filter(({ rule }) => !rule.scope.corridors?.length || rule.scope.corridors.includes(corridorId))
    .filter(({ rule }) => !!rule.who.linked_order || !rule.scope.directions?.length || rule.scope.directions.includes(chieu))
    .map(ruleAsPromo);
}

/** Nhãn khứ hồi khi đặt chiều đi `outbound`: luật có `linked_order` cho chiều ngược lại của tuyến này. */
export function roundtripRuleForOutbound(config: BookingConfig, corridorId: string, outbound: CorridorDirection): Promo | null {
  const back: CorridorDirection = outbound === "ab" ? "ba" : "ab";
  const found = config.rules.find(
    ({ rule }) =>
      statuses().includes(rule.status) &&
      !!rule.who.linked_order &&
      (!rule.scope.corridors?.length || rule.scope.corridors.includes(corridorId)) &&
      (!rule.scope.directions?.length || rule.scope.directions.includes(back)),
  );
  return found ? ruleAsPromo(found) : null;
}
