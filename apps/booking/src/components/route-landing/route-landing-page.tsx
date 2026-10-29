import { RouteFareTable } from "@/components/trips/route-fare-table";
import { RouteSearchForm, RouteTripList, type RoutePlaces } from "@/components/trips/route-trips";
import { localePrefix, translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { routeJsonLd } from "@/lib/route-schema";
import { JsonLd } from "./json-ld";
import { RouteCta } from "./route-cta";
import { RouteFaqLinks } from "./route-faq-links";
import { RouteHero } from "./route-hero";
import { ROUTE_HERO_ART } from "./route-art";
import { RouteInfo } from "./route-info";
import { RoutePlaces as RoutePlacesSection } from "./route-places";
import { RouteSchedule } from "./route-schedule";
import { RouteStopMap } from "./route-stop-map";

interface Props {
  view: RouteLandingView;
  locale: Locale;
  places: RoutePlaces;
  origin: string;
  /** Slug `a/b` của trang chiều ngược lại (nút dưới H1), null = không có. */
  reversePath?: string | null;
  start: string;
  end: string;
}

/**
 * Landing tuyến (server): banner + thẻ tìm vé → giờ chạy & giá → nội dung → hạng xe/tiện ích → sơ đồ điểm dừng →
 * điểm đón/văn phòng → khứ hồi → FAQ → tuyến liên quan → dải đặt vé (dải tải app nằm ở layout). Khối nào không có dữ liệu thì bỏ.
 */
export function RouteLandingPage({ view, locale, places, origin, reversePath = null, start, end }: Props) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const reverse = reversePath
    ? {
        href: `${localePrefix(locale)}/xe-khach/${reversePath}`,
        text: view.reverseRoute?.path === reversePath ? t("route.reverse_link", { label: view.reverseRoute.label }) : t("route.reverse_under_h1", { a: view.end, b: view.start }),
      }
    : null;
  const heroArt = ROUTE_HERO_ART[`${start}/${end}`];
  return (
    <>
      {routeJsonLd(view, { origin, locale, start, end }).map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <RouteHero view={view} locale={locale} art={heroArt} reverse={reverse}>
        <RouteSearchForm places={places} landing={`${start}/${end}`} />
      </RouteHero>
      <RouteSchedule view={view} locale={locale}>
        <RouteFareTable
          places={places}
          landing={`${start}/${end}`}
          classes={view.vehicleClasses.map((c) => ({ name: c.name, price_from: c.price_from }))}
          hours={view.runHours}
          title={t("route.fare_caption", { a: view.start, b: view.end })}
        />
        <RouteTripList places={places} landing={`${start}/${end}`} />
      </RouteSchedule>
      <RouteInfo view={view} locale={locale} />
      {heroArt ? <RouteStopMap locale={locale} /> : null}
      <RoutePlacesSection view={view} locale={locale} />
      <RouteFaqLinks view={view} locale={locale} />
      <RouteCta view={view} locale={locale} />
    </>
  );
}
