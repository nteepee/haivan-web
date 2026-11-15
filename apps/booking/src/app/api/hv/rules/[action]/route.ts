import type { NextRequest } from "next/server";
import { ENGINE_VERSION, importRules, secretOk, simulateRule, validateRule } from "@/server/rule-tools";

/**
 * Công cụ luật giá cho WordPress/CLI (header X-HV-Secret):
 *  - GET  /api/hv/rules/version   → { engine }
 *  - POST /api/hv/rules/validate  body: luật JSON → { ok, errors? , hash, warnings }
 *  - POST /api/hv/rules/simulate  body: { rule, scenario } → kết quả engine (áp/không, tiền giảm, lý do)
 *  - POST /api/hv/rules/import    body: { kind: "program", program, schedule_csv? } | { kind: "v1", promos } → { rules, warnings, errors }
 * Không ghi gì, không gọi apigw.
 */
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const deny = () => Response.json({ error: "forbidden" }, { status: 403, headers });

export async function GET(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  if (!secretOk(request.headers.get("x-hv-secret"))) return deny();
  const { action } = await params;
  if (action !== "version") return Response.json({ error: "not_found" }, { status: 404, headers });
  return Response.json({ engine: ENGINE_VERSION }, { headers });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  if (!secretOk(request.headers.get("x-hv-secret"))) return deny();
  const { action } = await params;
  const text = await request.text();
  if (text.length > 200_000) return Response.json({ error: "too_large" }, { status: 413, headers });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, errors: ["(gốc): JSON không hợp lệ"] }, { status: 400, headers });
  }
  if (action === "validate") return Response.json(validateRule(body), { headers });
  if (action === "simulate") {
    const b = (body ?? {}) as { rule?: unknown; scenario?: unknown };
    return Response.json(await simulateRule({ rule: b.rule, scenario: b.scenario }), { headers });
  }
  if (action === "import") return Response.json(importRules(body), { headers });
  return Response.json({ error: "not_found" }, { status: 404, headers });
}
