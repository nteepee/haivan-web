import { describe, expect, it } from "vitest";
import { evaluate, splitTotal, type RuleContext, type RuleLeg, type RuleSeat } from "./engine";
import { importLegacyProgram, windowsFromScheduleCsv, type LegacyProgram } from "./legacy";
import { parseRule, ruleSchema, type PriceRule, type PriceRuleInput } from "./schema";
import vtLive from "./fixtures/web-combo-vt.json";
import dbLive from "./fixtures/web-combo-db.json";
import legacyLines from "./fixtures/legacy-lines.json";

/**
 * Ca vàng của engine luật giá v2. Phần "parity" chép từ HV_QR_BOOKING/tests/test_combo.py (booking.haivan.com) để luật nhập
 * từ hệ cũ cho cùng kết quả. Lý do từ chối của hệ cũ được ánh xạ: per_phone (vượt vé/đơn) → seats, line → product_mix, date → travel_date.
 */

const at = (iso: string) => Date.parse(`${iso}+07:00`);
const rule = (input: PriceRuleInput): PriceRule => {
  const parsed = parseRule(input);
  if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
  return parsed.rule;
};
const seats = (names: string[], price = 300_000, rank?: string): RuleSeat[] => names.map((no) => ({ no, price, rank }));
const leg = (over: Partial<RuleLeg> = {}): RuleLeg => ({
  corridor: "sg-vt",
  direction: "ab",
  product: "Siêu rẻ",
  date: "2026-10-07",
  departure: "10:00",
  seats: seats(["3", "4"]),
  ...over,
});
const ctx = (legs: RuleLeg[], over: Partial<RuleContext> = {}): RuleContext => ({ now: at("2026-09-23T09:00:00"), legs, statuses: ["on", "test"], ...over });
const only = (rules: PriceRule[], c: RuleContext) => {
  const r = evaluate(rules, c);
  return { applied: r.applied.map((a) => ({ id: a.rule.id, discount: a.discount })), rejected: r.rejected, after: r.after, before: r.before, seats: r.applied[0]?.seats };
};

describe("schema", () => {
  it("rejects effects with zero or two pricing methods and percent without cap", () => {
    const base = { schema: 2, id: "x-test", title: "x", status: "draft", display: { label: { vi: "a" }, badge: { vi: "b" } } };
    expect(parseRule({ ...base, effect: {} }).ok).toBe(false);
    expect(parseRule({ ...base, effect: { seat_off_vnd: 1000, seat_set_vnd: 1 } }).ok).toBe(false);
    expect(parseRule({ ...base, effect: { seat_off_percent: 10 } }).ok).toBe(false);
    expect(parseRule({ ...base, effect: { seat_off_percent: 10, cap_vnd: 50_000 } }).ok).toBe(true);
    expect(parseRule({ ...base, effect: { seat_off_vnd: 1 }, unknown: 1 }).ok).toBe(false);
  });
  it("forbids combo tiers with a seat subset filter (tier would be split over fewer seats)", () => {
    const base = { schema: 2, id: "xx-tier", title: "x", status: "draft", display: { label: { vi: "a" }, badge: { vi: "b" } }, effect: { total_tiers: [{ seats: 2, total_vnd: 1 }] } };
    expect(parseRule({ ...base, who: { seat_match: { ranks: ["A"] } } }).ok).toBe(false);
    expect(parseRule({ ...base, who: { seat_match: { exclude_numbers: ["1"] } } }).ok).toBe(true);
  });
  it("reports errors with paths", () => {
    const r = parseRule({ schema: 2, id: "X", title: "", status: "on" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.startsWith("id:"))).toBe(true);
  });
  it("splits combo totals in 1,000đ units with remainder on the last seat", () => {
    expect(splitTotal(1_200_000, 2)).toEqual([600_000, 600_000]);
    expect(splitTotal(599_000, 3)).toEqual([200_000, 200_000, 199_000]);
    expect(splitTotal(1_000_000, 3)).toEqual([334_000, 333_000, 333_000]);
    expect(splitTotal(869_000, 4)).toEqual([218_000, 217_000, 217_000, 217_000]);
  });
});

