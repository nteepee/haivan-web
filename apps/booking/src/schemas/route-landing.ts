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
/** Ảnh: tên tệp trong public/assets/design/v2 (vd "lounge-q1.webp") hoặc URL https. */
const imageRef = z.string().regex(/^(?:[a-z0-9-]+\.(?:webp|jpg|jpeg|png)|https:\/\/\S+)$/i, "tên tệp ảnh v2 hoặc https");
const fact = z.object({ value: z.string(), label: z.string() });

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
    z.array(
      z.object({
        name: z.string(),
        address: z.string(),
        hours: opt(z.string()),
        note: opt(z.string()),
        map_url: opt(httpUrl),
        /** Nhãn nhỏ trên tên, vd "Quận 1 · Phòng chờ chính". */
        tag: opt(z.string()),
        image: opt(imageRef),
      }),
    ),
  ),
  /** Số liệu đầu trang ngoài giá (vd "15–30 phút" / "Một chuyến"); trống thì dùng giờ chạy + km của CMS. */
  facts: opt(z.array(fact)),
  /** Khối "Vì sao chọn": tiêu đề hai vế + thẻ có ảnh. */
  reasons: opt(
    z.object({
      eyebrow: opt(z.string()),
      title_a: z.string(),
      title_b: opt(z.string()),
      intro: opt(z.string()),
      items: z.array(z.object({ title: z.string(), text: z.string(), image: opt(imageRef) })),
    }),
  ),
  /** Danh bạ trạm đón trả theo khu vực. */
  stops: opt(z.array(z.object({ area: z.string(), name: z.string(), address: opt(z.string()) }))),
  stops_intro: opt(z.string()),
  /** Đánh giá Google của tuyến: điểm, số đánh giá, liên kết và vài lời khách (trích nguyên văn). */
  rating: opt(z.object({ score: z.string(), count: opt(z.number().int().nonnegative()), url: opt(httpUrl) })),
  reviews: opt(z.array(z.object({ quote: z.string(), author: opt(z.string()) }))),
  /** Số liệu doanh nghiệp có nguồn (vd "30+" / "năm vận tải"). */
  stats: opt(z.array(fact)),
  /** Một câu chuyện có thật (văn bản thuần). */
  story: opt(z.string()),
  vehicle_classes: opt(
    z.array(
      z.object({
        name: z.string(),
        seats: opt(z.number().int().positive()),
        /** Chuỗi hiển thị, vd "485.000đ". */
        price_from: opt(z.string()),
        text: opt(z.string()),
        amenities: opt(z.array(z.string())),
        /** Ảnh thật của hạng xe trên tuyến này; trống = ảnh mặc định theo tên hạng. */
        image: opt(imageRef),
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
