"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useT } from "@/components/providers";
import { SeatPanel } from "@/components/seats/seat-panel";
import { useTripDetail } from "@/hooks/use-trips";
import type { SearchParamsData } from "@/lib/search-url";
import type { Trip } from "@/schemas/trip";

// Leaflet chỉ tải khi mở thẻ (không SSR).
const JourneyMap = dynamic(() => import("./journey-map").then((m) => m.JourneyMap), { ssr: false });

/** Phần mở rộng thẻ chuyến: ảnh xe, sơ đồ ghế + giữ chỗ, bản đồ lộ trình. */
export function TripExpanded({ trip, search }: { trip: Trip; search: SearchParamsData }) {
  const t = useT();
  const [guests, setGuests] = useState(search.numberGuest);
  const detail = useTripDetail(trip, guests, true);
  const images = trip.car_imgs ?? [];

  return (
    <div className="hv-trip-panel">
      {images.length ? (
        <div className="hv-photos4">
          {images.slice(0, 4).map((src, i) => (
            <figure key={src} className="hv-photo relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ CMS nhiều host */}
              <img src={src} width={544} height={363} alt={t("list_trip.vehicle_alt", { name: trip.product.name })} loading="lazy" />
              {i === 3 && images.length > 4 ? (
                <span className="absolute inset-0 grid place-items-center bg-scrim font-extrabold text-surface">
                  +{images.length - 4} {t("list_trip.other_images")}
                </span>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}
      {detail.isPending ? (
        <p role="status" className="py-8 text-center text-muted">{t("list_trip.msg.in_progress")}</p>
      ) : detail.isError ? (
        <p role="alert" className="hv-err justify-center py-8 text-16">{t("list_trip.seat_error")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <SeatPanel trip={trip} search={{ ...search, numberGuest: guests }} seatMap={detail.data.seats} numberGuest={guests} onGuestsChange={setGuests} />
          {detail.data.journey.length > 1 ? (
            <div className="hv-photo isolate z-(--z-base) hidden h-96 rounded-4 lg:block">
              <JourneyMap points={detail.data.journey} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
