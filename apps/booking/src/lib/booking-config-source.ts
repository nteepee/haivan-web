import { cacheLife, cacheTag } from "next/cache";
import { bookingConfigSchema, type BookingConfig } from "@/schemas/booking-config";
import { FALLBACK_BOOKING_CONFIG } from "./booking-config-fallback";
import { createLastGood, unwrapFetched, type Fetched } from "./last-good";
import { routeBaseUrl } from "./route-landing";
import { BOOKING_CONFIG_TAG } from "./wp-price-cache";

/** Bản tốt gần nhất của WP; WP lỗi mà chưa từng có thì dùng bản dự phòng. */
const lastGood = createLastGood<BookingConfig>("[booking-config] fallback", "null");

/**
 * Lấy cấu hình từ WP, cache tối đa 1 phút (profile `bookingConfig`); WP lưu chương trình/tuyến thì gọi `/api/hv/revalidate` để bỏ
 * cache ngay (tag `BOOKING_CONFIG_TAG`, gắn cho cả bản lỗi để lần báo đổi cũng xoá bản lỗi). 404 (WP chưa có endpoint) → `none`, lặng lẽ dùng dự phòng.
 * Lỗi mạng/5xx/timeout/sai hợp đồng → `error` cache ngắn; không ném trong phạm vi cache (xem `Fetched`).
 */
async function loadWpBookingConfig(url: string): Promise<Fetched<BookingConfig>> {
  "use cache";
  cacheTag(BOOKING_CONFIG_TAG);
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

/**
 * Chỉ giữ luật giá v2 mà bản deploy này thực hiện được: luật ghi giảm trực tiếp ERP cần HV_ERP_DIRECT_URL/SECRET, luật có hạn mức cần
 * sổ hạn mức (HV_WP_SHARED_SECRET + WP). Chưa hỗ trợ ở web: khách tự chọn (optin), combo 2 chặng (across_legs), điều kiện cách thanh toán/
 * kênh (lúc áp mã chưa biết khách trả bằng gì). Không làm được thì không hiện cho khách (không hứa ưu đãi mà không áp được).
 */
function deployableRules(config: BookingConfig): BookingConfig {
  const direct = /^https?:\/\//.test(process.env.HV_ERP_DIRECT_URL?.trim() ?? "") && (process.env.HV_ERP_DIRECT_SECRET?.trim().length ?? 0) >= 16;
  const ledger = (process.env.HV_WP_SHARED_SECRET?.trim().length ?? 0) >= 16 && !!routeBaseUrl();
  const rules = config.rules.filter(
    ({ rule, has_quota }) =>
      (rule.apply.settlement !== "erp_direct" || direct) && (!(has_quota || rule.quota) || ledger) && !rule.who.across_legs && rule.apply.mode === "auto" && !rule.who.payments && !rule.who.channels,
  );
  return rules.length === config.rules.length ? config : { ...config, rules };
}

/** Cấu hình đặt vé: WP (`haivan-web/v1/booking-config`) → bản WP tốt gần nhất → bản dự phòng. Không bao giờ ném lỗi. */
export async function getBookingConfig(): Promise<BookingConfig> {
  const base = routeBaseUrl();
  if (!base) return FALLBACK_BOOKING_CONFIG;
  const wp = await lastGood.resolve("config", async () => unwrapFetched(await loadWpBookingConfig(`${base}/wp-json/haivan-web/v1/booking-config`)));
  return wp ? deployableRules(wp) : FALLBACK_BOOKING_CONFIG;
}
