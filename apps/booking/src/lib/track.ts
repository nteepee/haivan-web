import { currentAttribution, sourceLabel } from "./attribution";

/**
 * Đo phễu đặt vé (như booking-tracking.js + booking-log.js của booking.haivan.com). Chạy ở trình duyệt; mọi lỗi đo đếm đều bị nuốt,
 * không bao giờ làm hỏng luồng đặt vé. Không gửi tên, SĐT, email: chỉ tuyến, ngày, số vé, giờ, giá.
 *
 * - `track`: mốc chuyển đổi → GTM dataLayer + GA4 (gtag) + Meta Pixel (sự kiện chuẩn) + nhật ký máy chủ.
 * - `serverLog`: bước con giữa "xem danh sách" và "giữ ghế" (chỉ ghi máy chủ, không đụng chuyển đổi quảng cáo).
 * - `logStep`: bước lỗi hoặc chậm bất thường (vd sơ đồ ghế treo) → nhật ký máy chủ; tối đa vài bản ghi mỗi trang.
 * Nhật ký máy chủ: POST /api/hv/client-log (Next ghi một dòng JSON vào log container).
 */

export type FunnelEvent = "search_trip" | "start_checkout" | "booking_created" | "payment_paid" | "click_hotline" | "click_zalo";
export type StepEvent = "page_view" | "trip_list_view" | "trip_expand" | "seat_map_view" | "seat_select";

export interface TrackParams {
  /** Tuyến theo trang/chuyến, vd "quan-1/vung-tau". */
  route?: string;
  /** Vị trí nút/khối (hero, sticky, trip…) hoặc trạng thái (ok/error). */
  position?: string;
  date?: string;
  guests?: number;
  time?: string;
  /** Giá trị (VND): giá tạm tính khi giữ ghế, tổng đơn khi tạo/thanh toán. */
  value?: number;
  hotline?: string;
  target?: string;
}

const META_EVENTS: Record<FunnelEvent, string> = {
  search_trip: "Search",
  start_checkout: "InitiateCheckout",
  booking_created: "Lead",
  payment_paid: "Purchase",
  click_hotline: "Contact",
  click_zalo: "Contact",
};

type TrackWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };

const LOG_URL = "/api/hv/client-log";
/** Một lượt xem trang gửi tối đa chừng này bản ghi lỗi/chậm: vòng lặp lỗi không biến một khách thành nghìn request. */
const MAX_STEP_LOGS = 8;
let stepLogs = 0;

function send(body: Record<string, unknown>): void {
  try {
    void fetch(LOG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-HV-Req": "1" },
      body: JSON.stringify(body),
      keepalive: true, // còn gửi được khi khách rời trang ngay sau đó
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    /* đo đếm không được chặn trang */
  }
}

/**
 * Tuyến của trang hiện tại, lấy từ địa chỉ (Next giữ trang cũ ẩn trong DOM khi chuyển trang nên không đọc DOM):
 * trang tuyến `/xe-khach/<a>/<b>` → "a/b"; trang tìm chuyến theo tuyến chính → "<tuyen>:<chieu>"; còn lại "".
 */
export function pageRoute(): string {
  try {
    const path = window.location.pathname.replace(/^\/en(?=\/)/, "");
    const m = path.match(/^\/xe-khach\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
    if (m && !NOT_ROUTE.has(m[1])) return `${m[1]}/${m[2]}`;
    const q = new URLSearchParams(window.location.search);
    return q.get("tuyen") ? `${q.get("tuyen")}:${q.get("chieu") ?? ""}` : "";
  } catch {
    return "";
  }
}
const NOT_ROUTE = new Set(["thanh-toan", "xac-nhan", "cap-nhat-dich-vu", "tim-chuyen"]);

/** Nguồn quảng cáo đang có → biến dataLayer (không tên sự kiện, nên GA4 không sinh sự kiện mới), một lần mỗi trang. */
export function publishAttribution(): void {
  try {
    const a = currentAttribution();
    const vars = Object.fromEntries((["utm_source", "utm_medium", "utm_campaign"] as const).filter((k) => a?.[k]).map((k) => [k, a![k]]));
    if (!Object.keys(vars).length) return;
    const w = window as TrackWindow;
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push(vars);
  } catch {}
}

export function serverLog(event: FunnelEvent | StepEvent, params: TrackParams = {}): void {
  const attr = currentAttribution();
  send({
    ev: event,
    page: window.location.pathname.slice(0, 100),
    route: (params.route ?? pageRoute()).slice(0, 60),
    pos: (params.position ?? "").slice(0, 30),
    target: (params.target ?? "").slice(0, 30),
    hotline: (params.hotline ?? "").slice(0, 20),
    src: sourceLabel(attr).slice(0, 50),
    camp: (attr?.utm_campaign ?? "").slice(0, 80),
    gclid: (attr?.gclid ?? "").slice(0, 24),
    val: Number.isFinite(params.value) ? params.value : 0,
  });
}

export function track(event: FunnelEvent, raw: TrackParams = {}): void {
  const params: TrackParams = { ...raw, route: raw.route ?? (pageRoute() || undefined) };
  const w = window as TrackWindow;
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  try {
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event, ...clean });
  } catch {}
  try {
    if (typeof w.gtag === "function") w.gtag("event", event, clean);
  } catch {}
  try {
    if (typeof w.fbq === "function") {
      const data: Record<string, unknown> = {};
      if (params.value && params.value > 0 && event !== "search_trip") Object.assign(data, { value: params.value, currency: "VND" });
      if (event === "click_hotline" || event === "click_zalo") data.content_name = event;
      w.fbq("track", META_EVENTS[event], data);
    }
  } catch {}
  serverLog(event, params);
}

