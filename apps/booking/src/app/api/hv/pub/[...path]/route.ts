import type { NextRequest } from "next/server";
import { csrfViolation } from "@/server/csrf";
import { allowedPubPath } from "@/server/pub-allowlist";
import { upstreamSearch } from "@/server/raw-query";
import { jsonError } from "@/server/respond";
import { callApigw, relay, UpstreamBlocked } from "@/server/upstream";

/**
 * Proxy công khai tới apigw cho trang không chạy trên haivan.com (xem src/server/pub-allowlist.ts). Không đọc phiên đăng nhập,
 * không gửi Authorization; chỉ endpoint trong allowlist; bắt buộc header X-HV-Req (CSRF) để site khác không dùng làm relay.
 */
async function handle(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (csrfViolation(request, { checkGet: true })) return jsonError(403, "Yêu cầu không hợp lệ");
  const target = allowedPubPath(request.method, (await ctx.params).path);
  if (!target) return jsonError(404, "Not found");
  const body = request.method === "POST" ? await request.text() : undefined;
  if (body && body.length > 8192) return jsonError(413, "Quá lớn");
  const clientIp = (request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim() || undefined;
  try {
    const upstream = await callApigw({ method: request.method, path: target, search: upstreamSearch(request), body, clientIp, timeoutMs: 10_000 });
    return relay(upstream);
  } catch (error) {
    if (error instanceof UpstreamBlocked) return jsonError(503, error.message);
    console.error("[BFF][pub] upstream error", target, String(error));
    return jsonError(502, "Không kết nối được hệ thống đặt vé");
  }
}

export const GET = handle;
export const POST = handle;
