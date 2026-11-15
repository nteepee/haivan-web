import Image from "next/image";
import { translate, type Locale } from "@/i18n/t";
import { stripVietnamese } from "@/lib/route-landing-template";
import type { SiteLayout } from "@/schemas/layout";

type Logo = NonNullable<SiteLayout["partners"]>[number];

/** Alt theo locale: bản en dùng alt_en từ WP; layout dự phòng (không có alt_en) thì bỏ dấu. */
function logoAlt(logo: Logo, locale: Locale): string {
  if (locale === "vi") return logo.alt;
  return logo.alt_en ?? stripVietnamese(logo.alt.replace(/Hải Vân/g, "Hai Van"));
}

/** Nhóm logo: nhãn nhỏ + hàng chip sáng (logo cao 28px phone / 32px từ 40rem); chip có liên kết thì đệm nằm trên `<a>` để vùng bấm đủ 44px. */
function LogoGroup({ title, logos, locale }: { title: string; logos: Logo[] | undefined; locale: Locale }) {
  if (!logos?.length) return null; // ẩn cả nhóm khi không có logo
  return (
    <section className="hv-footer-group">
      <p className="hv-footer-head">{title}</p>
      <ul className="hv-chips">
        {logos.map((logo) => {
          const img = <Image src={logo.img} alt={logoAlt(logo, locale)} width={120} height={32} unoptimized />;
          return (
            <li key={logo.img}>
              {logo.href ? (
                <a href={logo.href} target="_blank" rel="noopener">
                  {img}
                </a>
              ) : (
                img
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Một hàng tin cậy gọn: Đối tác, Thành viên, Thanh toán, Chứng nhận (cùng thứ tự với WP). */
export function FooterTrust({ locale, site }: { locale: Locale; site: SiteLayout }) {
  const t = (key: string) => translate(locale, key);
  const cert = site.certificate;
  if (!site.partners?.length && !site.members?.length && !site.payments?.length && !cert) return null;
  return (
    <div className="hv-footer-tier hv-footer-trust">
      <LogoGroup title={t("footer.partners")} logos={site.partners} locale={locale} />
      <LogoGroup title={t("footer.members")} logos={site.members} locale={locale} />
      <LogoGroup title={t("footer.payment_methods")} logos={site.payments} locale={locale} />
      {cert ? <LogoGroup title={t("footer.certification")} logos={[{ img: cert.img, href: cert.href, alt: cert.alt ?? t("footer.certification"), alt_en: cert.alt_en ?? t("footer.certification") }]} locale={locale} /> : null}
    </div>
  );
}