/** Bước lỗi hoặc chạy chậm (≥ `slowMs`) → nhật ký máy chủ. `error` rỗng và nhanh → không gửi gì. */
export function logStep(step: string, ms: number, error = "", slowMs = 8000): void {
  if (!error && ms < slowMs) return;
  if (stepLogs >= MAX_STEP_LOGS) return;
  stepLogs += 1;
  send({
    ev: "client_step",
    page: window.location.pathname.slice(0, 100),
    step: step.slice(0, 40),
    ms: Math.round(ms),
    err: error.slice(0, 200),
    // Tab ẩn thì trình duyệt ngừng chạy khung hình: phân biệt "mạng treo" với "khách chuyển tab".
    hidden: document.visibilityState === "hidden",
  });
}

/** Đo một bước bất đồng bộ: lỗi hoặc chậm thì ghi nhật ký, kết quả/lỗi vẫn trả nguyên cho nơi gọi. */
export async function timed<T>(step: string, run: () => Promise<T>, slowMs?: number): Promise<T> {
  const started = performance.now();
  try {
    const out = await run();
    logStep(step, performance.now() - started, "", slowMs);
    return out;
  } catch (error) {
    // Huỷ do khách đổi tìm kiếm không phải lỗi.
    if (!(error instanceof DOMException && error.name === "AbortError")) logStep(step, performance.now() - started, String(error), slowMs);
    throw error;
  }
}

/**
 * Nghe toàn trang (một lần): bấm gọi tổng đài / Zalo, lỗi JavaScript không bắt được. Trả hàm gỡ.
 * Vị trí nút lấy từ `data-track-pos` gần nhất (hero, sticky…), mặc định "page".
 */
export function installGlobalTracking(): () => void {
  const onClick = (event: MouseEvent) => {
    try {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const position = link.closest<HTMLElement>("[data-track-pos]")?.dataset.trackPos ?? "page";
      if (href.startsWith("tel:")) track("click_hotline", { position, hotline: href.slice(4).replace(/\D/g, "") });
      else if (/^https?:\/\/(?:[a-z0-9-]+\.)?zalo\.me\//i.test(href)) track("click_zalo", { position, target: /zalo\.me\/s\//i.test(href) ? "miniapp" : "oa" });
    } catch {}
  };
  const onError = (event: ErrorEvent) => logStep("js-error", 0, `${event.message} @${(event.filename ?? "").split("/").pop()}:${event.lineno}`);
  const onRejection = (event: PromiseRejectionEvent) => logStep("js-rejection", 0, String(event.reason));
  document.addEventListener("click", onClick, true);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
