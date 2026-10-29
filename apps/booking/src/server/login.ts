import "server-only";
import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/http";
import { jsonError, NO_STORE, parseJson } from "./respond";
import { writeSession } from "./session";
import { callApigw } from "./upstream";

interface TokenBody {
  access_token?: unknown;
  token_type?: unknown;
}

const tokenOf = (body: unknown): string | null => {
  const { access_token, token_type } = (body ?? {}) as TokenBody;
  return typeof access_token === "string" && access_token ? `${typeof token_type === "string" ? token_type : "Bearer"} ${access_token}` : null;
};

/** Sau khi có token: lấy tên/SĐT hiển thị (như web cũ gọi customer/customers), lưu phiên, trả client không kèm token. */
export async function completeLogin(authorization: string): Promise<NextResponse> {
  let user = { name: null as string | null, phone: null as string | null };
  try {
    const res = await callApigw({ method: "GET", path: "customer/customers", authorization });
    const data = ((await parseJson(res)) as { data?: { name?: unknown; phone?: unknown } } | null)?.data;
    user = { name: typeof data?.name === "string" ? data.name : null, phone: typeof data?.phone === "string" ? data.phone : null };
  } catch {
    // Tên chỉ để hiển thị; đăng nhập vẫn thành công.
  }
  const response = NextResponse.json({ loggedIn: true, isNew: false, user }, { headers: NO_STORE });
  await writeSession(response, { authorization, user });
  return response;
}

/** Xử lý phản hồi verify-otp/register: có token → đăng nhập; không → khách mới. */
export async function handleTokenResponse(upstream: Response, requireCode200: boolean): Promise<NextResponse> {
  const body = await parseJson(upstream);
  if (!upstream.ok) {
    if (upstream.status === 400) return jsonError(400, errorMessage(body, "Mã OTP bạn nhập vào chưa đúng"));
    if (upstream.status === 429) return jsonError(429, errorMessage(body, "Thao tác quá nhiều lần, vui lòng thử lại sau"));
    if (upstream.status >= 500) return jsonError(502, "Hệ thống đặt vé đang bận, vui lòng thử lại");
    return jsonError(upstream.status, errorMessage(body, "Có lỗi xảy ra, vui lòng thử lại"));
  }
  if (requireCode200 && (body as { code?: unknown } | null)?.code !== 200) return jsonError(400, errorMessage(body, "Có lỗi xảy ra trong quá trình đăng ký"));
  const authorization = tokenOf(body);
  if (!authorization) return NextResponse.json({ loggedIn: false, isNew: true }, { headers: NO_STORE });
  return completeLogin(authorization);
}
