import "server-only";
import { AUTO_PREFIX, maskedToken } from "@/lib/auto-promo-token";
import { getBookingConfig } from "@/lib/booking-config-source";
import { encodeQueryValue } from "@/lib/qs";
import { REJECTION_MESSAGE, checkRoundtripEligibility, type OrderFacts, type Rejection } from "./promo-eligibility";
import { getPromoCodes, type MaskSet } from "./promo-secrets";
import { callApigw } from "./upstream";

/** Đường dẫn được phép mang token (nơi mã được áp): kiểm mã (POST) và đặt vé (POST). */
const SUBSTITUTABLE: Array<[string, string]> = [
  ["POST", "promotion/check-promotions"],
  ["POST", "bookings"],
];

/** Đọc đơn không được treo lâu: hết giờ/lỗi upstream → 503 chứ không phải "không đủ điều kiện". */
const ORDER_TIMEOUT_MS = 8000;

export interface PromoRequest {
  method: string;
  path: string;
  /** Chuỗi query thô gửi lên apigw (có thể bắt đầu bằng "?"). */
  search: string;
  body: string;
  authorization: string;
  mask: MaskSet;
}

export type PreparedPromo = { ok: true; search: string; body: string } | { ok: false; status: number; message: string };

const reject = (rejection: Rejection): PreparedPromo => ({ ok: false, status: 422, message: REJECTION_MESSAGE[rejection] });
const unavailable = (): PreparedPromo => ({ ok: false, status: 503, message: "Hệ thống tạm thời chưa kiểm tra được ưu đãi. Vui lòng thử lại sau ít phút." });
const HIDDEN_TYPED: PreparedPromo = { ok: false, status: 422, message: "Mã này chỉ được áp dụng tự động khi đặt chiều về từ đơn chiều đi của quý khách, không nhập tay được." };

const TOKEN_FULL = /^@auto:(\d+):([A-Za-z0-9]+)$/;
const TOKEN_ANY = /@auto:\d+(?::[A-Za-z0-9]+)?/g;
const MIN_CODE_LENGTH = 4;

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
};

/** Mọi chuỗi trong thân JSON (khoá và giá trị, đã giải mã escape); không phải JSON → cả thân. */
function jsonStrings(body: string): string[] {
  try {
    const out: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          out.push(k);
          walk(x);
        }
    };
    walk(JSON.parse(body));
    return out;
  } catch {
    return [body];
  }
}

/** Có mã ẩn nào do khách gõ (ngoài token) trong yêu cầu không — không phân biệt hoa thường, đã giải mã URL/JSON. */
export function containsTypedHiddenCode(search: string, body: string, codes: ReadonlyMap<string, string | null>): boolean {
  if (!codes.size) return false;
  const pieces = [...search.replace(/^\?/, "").split("&").flatMap((seg) => seg.split("=").map(safeDecode)), ...jsonStrings(body)];
  const hay = pieces.join("\n").replace(TOKEN_ANY, "").toLowerCase();
  for (const code of codes.keys()) if (code.length >= MIN_CODE_LENGTH && hay.includes(code)) return true;
  return false;
}

interface Facts {
  facts: OrderFacts | null;
  error: boolean;
}

/** Đọc đơn bằng token của khách (apigw chỉ trả đơn của chính họ). */
async function loadOrder(code: string, merchant: string, authorization: string): Promise<Facts> {
  if (!/^[A-Za-z0-9]+$/.test(code) || !/^[A-Za-z0-9_-]+$/.test(merchant)) return { facts: null, error: false };
  try {
    const res = await callApigw({ method: "GET", path: `bookings/${code}`, search: `?merchant_code=${merchant}`, authorization, timeoutMs: ORDER_TIMEOUT_MS });
    if (res.status === 404 || res.status === 403 || res.status === 422) return { facts: null, error: false };
    if (!res.ok) return { facts: null, error: true };
    const data = ((await res.json()) as { data?: Record<string, unknown> }).data;
    if (!data || typeof data !== "object") return { facts: null, error: false };
    const tickets = Array.isArray(data.tickets) ? (data.tickets as Array<Record<string, unknown>>) : [];
    const live = tickets.filter((t) => (t.status as { type?: number } | undefined)?.type !== 5);
    const first = live[0] as { departure?: { lat?: unknown; lng?: unknown }; destination?: { lat?: unknown; lng?: unknown }; trip?: { departure_time?: unknown } } | undefined;
    const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);
    const dep = { lat: num(first?.departure?.lat), lng: num(first?.departure?.lng) };
    const dest = { lat: num(first?.destination?.lat), lng: num(first?.destination?.lng) };
    const departureTime = typeof first?.trip?.departure_time === "string" ? first.trip.departure_time : "";
    const ok = [dep.lat, dep.lng, dest.lat, dest.lng].every(Number.isFinite) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(departureTime);
    const phone = String((data.customer as { phone?: unknown } | null | undefined)?.phone ?? "").replace(/\D/g, "");
    const keys = [phone ? `phone:${phone}` : "", ...tickets.map((t) => (t.user_created as { id?: unknown } | undefined)?.id).filter((id) => id !== undefined && id !== null).map((id) => `uid:${String(id)}`)].filter(Boolean);
    return {
      error: false,
      facts: {
        code,
        paid: (data.payment as { type?: number } | null | undefined)?.type === 1,
        cancelled: (data.status as { type?: number } | undefined)?.type === 3,
        customerKeys: [...new Set(keys)],
        liveTickets: live.length,
        trip: ok ? { dep, dest, departureTime } : null,
      },
    };
  } catch {
    return { facts: null, error: true };
  }
}

