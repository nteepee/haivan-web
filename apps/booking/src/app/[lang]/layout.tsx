import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppBand } from "@/components/layout/app-band";
import { HotlineButton } from "@/components/layout/hotline-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SITE_TAGS, SiteTagNoscript, SiteTagScripts } from "@/components/layout/site-tags";
import { Providers } from "@/components/providers";
import { ForceProfileDialog } from "@/components/account/force-profile-dialog";
import { isLocale, LOCALES, translate } from "@/i18n/t";
import { getSiteLayout } from "@/lib/layout-source";
import { publicOrigin } from "@/lib/public-origin";
import "../globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  // Nunito là font biến thiên: không khai báo `weight` thì một file phủ 200-1000 (design dùng 400, 600, 800).
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "vi";
  return {
    metadataBase: new URL(publicOrigin()),
    title: { default: translate(locale, "site.title_default"), template: translate(locale, "site.title_template") },
    description: translate(locale, "site.description"),
    // Như <head> haivan.com cũ: xác minh tên miền Facebook + fb:app_id (chia sẻ Facebook).
    ...(SITE_TAGS.enabled ? { facebook: { appId: SITE_TAGS.fbAppId }, other: { "facebook-domain-verification": SITE_TAGS.fbDomainVerification } } : {}),
  };
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const layout = await getSiteLayout();

  return (
    <html lang={lang} className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteTagNoscript />
        <Providers locale={lang}>
          <SiteHeader locale={lang} layout={layout[lang]} hotline={layout.hotline} />
          <main id="main" className="flex-1">
            <Suspense>{children}</Suspense>
          </main>
          <AppBand locale={lang} site={layout} />
          <SiteFooter locale={lang} site={layout} />
          {/* Cuối trang: chừa đúng chiều cao thanh dính (--bar-h) để chân trang không bị thanh che khi cuộn hết; 0 nếu không có thanh. */}
          <div className="hv-bar-spacer" aria-hidden />
          <HotlineButton locale={lang} hotline={layout.hotline} />
          <ForceProfileDialog />
        </Providers>
        <SiteTagScripts />
      </body>
    </html>
  );
}
