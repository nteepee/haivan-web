import type { NextRequest } from "next/server";
import { routePathMinPriceToday } from "@/server/route-price";

/** Tối đa số tuyến mỗi lần hỏi (danh sách tuyến trang chủ / khối tuyến của trang điểm đến). */
const MAX_PATHS = 24;
const PATH = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/**
 * Giá "từ" hôm nay của các tuyến cho WordPress: `GET /api/hv/route-price?path=quan-1/vung-tau&path=...`
 * → `{ "prices": { "quan-1/vung-tau": 200000, "x/y": null } }`. null = không có giá (tuyến không thuộc danh sách tuyến đã biết,
 * hết chuyến, lỗi API) → WP ẩn giá. Chỉ đọc; giá cache phía server (route-price.ts).
 */
export async function GET(request: NextRequest) {
  const paths = [...new Set(request.nextUrl.searchParams.getAll("path"))].filter((p) => PATH.test(p)).slice(0, MAX_PATHS);
  // Tối đa 4 tuyến cùng lúc (mỗi tuyến đọc 3 trang song song) để không dội apigw khi cache hết hạn.
  const prices: Record<string, number | null> = {};
  for (let i = 0; i < paths.length; i += 4) {
    const group = paths.slice(i, i + 4);
    const values = await Promise.all(group.map(routePathMinPriceToday));
    group.forEach((p, j) => (prices[p] = values[j]));
  }
  return Response.json({ prices }, { headers: { "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
