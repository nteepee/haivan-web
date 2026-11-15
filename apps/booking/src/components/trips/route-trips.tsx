"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useBookingConfig } from "@/components/booking-config-provider";
import { SearchForm } from "@/components/search/search-form";
import { useToday } from "@/hooks/use-today";
import { corridorForLanding, corridorForRouteForm } from "@/lib/corridors";
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
export function RouteSearchForm({ places, landing, swapHref = null }: { places?: RoutePlaces | null; landing?: string; swapHref?: string | null }) {
  const config = useBookingConfig();
  // Ô tìm vé khoá theo tuyến cả với trang sân bay (thuộc tuyến Sài Gòn – Vũng Tàu, trạm sân bay chọn sẵn); danh sách chuyến vẫn theo đúng hai đầu của trang.
  const match = useMemo(() => (landing ? corridorForRouteForm(config, landing) : null), [config, landing]);
  if (!match) return <SearchForm initial={places ? { from: places.from, to: places.to, numberGuest: 1 } : undefined} />;
  const base: LockedFormInit = { tuyen: match.corridor.id, chieu: match.chieu, diemDi: match.diemDi, diemDen: match.diemDen };
  // Query chỉ đọc được ở trình duyệt (trang dựng sẵn): bản dựng sẵn là form mặc định, có query thì form điền lại theo query.
  return (
    <Suspense fallback={<LockedForm base={base} swapHref={swapHref} />}>
      <LockedFormFromQuery base={base} swapHref={swapHref} />
    </Suspense>
  );
}

type LockedFormInit = Pick<NonNullable<SearchParamsData["corridor"]>, "tuyen" | "chieu" | "diemDi" | "diemDen">;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function LockedForm({ base, swapHref, date, guests = 1, ngayVe = null }: { base: LockedFormInit; swapHref: string | null; date?: string; guests?: number; ngayVe?: string | null }) {
  const corridor = { ...base, ngayVe, chang: null, donDi: null, gio: null };
  return <SearchForm mode="corridor" initial={{ date, numberGuest: guests, corridor }} todayChips lockCorridor swapHref={swapHref} />;
}

/**
 * Nhận ngày đi, số vé, ngày về, trạm từ trang chiều ngược lại (nút "Đổi chiều"). Giá trị sai dạng bị bỏ;
 * ngày được form kẹp vào khoảng mở bán, trạm lạ về trạm mặc định (`stopsFromParams`).
 */
function LockedFormFromQuery({ base, swapHref }: { base: LockedFormInit; swapHref: string | null }) {
  const q = useSearchParams();
  const date = q.get("ngay") ?? "";
  const ngayVe = q.get("ngay_ve") ?? "";
  const guests = Number.parseInt(q.get("khach") ?? "", 10);
  return (
    <LockedForm
      key={q.toString()}
      base={{ ...base, diemDi: q.get("diem_di") || base.diemDi, diemDen: q.get("diem_den") || base.diemDen }}
      swapHref={swapHref}
      date={ISO_DATE.test(date) ? date : undefined}
      guests={guests >= 1 && guests <= 99 ? guests : 1}
      ngayVe={ISO_DATE.test(ngayVe) ? ngayVe : null}
    />
  );
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
      <TripList search={search} legTitle={`${places.from.name} - ${places.to.name}`} />
      {/* Chỗ đệm cho thanh tổng cố định đáy khi một chuyến đang mở (cao 0 nếu không có thanh). */}
    </>
  );
}
