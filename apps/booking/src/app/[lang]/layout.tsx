import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppBand } from "@/components/layout/app-band";
import { HotlineButton } from "@/components/layout/hotline-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { ForceProfileDialog } from "@/components/account/force-profile-dialog";
import { isLocale, LOCALES } from "@/i18n/t";
import { getSiteLayout } from "@/lib/layout-source";
import { publicOrigin } from "@/lib/public-origin";
import "../globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin()),
  title: { default: "Hãng xe Hải Vân - xe liên tỉnh, xe hợp đồng, xe sân bay", template: "%s | Hải Vân" },
  description: "Đặt vé xe khách Hải Vân trực tuyến: chọn chuyến, chọn ghế, thanh toán nhanh. Hotline 1900 6763.",
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const layout = await getSiteLayout();

  return (
    <html lang={lang} className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
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
      </body>
    </html>
  );
}
