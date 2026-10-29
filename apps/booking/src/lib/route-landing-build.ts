import type { RouteListing } from "@/lib/route-listing";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { RouteLandingWp } from "@/schemas/route-landing";
import type { RouteTemplate } from "./route-landing-template";

export interface RouteLink {
  label: string;
  path: string;
}

/** Dữ liệu trang tuyến sau khi gộp WP > CMS `route-listing` > mẫu. HTML đã qua sanitizer. */
export interface RouteLandingView {
  start: string;
  end: string;
  title: string;
  description: string;
  h1: string;
  /** "Từ 485.000đ" như CMS trả (dòng phụ đề). */
  priceLabel: string | null;
  /** Số VND cho schema Offer.price; null khi không đọc được giá. */
  priceValue: number | null;
  subline: string | null;
  /** Số giờ chạy từ CMS ("11"), null nếu không có. */
  runHours: string | null;
  scheduleHtml: string;
  intro: string | null;
  contentHtml: string;
  faq: Array<{ q: string; a: string }>;
  pickupPoints: NonNullable<RouteLandingWp["pickup_points"]>;
  offices: NonNullable<RouteLandingWp["offices"]>;
  vehicleClasses: NonNullable<RouteLandingWp["vehicle_classes"]>;
  amenities: Array<{ name: string; icon: string | null }>;
  relatedRoutes: RouteLink[];
  reverseRoute: RouteLink | null;
  roundTripNote: string | null;
  /** ISO 8601 từ WP; sitemap dùng làm `lastmod`. */
  updatedAt: string | null;
  /** true khi có nội dung WP (quyết định index/hreflang với bản không phải vi). */
  hasWp: boolean;
}

/** Chuỗi rỗng/chỉ khoảng trắng/null coi như vắng mặt (ô WP chưa nhập). */
const text = (v: string | null | undefined): string | null => (v?.trim() ? v.trim() : null);
const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

/** "Từ 485.000đ" → 485000. */
export function parsePrice(label: string | null | undefined): number | null {
  const digits = (label ?? "").replace(/\D/g, "");
  const value = digits ? Number(digits) : NaN;
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/** Tên điểm A/B ngắn cho tiêu đề: "Mỹ Đình - Điện Biên" → ["Mỹ Đình","Điện Biên"]; không tách được thì tên bến. */
export function routeEndpoints(cms: RouteListing): [string, string] {
  const parts = cms.data.wayroad?.name.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean) ?? [];
  return parts.length === 2 ? [parts[0], parts[1]] : [cms.data.start_place.name, cms.data.end_place.name];
}

/** Giờ chạy dạng số ("11h", 11, "11") → "11"; không đọc được → null. */
function hours(runTime: string | number | null | undefined): string | null {
  const m = String(runTime ?? "").match(/\d+(?:[.,]\d+)?/);
  return m ? m[0] : null;
}

/** Meta_title của CMS nhiều tuyến chỉ lặp lại tên tuyến (vd "Mỹ Đình - Điện Biên") → không dùng làm title. */
function cmsTitle(cms: RouteListing): string | null {
  const way = cms.data.wayroad;
  const title = text(way?.meta_title);
  return title && way && norm(title) !== norm(way.name) ? title : null;
}

function cmsDescription(cms: RouteListing): string | null {
  const way = cms.data.wayroad;
  const desc = text(way?.meta_desc);
  return desc && way && norm(desc) !== norm(way.name) ? desc : null;
}

/**
 * Gộp theo thứ tự ưu tiên WP > CMS > mẫu (hàm thuần, không I/O). `wp` null khi WP chưa có bài hoặc sập.
 * Tiêu đề/mô tả của WP và CMS dùng nguyên văn; chỉ mẫu bị giới hạn độ dài.
 */
export function buildRouteLanding(wp: RouteLandingWp | null, cms: RouteListing, tpl: RouteTemplate): RouteLandingView {
  const [start, end] = routeEndpoints(cms);
  const way = cms.data.wayroad;
  const priceLabel = text(way?.price_avg);
  const priceShort = priceLabel?.replace(/^\s*từ\s+/i, "") ?? null;
  const runHours = hours(way?.run_time);
  const pickups = wp?.pickup_points ?? [];
  const useCms = tpl.cmsMeta;

  const faq = wp?.faq?.length ? wp.faq : useCms ? (cms.questions_wayroad ?? []).map((x) => ({ q: x.question, a: x.answer })) : [];
  const subline = [priceLabel, runHours ? `${runHours}h` : null, way?.distance ? `${way.distance} km` : null].filter(Boolean).join(" · ");

  return {
    start,
    end,
    title: text(wp?.seo_title) ?? (useCms ? cmsTitle(cms) : null) ?? tpl.title(start, end, priceShort),
    description:
      text(wp?.meta_description) ?? (useCms ? cmsDescription(cms) : null) ?? tpl.description(start, end, { price: priceShort, hours: runHours, pickup: pickups[0]?.name }),
    h1: text(wp?.h1) ?? tpl.h1(start, end),
    priceLabel,
    priceValue: parsePrice(priceLabel),
    subline: subline || null,
    runHours,
    scheduleHtml: sanitizeHtml(wp?.schedule_text),
    intro: text(wp?.intro),
    contentHtml: sanitizeHtml(wp?.content_html),
    faq: faq.filter((x) => x.q.trim() && x.a.trim()),
    pickupPoints: pickups,
    offices: wp?.offices ?? [],
    vehicleClasses: wp?.vehicle_classes ?? [],
    amenities: (cms.services ?? []).map((s) => ({ name: s.name, icon: s.image && /^https?:\/\//i.test(s.image) ? s.image : null })),
    relatedRoutes: wp?.related_routes ?? [],
    reverseRoute: wp?.reverse_route ?? null,
    roundTripNote: text(wp?.round_trip_note),
    updatedAt: wp?.updated_at ?? null,
    hasWp: Boolean(wp),
  };
}

/** Chỉ bản vi có nội dung thật (WP chỉ có tiếng Việt); en noindex và không đưa vào hreflang/sitemap tới khi WP có bản en. */
export const isIndexableLocale = (lang: string): boolean => lang === "vi";
