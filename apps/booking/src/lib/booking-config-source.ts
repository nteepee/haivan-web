import { cacheLife } from "next/cache";
import { bookingConfigSchema, type BookingConfig } from "@/schemas/booking-config";
import { FALLBACK_BOOKING_CONFIG } from "./booking-config-fallback";
import { createLastGood, unwrapFetched, type Fetched } from "./last-good";
import { routeBaseUrl } from "./route-landing";

/** Bản tốt gần nhất của WP; WP lỗi mà chưa từng có thì dùng bản dự phòng. */
const lastGood = createLastGood<BookingConfig>("[booking-config] fallback", "null");

/**
 * Lấy cấu hình từ WP, cache tối đa 5 phút (profile `bookingConfig`). 404 (WP chưa có endpoint) → `none`, lặng lẽ dùng dự phòng.
 * Lỗi mạng/5xx/timeout/sai hợp đồng → `error` cache ngắn; không ném trong phạm vi cache (xem `Fetched`).
 */
async function loadWpBookingConfig(url: string): Promise<Fetched<BookingConfig>> {
  "use cache";
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (res.status === 404) {
      cacheLife("bookingConfig");
      return { status: "none" };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = bookingConfigSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`sai hợp đồng: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    cacheLife("bookingConfig");
    return { status: "ok", data: parsed.data };
  } catch (error) {
    cacheLife("minutes");
    return { status: "error", message: String(error) };
  }
}

/** Cấu hình đặt vé: WP (`haivan-web/v1/booking-config`) → bản WP tốt gần nhất → bản dự phòng. Không bao giờ ném lỗi. */
export async function getBookingConfig(): Promise<BookingConfig> {
  const base = routeBaseUrl();
  if (!base) return FALLBACK_BOOKING_CONFIG;
  const wp = await lastGood.resolve("config", async () => unwrapFetched(await loadWpBookingConfig(`${base}/wp-json/haivan-web/v1/booking-config`)));
  return wp ?? FALLBACK_BOOKING_CONFIG;
}
