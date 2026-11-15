import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_SCHEMA_PATH, ruleJsonSchema } from "./json-schema";

const file = resolve(__dirname, "../../../..", THEME_SCHEMA_PATH);

describe("rule JSON Schema export", () => {
  it("theme copy is in sync with the zod schema", () => {
    const fresh = `${JSON.stringify(ruleJsonSchema(), null, 2)}\n`;
    if (process.env.HV_WRITE_RULE_SCHEMA === "1") writeFileSync(file, fresh);
    expect(readFileSync(file, "utf8")).toBe(fresh);
  });
});
