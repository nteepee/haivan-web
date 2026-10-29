/** Ảnh thật của Hải Vân dùng cho trang tuyến và thẻ tuyến (file nằm ở public/assets/design). Không có ảnh riêng thì dùng ảnh xe cùng tỉ lệ. */
export interface Art {
  src: string;
  width: number;
  height: number;
  /** Mô tả ảnh tiếng Việt (bản vi). */
  alt: string;
  /** Mô tả ảnh tiếng Anh cho /en (thiếu thì dùng `alt`). */
  altEn?: string;
}

/** Mô tả ảnh theo ngôn ngữ trang. */
export const artAlt = (a: Art, locale: "vi" | "en"): string => (locale === "en" ? (a.altEn ?? a.alt) : a.alt);

const DIR = "/assets/design";
const art = (file: string, width: number, height: number, alt: string, altEn?: string): Art => ({ src: `${DIR}/${file}`, width, height, alt, altEn });

/** Ảnh thẻ tuyến phổ biến (/xe-khach), khoá theo slug `a/b`. */
export const ROUTE_CARD_ART: Record<string, Art> = {
  "quan-1/vung-tau": art("route-quan1-vungtau.jpg", 720, 520, "Chợ Bến Thành, TP. Hồ Chí Minh", "Ben Thanh Market, Ho Chi Minh City"),
  "my-dinh/dien-bien": art("route-mydinh-dienbien.jpg", 900, 506, "Toàn cảnh thành phố Điện Biên Phủ nhìn từ trên cao", "Aerial view of Dien Bien Phu city"),
  "vung-tau/tan-son-nhat": art("route-tansonnhat.jpg", 390, 258, "Nhà ga sân bay Tân Sơn Nhất lúc chiều tối", "Tan Son Nhat airport terminal at dusk"),
  "tan-son-nhat/vung-tau": art("route-tansonnhat.jpg", 390, 258, "Nhà ga sân bay Tân Sơn Nhất lúc chiều tối", "Tan Son Nhat airport terminal at dusk"),
  "my-dinh/son-la": art("route-sonla.jpg", 302, 167, "Ruộng lúa chín và nhà sàn ở Sơn La", "Ripe rice fields and stilt houses in Son La"),
  "yen-nghia/dien-bien": art("ve_hai_van_2.jpg", 544, 363, "Đoàn xe Hải Vân xếp hàng tại bến", "Hai Van coaches lined up at the station"),
  "my-dinh/ban-phu": art("ve_hai_van_1.jpg", 544, 363, "Xe giường nằm Hải Vân màu đen", "Black Hai Van sleeper coach"),
  "my-dinh/muong-cha": art("phuong_tien_3.jpg", 815, 400, "Xe giường nằm Hải Vân trong bãi đỗ", "Hai Van sleeper coach in the parking lot"),
  "vung-tau/quan-1-san-bay": art("don-khach.jpg", 900, 600, "Nhân viên Hải Vân đón khách lên xe tại Vũng Tàu", "Hai Van staff welcoming passengers on board in Vung Tau"),
};
/** Tuyến lạ chưa có ảnh riêng: ảnh xe Hải Vân thật. */
export const FALLBACK_ROUTE_ART = art("phuong_tien_6.jpg", 815, 400, "Xe Luxury Hải Vân màu đen", "Black Hai Van Luxury coach");

const DIEN_BIEN_BUS = art("xe-hanoi-dienbien.webp", 900, 356, "Hai xe giường nằm Hải Vân chạy tuyến Hà Nội, Điện Biên: xe vàng Royal và xe trắng", "Two Hai Van sleeper coaches on the Hanoi - Dien Bien route: a yellow Royal and a white coach");
/** Ảnh xe trên banner trang tuyến; chỉ tuyến Tây Bắc có ảnh xe riêng. */
export const ROUTE_HERO_ART: Record<string, Art> = {
  "my-dinh/dien-bien": DIEN_BIEN_BUS,
  "yen-nghia/dien-bien": DIEN_BIEN_BUS,
  "my-dinh/ban-phu": DIEN_BIEN_BUS,
  "my-dinh/muong-cha": DIEN_BIEN_BUS,
};

/** Sơ đồ điểm dừng thật của tuyến Tây Bắc (chung cho các tuyến trên). */
export const ROUTE_STOP_MAP: Art = art(
  "route-map-tay-bac.webp",
  1886,
  428,
  "Sơ đồ tuyến từ Yên Nghĩa hoặc Xuân Mai qua Hòa Bình, Tuần Giáo tới Điện Biên, Mường Chà, Mường Lay và Bản Phủ",
  "Route map from Yen Nghia or Xuan Mai via Hoa Binh and Tuan Giao to Dien Bien, Muong Cha, Muong Lay and Ban Phu",
);

/** Ảnh nội thất theo tên hạng xe của WP (Royal, Luxury/Limousine, Economy); tên khác thì không gán ảnh. */
export function classArt(name: string): { art: Art; cut: boolean } | null {
  if (/royal/i.test(name)) return { art: art("xe-royal.webp", 900, 436, "Xe Royal Cabin vàng của Hải Vân", "Yellow Hai Van Royal Cabin coach"), cut: true };
  if (/luxury|limousine/i.test(name)) return { art: art("xe-luxury.webp", 900, 436, "Xe Luxury trắng của Hải Vân", "White Hai Van Luxury coach"), cut: true };
  if (/economy|\beco\b/i.test(name)) return { art: art("class-economy.jpg", 815, 400, "Xe giường nằm Economy của Hải Vân", "Hai Van Economy sleeper coach"), cut: false };
  return null;
}

/** Ảnh phòng chờ Hà Nội, chỉ hiện khi điểm đón/văn phòng của tuyến thật sự là phòng chờ đó. */
export const WAITING_ROOM_ART: Art[] = [
  art("phong_cho_1.jpg", 544, 363, "Phòng chờ Hải Vân với ghế sofa và quầy trà bánh", "Hai Van waiting room with sofas and a tea and snack counter"),
  art("phong_cho_2.jpg", 544, 363, "Trà bánh và trái cây trong phòng chờ", "Tea, snacks and fruit in the waiting room"),
  art("phong_cho_3.jpg", 544, 363, "Khách ngồi chờ xe trong phòng chờ", "Passengers waiting for their coach in the waiting room"),
];