interface Located {
  tokens: Array<{ promoId: number; outbound: string }>;
  currentCode: string;
  merchant: string;
  search: string;
  body: string;
  /** Hàm đổi token thành mã thật trong đúng các vị trí hợp lệ. */
  apply: (real: string) => { search: string; body: string };
}

const QUERY_TOKEN_KEY = /^codes\[\d+\]\[promotion\]$/;

/** Tìm token CHỈ ở `codes[i][promotion]` (query check-promotions) hoặc `seats[i].code` (thân bookings); chỗ khác/trùng khoá → rejection. */
function locate(req: PromoRequest): Located | Rejection {
  const marker = /%40auto%3A|@auto:/gi;
  if (req.path === "promotion/check-promotions") {
    if (/@auto:/i.test(req.body)) return "not_matching";
    const raw = req.search.replace(/^\?/, "");
    const segs = raw.split("&");
    const pairs = segs.map((seg) => {
      const i = seg.indexOf("=");
      return { seg, rawKey: i < 0 ? seg : seg.slice(0, i), rawVal: i < 0 ? "" : seg.slice(i + 1) };
    });
    const tokenSegs: number[] = [];
    const tokens: Located["tokens"] = [];
    for (const [idx, p] of pairs.entries()) {
      const key = safeDecode(p.rawKey);
      const val = safeDecode(p.rawVal);
      const mentions = (p.seg.match(marker) ?? []).length || (val.includes(AUTO_PREFIX) ? 1 : 0);
      if (!mentions && !key.includes(AUTO_PREFIX)) continue;
      const m = TOKEN_FULL.exec(val);
      if (!m || !QUERY_TOKEN_KEY.test(key) || mentions !== 1) return "not_matching";
      tokenSegs.push(idx);
      tokens.push({ promoId: Number(m[1]), outbound: m[2] });
    }
    const count = (name: string) => pairs.filter((p) => safeDecode(p.rawKey) === name).length;
    if (count("bookingCode") !== 1 || count("merchant_code") !== 1) return "order_unknown";
    const value = (name: string) => safeDecode(pairs.find((p) => safeDecode(p.rawKey) === name)!.rawVal);
    return {
      tokens,
      currentCode: value("bookingCode"),
      merchant: value("merchant_code"),
      search: req.search,
      body: req.body,
      apply: (real) => ({
        search: `${req.search.startsWith("?") ? "?" : ""}${pairs.map((p, idx) => (tokenSegs.includes(idx) ? `${p.rawKey}=${encodeQueryValue(real)}` : p.seg)).join("&")}`,
        body: req.body,
      }),
    };
  }

  // POST bookings
  if (/%40auto%3A|@auto:/i.test(req.search)) return "not_matching";
  let parsed: { seats?: unknown; order_code?: unknown; merchant_code?: unknown };
  try {
    parsed = JSON.parse(req.body) as typeof parsed;
  } catch {
    return "order_unknown";
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.seats)) return "not_matching";
  const tokens: Located["tokens"] = [];
  for (const seat of parsed.seats as Array<{ code?: unknown }>) {
    const code = seat && typeof seat === "object" ? seat.code : undefined;
    if (typeof code === "string" && code.includes(AUTO_PREFIX)) {
      const m = TOKEN_FULL.exec(code);
      if (!m) return "not_matching";
      tokens.push({ promoId: Number(m[1]), outbound: m[2] });
    }
  }
  // Mọi dấu hiệu token trong thân (kể cả escape \\u0040) phải nằm đúng ở seats[i].code.
  const inStrings = jsonStrings(req.body).reduce((n, s) => n + (s.match(/@auto:/g) ?? []).length, 0);
  const inRaw = (req.body.match(/"@auto:\d+:[A-Za-z0-9]+"/g) ?? []).length;
  if (inStrings !== tokens.length || inRaw !== tokens.length) return "not_matching";
  if ((req.body.match(/"order_code"\s*:/g) ?? []).length > 1 || (req.body.match(/"merchant_code"\s*:/g) ?? []).length > 1) return "order_unknown";
  return {
    tokens,
    currentCode: typeof parsed.order_code === "string" ? parsed.order_code : "",
    merchant: typeof parsed.merchant_code === "string" ? parsed.merchant_code : "",
    search: req.search,
    body: req.body,
    apply: (real) => ({ search: req.search, body: req.body.replace(/"@auto:\d+:[A-Za-z0-9]+"/g, () => JSON.stringify(real)) }),
  };
}

