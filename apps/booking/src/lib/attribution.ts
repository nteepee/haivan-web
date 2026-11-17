/**
 * Nguồn quảng cáo của khách, giữ tới lúc đặt vé (như booking-attribution.js của booking.haivan.com):
 * utm_source/medium/campaign/content/term và mã click (gclid, gbraid, wbraid, fbclid, ttclid) của lượt vào trang,
 * lưu cookie `hv_attribution` 30 ngày (WP và Next cùng host nên cả hai đọc được). Chạy ở trình duyệt.
 *
 * - Một tín hiệu là đủ: quảng cáo Google/Meta thường chỉ có gclid/fbclid, không có utm_source.
 * - Lượt quảng cáo mới ghi đè bản cũ (lần chạm cuối); đi lại giữa các trang của site (referrer cùng host) thì giữ bản cũ.
 * - Tham số lặp lấy giá trị cuối (gần cú click nhất). Giá trị sai dạng bị bỏ.
 */

export const ATTRIBUTION_COOKIE = "hv_attribution";
const TTL_MS = 30 * 24 * 3600 * 1000;
const FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid"] as const;
type Key = (typeof FIELDS)[number] | (typeof CLICK_IDS)[number];
export type Attribution = Partial<Record<Key, string>>;

interface StoredAttribution {
  v: 1;
  data: Attribution;
  capturedAt: number;
  expiresAt: number;
}

const FIELD_VALUE = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/i;
const CLICK_VALUE = /^[A-Za-z0-9._~-]{1,512}$/;

/** Chỉ giữ giá trị đúng dạng; null khi không có utm_source lẫn mã click nào. */
export function cleanAttribution(input: Record<string, unknown> | null | undefined): Attribution | null {
  if (!input) return null;
  const out: Attribution = {};
  for (const key of FIELDS) {
    const v = input[key];
    if (typeof v === "string" && v.length <= 160 && FIELD_VALUE.test(v)) out[key] = v;
  }
  for (const key of CLICK_IDS) {
    const v = input[key];
    if (typeof v === "string" && CLICK_VALUE.test(v)) out[key] = v;
  }
  if (!out.utm_source && !CLICK_IDS.some((k) => out[k])) return null;
  // Nhiều mã click dài không được đẩy cookie quá giới hạn trình duyệt.
  for (const key of [...CLICK_IDS].reverse()) if (encodeURIComponent(JSON.stringify(out)).length > 2800) delete out[key];
  return out;
}

/** Tham số quảng cáo trong URL (giá trị cuối của mỗi khoá). */
export function attributionFromUrl(search: URLSearchParams): Attribution | null {
  const input: Record<string, string> = {};
  for (const key of [...FIELDS, ...CLICK_IDS]) {
    const values = search.getAll(key);
    if (values.length) input[key] = values[values.length - 1];
  }
  return cleanAttribution(input);
}

function readStored(cookie: string, now: number): StoredAttribution | null {
  const raw = cookie.split("; ").find((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`));
  if (!raw) return null;
  try {
    const rec = JSON.parse(decodeURIComponent(raw.slice(ATTRIBUTION_COOKIE.length + 1))) as StoredAttribution;
    const data = cleanAttribution(rec?.data as Record<string, unknown>);
    const fresh = rec?.v === 1 && Number.isFinite(rec.capturedAt) && Number.isFinite(rec.expiresAt) && rec.expiresAt > now && rec.expiresAt - rec.capturedAt <= TTL_MS;
    return fresh && data ? { ...rec, data } : null;
  } catch {
    return null; // cookie hỏng: coi như chưa có
  }
}

const sameSite = (referrer: string, host: string) => {
  try {
    return new URL(referrer).host === host;
  } catch {
    return false;
  }
};

/** Ghi nguồn của lượt vào trang này (gọi một lần mỗi lần tải trang). */
export function captureAttribution(now = Date.now()): void {
  try {
    const data = attributionFromUrl(new URLSearchParams(window.location.search));
    if (!data) return;
    if (readStored(document.cookie, now) && sameSite(document.referrer, window.location.host)) return;
    const rec: StoredAttribution = { v: 1, data, capturedAt: now, expiresAt: now + TTL_MS };
    const encoded = encodeURIComponent(JSON.stringify(rec));
    if (encoded.length > 3500) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ATTRIBUTION_COOKIE}=${encoded}; Max-Age=${TTL_MS / 1000}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* chặn cookie: không ghi nguồn, không làm hỏng trang */
  }
}

/** Nguồn quảng cáo còn hạn của khách; null khi không có. */
export function currentAttribution(now = Date.now()): Attribution | null {
  try {
    return readStored(document.cookie, now)?.data ?? null;
  } catch {
    return null;
  }
}

/** Nhãn nguồn ngắn cho nhật ký máy chủ: gads | fb | utm_source | org. */
export function sourceLabel(a: Attribution | null): string {
  if (a?.gclid || a?.gbraid || a?.wbraid) return "gads";
  if (a?.fbclid) return "fb";
  return a?.utm_source ?? "org";
}
