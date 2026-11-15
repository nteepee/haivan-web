import "server-only";
import { z } from "zod";
import { routeBaseUrl } from "@/lib/route-landing";
import { wpPriceEpoch } from "@/lib/wp-price-cache";
import { configRuleSchema, type ConfigRule } from "@/schemas/booking-config";

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
 * - Làm mới tối đa 5 phút cho việc che mã (mọi request BFF); lỗi → cache âm 30 s (không dồn request lên WP).
 * - Lúc thanh toán (`getPromoCodes`, `getServerRules`: đổi token thành mã thật, engine tính tiền giảm) bản phải mới hơn
 *   `CHECKOUT_TTL_MS`, cũ hơn thì CHỜ đọc lại WP (không trả bản cũ rồi làm mới nền).
 * - WP báo đổi (`/api/hv/revalidate` tăng thế hệ trong `wp-price-cache.ts`) → mọi lần đọc sau đó chờ bản đọc SAU lần báo đổi.
 */
const TTL_MS = 5 * 60_000;
const CHECKOUT_TTL_MS = 60_000;
const ACTIVE_TTL_MS = 60 * 60_000;
const NEGATIVE_MS = 30_000;
const TIMEOUT_MS = 4000;

const codesSchema = z.object({
  codes: z.union([z.record(z.string(), z.string()), z.array(z.object({ id: z.union([z.number(), z.string()]), code: z.string() }))]).default({}),
  mask: z.array(z.string()).default([]),
  /** Luật giá v2 ĐẦY ĐỦ (cả quota) trạng thái on/test, để server đánh giá lại; từng luật kiểm riêng, luật sai bị bỏ. */
  rules: z.array(z.unknown()).default([]),
  /** SĐT được thử luật `test` (chỉ chữ số). */
  testers: z.array(z.string()).default([]),
});

interface State {
  active: ReadonlyMap<string, string>;
  rules: readonly ConfigRule[];
  testers: ReadonlySet<string>;
  at: number;
  /** Thế hệ dữ liệu giá WP lúc BẮT ĐẦU đọc: nhỏ hơn thế hệ hiện tại = đã có thay đổi sau lần đọc này. */
  epoch: number;
}
let state: State | null = null;
let everFetched = false;
let failedAt = 0;
/** Thế hệ của lượt đọc lỗi gần nhất: WP báo đổi SAU lần lỗi đó (tức WP đã sống lại) thì không chờ hết cache âm. */
let failedEpoch = -1;
let inflight: Promise<void> | null = null;
let inflightEpoch = -1;
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

async function refresh(epoch: number): Promise<void> {
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
    const rules = parsed.rules.flatMap((item) => {
      const r = configRuleSchema.safeParse(item);
      if (!r.success) console.warn(`[promo-secrets] bỏ luật ${String((item as { rule?: { id?: unknown } })?.rule?.id ?? "?")}: ${r.error.issues[0]?.path.join(".")} ${r.error.issues[0]?.message}`);
      return r.success ? [r.data] : [];
    });
    // Hai lượt đọc chồng nhau: lượt bắt đầu trước lần báo đổi không được đè bản của lượt bắt đầu sau.
    if (state && state.epoch > epoch) return;
    state = { active, rules, testers: new Set(parsed.testers.map((p) => p.replace(/\D/g, "")).filter(Boolean)), at: Date.now(), epoch };
    everFetched = true;
    failedAt = 0;
    warned = false;
  } catch (error) {
    failedAt = Date.now();
    failedEpoch = epoch;
    warnOnce("không đọc được mã từ WP, dùng bản gần nhất (nếu có)", error);
  }
}

/** Gộp các lượt đọc đồng thời; lượt đang chạy bắt đầu trước lần báo đổi mới nhất thì không dùng lại (có thể đọc trúng bản cũ). */
function ensureFresh(): Promise<void> {
  const epoch = wpPriceEpoch();
  if (!inflight || inflightEpoch < epoch) {
    const run: Promise<void> = refresh(epoch).finally(() => {
      if (inflight === run) inflight = null;
    });
    inflight = run;
    inflightEpoch = epoch;
  }
  return inflight;
}

/** `checkout`: bản phải mới hơn `CHECKOUT_TTL_MS` và chờ đọc lại; không thì làm mới nền sau `TTL_MS`. */
async function load(checkout = false): Promise<void> {
  const changed = !!state && state.epoch < wpPriceEpoch();
  const age = state ? Date.now() - state.at : Infinity;
  const stale = !state || changed || age > (checkout ? CHECKOUT_TTL_MS : TTL_MS);
  // Lỗi gần đây: không dồn request lên WP; bản cũ (nếu có) được nơi gọi giới hạn bằng ACTIVE_TTL_MS.
  const backoff = failedAt > 0 && Date.now() - failedAt < NEGATIVE_MS && failedEpoch >= wpPriceEpoch();
  if (!stale || backoff) return;
  if (!state || changed || checkout) await ensureFresh();
  else void ensureFresh();
}

/** Bản đồ `promoId → mã thật` của chương trình ĐANG chạy; rỗng nếu chưa đọc được hoặc bản cũ quá `ACTIVE_TTL_MS`. */
export async function getPromoCodes(): Promise<ReadonlyMap<string, string>> {
  await load(true);
  return state && Date.now() - state.at <= ACTIVE_TTL_MS ? state.active : new Map();
}

/** Luật giá v2 đầy đủ + SĐT thử (rỗng khi chưa đọc được hoặc bản cũ quá `ACTIVE_TTL_MS`: không áp luật nào thay vì áp luật cũ). */
export async function getServerRules(): Promise<{ rules: readonly ConfigRule[]; testers: ReadonlySet<string> }> {
  await load(true);
  return state && Date.now() - state.at <= ACTIVE_TTL_MS ? { rules: state.rules, testers: state.testers } : { rules: [], testers: new Set() };
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
  failedEpoch = -1;
  inflight = null;
  inflightEpoch = -1;
  warned = false;
  seen.clear();
}
