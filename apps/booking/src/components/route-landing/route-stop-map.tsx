import Image from "next/image";
import { translate, type Locale } from "@/i18n/t";
import { artAlt, ROUTE_STOP_MAP } from "./route-art";

/** Sơ đồ điểm dừng thật trên nền ink (chỉ tuyến Tây Bắc có sơ đồ); cuộn ngang được trên điện thoại. */
export function RouteStopMap({ locale }: { locale: Locale }) {
  const a = ROUTE_STOP_MAP;
  return (
    <section aria-labelledby="route-stops" className="hv-section hv-section-dark">
      <div className="hv-container">
        <div className="hv-head-block">
          <h2 id="route-stops">{translate(locale, "route.stops_title")}</h2>
        </div>
        <div className="hv-map-wrap" tabIndex={0} role="region" aria-label={translate(locale, "route.stops_title")}>
          <Image src={a.src} alt={artAlt(a, locale)} width={a.width} height={a.height} unoptimized loading="lazy" />
        </div>
      </div>
    </section>
  );
}
