import type { Metadata } from "next";
import { LoyaltyPage } from "@/components/account/loyalty-page";
import { isLocale, translate } from "@/i18n/t";

export async function generateMetadata({ params }: PageProps<"/[lang]/tai-khoan/khach-hang-than-thiet">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "vi";
  return { title: translate(locale, "footer.intro4"), robots: { index: false } };
}

export default function Page() {
  return <LoyaltyPage />;
}
