import { NextResponse, type NextRequest } from "next/server";
import { NO_STORE } from "@/server/respond";
import { readSession } from "@/server/session";

/** Trạng thái đăng nhập cho Next lẫn header WordPress (cùng origin). Không bao giờ trả token. */
export async function GET(request: NextRequest) {
  const session = await readSession(request);
  return NextResponse.json(session ? { loggedIn: true, user: session.user } : { loggedIn: false, user: null }, { headers: NO_STORE });
}
