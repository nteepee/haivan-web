import { Check } from "lucide-react";
import { formatMoney } from "@/lib/format";
import Image from "next/image";
import { Rail } from "@/components/ui/rail";
import { translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { HtmlBlock } from "./html-block";
import { artAlt, classArt } from "./route-art";
import { SectionCard } from "./section-card";

type T = (key: string, vars?: Record<string, string | number>) => string;

function ClassCard({ v, t, locale, south, price }: { v: RouteLandingView["vehicleClasses"][number]; t: T; locale: Locale; south: boolean; price: number | null }) {
  const photo = classArt(v.name, south);
  // Giá "từ" = giá thấp nhất của hạng này trong các chuyến hôm nay (không dùng giá nhập tay của WP vì đã cũ).
  const meta = [v.seats ? t("route.seats", { n: v.seats }) : null].filter(Boolean).join(", ");
  return (
    <li className="hv-ccard">
      {photo ? (
        <div className={photo.cut ? "hv-ccard-img hv-ccard-img-cut" : "hv-ccard-img"}>
          <Image src={photo.art.src} alt={artAlt(photo.art, locale)} width={photo.art.width} height={photo.art.height} unoptimized loading="lazy" />
        </div>
      ) : null}
      <div className="hv-ccard-body">
        <h3>{v.name}</h3>
        {meta ? <p className="text-muted">{meta}</p> : null}
        {price ? (
          <p className="hv2r-class-price">
            <small>{t("route.fact_price")}</small> <strong>{formatMoney(price)}</strong>
          </p>
        ) : null}
        {v.text ? <p>{v.text}</p> : null}
        {v.amenities?.length ? (
          <ul className="hv-ticks">
            {v.amenities.map((a) => (
              <li key={a}>
                <Check className="size-6 shrink-0" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

/** Cẩm nang tuyến (content_html của WP, HTML đã lọc). */
export function RouteAbout({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t: T = (key, vars) => translate(locale, key, vars);
  if (!view.contentHtml) return null;
  return (
    <SectionCard id="route-about" eyebrow={t("route.about_eyebrow")} title={t("route.about_title", { a: view.start, b: view.end })}>
      <HtmlBlock html={view.contentHtml} className="hv2r-reading" />
    </SectionCard>
  );
}

/** Hạng xe (ảnh thật, giá "từ" hôm nay theo hạng) và tiện ích. Khối nào trống thì không render. */
export function RouteInfo({ view, locale, south, classPrice }: { view: RouteLandingView; locale: Locale; south: boolean; classPrice: (name: string) => number | null }) {
  const t: T = (key, vars) => translate(locale, key, vars);
  return (
    <>
      {view.vehicleClasses.length ? (
        <SectionCard
          id="route-vehicles"
          eyebrow={t("route.vehicles_eyebrow")}
          title={t(south ? "route.vehicles_title_south" : "route.vehicles_title_a", { a: view.start, b: view.end })}
          intro={<p>{t("route.vehicles_intro")}</p>}
        >
          <Rail grid label={t("route.vehicles_title")}>
            {view.vehicleClasses.map((v) => (
              <ClassCard key={v.name} v={v} t={t} locale={locale} south={south} price={classPrice(v.name)} />
            ))}
          </Rail>
        </SectionCard>
      ) : null}
      {view.amenities.length ? (
        <SectionCard id="route-amenities" eyebrow={t("route.amenities_eyebrow")} title={t("route.amenities_title")}>
          <ul className="hv-amenities">
            {view.amenities.map((a) => (
              <li key={a.name}>
                {a.icon ? (
                  // Icon từ CMS (tên file có khoảng trắng/dấu, ngoài allowlist loader) nên dùng thẻ img thuần.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.icon} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 rounded-1 object-cover" />
                ) : (
                  <Check className="size-icon shrink-0" aria-hidden />
                )}
                <span>{a.name}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </>
  );
}
