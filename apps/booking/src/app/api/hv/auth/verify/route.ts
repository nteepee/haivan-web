import type { NextRequest } from "next/server";
import { tooManyAttempts } from "@/server/attempts";
import { csrfViolation } from "@/server/csrf";
import { handleTokenResponse } from "@/server/login";
import { jsonError, readJsonBody } from "@/server/respond";
import { callApigw, UpstreamBlocked } from "@/server/upstream";

/** Bước OTP: `POST api/verify-otp {phone, otp, channel:1}` như web cũ (phone có thể là email). */
export async function POST(request: NextRequest) {
  if (csrfViolation(request)) return jsonError(403, "Yêu cầu không hợp lệ");
  const input = await readJsonBody(request);
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const otp = typeof input?.otp === "string" ? input.otp.trim() : "";
  if (!phone || !/^\d{6}$/.test(otp)) return jsonError(400, "Mã OTP bạn nhập vào chưa đúng");
  if (tooManyAttempts(phone)) return jsonError(429, "Bạn đã nhập sai quá nhiều lần, vui lòng thử lại sau ít phút");
  try {
    const upstream = await callApigw({ method: "POST", path: "verify-otp", body: JSON.stringify({ phone, otp, channel: 1 }) });
    return handleTokenResponse(upstream, false);
  } catch (error) {
    if (error instanceof UpstreamBlocked) return jsonError(503, error.message);
    return jsonError(502, "Không kết nối được hệ thống đặt vé");
  }
}
