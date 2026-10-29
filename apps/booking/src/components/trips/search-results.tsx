"use client";

import { Calendar, Flag, MapPin, Users, type LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/components/providers";
import { SearchForm } from "@/components/search/search-form";
import { Stepper } from "@/components/ui/stepper";
import { useTrips } from "@/hooks/use-trips";
import { SUMMARY_SLOT_ID } from "@/components/seats/seat-panel";
import { parseSearchWithCorridor, type SearchParamsData } from "@/lib/search-url";
import { TripList } from "./trip-list";

const shortName = (name: string) => name.split("(")[0].trim();

/** Dải tóm tắt tìm kiếm v3: thẻ trắng nổi trên dải vàng (nhãn như form web cũ: Điểm xuất phát, Điểm đến, Ngày đi, Số người) + nút "Sửa" mở lại form. */
function SummaryStrip({ search, onEdit, editing }: { search: SearchParamsData; onEdit: () => void; editing: boolean }) {
  const t = useT();
  const locale = useLocale();
  const date = new Date(`${search.date}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "vi-VN", { timeZone: "UTC" });
  const facts: { label: string; value: string; Icon: LucideIcon }[] = [
    { label: t("search.from"), value: shortName(search.from.name), Icon: MapPin },
    { label: t("search.to"), value: shortName(search.to.name), Icon: Flag },
    { label: t("search.departure_date"), value: date, Icon: Calendar },
    { label: t("search.number_of_people"), value: String(search.numberGuest), Icon: Users },
  ];
  return (
    <div className="hv-edit-row">
      <dl>
        {facts.map((f) => (
          <div key={f.label}>
            <f.Icon className="size-icon shrink-0 text-muted" aria-hidden />
            <div>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <button type="button" className="hv-btn hv-btn-ghost hv-btn-sm" aria-expanded={editing} onClick={onEdit}>
        {t("list_trip.edit")}
      </button>
    </div>
  );
}

/** /xe-khach/tim-chuyen: bước, tiêu đề + số chuyến thật, dải "Sửa", danh sách chuyến, cột phải giữ thẻ tổng của sơ đồ ghế. */
export function SearchResults() {
  const t = useT();
  const params = useSearchParams();
  const search = parseSearchWithCorridor(params);
  const key = params.toString();
  const [editing, setEditing] = useState(false);
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
          {search ? (
            <>
              <SummaryStrip search={search} editing={editing} onEdit={() => setEditing((v) => !v)} />
              {editing ? (
                <div className="mt-4">
                  <SearchForm key={key} initial={search} />
                </div>
              ) : null}
            </>
          ) : (
            <SearchForm key={key} />
          )}
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
