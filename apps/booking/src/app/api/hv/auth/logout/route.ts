import { NextResponse, type NextRequest } from "next/server";
import { csrfViolation } from "@/server/csrf";
import { jsonError, NO_STORE } from "@/server/respond";
import { clearSession } from "@/server/session";

/** Đăng xuất giống web cũ: không gọi api/logout, chỉ xoá phiên (anh quyết 2026-10-28). */
export async function POST(request: NextRequest) {
  if (csrfViolation(request)) return jsonError(403, "Yêu cầu không hợp lệ");
  const response = NextResponse.json({ loggedIn: false }, { headers: NO_STORE });
  clearSession(response);
  return response;
}