describe("parity with booking.haivan.com quote() — per-seat tiers (RULES)", () => {
  // RULES: siêu rẻ, 2/3 vé 250k/vé, 4 vé 200k/vé, tháng 10, đặt trước 7 ngày, tính trên cả 2 chặng.
  const r = rule({
    schema: 2,
    id: "parity-tiers",
    title: "parity",
    status: "on",
    scope: { corridors: ["sg-vt"], products: ["siêu rẻ"] },
    when: { travel: { from: "2026-10-01", to: "2026-10-31" }, lead: { min_days: 7 } },
    who: { seats: { min: 2, max: 4 }, across_legs: true },
    effect: { total_tiers: [{ seats: 2, total_vnd: 500_000 }, { seats: 3, total_vnd: 750_000 }, { seats: 4, total_vnd: 800_000 }] },
    display: { label: { vi: "c" }, badge: { vi: "c" } },
  });
  const one = (n: number, over: Partial<RuleLeg> = {}) => leg({ seats: seats(Array.from({ length: n }, (_, i) => String(i + 3))), ...over });
  it.each([
    [[one(2)], 500_000],
    [[one(3)], 750_000],
    [[one(4)], 800_000],
    [[one(1), one(1, { direction: "ba" })], 500_000],
    [[one(2), one(2, { direction: "ba" })], 800_000],
  ])("totals %#", (legs, total) => {
    expect(only([r], ctx(legs)).after).toBe(total);
  });
  it("2 + 1 across legs = 750k split 500k/250k", () => {
    const out = only([r], ctx([one(2), one(1, { direction: "ba" })]));
    expect(out.after).toBe(750_000);
    expect(out.seats?.filter((s) => s.leg === 0).reduce((s, x) => s + x.after, 0)).toBe(500_000);
  });
  it.each([
    [[one(1)], "seats"],
    [[one(5)], "seats"],
    [[one(2, { product: "Cao cấp" })], "product"],
    [[one(2, { date: "2026-09-29" })], "too_late"],
    [[one(2, { date: "2026-11-02" })], "travel_date"],
    [[one(2, { corridor: "hn-db" })], "corridor"],
  ])("refuses %#", (legs, reason) => {
    expect(only([r], ctx(legs)).rejected).toEqual([{ ruleId: "parity-tiers", reason }]);
  });
  it("status off never applies", () => {
    expect(only([{ ...r, status: "off" }], ctx([one(2)])).rejected[0].reason).toBe("status");
  });
});

