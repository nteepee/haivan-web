import "server-only";

/**
 * Cách ghi khoản giảm của luật giá v2 vào ERP:
 *  - erp_code: BFF đổi token thành MÃ chương trình ERP, apigw/ERP tự tính (promo-substitute.ts) — không cần module này.
 *  - erp_direct: ghi "giảm giá trực tiếp" lên từng vé ERP như hệ booking.haivan.com cũ (HV_QR_BOOKING app/erp_confirm.py,
 *    hình thức giảm 3 + giam_gia_truc_tiep[id] + ghi chú). Web mới KHÔNG tự scrape ERP: gọi một dịch vụ ghi ERP qua HTTP.
 *
 * Hợp đồng dịch vụ (HV_ERP_DIRECT_URL, header X-HV-Secret = HV_ERP_DIRECT_SECRET):
 *   POST { merchant, order_code, rule_id, note, tickets: [{ ticket_code, seat, discount_vnd }] }
 *   → 200 { ok: true } | { ok: false, message }
 * Chưa cấu hình → luật erp_direct bị từ chối ở BFF (không bao giờ hứa giảm mà không ghi được ERP).
 */
const TIMEOUT_MS = 20_000;

export interface DirectDiscount {
  merchant: string;
  orderCode: string;
  ruleId: string;
  note: string;
  tickets: Array<{ ticketCode: string; seat: string; discountVnd: number }>;
}

function target(): { url: string; secret: string } | null {
  const url = process.env.HV_ERP_DIRECT_URL?.trim() ?? "";
  const secret = process.env.HV_ERP_DIRECT_SECRET?.trim() ?? "";
  return /^https?:\/\//.test(url) && secret.length >= 16 ? { url, secret } : null;
}

export const erpDirectConfigured = () => target() !== null;

export async function settleDirectDiscount(d: DirectDiscount): Promise<{ ok: true } | { ok: false; message: string }> {
  const t = target();
  if (!t) return { ok: false, message: "Chưa cấu hình dịch vụ ghi giảm trực tiếp ERP" };
  try {
    const res = await fetch(t.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-HV-Secret": t.secret },
      body: JSON.stringify({ merchant: d.merchant, order_code: d.orderCode, rule_id: d.ruleId, note: d.note, tickets: d.tickets.map((x) => ({ ticket_code: x.ticketCode, seat: x.seat, discount_vnd: x.discountVnd })) }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    return res.ok && body.ok === true ? { ok: true } : { ok: false, message: body.message || `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
}
