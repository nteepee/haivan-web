import Image from "next/image";
import { Phone } from "lucide-react";
import { Suspense } from "react";
import logo from "@/assets/logo.svg";
import { localePrefix, translate, type Locale } from "@/i18n/t";
import type { LocalizedLayout } from "@/schemas/layout";
import { AccountMenu } from "./account-menu";
import { HeaderNav, MobileNav } from "./header-nav";
import { HeaderShell } from "./header-shell";
import { LanguageSwitch } from "./language-switch";

/** Header vàng một dòng, dính đầu trang (kính vàng khi đã cuộn): logo, 5 nhóm menu, hotline, đăng nhập, EN. */
export function SiteHeader({ locale, layout, hotline }: { locale: Locale; layout: LocalizedLayout; hotline: string }) {
  const callLabel = translate(locale, "header.call", { hotline });
  return (
    <HeaderShell>
      <a href="#main" className="hv-skip">
        {translate(locale, "ux.skip_to_content")}
      </a>
      <div className="hv-container hv-header-row">
        <a href={localePrefix(locale) || "/"} aria-label={translate(locale, "header.home_label")} className="hv-brand">
          <Image src={logo} alt="HAIVAN" width={121} height={24} priority className="h-6 w-auto" />
        </a>
        <HeaderNav items={layout.primary} />
        <a href={`tel:${hotline.replace(/\s/g, "")}`} aria-label={callLabel} className="hv-header-call">
          <Phone className="size-icon" aria-hidden />
          <span className="hv-header-call-num">{hotline}</span>
        </a>
        <AccountMenu />
        <Suspense fallback={null}>
          <LanguageSwitch />
        </Suspense>
        <MobileNav items={layout.primary} />
      </div>
    </HeaderShell>
  );
}