describe("parity — Điện Biên combo imported from COMBO_JSON + schedule CSV", () => {
  const DB_CSV = `Ngày,Chiều,Dòng xe,Khung giờ chạy,Áp combo
T2–CN,HN→DB,Royal,19:30,Combo 2 + Combo 4
T2–CN,DB→HN,Royal,21:15,Combo 2 + Combo 4
T2–CN,HN→DB,Lux,18:00,Combo 2 + Combo 4
T2–CN,DB→HN,Lux,19:15,Combo 2 + Combo 4
T2–CN,HN→DB,Eco,19:00,Combo 2 + Combo 4
T2–CN,DB→HN,Eco,19:30,Combo 2 + Combo 4`;
  const program: LegacyProgram = {
    id: "db",
    mode: "optin",
    directions: ["hn-db", "db-hn"],
    pricing: "per_combo",
    per_leg: false,
    min_days_ahead: 1,
    max_per_phone: 4,
    date_from: "2026-10-01",
    date_to: "2026-10-31",
    lines: (legacyLines as Record<string, LegacyProgram["lines"]>).db,
    totals: { royal: { "2": 1_200_000, "4": 2_400_000 }, lux: { "2": 900_000, "4": 1_800_000 }, eco: { "2": 500_000, "4": 1_000_000 } },
    blocked_seats: ["1", "2", "11", "12", "A1-1", "C1-1", "A2-1", "C2-1"],
  };
  const { rules, warnings } = importLegacyProgram(program, { scheduleWindows: windowsFromScheduleCsv(DB_CSV, program) });
  const combo = rule(rules.find((x) => x.id === "db-combo")!);
  const db = (over: Partial<RuleLeg>) => leg({ corridor: "hn-db", direction: "ab", merchant: "01", product: "Cao cấp", date: "2026-10-01", departure: "19:30", seats: seats(["3", "4"], 680_000), ...over });
  const run = (legs: RuleLeg[], now = at("2026-09-23T09:00:00")) => only([combo], ctx(legs, { now, requested: ["db-combo"] }));

  it("imports cleanly", () => {
    expect(warnings).toEqual([]);
    expect(rules.every((x) => ruleSchema.safeParse(x).success)).toBe(true);
    expect(combo.apply).toEqual({ mode: "optin", settlement: "erp_direct" });
  });
  it("royal 2 seats one way = 1.2tr", () => expect(run([db({})]).after).toBe(1_200_000));
  it("royal 1 seat each way = 600k + 600k", () => {
    const out = run([db({ seats: seats(["3"], 680_000) }), db({ direction: "ba", date: "2026-10-04", departure: "21:15", seats: seats(["5"], 680_000) })]);
    expect(out.after).toBe(1_200_000);
    expect(out.seats?.map((s) => s.after)).toEqual([600_000, 600_000]);
  });
  it("royal outside schedule → schedule", () => {
    expect(run([db({ departure: "20:30" })]).rejected[0].reason).toBe("schedule");
    expect(run([db({ direction: "ba", date: "2026-10-04", departure: "20:15" })]).rejected[0].reason).toBe("schedule");
  });
  it("lux 2 seats (34 and 36 berths) = 900k", () => {
    expect(run([db({ product: "Tiết kiệm", vehicleSeats: 34, departure: "18:00", seats: seats(["A1-2", "C1-2"], 515_000) })]).after).toBe(900_000);
    expect(run([db({ product: "Tiết kiệm", vehicleSeats: 36, departure: "18:00", seats: seats(["A1-2", "C1-2"], 515_000) })]).after).toBe(900_000);
  });
  it("eco 1 seat each way = 250k + 250k", () => {
    const out = run([
      db({ product: "Siêu rẻ", departure: "19:00", seats: seats(["A1-2"], 410_000) }),
      db({ product: "Siêu rẻ", direction: "ba", date: "2026-10-04", departure: "19:30", seats: seats(["C1-2"], 410_000) }),
    ]);
    expect(out.after).toBe(500_000);
  });
  it("mixed lines across legs → product_mix", () => {
    const out = run([db({ departure: "19:30" }), db({ product: "Tiết kiệm", direction: "ba", date: "2026-10-05", departure: "19:15" })]);
    expect(out.rejected[0].reason).toBe("product_mix");
  });
  it("same line spelled differently on the two legs still counts as one line", () => {
    const out = run([db({ product: "Tiết kiệm", vehicleSeats: 34, departure: "18:00", seats: seats(["A1-2"], 515_000) }), db({ product: "Lux 36", vehicleSeats: 36, direction: "ba", date: "2026-10-04", departure: "19:15", seats: seats(["C1-2"], 515_000) })]);
    expect(out.after).toBe(900_000);
  });
  it("front seats blocked", () => {
    expect(run([db({ seats: seats(["1", "3"], 680_000) })]).rejected[0].reason).toBe("blocked_seat");
  });
  it("min 1 day ahead: tomorrow ok, today too_late", () => {
    const now = at("2026-10-05T08:00:00");
    expect(run([db({ date: "2026-10-06" })], now).after).toBe(1_200_000);
    expect(run([db({ date: "2026-10-05" })], now).rejected[0].reason).toBe("too_late");
  });
  it("min days by line: lux 3 ok at 4 days, eco 7 refuses", () => {
    const strict = importLegacyProgram({ ...program, min_days_ahead: 3, min_days_ahead_by_line: { royal: 3, lux: 3, eco: 7 } }, { scheduleWindows: windowsFromScheduleCsv(DB_CSV, program) });
    const r = rule(strict.rules.find((x) => x.id === "db-combo")!);
    const now = at("2026-10-05T08:00:00");
    const lux = only([r], ctx([db({ product: "Tiết kiệm 34", vehicleSeats: 34, date: "2026-10-09", departure: "18:00", seats: seats(["3", "4"], 515_000) })], { now, requested: ["db-combo"] }));
    const eco = only([r], ctx([db({ product: "Siêu rẻ 44", vehicleSeats: 44, date: "2026-10-09", departure: "19:00", seats: seats(["A1-2", "C1-2"], 410_000) })], { now, requested: ["db-combo"] }));
    expect(lux.after).toBe(900_000);
    expect(eco.rejected[0].reason).toBe("too_late");
  });
  it("optin: not requested → regular price", () => {
    expect(only([combo], ctx([db({})])).rejected[0].reason).toBe("optin");
  });
});