/**
 * Trước khi chuyển lên apigw:
 * 1. Mã ẩn do khách GÕ TAY (ngoài token, không phân biệt hoa thường, đã giải mã) → 422: mã khứ hồi chỉ dùng được qua đường tự động.
 * 2. Token `@auto:<promoId>:<đơn chiều đi>` chỉ được ở `codes[i][promotion]` (check-promotions) / `seats[i].code` (bookings); chỗ khác, trùng
 *    bookingCode/merchant_code, thiếu đơn chiều đi → 422 và không đổi gì.
 * 3. Kiểm điều kiện phía server (tuyến/chiều/ngày giờ, đơn chiều đi cùng khách, đã trả, chưa huỷ, đúng chiều ngược, số ghế) rồi mới đổi token
 *    thành mã thật bằng thay thế đúng từng byte — apigw nhận y như khi khách tự gõ mã.
 * Không có token và không có mã ẩn → trả nguyên (đường nhập mã thường không đổi).
 */
export async function prepareAutoPromo(req: PromoRequest): Promise<PreparedPromo> {
  if (containsTypedHiddenCode(req.search, req.body, req.mask.codes)) return HIDDEN_TYPED;
  const hasToken = /%40auto%3A|@auto:/i.test(req.search) || /@auto:/i.test(req.body) || /\\u0040auto/i.test(req.body);
  if (!hasToken) return { ok: true, search: req.search, body: req.body };
  if (!SUBSTITUTABLE.some(([m, p]) => m === req.method && p === req.path)) return reject("not_matching");

  const located = locate(req);
  if (typeof located === "string") return reject(located);
  const { tokens } = located;
  if (!tokens.length) return reject("no_outbound");
  const promoIds = new Set(tokens.map((t) => t.promoId));
  const outbounds = new Set(tokens.map((t) => t.outbound));
  if (promoIds.size !== 1 || outbounds.size !== 1) return reject("not_matching");
  const promoId = tokens[0].promoId;
  if (!located.currentCode || !located.merchant) return reject("order_unknown");

  const [config, current, outbound] = await Promise.all([
    getBookingConfig(),
    loadOrder(located.currentCode, located.merchant, req.authorization),
    loadOrder(tokens[0].outbound, located.merchant, req.authorization),
  ]);
  if (current.error || outbound.error) return unavailable();
  const verdict = checkRoundtripEligibility({ config, promoId, current: current.facts, outbound: outbound.facts, seats: tokens.length });
  if (verdict.rejection) return reject(verdict.rejection);

  const real = (await getPromoCodes()).get(String(promoId));
  if (!real) return reject("not_active");
  return { ok: true, ...located.apply(real) };
}

/**
 * Che mã thật về token `@auto:<promoId>` (mã chỉ biết từ `mask` → `@auto:0`) ở MỌI nơi trong văn bản phản hồi:
 * không phân biệt hoa thường, mã dài trước, nên mã dài chứa mã ngắn không bị cắt dở.
 */
export function maskPromoCodes(text: string, codes: ReadonlyMap<string, string | null>): string {
  if (!codes.size || !text) return text;
  const list = [...codes.keys()].filter((c) => c.length >= MIN_CODE_LENGTH).sort((a, b) => b.length - a.length);
  if (!list.length) return text;
  const re = new RegExp(list.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  return text.replace(re, (m) => maskedToken(codes.get(m.toLowerCase()) ?? 0));
}
