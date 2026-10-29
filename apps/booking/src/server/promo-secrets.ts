import "server-only";
import { z } from "zod";
import { routeBaseUrl } from "@/lib/route-landing";

/**
 * Mã khuyến mãi thật của chương trình tự áp, đọc phía server từ route RIÊNG của WordPress (header `X-HV-Secret`).
 * Không bao giờ truyền xuống Client Component, không nằm trong `booking-config` công khai, không ghi vào cache của Next
 * (bộ nhớ tiến trình).
 *
 * Hợp đồng: `GET <WP>/wp-json/haivan-web/v1/promo-codes` (hoặc `HV_WP_PROMO_CODES_URL`), header `X-HV-Secret: $HV_WP_SHARED_SECRET`,
 * thân `{ "codes": { "<promoId>": "<mã>" }, "mask": ["<mọi mã của mọi chương trình, kể cả đã tắt>"] }`
 * (`codes` cũng nhận dạng mảng `[{ id, code }]`; `mask` tuỳ chọn).
 *
 * - `codes` (chương trình đang chạy) dùng để THAY token; hết hạn sau `ACTIVE_TTL_MS` nếu WP không trả lời (không thay bằng mã cũ mãi mãi).
 * - Tập che = `mask` ∪ `codes` ∪ mọi mã từng thấy trong tiến trình (không bao giờ xoá): che trong phản hồi và chặn gõ thẳng mã ẩn.
 * - Làm mới tối đa 5 phút; lỗi → cache âm 30 s (không dồn request lên WP).
 */
const TTL_MS = 5 * 60_000;
const ACTIVE_TTL_MS = 60 * 60_000;
const NEGATIVE_MS = 30_000;
const TIMEOUT_MS = 4000;

const codesSchema = z.object({
  codes: z.union([z.record(z.string(), z.string()), z.array(z.object({ id: z.union([z.number(), z.string()]), code: z.string() }))]).default({}),
  mask: z.array(z.string()).default([]),
});

interface State {
  active: ReadonlyMap<string, string>;
  at: number;
}
let state: State | null = null;
let everFetched = false;
let failedAt = 0;
let inflight: Promise<void> | null = null;
/** Mọi mã từng thấy (không bao giờ xoá): key = mã viết thường. */
const seen = new Map<string, string | null>();
let warned = false;
const warnOnce = (message: string, error?: unknown) => {
  if (warned) return;
  warned = true;
  console.warn(`[promo-secrets] ${message}`, ...(error === undefined ? [] : [String(error)]));
};

/** Cấu hình có bật tính năng mã ẩn không (có bí mật + địa chỉ WP). Không bật → không che/chặn gì. */
export function promoSecretsConfigured(): boolean {
  return !!process.env.HV_WP_SHARED_SECRET?.trim() && !!endpoint();
}

function endpoint(): string | null {
  const explicit = process.env.HV_WP_PROMO_CODES_URL?.trim();
  if (explicit) return explicit;
  const base = routeBaseUrl();
  return base ? `${base}/wp-json/haivan-web/v1/promo-codes` : null;
}

async function refresh(): Promise<void> {
  const url = endpoint();
  const secret = process.env.HV_WP_SHARED_SECRET?.trim();
  if (!url || !secret) {
    warnOnce("thiếu HV_WP_SHARED_SECRET hoặc địa chỉ WP: không tự áp được mã ẩn");
    return;
  }
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", "X-HV-Secret": secret }, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = codesSchema.parse(await res.json());
    const entries = Array.isArray(parsed.codes) ? parsed.codes.map((c) => [String(c.id), c.code] as const) : Object.entries(parsed.codes);
    const active = new Map(entries.filter(([, code]) => code.trim().length > 0).map(([id, code]) => [id, code.trim()]));
    for (const [id, code] of active) seen.set(code.toLowerCase(), id);
    for (const code of parsed.mask) if (code.trim() && !seen.has(code.trim().toLowerCase())) seen.set(code.trim().toLowerCase(), null);
    state = { active, at: Date.now() };
    everFetched = true;
    failedAt = 0;
    warned = false;
  } catch (error) {
    failedAt = Date.now();
    warnOnce("không đọc được mã từ WP, dùng bản gần nhất (nếu có)", error);
  }
}

function ensureFresh(): Promise<void> {
  if (!inflight) {
    inflight = refresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function load(): Promise<void> {
  const stale = !state || Date.now() - state.at > TTL_MS;
  const backoff = failedAt > 0 && Date.now() - failedAt < NEGATIVE_MS;
  if (!stale || backoff) return;
  if (!state) await ensureFresh();
  else void ensureFresh();
}

/** Bản đồ `promoId → mã thật` của chương trình ĐANG chạy; rỗng nếu chưa đọc được hoặc bản cũ quá `ACTIVE_TTL_MS`. */
export async function getPromoCodes(): Promise<ReadonlyMap<string, string>> {
  await load();
  return state && Date.now() - state.at <= ACTIVE_TTL_MS ? state.active : new Map();
}

export interface MaskSet {
  /** Mã viết thường → `promoId` (hoặc null nếu chỉ biết từ `mask`). */
  codes: ReadonlyMap<string, string | null>;
  /**
   * Đã biết tập che? false = tính năng bật nhưng chưa từng đọc được từ WP: route phải ĐÓNG (503) với đường dẫn có đơn/mã thay vì cho qua.
   * Tính năng không bật (không có bí mật) → true với tập rỗng.
   */
  ready: boolean;
}

export async function getMaskSet(): Promise<MaskSet> {
  if (!promoSecretsConfigured()) return { codes: new Map(), ready: true };
  await load();
  return { codes: seen, ready: everFetched };
}

/** Chỉ cho test. */
export function resetPromoSecretsForTest(): void {
  state = null;
  everFetched = false;
  failedAt = 0;
  inflight = null;
  warned = false;
  seen.clear();
}
