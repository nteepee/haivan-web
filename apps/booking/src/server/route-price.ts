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

export interface RoutePrices {
  /** Giá thấp nhất mọi hạng; null = không có giá. */
  min: number | null;
  /** Giá thấp nhất theo tên hạng xe của chuyến (`product.name`, vd "Luxury"). */
  byClass: Record<string, number>;
}

/**
 * Giá thấp nhất khách thực trả (sau giảm, đã gồm VAT; như thẻ chuyến) trong các chuyến còn đặt được, chung và theo hạng xe.
 * API chỉ trả chuyến chưa chạy nhưng có trả chuyến hết chỗ: bỏ chuyến hết chỗ, chuyến ẩn giá/giá 0 và dữ liệu lỗi.
 */
export function tripPrices(items: readonly unknown[]): RoutePrices {
  const out: RoutePrices = { min: null, byClass: {} };
  for (const item of items) {
    const parsed = tripSchema.safeParse(item);
    if (!parsed.success || parsed.data.available_seats <= 0) continue;
    const price = displayPrice(parsed.data);
    if (price === null || price <= 0) continue;
    if (out.min === null || price < out.min) out.min = price;
    // Ghi theo cả tên ("Cao cấp") lẫn mã hạng ("ROYAL"): WP đặt tên Royal/Luxury/Eco, khớp được qua mã khi ERP còn tên cũ.
    for (const key of new Set([parsed.data.product.name.trim(), parsed.data.product.code.trim()])) {
      if (key && !(out.byClass[key] <= price)) out.byClass[key] = price;
    }
  }
  return out;
}

export const minTripPrice = (items: readonly unknown[]): number | null => tripPrices(items).min;

/** Giá hôm nay của một hạng xe theo tên WP ("Royal", "Luxury", "Economy"/"Eco"): khớp không phân biệt hoa thường, theo từ đầu. */
export function classPrice(prices: RoutePrices, name: string): number | null {
  const key = name.trim().toLowerCase().split(/\s+/)[0]?.replace(/^eco$/, "economy");
  if (!key) return null;
  const hit = Object.entries(prices.byClass).find(([k]) => k.toLowerCase().startsWith(key) || key.startsWith(k.toLowerCase()));
  return hit ? hit[1] : null;
}

/** Tối đa số request `el/trips` đang chạy cùng lúc trong cả tiến trình (lúc build mọi trang tuyến hỏi giá một lượt). */
const MAX_INFLIGHT = 6;
let inflight = 0;
const waiting: Array<() => void> = [];

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_INFLIGHT) await new Promise<void>((resolve) => waiting.push(resolve));
  inflight += 1;
  try {
    return await task();
  } finally {
    inflight -= 1;
    waiting.shift()?.();
  }
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
  const body = await limited(async () => {
    const res = await callApigw({ method: "GET", path: "el/trips", search: `?${query}`, timeoutMs: PAGE_TIMEOUT_MS });
    if (!res.ok) throw new Error(`el/trips HTTP ${res.status}`);
    return tripsResponseSchema.parse(await res.json());
  });
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
export async function routePricesToday(from: LatLng, to: LatLng): Promise<RoutePrices> {
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
    return tripPrices(items);
  } catch (error) {
    cacheLife({ stale: 60, revalidate: 60, expire: Math.min(ttl, 600) });
    console.warn("[route-price] không lấy được giá hôm nay:", String(error));
    return { min: null, byClass: {} };
  }
}

/** Chỉ giá thấp nhất mọi hạng (dùng chung bản cache của `routePricesToday`). */
export async function routeMinPriceToday(from: LatLng, to: LatLng): Promise<number | null> {
  return (await routePricesToday(from, to)).min;
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
