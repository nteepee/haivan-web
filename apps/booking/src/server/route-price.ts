import "server-only";
import { cacheLife } from "next/cache";
import popularRoutes from "@/content/popular-routes.json";
import { getBookingConfig } from "@/lib/booking-config-source";
import { corridorLanding, corridorListing } from "@/lib/corridor-landing";
import { todayIsoVn } from "@/lib/format";
import { getRouteListing } from "@/lib/route-listing";
import { displayPrice } from "@/lib/trip-filters";
import { tripSchema, tripsResponseSchema } from "@/schemas/trip";
import { callApigw } from "./upstream";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Giới hạn số trang `el/trips` đọc cho một tuyến (10 chuyến/trang; tuyến dày nhất ~7 trang mỗi ngày). */
const MAX_PAGES = 8;
/** Hết giờ mỗi trang (API đo được 0,4–3 s/trang): API treo thì trang tuyến không bị chặn quá lâu, giá ẩn. */
const PAGE_TIMEOUT_MS = 8000;
/** Số trang đọc song song mỗi lượt cho một tuyến: tránh dội hàng chục request cùng lúc lên apigw (gây hết giờ). */
const PAGE_BATCH = 3;

/** Giá thấp nhất khách thực trả (sau giảm, đã gồm VAT; như thẻ chuyến) trong các chuyến; chuyến lỗi dữ liệu hoặc ẩn giá bị bỏ. */
export function minTripPrice(items: readonly unknown[]): number | null {
  let min: number | null = null;
  for (const item of items) {
    const parsed = tripSchema.safeParse(item);
    if (!parsed.success) continue;
    const price = displayPrice(parsed.data);
    if (price !== null && price > 0 && (min === null || price < min)) min = price;
  }
  return min;
}

async function tripsPage(from: LatLng, to: LatLng, date: string, page: number) {
  const query = new URLSearchParams({
    from_location: `${from.lat},${from.lng}`,
    to_location: `${to.lat},${to.lng}`,
    numberGuest: "1",
    date,
    sort_by: "price",
    sort_mode: "asc",
    ...(page > 1 ? { page: String(page) } : {}),
  });
  const res = await callApigw({ method: "GET", path: "el/trips", search: `?${query}`, timeoutMs: PAGE_TIMEOUT_MS });
  if (!res.ok) throw new Error(`el/trips HTTP ${res.status}`);
  const body = tripsResponseSchema.parse(await res.json());
  return { items: body.data, last: body.meta?.last_page ?? 1 };
}

/** Số giây tới nửa đêm giờ Việt Nam (≥ 60): giá của ngày cũ không được sống qua ngày mới. */
function secondsToVnMidnight(now = Date.now()): number {
  const day = 86_400_000;
  const vn = now + 7 * 3_600_000;
  return Math.max(60, Math.ceil((day - (vn % day)) / 1000));
}

/**
 * "Giá từ" của tuyến trong ngày hôm nay (giờ Việt Nam): giá thấp nhất trong mọi chuyến hôm nay của API danh sách chuyến (chỉ đọc).
 * Thay cho giá nhập tay đã cũ (vd. 140.000đ Sài Gòn – Vũng Tàu). Cache 1 giờ nhưng không quá nửa đêm (cả hạn dùng bản cũ),
 * nên sang ngày mới không còn giá hôm qua. Lỗi trang 1 → null (trang ẩn giá), cache 1 phút; lỗi trang sau → giữ giá các trang đọc được.
 */
export async function routeMinPriceToday(from: LatLng, to: LatLng): Promise<number | null> {
  "use cache";
  const ttl = Math.min(3600, secondsToVnMidnight());
  try {
    const date = todayIsoVn();
    const first = await tripsPage(from, to, date, 1);
    const pages = Math.min(first.last, MAX_PAGES);
    const rest: PromiseSettledResult<Awaited<ReturnType<typeof tripsPage>>>[] = [];
    for (let page = 2; page <= pages; page += PAGE_BATCH) {
      const batch = Array.from({ length: Math.min(PAGE_BATCH, pages - page + 1) }, (_, i) => tripsPage(from, to, date, page + i));
      rest.push(...(await Promise.allSettled(batch)));
    }
    const items = [...first.items, ...rest.flatMap((r) => (r.status === "fulfilled" ? r.value.items : []))];
    const complete = rest.every((r) => r.status === "fulfilled");
    cacheLife(complete ? { stale: 60, revalidate: ttl, expire: ttl } : { stale: 60, revalidate: Math.min(ttl, 300), expire: ttl });
    return minTripPrice(items);
  } catch (error) {
    cacheLife({ stale: 60, revalidate: 60, expire: Math.min(ttl, 600) });
    console.warn("[route-price] không lấy được giá hôm nay:", String(error));
    return null;
  }
}

/** Trang tuyến được phép hỏi giá: tuyến phổ biến + trang tuyến hai chiều của các tuyến chính (chặn slug tuỳ ý gọi CMS/apigw). */
async function knownRoutePaths(): Promise<Set<string>> {
  const config = await getBookingConfig();
  const out = new Set(popularRoutes.map((r) => r.slug));
  for (const c of config.corridors) for (const slug of [c.landing.ab, c.landing.ba]) if (slug) out.add(slug);
  return out;
}

/** Giá "từ" hôm nay theo đường dẫn trang tuyến "start/end"; null khi tuyến lạ, không đọc được toạ độ hoặc không có giá. */
export async function routePathMinPriceToday(path: string): Promise<number | null> {
  if (!(await knownRoutePaths()).has(path)) return null;
  const [start, end] = path.split("/");
  try {
    let route = await getRouteListing(start, end);
    if (!route) {
      const corridor = corridorLanding(await getBookingConfig(), path);
      if (!corridor) return null;
      route = corridorListing(corridor, path, "vi");
    }
    const { start_place: s, end_place: e } = route.data;
    return await routeMinPriceToday({ lat: s.lat, lng: s.lng }, { lat: e.lat, lng: e.lng });
  } catch {
    return null;
  }
}
