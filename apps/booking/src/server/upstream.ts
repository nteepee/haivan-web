import "server-only";
import { isLoopbackOrigin, serverEnv } from "./env";

export interface UpstreamRequest {
  method: string;
  /** Đường dẫn sau /api/, đã qua allowlist hoặc cố định trong code. */
  path: string;
  /** Query thô giữ nguyên byte như trình duyệt gửi (gồm dấu "?"), có thể rỗng. */
  search?: string;
  body?: string;
  authorization?: string;
  /** Mặc định: mọi method khác GET. */
  write?: boolean;
  /** Hết giờ riêng (mặc định 30 s). */
  timeoutMs?: number;
}

export class UpstreamBlocked extends Error {}

/**
 * Gọi apigw với bộ header cố định của web cũ. Mặc định từ chối:
 * - mọi backend không phải loopback khi E2E=1 (không có cờ nào mở được);
 * - backend không phải loopback khi chưa bật HV_LIVE_BACKEND=1;
 * - thao tác ghi tới backend thật khi chưa bật HV_LIVE_WRITES=1.
 */
export async function callApigw({ method, path, search = "", body, authorization, write = method !== "GET", timeoutMs = 30_000 }: UpstreamRequest): Promise<Response> {
  const env = serverEnv();
  const live = !isLoopbackOrigin(env.apigwOrigin);
  // Chốt chặn cuối của E2E: chặn trước cả các cờ HV_LIVE_* (có thể đến từ .env.local).
  if (live && env.e2e) throw new UpstreamBlocked("E2E=1: chỉ được gọi backend loopback (mock)");
  if (live && !env.liveBackend) throw new UpstreamBlocked("Backend thật chưa được bật (HV_LIVE_BACKEND=1)");
  if (live && write) {
    if (!env.liveWrites) throw new UpstreamBlocked("Ghi lên backend thật chưa được bật (HV_LIVE_WRITES=1)");
    console.warn(`[BFF][LIVE WRITE] ${method} /api/${path}`);
  }

  const url = new URL(`${env.apigwOrigin}/api/${path}${search}`);
  if (url.origin !== env.apigwOrigin) throw new UpstreamBlocked("URL upstream sai origin");

  const headers: Record<string, string> = { Accept: "application/json", Domain: "haivan.com" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authorization) headers.Authorization = authorization;

  return fetch(url, { method, headers, body, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
}

/** Header cho mọi phản hồi /api/hv/*: không cache, không đoán kiểu, không render như trang. */
export const BFF_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
} as const;

const NULL_BODY = new Set([101, 204, 205, 304]);

/** Trả về cho trình duyệt: chỉ JSON, chỉ status + Content-Type; HTML/khác → 502 JSON. */
export async function relay(upstream: Response, transform?: (text: string) => string): Promise<Response> {
  if (upstream.status >= 300 && upstream.status < 400) return Response.json({ message: "Phản hồi không hợp lệ từ hệ thống đặt vé" }, { status: 502, headers: BFF_HEADERS });
  if (NULL_BODY.has(upstream.status)) return new Response(null, { status: upstream.status, headers: BFF_HEADERS });
  const text = transform ? transform(await upstream.text()) : await upstream.text();
  if (text) {
    try {
      JSON.parse(text); // chấp nhận JSON kể cả khi upstream khai sai Content-Type
    } catch {
      return Response.json({ message: "Phản hồi không hợp lệ từ hệ thống đặt vé" }, { status: 502, headers: BFF_HEADERS });
    }
  }
  return new Response(text || null, { status: upstream.status, headers: { ...BFF_HEADERS, "Content-Type": "application/json" } });
}
