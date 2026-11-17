import { NextResponse, type NextRequest } from "next/server";
import { csrfViolation } from "@/server/csrf";
import { blockedInHold } from "@/lib/seat-policy";
import { allowedPath, isWrite } from "@/server/gw-allowlist";
import { upstreamSearch } from "@/server/raw-query";
import { jsonError, NO_STORE } from "@/server/respond";
import { clearSession, readSession } from "@/server/session";
import { callApigw, relay, UpstreamBlocked } from "@/server/upstream";
import { maskPromoCodes, prepareAutoPromo } from "@/server/promo-substitute";
import { getMaskSet } from "@/server/promo-secrets";

/** Đường dẫn có đơn/mã: nếu tính năng mã ẩn đã bật mà chưa từng đọc được tập mã che từ WP thì ĐÓNG (503) thay vì cho phản hồi đi qua chưa che. */
const GUARDED_PATHS = /^(bookings|promotion\/|admin\/search-code-hide|price-ticket|cancel-|update-booking|v4\/)/;

/** Proxy có allowlist cho endpoint apigw cần đăng nhập; Authorization lấy từ cookie phiên. */
async function handle(request: NextRequest, ctx: RouteContext<"/api/hv/gw/[...path]">) {
  if (csrfViolation(request, { checkGet: true })) return jsonError(403, "Yêu cầu không hợp lệ");

  const { path } = await ctx.params;
  const target = allowedPath(request.method, path);
  if (!target) return jsonError(404, "Not found");

  const session = await readSession(request);
  if (!session) return jsonError(401, "Vui lòng đăng nhập");

  // DELETE transit/cancel-order có body {reason, type:0}.
  const rawBody = request.method === "GET" ? "" : await request.text();
  // Chỗ web không bán (giường đầu xe Điện Biên, chỗ trung chuyển, giá tượng trưng): chặn cả khi client bỏ qua sơ đồ đã khoá.
  if (request.method === "POST" && target === "hold-booking") {
    const blocked = blockedInHold(safeJson(rawBody));
    if (blocked.length) return jsonError(422, `Vị trí ${blocked.join(", ")} không mở bán trực tuyến. Vui lòng chọn vị trí khác.`);
  }
  try {
    // Tập mã che (mọi mã của mọi chương trình, kể cả đã tắt): che MỌI phản hồi và chặn gõ thẳng mã ẩn.
    const mask = await getMaskSet();
    if (!mask.ready && GUARDED_PATHS.test(target)) return jsonError(503, "Hệ thống khuyến mãi tạm thời chưa sẵn sàng. Vui lòng thử lại sau ít phút.");
    // Mã khuyến mãi tự áp (khứ hồi) đi dưới dạng token `@auto:…`: kiểm điều kiện rồi mới đổi thành mã thật (mã thật không bao giờ tới client).
    const prepared = await prepareAutoPromo({ method: request.method, path: target, search: upstreamSearch(request), body: rawBody, authorization: session.authorization, mask });
    if (!prepared.ok) return jsonError(prepared.status, prepared.message);
    // Luật ghi giảm trực tiếp ERP ở bước kiểm mã: BFF tự trả tiền giảm (không có mã để gửi apigw).
    if (prepared.respond !== undefined) return NextResponse.json(prepared.respond, { headers: NO_STORE });
    const { body, search } = prepared;
    const upstream = await callApigw({
      method: request.method,
      path: target,
      search, // chuỗi gốc của client nếu tương đương, giữ byte như web cũ
      body: body || undefined,
      authorization: session.authorization,
      write: isWrite(request.method, target),
    });
    if (upstream.status === 401) {
      const expired = NextResponse.json({ message: "Phiên đăng nhập đã hết hạn" }, { status: 401, headers: NO_STORE });
      clearSession(expired);
      return expired;
    }
    // Chốt/trả suất ưu đãi, ghi giảm trực tiếp ERP sau khi apigw nhận đơn.
    const failed = prepared.after ? await prepared.after(upstream.ok, await upstream.clone().text()) : null;
    if (failed) return jsonError(failed.status, failed.message);
    // Che mã thật (nếu apigw lặp lại nó ở bất kỳ đâu trong phản hồi) về token trước khi trả cho trình duyệt.
    return relay(upstream, (text) => maskPromoCodes(text, mask.codes));
  } catch (error) {
    if (error instanceof UpstreamBlocked) return jsonError(503, error.message);
    console.error("[BFF] upstream error", error);
    return jsonError(502, "Không kết nối được hệ thống đặt vé");
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
