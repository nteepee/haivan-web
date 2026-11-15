import type { Trip } from "@/schemas/trip";

const V2 = "/assets/design/v2/";

/**
 * Ảnh xe tuyến Điện Biên (Mỹ Đình – Điện Biên / Bản Phủ / Mường Chà) theo hạng, chụp từ xe đang chạy (nhà xe gửi 11/2026).
 * Ảnh ERP của tuyến này còn xe trắng đã ngưng chạy và xe biển "Sơn La", nên web dùng bộ ảnh riêng; tuyến khác giữ ảnh ERP.
 * Hạng: "Cao cấp" = Royal Cabin 22–24 cabin, "Tiết kiệm" = Luxury 34–36 giường, "Siêu rẻ" = Eco 44 giường.
 */
const DIEN_BIEN_LINE = /điện biên|bản phủ|mường chà|dien bien|ban phu|muong cha/i;

const PHOTOS = {
  royal: ["dien-bien-hero-bus.webp", "dien-bien-hero-royal-bed.webp", "dien-bien-hero-cabin-bed.webp", "dien-bien-hero-berth-aisle.webp"],
  luxury: ["dien-bien-hero-bus.webp", "db-luxury-berth.webp", "db-luxury-aisle.webp", "db-luxury-screen.webp"],
  eco: ["dien-bien-hero-bus.webp", "db-eco-aisle.webp", "db-eco-seat.webp", "db-bus-yellow.webp"],
} as const;

function classOf(productName: string): keyof typeof PHOTOS {
  const n = productName.normalize("NFC").toLowerCase();
  if (/cao cấp|royal/.test(n)) return "royal";
  if (/tiết kiệm|lux/.test(n)) return "luxury";
  return "eco";
}

/** Ảnh hiển thị cho một chuyến: bộ ảnh riêng của tuyến Điện Biên, còn lại ảnh xe từ ERP. */
export function tripPhotos(trip: Pick<Trip, "route" | "product" | "car_imgs">): string[] {
  if (DIEN_BIEN_LINE.test(trip.route.name.normalize("NFC"))) return PHOTOS[classOf(trip.product.name)].map((f) => V2 + f);
  return trip.car_imgs ?? [];
}
