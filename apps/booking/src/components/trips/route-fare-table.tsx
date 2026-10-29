"use client";

import { useLocale, useT } from "@/components/providers";
import { useTrips } from "@/hooks/use-trips";
import { buildFareRows, type WpClass } from "@/lib/fare-rows";
import { formatMoney } from "@/lib/format";
import { useLandingSearch, type RoutePlaces } from "./route-trips";

const MAX_TIMES = 10;

/**
 * Bảng HTML "Hạng xe | Giờ xuất bến | Thời gian | Giá từ" của trang tuyến (đoạn trích bảng của Google). Chỉ dữ liệu thật:
 * lúc prerender là hạng xe + giá từ bài WP (+ giờ chạy CMS); sau khi chuyến apigw hôm nay tải xong thì thêm cột giờ xuất bến và thời gian
 * theo chuyến. Không có dòng nào thì không vẽ bảng.
 */
export function RouteFareTable({ places, landing, classes, hours, title }: { places: RoutePlaces; landing?: string; classes: WpClass[]; hours: string | null; title: string }) {
  const t = useT();
  const locale = useLocale();
  const search = useLandingSearch(places, landing);
  const trips = useTrips(search);
  const loaded = trips.data?.pages.flatMap((p) => p.data) ?? [];
  const complete = !!trips.data && !trips.hasNextPage;
  const rows = buildFareRows(classes, loaded, { complete, hours });
  if (!rows.length) return null;
  const withTimes = rows.some((r) => r.times.length > 0);
  const priceCell = (r: (typeof rows)[number]) => (r.minPrice !== null ? formatMoney(r.minPrice) : (r.priceLabel ?? "—"));
  const timeCell = (r: (typeof rows)[number]) => {
    if (!r.times.length) return "—";
    if (r.timesPartial) return t("route.fare_from_time", { time: r.times[0] });
    return r.times.length > MAX_TIMES ? `${r.times.slice(0, MAX_TIMES).join(", ")} …` : r.times.join(", ");
  };
  return (
    <div className="hv-fare-wrap" lang={locale}>
      <table className="hv-fare-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{t("route.fare_col_class")}</th>
            {withTimes ? <th scope="col">{t("route.fare_col_times")}</th> : null}
            <th scope="col">{t("route.fare_col_duration")}</th>
            <th scope="col">{t("route.fare_col_price")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">{r.name}</th>
              {withTimes ? <td className="hv-tabular">{timeCell(r)}</td> : null}
              <td className="hv-tabular">{r.duration ?? "—"}</td>
              <td className="hv-tabular">{priceCell(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
