import type { Metadata } from "next";
import { isLocale, translate } from "@/i18n/t";

/**
 * generateMetadata cho trang có tiêu đề cố định: tiêu đề lấy từ i18n `page_title.<key>` theo locale của URL
 * (bản en không mang tiêu đề tiếng Việt). `absolute` = không thêm hậu tố thương hiệu của layout.
 */
export function localizedMetadata(key: string, extra: Omit<Metadata, "title"> = {}, absolute = false) {
  return async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
    const { lang } = await params;
    const title = translate(isLocale(lang) ? lang : "vi", `page_title.${key}`);
    return { ...extra, title: absolute ? { absolute: title } : title };
  };
}
