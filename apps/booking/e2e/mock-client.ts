import type { RecordedRequest } from "./mock-apigw";

export type { RecordedRequest };

export const MOCK = process.env.E2E_MOCK_APIGW ?? "http://127.0.0.1:4010";

// Trùng với hằng trong mock-apigw.ts (không import vì file đó mở cổng khi được nạp).
export const E2E_CAPTCHA_TOKEN = "e2e-captcha-token";
export const E2E_OTP = "123456";
export const FAKE_PAYMENT_HOST = "pay.vnpay.e2e.invalid";
export const TEST_PHONE = "0900000000";

async function control<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MOCK}/__e2e/${path}`, init);
  if (!res.ok) throw new Error(`mock-apigw /__e2e/${path} → ${res.status}`);
  return (await res.json()) as T;
}

export const resetMock = () => control<{ ok: true }>("reset", { method: "POST" });

/** Request mock đã nhận từ lần reset gần nhất (không gồm preflight CORS). */
export async function recordedRequests(): Promise<RecordedRequest[]> {
  return (await control<{ requests: RecordedRequest[] }>("requests")).requests;
}

export const matching = (all: RecordedRequest[], method: string, path: RegExp | string) =>
  all.filter((r) => r.method === method && (typeof path === "string" ? r.path === path : path.test(r.path)));

/** Một request duy nhất khớp; 0 hoặc nhiều hơn 1 là lỗi để spec không so nhầm. */
export function only(all: RecordedRequest[], method: string, path: RegExp | string): RecordedRequest {
  const found = matching(all, method, path);
  if (found.length !== 1) throw new Error(`Cần đúng 1 request ${method} ${path}, thực tế ${found.length}: ${all.map((r) => `${r.method} ${r.path}`).join(" | ")}`);
  return found[0];
}
