import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RULE_EXAMPLES } from "./examples";
import { importLegacyProgram, type LegacyProgram } from "./legacy";
import { parseRule } from "./schema";
import vtLive from "./fixtures/web-combo-vt.json";
import dbLive from "./fixtures/web-combo-db.json";
import legacyLines from "./fixtures/legacy-lines.json";

/** Mẫu trong theme (`price-rules/examples/*.json`) cho CMS "Tạo từ mẫu" và AI; ghi lại: HV_WRITE_RULE_SCHEMA=1. */
const dir = resolve(__dirname, "../../../../wordpress/wp-content/themes/haivan-web-child/price-rules/examples");
const lines = legacyLines as Record<string, LegacyProgram["lines"]>;
const imported = [
  ...importLegacyProgram({ ...(vtLive as LegacyProgram), lines: lines.vt, exact_seats: { "3": { luxury: ["9", "10", "11"], eco: ["7", "8", "9"], royal: ["7", "8", "9"] } } }).rules,
  ...importLegacyProgram({ ...(dbLive as LegacyProgram), lines: lines.db }).rules,
];
const all: Record<string, unknown> = { ...RULE_EXAMPLES, ...Object.fromEntries(imported.map((r) => [`booking-${r.id}`, r])) };

describe("rule examples", () => {
  it("every example is a valid rule", () => {
    for (const [name, r] of Object.entries(all)) {
      const parsed = parseRule(r);
      expect(parsed.ok ? [] : parsed.errors, name).toEqual([]);
    }
  });
  it("theme examples are in sync", () => {
    if (process.env.HV_WRITE_RULE_SCHEMA === "1") for (const [name, r] of Object.entries(all)) writeFileSync(resolve(dir, `${name}.json`), `${JSON.stringify(r, null, 2)}\n`);
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    expect(files).toEqual(Object.keys(all).map((n) => `${n}.json`).sort());
    for (const f of files) expect(JSON.parse(readFileSync(resolve(dir, f), "utf8")), f).toEqual(all[f.replace(/\.json$/, "")]);
  });
});
