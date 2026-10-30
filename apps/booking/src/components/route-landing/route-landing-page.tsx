import { RouteFareTable } from "@/components/trips/route-fare-table";
import { RouteSearchForm, RouteTripList, type RoutePlaces } from "@/components/trips/route-trips";
import { localePrefix, translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { routeJsonLd } from "@/lib/route-schema";
import { JsonLd } from "./json-ld";
import { RouteCta } from "./route-cta";
import { RouteFaqLinks } from "./route-faq-links";
import { RouteHero } from "./route-hero";
import { isSouthRoute, ROUTE_HERO_ART, routeHeroPhoto } from "./route-art";
import { RouteAbout, RouteInfo } from "./route-info";
import { RoutePlaces as RoutePlacesSection } from "./route-places";
import { RouteSchedule } from "./route-schedule";
import { RouteStopMap } from "./route-stop-map";
import { RouteLounges, RouteProof, RouteReasons, RouteStops } from "./route-story";
import { formatMoney } from "@/lib/format";
import { classPrice, type RoutePrices } from "@/server/route-price";

interface Props {
  view: RouteLandingView;
  /** Giá hôm nay (chung + theo hạng xe) từ API danh sách chuyến; rỗng khi lỗi. */
  prices: RoutePrices;
  locale: Locale;
  places: RoutePlaces;
  origin: string;
  /** Slug `a/b` của trang chiều ngược lại (nút dưới H1), null = không có. */
  reversePath?: string | null;
  start: string;
  end: string;
}

/**
 * Landing tuyến (server), mạch như trang chủ: banner ảnh + thẻ tìm vé → giờ chạy & giá → vì sao chọn → hạng xe/tiện ích →
 * phòng chờ & quầy → danh bạ trạm → sơ đồ điểm dừng → bằng chứng (đánh giá, số liệu, câu chuyện) → khứ hồi → FAQ → tuyến liên quan →
 * cẩm nang tuyến → dải đặt vé (dải tải app nằm ở layout). Khối nào không có dữ liệu thì bỏ.
 */
export function RouteLandingPage({ view, prices, locale, places, origin, reversePath = null, start, end }: Props) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const reverse = reversePath
    ? {
        href: `${localePrefix(locale)}/xe-khach/${reversePath}`,
        text: view.reverseRoute?.path === reversePath ? t("route.reverse_link", { label: view.reverseRoute.label }) : t("route.reverse_under_h1", { a: view.end, b: view.start }),
      }
    : null;
  const heroArt = ROUTE_HERO_ART[`${start}/${end}`];
  const south = isSouthRoute(`${start}/${end}`);
  const priceOf = (name: string) => classPrice(prices, name);
  return (
    <>
      {routeJsonLd(view, { origin, locale, start, end }).map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <RouteHero view={view} locale={locale} photo={routeHeroPhoto(`${start}/${end}`)} reverse={reverse}>
        <RouteSearchForm places={places} landing={`${start}/${end}`} />
      </RouteHero>
      <RouteSchedule view={view} locale={locale}>
        <RouteFareTable
          places={places}
          landing={`${start}/${end}`}
          classes={view.vehicleClasses.map((c) => {
            const live = priceOf(c.name);
            return { name: c.name, price_from: live ? formatMoney(live) : null };
          })}
          hours={view.runHours}
          title={t("route.fare_caption", { a: view.start, b: view.end })}
        />
        <RouteTripList places={places} landing={`${start}/${end}`} />
      </RouteSchedule>
      <RouteReasons view={view} />
      <RouteInfo view={view} locale={locale} south={south} classPrice={priceOf} />
      <RouteLounges view={view} locale={locale} />
      <RouteStops view={view} locale={locale} />
      {heroArt ? <RouteStopMap locale={locale} /> : null}
      <RouteProof view={view} locale={locale} />
      <RoutePlacesSection view={view} locale={locale} />
      <RouteFaqLinks view={view} locale={locale} />
      <RouteAbout view={view} locale={locale} />
      <RouteCta view={view} locale={locale} />
    </>
  );
}
