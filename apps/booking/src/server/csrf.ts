import "server-only";
import type { NextRequest } from "next/server";
import { serverEnv } from "./env";

/**
 * Chống CSRF cho mọi request không phải GET tới /api/hv/* (WordPress cùng origin,
 * cookie phiên httpOnly): bắt buộc header riêng, JSON, Origin đúng, Sec-Fetch-Site same-origin.
 * Trả lý do từ chối hoặc null nếu hợp lệ.
 */
export function csrfViolation(request: NextRequest, opts: { checkGet?: boolean } = {}): string | null {
  const reason = check(request, opts);
  // Lý do + Origin/Host để chẩn đoán cấu hình sai (www, PUBLIC_ORIGIN) trên production; không log cookie/body.
  if (reason) console.warn(`[BFF][CSRF] ${reason} origin=${request.headers.get("origin") ?? "-"} host=${request.headers.get("host") ?? "-"} path=${request.nextUrl.pathname}`);
  return reason;
}

function check(request: NextRequest, opts: { checkGet?: boolean }): string | null {
  const isGet = request.method === "GET" || request.method === "HEAD";
  if (request.headers.get("sec-fetch-mode") === "navigate") return "navigation not allowed";
  if (isGet && !opts.checkGet) return null;
  if (request.headers.get("x-hv-req") !== "1") return "missing X-HV-Req";
  if (isGet) return null;
  const hasBody = (request.headers.get("content-length") ?? "0") !== "0" || request.headers.has("transfer-encoding");
  const type = request.headers.get("content-type") ?? "";
  if (hasBody && !type.toLowerCase().startsWith("application/json")) return "content-type must be application/json";
  if (request.headers.get("origin") !== serverEnv().publicOrigin) return "origin mismatch";
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return "cross-site request";
  return null;
}
