"use client";

import { useMemo } from "react";
import { useBookingConfig } from "@/components/booking-config-provider";
import { SearchForm } from "@/components/search/search-form";
import { useToday } from "@/hooks/use-today";
import { corridorForLanding } from "@/lib/corridors";
import type { SearchParamsData, SearchPoint } from "@/lib/search-url";
import { TripList } from "./trip-list";

/** Hai đầu tuyến (toạ độ CMS) truyền từ server sang các khối client của trang tuyến. */
export interface RoutePlaces {
  from: SearchPoint;
  to: SearchPoint;
}

/** Ý định theo tuyến chính của trang tuyến `landing` ("a/b") nếu nó là landing của một tuyến chính; null → trang tuyến thường. */
function useLandingCorridor(landing?: string): SearchParamsData["corridor"] | undefined {
  const config = useBookingConfig();
  return useMemo(() => {
    const match = landing ? corridorForLanding(config, landing) : null;
    if (!match) return undefined;
    return { tuyen: match.corridor.id, chieu: match.chieu, diemDi: null, diemDen: null, ngayVe: null, chang: null, donDi: null, gio: null };
  }, [config, landing]);
}

/**
 * Form tìm vé của trang tuyến. Landing của một tuyến chính → ô theo tuyến, chọn sẵn tuyến + chiều của trang;
 * tuyến khác → điền sẵn đầu tuyến (không có tuyến → form trống, trang noindex như web cũ).
 */
export function RouteSearchForm({ places, landing }: { places?: RoutePlaces | null; landing?: string }) {
  const corridor = useLandingCorridor(landing);
  if (corridor) return <SearchForm mode="corridor" initial={{ numberGuest: 1, corridor }} todayChips />;
  return <SearchForm initial={places ? { from: places.from, to: places.to, numberGuest: 1 } : undefined} />;
}

/** Tìm chuyến của trang tuyến: hôm nay (giờ VN), 1 khách, không `type` — giống request web cũ; null khi chưa biết hôm nay (prerender). Landing của tuyến chính mang theo tuyến + chiều để thẻ chuyến hiện nhãn combo. */
export function useLandingSearch(places: RoutePlaces, landing?: string): SearchParamsData | null {
  const today = useToday();
  const corridor = useLandingCorridor(landing);
  return useMemo<SearchParamsData | null>(
    () => (today ? { ...places, date: today, numberGuest: 1, type: null, ...(corridor ? { corridor } : {}) } : null),
    [places, today, corridor],
  );
}

export function RouteTripList({ places, landing }: { places: RoutePlaces; landing?: string }) {
  const search = useLandingSearch(places, landing);
  if (!search) return null;
  return (
    <>
      <TripList search={search} />
      {/* Chỗ đệm cho thanh tổng cố định đáy khi một chuyến đang mở (cao 0 nếu không có thanh). */}
    </>
  );
}
