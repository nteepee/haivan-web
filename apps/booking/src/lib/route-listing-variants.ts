import type { RouteListing } from "./route-listing";

/**
 * Chiều về chỉ có bài WP (`hv_route`) mà CMS `route-listing` không biết (trả `[]`) và không thuộc tuyến chính của
 * booking-config. Chỉ liệt kê hướng đã xác nhận đang chạy; Điện Biên → Yên Nghĩa chưa có nên không nằm ở đây.
 * Trang chỉ được dựng (và vào sitemap) khi WP có bài cho đúng hướng đó.
 */
export const RETURN_ONLY_ROUTES: readonly string[] = ["ban-phu/my-dinh", "muong-cha/my-dinh"];

export const isReturnOnlyRoute = (slug: string): boolean => RETURN_ONLY_ROUTES.includes(slug);

/**
 * Listing chiều về dựng từ listing CMS của chiều đi: đổi đầu đi/đến và tên tuyến ("Mỹ Đình - Bản Phủ" → "Bản Phủ - Mỹ Đình").
 * Bỏ giá, giờ chạy, meta, hỏi đáp và tiện ích của chiều đi vì chiều về có thể khác (không bịa số liệu); giữ khoảng cách và ảnh.
 */
export function reversedListing(outbound: RouteListing, slug: string): RouteListing {
  const { start_place: from, end_place: to, wayroad } = outbound.data;
  const parts = wayroad?.name.split(/\s+-\s+/).filter(Boolean) ?? [];
  const name = parts.length === 2 ? `${parts[1]} - ${parts[0]}` : `${to.name} - ${from.name}`;
  return {
    data: {
      slug,
      start_place: { ...to },
      end_place: { ...from },
      wayroad: { name, price_avg: null, run_time: null, distance: wayroad?.distance ?? null, img_path: wayroad?.img_path ?? null, meta_title: null, meta_desc: null },
    },
  };
}

/**
 * Đổi tên tuyến (vd "Mỹ Đình - Sơn La" của CMS → "Hà Nội - Sơn La" của tuyến chính) để tiêu đề các mục trên trang gọi theo
 * tỉnh/thành. `null` hoặc chuỗi rỗng → giữ nguyên listing.
 */
export function withWayroadName(listing: RouteListing, name: string | null | undefined): RouteListing {
  const way = listing.data.wayroad;
  if (!name?.trim() || !way || way.name === name) return listing;
  return { ...listing, data: { ...listing.data, wayroad: { ...way, name } } };
}
