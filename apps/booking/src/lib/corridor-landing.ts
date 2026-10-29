import type { Locale } from "@/i18n/t";
import type { BookingConfig, Corridor, CorridorDirection } from "@/schemas/booking-config";
import { corridorForLanding, endsFor, localized, reverseChieu } from "./corridors";
import type { RouteListing } from "./route-listing";
import type { SearchPoint } from "./search-url";

/** Trang tuyến thuộc một tuyến chính của `booking-config` (landing `ab` hoặc `ba`): đầu tuyến, chiều và trang chiều ngược. */
export interface CorridorLanding {
  corridor: Corridor;
  chieu: CorridorDirection;
  from: SearchPoint;
  to: SearchPoint;
  /** Slug `a/b` của trang chiều ngược lại nếu đã có (config `landing` khác null). */
  reverseSlug: string | null;
}

export function corridorLanding(config: BookingConfig, slug: string): CorridorLanding | null {
  const match = corridorForLanding(config, slug);
  if (!match) return null;
  const { corridor, chieu } = match;
  const ends = endsFor(corridor, chieu);
  return {
    corridor,
    chieu,
    from: { name: ends.from.point.name, lat: ends.from.point.lat, lng: ends.from.point.lng },
    to: { name: ends.to.point.name, lat: ends.to.point.lat, lng: ends.to.point.lng },
    reverseSlug: corridor.landing[reverseChieu(chieu)],
  };
}

/**
 * Bản thay cho `route-listing` của CMS khi CMS không biết tuyến (my-dinh/moc-chau, moc-chau/my-dinh, son-la/my-dinh, dien-bien/my-dinh):
 * chỉ có tên hai đầu và toạ độ đầu tuyến từ cấu hình; không có giá/giờ/khoảng cách (không bịa số liệu — nội dung đến từ bài WP, chuyến từ apigw).
 */
export function corridorListing(cl: CorridorLanding, slug: string, locale: Locale): RouteListing {
  const ends = endsFor(cl.corridor, cl.chieu);
  const name = `${localized(ends.from, locale)} - ${localized(ends.to, locale)}`;
  return {
    data: {
      slug,
      start_place: { name: localized(ends.from, locale), lat: cl.from.lat, lng: cl.from.lng, slug: null },
      end_place: { name: localized(ends.to, locale), lat: cl.to.lat, lng: cl.to.lng, slug: null },
      wayroad: { name, price_avg: null, run_time: null, distance: null, img_path: null, meta_title: null, meta_desc: null },
    },
  };
}
