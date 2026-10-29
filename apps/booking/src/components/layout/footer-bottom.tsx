import Image from "next/image";
import { translate, type Locale } from "@/i18n/t";
import type { SiteLayout } from "@/schemas/layout";

type IconLink = { href: string; icon: string; alt: string };

function IconRow({ title, links }: { title: string; links: IconLink[] }) {
  if (!links.length) return null;
  return (
    <section className="hv-footer-group">
      <p className="hv-footer-head">{title}</p>
      <ul className="hv-footer-icons">
        {links.map((s) => (
          <li key={s.alt}>
            <a href={s.href} target="_blank" rel="noopener" aria-label={s.alt}>
              <Image src={s.icon} alt="" width={32} height={32} unoptimized />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Đáy footer (cùng cấu trúc với WP): pháp lý của công ty | Theo dõi + Ứng dụng HAIVAN; bản quyền là dòng cuối có vạch trên. */
export function FooterBottom({ locale, site }: { locale: Locale; site: SiteLayout }) {
  const t = (key: string) => translate(locale, key);
  const { company } = site[locale];
  const { social, apps, badges } = site;
  const tel = site.hotline.replace(/[^0-9+]/g, "");
  const copyright = typeof site.copyright === "string" ? site.copyright : site.copyright?.[locale];
  const socials = [
    { href: social?.facebook, icon: "/assets/icons/facebook.svg", alt: "Facebook" },
    { href: social?.youtube, icon: "/assets/icons/youtube.svg", alt: "YouTube" },
  ].filter((s): s is IconLink => Boolean(s.href));
  const stores = [
    { href: apps?.ios, icon: badges?.appstore_icon, alt: t("footer.app_store") },
    { href: apps?.android, icon: badges?.playstore_icon, alt: t("footer.play_store") },
  ].filter((s): s is IconLink => Boolean(s.href && s.icon));

  return (
    <>
      <div className="hv-footer-tier hv-footer-bottom">
        <div className="hv-footer-legal">
          <p>
            <strong>{company.name}</strong>
          </p>
          {company.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {tel ? (
            <p>
              {t("footer.hotline_label")} <a href={`tel:${tel}`}>{site.hotline}</a>
            </p>
          ) : null}
        </div>
        <div className="hv-footer-follow">
          <IconRow title={t("footer.follow_us")} links={socials} />
          <IconRow title={t("footer.appHV")} links={stores} />
        </div>
      </div>
      {copyright ? <p className="hv-footer-copy">{copyright}</p> : null}
    </>
  );
}
