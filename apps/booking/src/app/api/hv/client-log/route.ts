import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { csrfViolation } from "@/server/csrf";
import { jsonError, NO_STORE, readJsonBody } from "@/server/respond";

/**
 * Nhật ký phía khách (src/lib/track.ts): mốc phễu đặt vé, bước con, lỗi/chậm của trình duyệt. Ghi một dòng JSON
 * `[client-log] {...}` vào log của container Next (docker logs), không lưu gì khác. Chỉ nhận các trường đã biết,
 * cắt độ dài; không có tên/SĐT/email nào trong hợp đồng. Giới hạn theo IP trong bộ nhớ để một trình duyệt lỗi lặp không xả log.
 */
const EVENTS = new Set([
  "page_view", "search_trip", "trip_list_view", "trip_expand", "seat_map_view", "seat_select",
  "start_checkout", "booking_created", "payment_paid", "click_hotline", "click_zalo", "client_step",
]);
const TEXT: Record<string, number> = { page: 100, route: 60, pos: 30, target: 30, hotline: 20, src: 50, camp: 80, gclid: 24, step: 40, err: 200 };
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const hits = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string, now = Date.now()): boolean {
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  if (csrfViolation(request)) return jsonError(403, "Yêu cầu không hợp lệ");
  if (Number(request.headers.get("content-length") ?? "0") > 2048) return jsonError(413, "Quá lớn");
  const ip = (request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim() || "unknown";
  if (limited(ip)) return new NextResponse(null, { status: 204, headers: NO_STORE });
  const body = await readJsonBody(request);
  const ev = typeof body?.ev === "string" ? body.ev : "";
  if (!body || !EVENTS.has(ev)) return jsonError(400, "Sự kiện không hợp lệ");
  const out: Record<string, string | number | boolean> = { ev };
  for (const [key, max] of Object.entries(TEXT)) {
    const v = body[key];
    if (typeof v === "string" && v) out[key] = v.replace(/[\r\n]+/g, " ").slice(0, max);
  }
  for (const key of ["val", "ms"]) {
    const v = body[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[key] = Math.min(Math.round(v), 1e10);
  }
  if (body.hidden === true) out.hidden = true;
  console.info(`[client-log] ${JSON.stringify(out)}`);
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
