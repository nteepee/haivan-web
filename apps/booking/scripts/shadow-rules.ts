/**
 * Chạy bóng luật giá v2 với engine combo CŨ — hoàn toàn LOCAL, không gọi booking.haivan.com:
 *   1. python3 scripts/legacy-quote.py <HV_QR_BOOKING> <combo-programs.json> <thư mục lịch CSV> > cases.json
 *      (chạy quote() của hệ cũ trên lưới chiều × ngày × giờ × dòng xe × điểm đón × số vé)
 *   2. pnpm shadow-rules <combo-programs.json> <thư mục lịch CSV> <cases.json>
 *      (nhập CÙNG cấu hình sang luật v2 bằng src/price-rules/legacy.ts, engine mới tính lại từng ca, in chỗ lệch)
 * Dùng cấu hình/lịch thật lấy từ máy chủ booking cũ trước khi tắt chương trình bên đó (phase 6, plans/261111-0439-price-rules-engine).
 */
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { evaluate, type RuleLeg } from "../src/price-rules/engine";
import { importLegacyProgram, LEGACY_DIRECTIONS, LEGACY_MERCHANT, windowsFromScheduleCsv, type LegacyProgram } from "../src/price-rules/legacy";
import { parseRule, type PriceRule } from "../src/price-rules/schema";

interface Case {
  program: string;
  direction: string;
  date: string;
  time: string;
  line: string;
  product: string;
  vehicle_seats: number;
  seats: string[];
  stop: string | null;
  price: number | null;
  reason: string;
}

/** Hệ cũ đánh giá với "hôm nay" = 11/11/2026 (legacy-quote.py); engine mới dùng cùng mốc. */
const NOW = Date.parse("2026-11-11T08:00:00+07:00");
/** Giá thường mỗi ghế đủ cao để mọi bậc combo đều có lợi (not_cheaper không che lệch thật). */
const REGULAR = 2_000_000;

function main() {
  const [configPath, scheduleDir, casesPath] = process.argv.slice(2);
  if (!casesPath) throw new Error("dùng: pnpm shadow-rules <combo-programs.json> <thư mục lịch CSV> <cases.json>");
  const programs = (JSON.parse(readFileSync(configPath, "utf8")) as { programs: Array<LegacyProgram & { schedule_file?: string }> }).programs;
  const rulesBy = new Map<string, PriceRule[]>();
  for (const p of programs) {
    const csv = p.schedule_file ? readFileSync(join(scheduleDir, basename(p.schedule_file)), "utf8") : null;
    const out = importLegacyProgram(p, { scheduleWindows: csv ? windowsFromScheduleCsv(csv, p) : undefined });
    out.warnings.forEach((w) => console.log(`! ${w}`));
    rulesBy.set(
      p.id,
      out.rules.filter((r) => r.effect.total_tiers).map((r) => {
        const parsed = parseRule(r);
        if (!parsed.ok) throw new Error(`${r.id}: ${parsed.errors.join("; ")}`);
        return parsed.rule;
      }),
    );
  }
  const cases = JSON.parse(readFileSync(casesPath, "utf8")) as Case[];
  const mismatches: string[] = [];
  for (const c of cases) {
    const rules = rulesBy.get(c.program) ?? [];
    const map = LEGACY_DIRECTIONS[c.direction];
    const leg: RuleLeg = {
      merchant: LEGACY_MERCHANT[c.program] ?? null,
      corridor: map.corridor,
      direction: map.direction,
      product: c.product,
      vehicleSeats: c.vehicle_seats,
      fromStop: c.stop,
      toStop: null,
      date: c.date,
      departure: c.time,
      seats: c.seats.map((no) => ({ no, price: REGULAR })),
    };
    const out = evaluate(rules, { now: NOW, legs: [leg], requested: rules.map((r) => r.id), statuses: ["test", "on"] });
    const mine = out.applied.length ? out.after : null;
    if (mine !== c.price) {
      const why = out.rejected.map((r) => `${r.ruleId}:${r.reason}`).join(",");
      mismatches.push(`${c.direction} ${c.date} ${c.time} ${c.line}/${c.vehicle_seats} ${c.stop ?? ""} ${c.seats.length} vé: cũ=${c.price ?? `-(${c.reason})`} mới=${mine ?? "-"} ${why}`);
    }
  }
  console.log(`So ${cases.length} ca, lệch ${mismatches.length}.`);
  mismatches.slice(0, 60).forEach((m) => console.log(m));
  process.exitCode = mismatches.length ? 1 : 0;
}

main();
