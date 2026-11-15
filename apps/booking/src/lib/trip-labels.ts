import type { Locale } from "@/i18n/t";
import { placeEn, stripVietnamese } from "@/lib/route-landing-template";

/** Tên hạng xe ERP (có tuyến đặt tên tiếng Việt: "Cao cấp", "Tiết kiệm", "Siêu rẻ") theo locale; bản en dùng tên hạng quốc tế. */
export function tripClassLabel(name: string, locale: Locale | string): string {
  // Tên hạng thống nhất Royal (22/24 cabin) / Luxury (34–36 giường) / Eco (44 giường) cho mọi ngôn ngữ; ERP vẫn trả tên cũ.
  const n = name.normalize("NFC").trim().toLowerCase();
  if (n === "cao cấp") return "Royal";
  if (n === "tiết kiệm") return "Luxury";
  if (n === "siêu rẻ") return "Eco";
  return locale === "vi" ? name : stripVietnamese(name);
}

/** Tên tuyến/chặng "A - B" từ ERP/CMS theo locale: bản en đổi từng địa danh (Hà Nội → Hanoi, bỏ dấu). */
export function placeLineLabel(line: string, locale: Locale | string): string {
  if (locale === "vi") return line;
  return line.split(" - ").map((part) => placeEn(part)).join(" - ");
}
