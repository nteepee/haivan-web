import { cacheLife } from "next/cache";
import { routeLandingSchema, type RouteLandingWp } from "@/schemas/route-landing";
import { createLastGood, unwrapFetched, type Fetched } from "./last-good";

const SLUG = /^[a-z0-9-]+$/;
/** Bản tốt gần nhất theo tuyến; WP lỗi mà chưa từng có bản tốt thì trang dùng CMS/mẫu. Mỗi tuyến cảnh báo một lần. */
const lastGood = createLastGood<RouteLandingWp>("[route] fallback", "null");

/** Gốc WordPress: `WP_ROUTE_URL`, nếu không thì suy từ `WP_LAYOUT_URL` (cắt từ `/wp-json/`). */
export function routeBaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const explicit = env.WP_ROUTE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const layout = env.WP_LAYOUT_URL?.trim();
  if (!layout) return null;
  return layout.replace(/\/wp-json\/.*$/, "").replace(/\/+$/, "") || null;
}

/**
 * Lấy nội dung landing do WP trả (404 → `none`). Mạng/5xx/timeout/sai hợp đồng → `error`, cache ngắn ("minutes") để WP không bị
 * gọi dồn; không ném lỗi trong phạm vi cache (xem `Fetched`). Hết `revalidate` thì lần tạo lại trang ISR chạy ở foreground và
 * Next không tự giữ bản cũ, nên bản tốt gần nhất được giữ ở `lastGood` bên ngoài hàm này.
 */
async function loadRouteLanding(url: string): Promise<Fetched<RouteLandingWp>> {
  "use cache";
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (res.status === 404) {
      cacheLife("routeLanding");
      return { status: "none" };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = routeLandingSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`sai hợp đồng: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    cacheLife("routeLanding");
    return { status: "ok", data: parsed.data };
  } catch (error) {
    cacheLife("minutes");
    return { status: "error", message: String(error) };
  }
}

/** Nội dung landing từ WP cho `/xe-khach/<start>/<end>`; `null` = dùng CMS/mẫu. Không bao giờ ném lỗi. */
export async function getRouteLanding(start: string, end: string): Promise<RouteLandingWp | null> {
  const base = routeBaseUrl();
  if (!base || !SLUG.test(start) || !SLUG.test(end)) return null;
  const key = `${start}/${end}`;
  const wp = await lastGood.resolve(key, async () => unwrapFetched(await loadRouteLanding(`${base}/wp-json/haivan-web/v1/route/${start}/${end}`)));
  if (!wp) lastGood.warnOnce(key, "WP chưa có nội dung");
  return wp;
}
