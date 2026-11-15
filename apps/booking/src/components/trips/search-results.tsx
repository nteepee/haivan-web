"use client";

import { useSearchParams } from "next/navigation";
import { useT } from "@/components/providers";
import { SearchForm } from "@/components/search/search-form";
import { Stepper } from "@/components/ui/stepper";
import { useTrips } from "@/hooks/use-trips";
import { SUMMARY_SLOT_ID } from "@/components/seats/seat-panel";
import { parseSearchWithCorridor } from "@/lib/search-url";
import { TripList } from "./trip-list";

const shortName = (name: string) => name.split("(")[0].trim();

/** /xe-khach/tim-chuyen: bước, tiêu đề + số chuyến thật, thanh tìm vé luôn mở (không còn dải tóm tắt + nút "Sửa"), danh sách chuyến, cột phải giữ thẻ tổng của sơ đồ ghế. */
export function SearchResults() {
  const t = useT();
  const params = useSearchParams();
  const search = parseSearchWithCorridor(params);
  const key = params.toString();
  const total = useTrips(search).data?.pages[0]?.meta?.total;

  return (
    <>
      <section className="hv-rs-top">
        <div className="hv-container">
          <Stepper current={1} />
          <div className="hv-page-title">
            <h1>{search ? `${t("list_trip.bus")} ${shortName(search.from.name)} - ${shortName(search.to.name)}` : t("list_trip.bus")}</h1>
            {search && total !== undefined ? <p>{t("list_trip.count", { n: total, date: search.date.split("-").reverse().join("/") })}</p> : null}
          </div>
          {search?.corridor?.chang === "ve" && search.corridor.donDi ? (
            <p role="note" className="hv-notice mb-4">
              {t("corridor.return_leg_notice", { code: search.corridor.donDi })}
            </p>
          ) : null}
          {search ? <SearchForm key={key} initial={search} bar /> : <SearchForm key={key} />}
        </div>
      </section>
      {search ? (
        <div className="hv-container hv-app-main">
          <div className="hv-results-grid">
            <section aria-labelledby="trip-list-heading">
              <h2 id="trip-list-heading" className="sr-only">
                {t("list_trip.list_label")}
              </h2>
              <TripList key={key} search={search} />
            </section>
            <aside aria-label={t("list_trip.summary_label")} className="hv-results-aside">
              <div id={SUMMARY_SLOT_ID} className="hv-summary-slot" />
              <p className="hv-card hv-summary-hint p-card text-muted">{t("list_trip.seat_hint_summary")}</p>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
