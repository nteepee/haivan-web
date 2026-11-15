import { translate, type Locale } from "@/i18n/t";
import { formatMoney } from "@/lib/format";

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Phần thông tin có thể thiếu khi dựng meta description (thiếu thì bỏ, không để chỗ trống). */
export interface MetaParts {
  price?: string | null;
  hours?: string | null;
  pickup?: string | null;
}

/** Chuỗi mẫu dùng khi WP và CMS đều không có (i18n: vi là gốc, en dịch). */
export interface RouteTemplate {
  /** Chỉ `vi` dùng meta_title/meta_desc của CMS (CMS không có bản en). */
  cmsMeta: boolean;
  title(a: string, b: string, price?: string | null): string;
  h1(a: string, b: string): string;
  description(a: string, b: string, parts: MetaParts): string;
  /** Tên địa danh từ CMS (luôn tiếng Việt) theo locale: vi giữ nguyên, en đổi tên quen thuộc và bỏ dấu. */
  place(name: string): string;
  /** Tên tiện ích trên xe từ CMS (tiếng Việt) theo locale; tên lạ giữ nguyên. */
  amenity(name: string): string;
  /** Giá theo locale: vi "250.000đ", en "250,000đ". */
  money(value: number): string;
}

/** Tên địa danh có bản tiếng Anh quen dùng (khoá đã chuẩn hoá chữ thường). */
const PLACE_EN: Record<string, string> = {
  "quận 1 sân bay": "District 1 & Airport",
  "quận 1": "District 1",
  "tân sơn nhất": "Tan Son Nhat Airport",
  "sài gòn": "Saigon",
  "hà nội": "Hanoi",
};

const AMENITY_EN: Record<string, string> = {
  "điều hòa cá nhân": "Personal air conditioning",
  "sạc không dây": "Wireless charging",
  "khăn lạnh miễn phí": "Free cold towels",
  "ghế massage": "Massage seats",
  "nước uống miễn phí": "Free drinking water",
  "wifi miễn phí": "Free Wi-Fi",
};

const key = (s: string) => s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");

/** "Điện Biên" → "Dien Bien" (bỏ dấu, đ → d). */
export const stripVietnamese = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFC");

export function placeEn(name: string): string {
  return PLACE_EN[key(name)] ?? stripVietnamese(name.trim());
}

export function amenityEn(name: string): string {
  return AMENITY_EN[key(name)] ?? name;
}

const truncate = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** Mẫu theo locale. Tiêu đề ≤ 60 ký tự: bỏ giá, rồi cắt nếu vẫn dài. Mô tả ≤ 155: bỏ lần lượt điểm đón, giờ chạy, giá. */
export function routeTemplate(locale: Locale): RouteTemplate {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, `route.${key}`, vars);
  return {
    cmsMeta: locale === "vi",
    place: (name) => (locale === "vi" ? name : placeEn(name)),
    amenity: (name) => (locale === "vi" ? name : amenityEn(name)),
    money: (value) => formatMoney(value, locale),
    title(a, b, price) {
      const candidates = [price ? t("tpl_title", { a, b, price }) : "", t("tpl_title_no_price", { a, b })].filter(Boolean);
      return candidates.find((c) => c.length <= TITLE_MAX) ?? truncate(candidates[candidates.length - 1], TITLE_MAX);
    },
    h1: (a, b) => t("tpl_h1", { a, b }),
    description(a, b, parts) {
      const head = t("tpl_meta_head", { a, b });
      const tail = t("tpl_meta_tail");
      const facts = {
        price: parts.price ? t("tpl_meta_price", { price: parts.price }) : "",
        hours: parts.hours ? t("tpl_meta_time", { hours: parts.hours }) : "",
        pickup: parts.pickup ? t("tpl_meta_pickup", { place: parts.pickup }) : "",
      };
      const dropOrder: Array<keyof typeof facts | null> = [null, "pickup", "hours", "price"];
      for (const drop of dropOrder) {
        const list = (["price", "hours", "pickup"] as const).filter((k) => k !== drop && facts[k]).map((k) => facts[k]);
        const text = `${head}${list.length ? `: ${list.join(", ")}` : ""}. ${tail}`;
        if (text.length <= DESCRIPTION_MAX) return text;
      }
      return truncate(`${head}. ${tail}`, DESCRIPTION_MAX);
    },
  };
}
