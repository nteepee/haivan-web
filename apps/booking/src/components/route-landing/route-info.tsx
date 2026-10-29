import { Check } from "lucide-react";
import Image from "next/image";
import { Rail } from "@/components/ui/rail";
import { translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { HtmlBlock } from "./html-block";
import { artAlt, classArt } from "./route-art";
import { SectionCard } from "./section-card";

type T = (key: string, vars?: Record<string, string | number>) => string;

function ClassCard({ v, t, locale }: { v: RouteLandingView["vehicleClasses"][number]; t: T; locale: Locale }) {
  const photo = classArt(v.name);
  const meta = [v.seats ? t("route.seats", { n: v.seats }) : null, v.price_from ? t("route.price_from", { price: v.price_from }) : null].filter(Boolean).join(", ");
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

/** Nội dung tuyến (content_html), hạng xe và tiện ích. Khối nào trống thì không render. */
export function RouteInfo({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t: T = (key, vars) => translate(locale, key, vars);
  return (
    <>
      {view.contentHtml ? (
        <SectionCard id="route-about" title={t("route.about_title", { a: view.start, b: view.end })}>
          <HtmlBlock html={view.contentHtml} />
        </SectionCard>
      ) : null}
      {view.vehicleClasses.length ? (
        <SectionCard id="route-vehicles" title={t("route.vehicles_title")}>
          <Rail grid label={t("route.vehicles_title")}>
            {view.vehicleClasses.map((v) => (
              <ClassCard key={v.name} v={v} t={t} locale={locale} />
            ))}
          </Rail>
        </SectionCard>
      ) : null}
      {view.amenities.length ? (
        <SectionCard id="route-amenities" title={t("route.amenities_title")}>
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
