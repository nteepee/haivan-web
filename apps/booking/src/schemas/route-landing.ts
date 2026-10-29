import { z } from "zod";

/**
 * Hợp đồng `GET /wp-json/haivan-web/v1/route/<a>/<b>` (bài `hv_route` trong WordPress, MKT sửa).
 * Mọi trường tuỳ chọn trừ `path`; WP có thể gửi `null` hoặc chuỗi rỗng cho ô chưa nhập
 * (chuỗi rỗng coi như vắng mặt khi gộp, xem `route-landing-build.ts`).
 * Fixture `test/fixtures/wp-route.json` vừa là mẫu WP phải trả vừa là dữ liệu e2e.
 */
const opt = <T extends z.ZodType>(schema: T) => schema.nullish();
const httpUrl = z.url({ protocol: /^https?$/ });
const slugPair = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "path dạng a/b (slug CMS)");

const routeLink = z.object({ label: z.string(), path: slugPair });

export const routeLandingSchema = z.looseObject({
  path: slugPair,
  seo_title: opt(z.string()),
  meta_description: opt(z.string()),
  h1: opt(z.string()),
  intro: opt(z.string()),
  /** Đoạn dưới tiêu đề "Giờ chạy & giá vé" (HTML hạn chế, qua sanitizer). */
  schedule_text: opt(z.string()),
  /** HTML hạn chế (allowlist trong `sanitize-html.ts`). */
  content_html: opt(z.string()),
  faq: opt(z.array(z.object({ q: z.string(), a: z.string() }))),
  pickup_points: opt(z.array(z.object({ name: z.string(), address: z.string(), note: opt(z.string()) }))),
  offices: opt(
    z.array(z.object({ name: z.string(), address: z.string(), hours: opt(z.string()), note: opt(z.string()), map_url: opt(httpUrl) })),
  ),
  vehicle_classes: opt(
    z.array(
      z.object({
        name: z.string(),
        seats: opt(z.number().int().positive()),
        /** Chuỗi hiển thị, vd "485.000đ". */
        price_from: opt(z.string()),
        text: opt(z.string()),
        amenities: opt(z.array(z.string())),
      }),
    ),
  ),
  related_routes: opt(z.array(routeLink)),
  reverse_route: opt(routeLink),
  round_trip_note: opt(z.string()),
  /** ISO 8601; dùng cho `lastmod` của sitemap. */
  updated_at: opt(z.iso.datetime({ offset: true })),
});
export type RouteLandingWp = z.infer<typeof routeLandingSchema>;
