import "server-only";
import { sealData, unsealData } from "iron-session";
import type { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "./env";

export const SESSION_COOKIE = "hv_session";
/** `__Host-` khi HTTPS: chặn subdomain cài cookie phiên giả (login fixation). */
export const sessionCookieName = () => (serverEnv().secureCookie ? `__Host-${SESSION_COOKIE}` : SESSION_COOKIE);
const MAX_AGE = 365 * 24 * 3600; // web cũ giữ đăng nhập rất lâu

export interface SessionData {
  /** `token_type + " " + access_token` đúng như web cũ gửi trong Authorization. */
  authorization: string;
  user: { name: string | null; phone: string | null };
}

function password(): string {
  const { sessionSecret } = serverEnv();
  if (sessionSecret.length < 32) throw new Error("SESSION_SECRET phải dài ít nhất 32 ký tự");
  return sessionSecret;
}

export async function readSession(request: NextRequest): Promise<SessionData | null> {
  const raw = request.cookies.get(sessionCookieName())?.value;
  if (!raw) return null;
  try {
    const data = await unsealData<Partial<SessionData>>(raw, { password: password(), ttl: MAX_AGE });
    return typeof data.authorization === "string" && data.authorization ? (data as SessionData) : null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("SESSION_SECRET")) console.error("[BFF] cấu hình phiên sai:", error.message);
    return null;
  }
}

export async function writeSession(response: NextResponse, data: SessionData): Promise<void> {
  const sealed = await sealData(data, { password: password(), ttl: MAX_AGE });
  response.cookies.set(sessionCookieName(), sealed, {
    httpOnly: true,
    secure: serverEnv().secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSession(response: NextResponse): void {
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, secure: serverEnv().secureCookie, sameSite: "lax", path: "/", maxAge: 0 });
}
