import "server-only";
import { publicOrigin } from "@/lib/public-origin";

/** Cấu hình phía server cho BFF. Chỉ đọc ở runtime (không nhúng vào bundle client). */
export function serverEnv() {
  const apigwUrl = (process.env.APIGW_URL ?? "https://apigw.haivan.com").replace(/\/$/, "");
  const origin = publicOrigin();
  const secret = process.env.SESSION_SECRET ?? "";
  return {
    apigwOrigin: new URL(apigwUrl).origin,
    publicOrigin: origin,
    sessionSecret: secret,
    secureCookie: origin.startsWith("https://"),
    /** Bắt buộc bật rõ ràng mới được gọi backend không phải loopback. */
    liveBackend: process.env.HV_LIVE_BACKEND === "1",
    /** Bắt buộc bật rõ ràng mới được gửi thao tác ghi tới backend thật. */
    liveWrites: process.env.HV_LIVE_WRITES === "1",
    /** Chạy dưới E2E: BFF chỉ được nói chuyện với mock loopback, bất kể cờ HV_LIVE_*. */
    e2e: process.env.E2E === "1",
  };
}

export function isLoopbackOrigin(origin: string): boolean {
  const host = new URL(origin).hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
}
