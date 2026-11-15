// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/hv/rules/[action]/route";
import { RULE_EXAMPLES } from "@/price-rules/examples";
import { canonicalJson, ruleHash } from "./rule-tools";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
const SECRET = "wp-shared-secret-1234";
const env = { ...process.env };
beforeEach(() => {
  process.env.HV_WP_SHARED_SECRET = SECRET;
  delete process.env.WP_LAYOUT_URL;
});
afterEach(() => {
  process.env = { ...env };
});
const call = (action: string, body?: unknown, secret = SECRET) =>
  (body === undefined ? GET : POST)(
    new NextRequest(`http://x/api/hv/rules/${action}`, { method: body === undefined ? "GET" : "POST", body: body === undefined ? undefined : JSON.stringify(body), headers: { "x-hv-secret": secret } }),
    { params: Promise.resolve({ action }) },
  );

describe("rule tools endpoint", () => {
  it("needs the shared secret", async () => {
    expect((await call("version", undefined, "wrong-secret-xxxxx")).status).toBe(403);
    expect(await (await call("version")).json()).toEqual({ engine: "2.1" });
  });
  it("validate returns path errors, or hash + warnings", async () => {
    const bad = await (await call("validate", { schema: 2, id: "x" })).json();
    expect(bad.ok).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
    const good = await (await call("validate", RULE_EXAMPLES["sat-gio"])).json();
    expect(good.ok).toBe(true);
    expect(good.hash).toBe(ruleHash(RULE_EXAMPLES["sat-gio"]));
    expect(good.warnings.join(" ")).toContain("erp_direct");
  });
  it("simulate: last-minute rule on a trip 90 minutes away", async () => {
    const out = await (
      await call("simulate", {
        rule: RULE_EXAMPLES["sat-gio"],
        scenario: { corridor: "sg-vt", direction: "ab", merchant: "02", product: "Luxury", date: "2026-11-16", departure: "10:00", now: "2026-11-16T08:30:00+07:00", seats: [{ no: "5", price: 260000 }, { no: "6", price: 260000 }], with_live: false },
      })
    ).json();
    expect(out).toMatchObject({ ok: true, applies: true, discount: 60000, before: 520000, after: 460000 });
    const early = await (
      await call("simulate", {
        rule: RULE_EXAMPLES["sat-gio"],
        scenario: { corridor: "sg-vt", direction: "ab", merchant: "02", product: "Luxury", date: "2026-11-16", departure: "13:00", now: "2026-11-16T08:30:00+07:00", seats: [{ no: "5", price: 260000 }], with_live: false },
      })
    ).json();
    expect(early.applies).toBe(false);
    expect(early.rejected[0]).toMatchObject({ id: "vt-sat-gio-30k", reason: "too_early" });
  });
  it("canonical JSON ignores key order", () => {
    expect(canonicalJson({ b: 1, a: { d: 1, c: 2 } })).toBe(canonicalJson({ a: { c: 2, d: 1 }, b: 1 }));
  });
});
