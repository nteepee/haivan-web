import { Check } from "lucide-react";
import Image from "next/image";
import { localePrefix, translate, type Locale } from "@/i18n/t";
import type { SiteLayout } from "@/schemas/layout";

/** Ý của dải app như WP: ý cuối là liên kết sang chương trình khách hàng thân thiết. */
const TICKS = [
  { key: "footer.app_tick_1" },
  { key: "footer.app_tick_2" },
  { key: "footer.app_tick_3" },
  { key: "footer.app_tick_4", href: "/chung-toi/chuong-trinh-khach-hang-than-thiet" },
] as const;

/**
 * Dải tải app nền vàng thương hiệu, cùng markup và lớp với WP (`hv_render_app_band`): tiêu đề, bốn ý, QR, huy hiệu cửa hàng, ảnh điện thoại.
 * Nằm ngay trước footer ở mọi trang (layout); không có dữ liệu app thì ẩn.
 */
export function AppBand({ locale, site }: { locale: Locale; site: SiteLayout }) {
  const t = (key: string) => translate(locale, key);
  const { apps, badges, qr } = site;
  if (!apps || !badges) return null;
  return (
    <section aria-labelledby="app-band-title" className="hv-section hv-section-yellow hv-app-band">
      <div className="hv-container hv-app">
        <div className="hv-app-text">
          <p id="app-band-title" className="hv-app-title">
            {t("footer.app_title")}
          </p>
          <ul className="hv-ticks">
            {TICKS.map((tick) => (
              <li key={tick.key}>
                <Check className="hv-ic size-6 shrink-0" aria-hidden />
                {"href" in tick ? (
                  <a className="hv-ticks__link" href={localePrefix(locale) + tick.href}>
                    {t(tick.key)}
                  </a>
                ) : (
                  t(tick.key)
                )}
              </li>
            ))}
          </ul>
          <div className="hv-app-qr">
            {qr ? <Image src={qr} alt={t("footer.qr_alt")} width={128} height={128} unoptimized className="hv-qr" /> : <span />}
            <div>
              <p>{t("footer.qr_scan")}</p>
              <ul className="hv-badges">
                <li>
                  <a href={apps.ios} target="_blank" rel="noopener" aria-label={t("footer.app_store")}>
                    <Image src={badges.appstore} alt="" width={140} height={44} unoptimized />
                  </a>
                </li>
                <li>
                  <a href={apps.android} target="_blank" rel="noopener" aria-label={t("footer.play_store")}>
                    <Image src={badges.playstore} alt="" width={140} height={44} unoptimized />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <Image src="/assets/design/app-phone.webp" alt={t("footer.app_phone_alt")} width={640} height={656} unoptimized className="hv-app-phone" />
      </div>
    </section>
  );
}
