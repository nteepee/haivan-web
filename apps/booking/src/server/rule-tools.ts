import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { evaluate, rejectMessage, type RuleContext } from "@/price-rules/engine";
import { parseRule, RULE_SCHEMA_VERSION, type PriceRule } from "@/price-rules/schema";
import { getServerRules } from "./promo-secrets";
import { importLegacyProgram, importV1Promo, windowsFromScheduleCsv, type LegacyProgram, type V1Promo } from "@/price-rules/legacy";

/**
 * Công cụ luật giá cho WP (CMS) và WP-CLI/AI: kiểm hợp lệ bằng ĐÚNG zod/engine của Next, và mô phỏng một chuyến.
 * Chỉ nhận header `X-HV-Secret` = HV_WP_SHARED_SECRET (WP gọi qua HV_NEXT_INTERNAL_URL). Thuần: không gọi apigw, không ghi gì.
 */
export const ENGINE_VERSION = `${RULE_SCHEMA_VERSION}.1`;

export function secretOk(given: string | null): boolean {
  const secret = process.env.HV_WP_SHARED_SECRET?.trim() ?? "";
  if (secret.length < 16 || !given) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** JSON chuẩn hoá (khoá sắp xếp) để WP so hash bản đã kiểm với bản đang lưu. */
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(sort(value));
}
export const ruleHash = (rule: unknown) => createHash("sha256").update(canonicalJson(rule)).digest("hex");

export function validateRule(input: unknown) {
  const parsed = parseRule(input);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors, engine: ENGINE_VERSION };
  const warnings: string[] = [];
  const r = parsed.rule;
  if (r.apply.settlement === "erp_direct") warnings.push("apply.settlement=erp_direct: cần bộ ghi giảm trực tiếp ERP (chưa bật), web chưa tự áp luật này.");
  if (r.quota) warnings.push("quota: cần sổ hạn mức đang chạy; nếu chưa có, server từ chối áp luật này.");
  if (r.apply.mode === "optin") warnings.push("apply.mode=optin: khách phải tự chọn ưu đãi; cần nút chọn trên trang xác nhận.");
  if (r.who.across_legs) warnings.push("who.across_legs: combo tính trên cả 2 chặng chưa hỗ trợ ở web (2 đơn riêng).");
  if (!r.scope.corridors?.length && !r.scope.merchants?.length) warnings.push("Luật áp cho MỌI tuyến/SBU: kiểm lại phạm vi.");
  return { ok: true as const, rule: r, hash: ruleHash(input), warnings, engine: ENGINE_VERSION };
}

const scenarioSchema = z.object({
  corridor: z.string().nullable().default(null),
  direction: z.enum(["ab", "ba"]).nullable().default(null),
  merchant: z.string().nullable().default(null),
  product: z.string().min(1),
  vehicle_seats: z.number().int().positive().nullable().default(null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departure: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
  seats: z.array(z.object({ no: z.string(), rank: z.string().nullable().default(null), price: z.number().int().min(0) })).min(1).max(60),
  now: z.string().optional().describe("ISO, mặc định bây giờ"),
  linked: z.object({ paid: z.boolean().default(true), seats: z.number().int().min(1), same_customer: z.boolean().default(true) }).nullable().default(null),
  payment: z.string().nullable().default(null),
  counters: z.object({ trip: z.number().int().min(0).optional(), phone: z.number().int().min(0).optional(), total: z.number().int().min(0).optional() }).optional(),
  /** true = đánh giá cùng các luật đang chạy (quy tắc cộng dồn thật). */
  with_live: z.boolean().default(true),
});
export type Scenario = z.input<typeof scenarioSchema>;

export async function simulateRule(input: { rule: unknown; scenario: unknown }) {
  const checked = validateRule(input.rule);
  if (!checked.ok) return checked;
  const sc = scenarioSchema.safeParse(input.scenario);
  if (!sc.success) return { ok: false as const, errors: sc.error.issues.map((i) => `scenario.${i.path.join(".")}: ${i.message}`), engine: ENGINE_VERSION };
  const s = sc.data;
  const target = checked.rule;
  const live: PriceRule[] = s.with_live ? (await getServerRules()).rules.map((r) => r.rule).filter((r) => r.id !== target.id && r.status === "on") : [];
  const ctx: RuleContext = {
    now: s.now ? Date.parse(s.now) : Date.now(),
    legs: [{ merchant: s.merchant, corridor: s.corridor, direction: s.direction, product: s.product, vehicleSeats: s.vehicle_seats, date: s.date, departure: s.departure, seats: s.seats }],
    linkedOrder: s.linked ? { reverse: true, paid: s.linked.paid, sameCustomer: s.linked.same_customer, seats: s.linked.seats, departsBefore: true } : null,
    payment: s.payment,
    statuses: [...new Set<PriceRule["status"]>(["on", target.status])],
    requested: [target.id, ...live.filter((r) => r.apply.mode === "optin").map((r) => r.id)],
    counters: s.counters ? { [target.id]: s.counters } : undefined,
  };
  const result = evaluate([target, ...live], ctx);
  const mine = result.applied.find((a) => a.rule.id === target.id);
  return {
    ok: true as const,
    engine: ENGINE_VERSION,
    warnings: checked.warnings,
    applies: !!mine,
    discount: mine?.discount ?? 0,
    before: result.before,
    after: result.after,
    seats: mine?.seats ?? [],
    applied: result.applied.map((a) => ({ id: a.rule.id, title: a.rule.title, discount: a.discount })),
    rejected: result.rejected.map((r) => ({ id: r.ruleId, reason: r.reason, message: rejectMessage(r.reason) })),
  };
}

/**
 * Chuyển luật cũ → v2 (chỉ trả JSON, WP/CLI tự lưu):
 *  - { kind: "program", program, schedule_csv? }: chương trình booking.haivan.com (COMBO_JSON hoặc `rules` của web-combo, có thể kèm `lines`);
 *  - { kind: "v1", promos: [...] }: bài hv_promo v1 (payload booking-config v1).
 */
export function importRules(body: unknown) {
  const b = (body ?? {}) as { kind?: string; program?: LegacyProgram; schedule_csv?: string; promos?: V1Promo[] };
  try {
    if (b.kind === "program" && b.program && typeof b.program === "object" && Array.isArray(b.program.directions)) {
      const scheduleWindows = b.schedule_csv ? windowsFromScheduleCsv(b.schedule_csv, b.program) : undefined;
      const out = importLegacyProgram(b.program, { scheduleWindows });
      return { ok: true as const, rules: out.rules, warnings: out.warnings, errors: out.rules.flatMap((r) => (validateRule(r).ok ? [] : [`${r.id}: luật nhập không hợp lệ`])) };
    }
    if (b.kind === "v1" && Array.isArray(b.promos)) {
      const rules = b.promos.map(importV1Promo);
      return { ok: true as const, rules, warnings: [], errors: rules.flatMap((r) => { const v = validateRule(r); return v.ok ? [] : v.errors.map((e) => `${r.id}: ${e}`); }) };
    }
    return { ok: false as const, errors: ['kind phải là "program" (kèm program) hoặc "v1" (kèm promos)'] };
  } catch (error) {
    return { ok: false as const, errors: [(error as Error).message] };
  }
}