describe("live booking.haivan.com programs (web-combo snapshot 11/11/2026)", () => {
  const lines = legacyLines as Record<string, LegacyProgram["lines"]>;
  const vt = importLegacyProgram({ ...(vtLive as LegacyProgram), lines: lines.vt, exact_seats: { "3": { luxury: ["9", "10", "11"], eco: ["7", "8", "9"], royal: ["7", "8", "9"] } } });
  const dbp = importLegacyProgram({ ...(dbLive as LegacyProgram), lines: lines.db });
  const vtRules = vt.rules.map(rule);
  const vtLeg = (over: Partial<RuleLeg>) => leg({ merchant: "02", product: "Luxury", vehicleSeats: 11, date: "2026-11-19", departure: "10:00", seats: seats(["5", "6"], 260_000), ...over });
  const now = at("2026-11-11T09:00:00");
  const req = { now, requested: vtRules.map((r) => r.id) };

  it("imports vt (combo + 05:00 slot + roundtrip) and db (drops legs without a corridor)", () => {
    expect(vtRules.map((r) => r.id)).toEqual(["vt-combo", "vt-combo-khung-1", "vt-khu-hoi"]);
    expect(dbp.rules.map((r) => r.id)).toEqual(["db-combo"]);
    expect(dbp.warnings.join("\n")).toContain('bỏ chiều "mc-md"');
    expect(vt.warnings.join("\n")).toContain("đã giới hạn trạm q1");
  });
  it("Luxury 11 seats Thursday 10:00, 2 seats = 419k", () => {
    expect(only(vtRules, ctx([vtLeg({})], req)).after).toBe(419_000);
  });
  it("Luxury 9 seats is the eco line (same 419k), royal 469k", () => {
    expect(only(vtRules, ctx([vtLeg({ vehicleSeats: 9 })], req)).after).toBe(419_000);
    expect(only(vtRules, ctx([vtLeg({ product: "Royal Cabin", vehicleSeats: 9, seats: seats(["5", "6"], 280_000) })], req)).after).toBe(469_000);
  });
  it("3 seats must be the full back row", () => {
    const back = only(vtRules, ctx([vtLeg({ seats: seats(["9", "10", "11"], 260_000) })], req));
    expect(back.after).toBe(599_000);
    const other = only(vtRules, ctx([vtLeg({ seats: seats(["5", "6", "7"], 260_000) })], req));
    expect(other.rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("exact_seats");
  });
  it("Saturday 07:00 Sài Gòn → VT is outside the window; 05:15 gets the slot price 250k (wins the group)", () => {
    expect(only(vtRules, ctx([vtLeg({ date: "2026-11-21", departure: "07:00" })], req)).rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("schedule");
    const early = only(vtRules, ctx([vtLeg({ date: "2026-11-21", departure: "05:15", fromStop: "q1" })], req));
    expect(early.applied).toEqual([{ id: "vt-combo-khung-1", discount: 270_000 }]);
    expect(early.rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("group");
    // Cùng giờ nhưng đón ở sân bay (live: chuyến 05:00 luxury tuyến sân bay giữ combo thường 419k).
    const airport = only(vtRules, ctx([vtLeg({ date: "2026-11-21", departure: "05:15", fromStop: "tsn-t1" })], req));
    expect(airport.applied).toEqual([{ id: "vt-combo", discount: 101_000 }]);
    expect(airport.rejected.find((x) => x.ruleId === "vt-combo-khung-1")?.reason).toBe("stop");
  });
  it("seats 1–2 blocked; 15 minutes before departure is too late", () => {
    expect(only(vtRules, ctx([vtLeg({ seats: seats(["1", "5"], 260_000) })], req)).rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("blocked_seat");
    expect(only(vtRules, ctx([vtLeg({ date: "2026-11-11", departure: "09:10" })], req)).rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("too_late");
  });
  it("quota per trip and per phone", () => {
    expect(only(vtRules, ctx([vtLeg({})], { ...req, counters: { "vt-combo": { trip: 9 } } })).rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("quota");
    expect(only(vtRules, ctx([vtLeg({})], { ...req, counters: { "vt-combo": { phone: 3 } } })).rejected.find((x) => x.ruleId === "vt-combo")?.reason).toBe("per_phone");
  });
});

describe("new kinds of offers without code changes", () => {
  const display = { label: { vi: "x" }, badge: { vi: "x" } };
  it("roundtrip: 20k per return seat, capped by outbound seats, needs a paid reverse order", () => {
    const r = rule({ schema: 2, id: "kh", title: "kh", status: "on", scope: { corridors: ["sg-vt"] }, who: { linked_order: { reverse: true, same_customer: true } }, effect: { seat_off_vnd: 20_000 }, display });
    const back = leg({ direction: "ba", seats: seats(["3", "4", "5"], 260_000) });
    const linked = { reverse: true, paid: true, sameCustomer: true, seats: 2, departsBefore: true };
    expect(only([r], ctx([back], { linkedOrder: linked })).applied).toEqual([{ id: "kh", discount: 40_000 }]);
    expect(only([r], ctx([back], { linkedOrder: { ...linked, paid: false } })).rejected[0].reason).toBe("linked_order");
    expect(only([r], ctx([back])).rejected[0].reason).toBe("linked_order");
  });
  it("last-minute: 30k off within 2 hours of departure", () => {
    const r = rule({ schema: 2, id: "sat-gio", title: "s", status: "on", when: { lead: { max_minutes: 120 } }, effect: { seat_off_vnd: 30_000 }, display });
    const now = at("2026-10-07T08:30:00");
    expect(only([r], ctx([leg({ departure: "10:00" })], { now })).applied[0].discount).toBe(60_000);
    expect(only([r], ctx([leg({ departure: "12:00" })], { now })).rejected[0].reason).toBe("too_early");
  });
  it("seat rank: 10% off rank C/D seats, capped at 50k per order", () => {
    const r = rule({ schema: 2, id: "hang-ghe", title: "h", status: "on", who: { seat_match: { ranks: ["C", "D"] } }, effect: { seat_off_percent: 10, cap_vnd: 50_000 }, display });
    const mixed = [...seats(["1"], 280_000, "A"), ...seats(["7", "8"], 230_000, "C"), ...seats(["9", "10", "11"], 230_000, "D")];
    const out = only([r], ctx([leg({ seats: mixed })]));
    expect(out.applied[0].discount).toBe(50_000);
    expect(only([r], ctx([leg({ seats: seats(["1"], 280_000, "A") })])).rejected[0].reason).toBe("seat_match");
  });
  it("SBU scope and weekday windows with several spans", () => {
    const r = rule({
      schema: 2, id: "sbu", title: "s", status: "on", scope: { merchants: ["02"] },
      when: { departure: [{ weekdays: [6], from: "05:00", to: "06:59" }, { weekdays: [6], from: "19:00", to: "19:59" }] },
      effect: { seat_off_vnd: 10_000 }, display,
    });
    expect(only([r], ctx([leg({ merchant: "02", date: "2026-11-21", departure: "19:30" })])).applied.length).toBe(1);
    expect(only([r], ctx([leg({ merchant: "02", date: "2026-11-21", departure: "12:00" })])).rejected[0].reason).toBe("schedule");
    expect(only([r], ctx([leg({ merchant: "01", date: "2026-11-21", departure: "19:30" })])).rejected[0].reason).toBe("merchant");
  });
  it("stacking: different groups stack on the running price; same group keeps the higher priority; never below zero", () => {
    const a = rule({ schema: 2, id: "aa", title: "a", status: "on", priority: 200, exclusive_group: "g", effect: { seat_off_vnd: 50_000 }, display });
    const b = rule({ schema: 2, id: "bb", title: "b", status: "on", priority: 100, exclusive_group: "g", effect: { seat_off_vnd: 80_000 }, display });
    const c = rule({ schema: 2, id: "cc", title: "c", status: "on", exclusive_group: "rieng", effect: { seat_off_percent: 50, cap_vnd: 1_000_000 }, display });
    const out = only([a, b, c], ctx([leg({ seats: seats(["3"], 300_000) })]));
    expect(out.applied).toEqual([{ id: "aa", discount: 50_000 }, { id: "cc", discount: 125_000 }]);
    expect(out.rejected).toEqual([{ ruleId: "bb", reason: "group" }]);
    expect(out.after).toBe(125_000);
  });
  it("rules without a group never stack (default group)", () => {
    const x = rule({ schema: 2, id: "xx", title: "x", status: "on", effect: { seat_off_vnd: 10_000 }, display });
    const y = rule({ schema: 2, id: "yy", title: "y", status: "on", effect: { seat_off_vnd: 30_000 }, display });
    const out = only([x, y], ctx([leg({ seats: seats(["3"], 300_000) })]));
    expect(out.applied).toEqual([{ id: "yy", discount: 30_000 }]);
    expect(out.rejected).toEqual([{ ruleId: "xx", reason: "group" }]);
  });
  it("one settlement per order; not_cheaper keeps combo from raising a cheap fare", () => {
    const code = rule({ schema: 2, id: "code", title: "c", status: "on", priority: 200, exclusive_group: "g1", effect: { seat_off_vnd: 10_000 }, display });
    const direct = rule({ schema: 2, id: "direct", title: "d", status: "on", exclusive_group: "g2", effect: { seat_off_vnd: 10_000 }, apply: { settlement: "erp_direct" }, display });
    expect(only([code, direct], ctx([leg({})])).rejected).toEqual([{ ruleId: "direct", reason: "settlement_mix" }]);
    const combo = rule({ schema: 2, id: "cb", title: "c", status: "on", effect: { total_tiers: [{ seats: 2, total_vnd: 600_000 }] }, display });
    expect(only([combo], ctx([leg({ seats: seats(["3", "4"], 250_000) })])).rejected[0].reason).toBe("no_benefit");
  });
  it("test status only runs for allowed testers; preview gives labels before seats are chosen", () => {
    const r = rule({ schema: 2, id: "tt", title: "t", status: "test", effect: { seat_off_vnd: 10_000 }, display });
    expect(only([r], ctx([leg({})], { statuses: ["on"] })).rejected[0].reason).toBe("status");
    const preview = evaluate([r], ctx([leg({ seats: [], seatCount: 2 })], { preview: true }));
    expect(preview.applied.map((a) => [a.rule.id, a.discount])).toEqual([["tt", null]]);
  });
});
