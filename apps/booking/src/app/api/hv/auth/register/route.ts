import type { NextRequest } from "next/server";
import { csrfViolation } from "@/server/csrf";
import { handleTokenResponse } from "@/server/login";
import { jsonError, readJsonBody } from "@/server/respond";
import { callApigw, UpstreamBlocked } from "@/server/upstream";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Khách mới: `POST api/register {email, phone, otp, name}`; thành công khi `code === 200` (như web cũ). */
export async function POST(request: NextRequest) {
  if (csrfViolation(request)) return jsonError(403, "Yêu cầu không hợp lệ");
  const input = await readJsonBody(request);
  const body = { email: str(input?.email), phone: str(input?.phone), otp: str(input?.otp), name: str(input?.name) };
  if (!body.name || (!body.phone && !body.email)) return jsonError(400, "Vui lòng nhập đầy đủ thông tin");
  try {
    const upstream = await callApigw({ method: "POST", path: "register", body: JSON.stringify(body) });
    return handleTokenResponse(upstream, true);
  } catch (error) {
    if (error instanceof UpstreamBlocked) return jsonError(503, error.message);
    return jsonError(502, "Không kết nối được hệ thống đặt vé");
  }
}
