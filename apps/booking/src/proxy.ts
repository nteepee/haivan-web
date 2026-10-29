import { NextResponse, type NextRequest } from "next/server";

const REWRITTEN = "x-hv-rewritten";

/**
 * URL công khai giữ như web cũ: tiếng Việt không tiền tố (/xe-khach/...),
 * tiếng Anh có /en (/en/xe-khach/...). Bên trong app mọi trang nằm dưới app/[lang].
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  // Bản standalone chạy lại proxy cho đích đã rewrite (/vi/...): cho qua, nếu không sẽ 308 vòng lặp.
  if (request.headers.get(REWRITTEN) === "1") return NextResponse.next();

  // /vi/... không phải URL công khai → chuyển về dạng không tiền tố.
  if (pathname === "/vi" || pathname.startsWith("/vi/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/vi${pathname === "/" ? "" : pathname}`;
  url.search = search;
  const headers = new Headers(request.headers);
  headers.set(REWRITTEN, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Bỏ qua BFF, tài nguyên Next và file tĩnh (có phần mở rộng).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
