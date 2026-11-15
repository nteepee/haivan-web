import "server-only";
import { routeBaseUrl } from "@/lib/route-landing";

/**
 * Sổ hạn mức luật giá v2 (bảng WP hv_rule_quota, inc/rule-quota.php): giữ suất nguyên tử khi kiểm mã, chốt khi đặt vé thành công,
 * trả khi huỷ. Gọi bằng X-HV-Secret. Không cấu hình được → luật có `quota` bị từ chối (không bán vượt suất).
 */
const TIMEOUT_MS = 5000;

export interface QuotaLimits {
  per_trip?: number;
  per_phone?: number;
  total?: number;
}
export type ReserveResult = { ok: true } | { ok: false; reason: "quota" | "per_phone" } | { ok: false; reason: "unavailable" };

function base(): { url: string; secret: string } | null {
  const secret = process.env.HV_WP_SHARED_SECRET?.trim() ?? "";
  const explicit = process.env.HV_WP_QUOTA_URL?.trim();
  const root = explicit || (routeBaseUrl() ? `${routeBaseUrl()}/wp-json/haivan-web/v1/rule-quota` : "");
  return secret.length >= 16 && root ? { url: root.replace(/\/$/, ""), secret } : null;
}

export const quotaLedgerConfigured = () => base() !== null;

async function call(action: "reserve" | "commit" | "release", body: unknown): Promise<Record<string, unknown> | null> {
  const b = base();
  if (!b) return null;
  try {
    const res = await fetch(`${b.url}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-HV-Secret": b.secret },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function reserveQuota(input: { ruleId: string; tripKey: string; phone: string; orderCode: string; seats: number; limits: QuotaLimits }): Promise<ReserveResult> {
  const out = await call("reserve", { rule_id: input.ruleId, trip_key: input.tripKey, phone: input.phone, order_code: input.orderCode, seats: input.seats, limits: input.limits });
  if (!out) return { ok: false, reason: "unavailable" };
  if (out.ok === true) return { ok: true };
  return { ok: false, reason: out.reason === "per_phone" ? "per_phone" : "quota" };
}

/** Chốt / trả suất: lỗi chỉ ghi log (suất `held` tự hết hạn; `committed` của đơn huỷ chỉ làm đếm dư — an toàn, không bán vượt). */
export async function settleQuota(action: "commit" | "release", orderCode: string, ruleId?: string): Promise<void> {
  const out = await call(action, { order_code: orderCode, ...(ruleId ? { rule_id: ruleId } : {}) });
  if (!out) console.warn(`[quota-ledger] ${action} ${ruleId ?? "*"} ${orderCode} thất bại`);
}
