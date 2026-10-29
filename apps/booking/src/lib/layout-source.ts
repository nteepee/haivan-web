import { cacheLife } from "next/cache";
import fallback from "@/content/layout-fallback.json";
import { layoutSchema, type SiteLayout } from "@/schemas/layout";
import { createLastGood, unwrapFetched, type Fetched } from "./last-good";

/** Trường tuỳ chọn của v1: WP chưa trả (vắng mặt) thì lấy từ bản dự phòng; mảng rỗng của WP nghĩa là cố ý ẩn. */
const OPTIONAL_KEYS = ["partners", "members", "payments", "social", "certificate", "qr", "badges", "copyright", "logo_white"] as const;

export function withFallbackDefaults(wp: SiteLayout, base: SiteLayout): SiteLayout {
  const merged: SiteLayout = { ...wp };
  for (const key of OPTIONAL_KEYS) {
    if (merged[key] === undefined) Object.assign(merged, { [key]: base[key] });
  }
  return merged;
}

const BASE = layoutSchema.parse(fallback);

/** Bản tốt gần nhất của layout WP; WP lỗi mà chưa từng có thì dùng bản dự phòng trong repo. */
const lastGood = createLastGood<SiteLayout>("[layout] fallback", "null");

/** Lấy layout từ WP, cache 1 giờ; lỗi/sai hợp đồng → `error` cache ngắn (không ném trong phạm vi cache, xem `Fetched`). */
async function loadWpLayout(url: string): Promise<Fetched<SiteLayout>> {
  "use cache";
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = layoutSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`sai hợp đồng: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    cacheLife("hours");
    return { status: "ok", data: parsed.data };
  } catch (error) {
    cacheLife("minutes");
    return { status: "error", message: String(error) };
  }
}

/**
 * Năm hiện tại (giờ máy chủ) cho `{year}` trong bản quyền. Đọc đồng hồ phải nằm trong hàm `'use cache'` (đọc giờ ở render làm Next
 * bỏ cả khối nội dung khỏi HTML tĩnh); giữ vài ngày là đủ vì chỉ đổi vào đầu năm.
 */
async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Thay `{year}` trong bản quyền (WP đã tính năm ở route công khai; bản dự phòng trong repo giữ chỗ). */
async function withYear(layout: SiteLayout): Promise<SiteLayout> {
  const c = layout.copyright;
  const has = typeof c === "string" ? c.includes("{year}") : c ? c.vi.includes("{year}") || c.en.includes("{year}") : false;
  if (!c || !has) return layout;
  const year = String(await currentYear());
  const fill = (v: string) => v.replaceAll("{year}", year);
  return { ...layout, copyright: typeof c === "string" ? fill(c) : { vi: fill(c.vi), en: fill(c.en) } };
}

/**
 * Header/footer lấy từ WordPress (`haivan-web/v1/layout`), cache 1 giờ.
 * WP lỗi → bản WP tốt gần nhất trong bộ nhớ; chưa từng có → bản dự phòng trong repo (cùng hợp đồng).
 */
export async function getSiteLayout(): Promise<SiteLayout> {
  const url = process.env.WP_LAYOUT_URL;
  if (!url) return withYear(BASE);
  const wp = await lastGood.resolve("layout", async () => unwrapFetched(await loadWpLayout(url)));
  return withYear(wp ? withFallbackDefaults(wp, BASE) : BASE);
}
