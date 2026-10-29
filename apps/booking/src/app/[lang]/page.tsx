import { redirect } from "next/navigation";
import { localePrefix, isLocale } from "@/i18n/t";

// Trang chủ thuộc WordPress (nginx). Khi chạy Next đơn lẻ, đưa về trang đặt vé.
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  redirect(`${isLocale(lang) ? localePrefix(lang) : ""}/xe-khach`);
}
