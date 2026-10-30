import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { translate, localePrefix, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { artAlt, WAITING_ROOM_ART } from "./route-art";
import { SectionCard } from "./section-card";

/** Ảnh phòng chờ Hà Nội chỉ đi cùng điểm đón/văn phòng thật sự là phòng chờ đó (01 Nguyễn Hoàng). */
const hasWaitingRoom = (view: RouteLandingView) =>
  [...view.pickupPoints, ...view.offices].some((p) => /phòng chờ|nguyễn hoàng/i.test(`${p.name} ${p.address}`));

/** Điểm đón trả (khi chưa có danh bạ trạm) và ghi chú khứ hồi; văn phòng/phòng chờ nằm ở `RouteLounges`. */
export function RoutePlaces({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const p = localePrefix(locale);
  return (
    <>
      {view.pickupPoints.length && !view.stops.length ? (
        <SectionCard id="route-pickup" eyebrow={t("route.stops_eyebrow")} title={t("route.pickup_title")}>
          <div className={hasWaitingRoom(view) ? "hv-two" : undefined}>
            <ul className="hv-addrs">
              {view.pickupPoints.map((pt) => (
                <li key={`${pt.name}-${pt.address}`} className="hv-addr">
                  <MapPin className="mt-1 size-icon" aria-hidden />
                  <div>
                    <h3 className="text-16">{pt.name}</h3>
                    <p>{pt.address}</p>
                    {pt.note ? <p>{pt.note}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
            {hasWaitingRoom(view) ? (
              <ul className="hv-mosaic">
                {WAITING_ROOM_ART.map((a) => (
                  <li key={a.src} className="hv-photo">
                    <Image src={a.src} alt={artAlt(a, locale)} width={a.width} height={a.height} unoptimized loading="lazy" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
      {view.roundTripNote ? (
        <SectionCard id="route-round-trip" eyebrow={t("route.round_trip_eyebrow")} title={t("route.round_trip_title")}>
          <p className="max-w-[68ch] text-18">{view.roundTripNote}</p>
          {view.reverseRoute ? (
            <Link href={`${p}/xe-khach/${view.reverseRoute.path}`} className="hv-btn hv-btn-outline mt-4">
              {t("route.reverse_link", { label: view.reverseRoute.label })}
            </Link>
          ) : null}
        </SectionCard>
      ) : null}
    </>
  );
}
