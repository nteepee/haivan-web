import Image from "next/image";
import { translate, type Locale } from "@/i18n/t";
import type { SiteLayout } from "@/schemas/layout";

/**
 * Dải tải app v2 (khối vàng như trang chủ WP): dòng nhỏ, tiêu đề hai vế, đoạn dẫn, huy hiệu cửa hàng; QR bên phải.
 * Tiêu đề là <p> dáng H2 (không thêm heading lặp ở mọi trang). Nằm ngay trước footer (layout); không có dữ liệu app thì ẩn.
 */
export function AppBand({ locale, site }: { locale: Locale; site: SiteLayout }) {
  const t = (key: string) => translate(locale, key);
  const { apps, badges, qr } = site;
  if (!apps || !badges) return null;
  return (
    <section aria-labelledby="app-band-title" className="hv-section hv-section-yellow hv-app-band">
      <div className="hv-container hv-app">
        <div className="hv-app-text">
          <p className="hv-eyebrow">{t("footer.app_eyebrow")}</p>
          <p id="app-band-title" className="hv-app-title">
            {t("footer.app_h2_a")} <em>{t("footer.app_h2_b")}</em>
          </p>
          <p className="hv-app-lead">{t("footer.app_lead")}</p>
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
        {qr ? (
          <figure className="hv-qr-card">
            <Image src={qr} alt={t("footer.qr_alt")} width={160} height={160} unoptimized className="hv-qr" />
            <figcaption>{t("footer.app_scan")}</figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
