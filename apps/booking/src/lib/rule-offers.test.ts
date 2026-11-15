import { describe, expect, it } from "vitest";
import { FALLBACK_BOOKING_CONFIG } from "./booking-config-fallback";
import { autoRuleFor, autoRuleSeatNames, routeRuleOffers, tripRuleBadge } from "./rule-offers";
import { parseRule } from "@/price-rules/schema";
import type { BookingConfig } from "@/schemas/booking-config";
import type { BookingDraft } from "@/stores/booking-draft";
import type { Trip } from "@/schemas/trip";

const display = { label: { vi: "Ưu đãi" }, badge: { vi: "Ưu đãi" } };
const rule = (input: Record<string, unknown>) => {
  const r = parseRule({ schema: 2, title: "t", status: "on", display, ...input });
  if (!r.ok) throw new Error(r.errors.join(";"));
  return r.rule;
};
const config = (rules: ReturnType<typeof rule>[]): BookingConfig => ({ ...FALLBACK_BOOKING_CONFIG, version: 2, rules: rules.map((r, i) => ({ post_id: 900 + i, rule: r, has_quota: false })) });
const NOW = Date.parse("2026-11-16T08:00:00+07:00");
const draft = (seats: Array<{ name: string; rank: string }>, own: Partial<NonNullable<BookingDraft["search"]["corridor"]>> = {}): BookingDraft =>
  ({
    search: { corridor: { tuyen: "sg-vt", chieu: "ab", diemDi: "q1", diemDen: "vt", ngayVe: null, chang: null, donDi: null, gio: null, ...own } },
    trip_info: { merchant: { code: "02" }, product: { name: "Royal Cabin" }, total_seats: 9, date: "2026-11-18", time: "10:00", from: { reached_at: "2026-11-18 10:00:00" } },
    seats: seats.map((s, i) => ({ id: i + 1, name: s.name, price: 260000, is_empty: false, seat_rank: s.rank })),
    order_code: "B02X0001",
    is_combo: 0,
  }) as unknown as BookingDraft;

describe("rule offers (client hints)", () => {
  it("seat-rank rule: only the matching seats get the token", () => {
    const cfg = config([rule({ id: "hang-a", who: { seat_match: { ranks: ["A"] } }, effect: { seat_off_vnd: 20000 } })]);
    const d = draft([{ name: "1", rank: "A" }, { name: "5", rank: "B" }, { name: "6", rank: "B" }]);
    expect(autoRuleFor(cfg, d, NOW)?.id).toBe(900);
    expect(autoRuleSeatNames(cfg, d, 900, NOW)).toEqual(["1"]);
    expect(autoRuleSeatNames(cfg, d, 12345, NOW)).toBeNull();
  });
  it("roundtrip rule needs the return leg with an outbound order", () => {
    const cfg = config([rule({ id: "kh", who: { linked_order: { reverse: true, same_customer: true } }, effect: { seat_off_vnd: 20000 } })]);
    expect(autoRuleFor(cfg, draft([{ name: "5", rank: "B" }]), NOW)).toBeNull();
    expect(autoRuleFor(cfg, draft([{ name: "5", rank: "B" }], { chang: "ve", donDi: "B02OUT01" }), NOW)?.type).toBe("roundtrip");
  });
  it("route block lists on-rules for the corridor; trip badge needs a matching trip", () => {
    const cfg = config([rule({ id: "vt-5h", scope: { corridors: ["sg-vt"], stops: { from: ["q1"] } }, when: { departure: [{ from: "05:00", to: "05:30" }] }, effect: { seat_off_vnd: 10000 }, display: { ...display, show_on: ["route", "trip_card"] } })]);
    expect(routeRuleOffers(cfg, "sg-vt", "ab").map((p) => p.id)).toEqual([900]);
    expect(routeRuleOffers(cfg, "hn-db", "ab")).toEqual([]);
    const trip = (time: string) => ({ merchant: { code: "02" }, product: { name: "Luxury" }, total_seats: 11, date: "2026-11-18", time, from: { reached_at: `2026-11-18 ${time}:00` } }) as unknown as Trip;
    expect(tripRuleBadge(cfg, trip("05:15"), { tuyen: "sg-vt", chieu: "ab", diemDi: "q1" }, 2, NOW)?.id).toBe(900);
    expect(tripRuleBadge(cfg, trip("05:15"), { tuyen: "sg-vt", chieu: "ab", diemDi: "tsn-t1" }, 2, NOW)).toBeNull();
    expect(tripRuleBadge(cfg, trip("08:00"), { tuyen: "sg-vt", chieu: "ab", diemDi: "q1" }, 2, NOW)).toBeNull();
  });
  it("no rules → nothing (v1 flow unchanged)", () => {
    expect(autoRuleFor(FALLBACK_BOOKING_CONFIG, draft([{ name: "1", rank: "A" }]), NOW)).toBeNull();
    expect(routeRuleOffers(FALLBACK_BOOKING_CONFIG, "sg-vt", "ab")).toEqual([]);
  });
});
