"use client";

import { ArrowLeftRight, Bus, Car, CarTaxiFront, Minus, Plus, PlaneTakeoff, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useBookingConfig } from "@/components/booking-config-provider";
import { useLocale, useT } from "@/components/providers";
import { localePrefix } from "@/i18n/t";
import { useToday } from "@/hooks/use-today";
import { addDaysIso } from "@/lib/format";
import { buildSearchUrl, type SearchParamsData, type SearchPoint } from "@/lib/search-url";
import { CorridorForm } from "./corridor-form";
import { PlacePicker } from "./place-picker";

/**
 * Dải loại hình (Xe liên tỉnh / Xe sân bay / Xe hợp đồng / Xe du lịch) tạm ẩn theo chủ dự án: chỉ còn xe liên tỉnh nên cả dải ẩn.
 * Bật lại: đổi thành `true` (trang /xe-san-bay là WordPress, không bị ảnh hưởng).
 */
export const SHOW_SERVICE_TABS = false;

const TABS: readonly { key: string; href: string | null; Icon: LucideIcon }[] = [
  { key: "search.intercity_bus", href: null, Icon: Bus },
  { key: "search.airport_transfers_bus", href: "/xe-san-bay", Icon: PlaneTakeoff },
  { key: "search.airport_transfers_taxi", href: "/dich-vu/xe-hop-dong/phuong-tien", Icon: CarTaxiFront },
  { key: "search.rental_cars", href: "/dich-vu/xe-hop-dong/phuong-tien", Icon: Car },
];

/** +4 tháng như DatePicker web cũ. */
function maxDate(today: string) {
  if (!today) return undefined; // prerender: chưa biết ngày
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 4);
  return d.toISOString().slice(0, 10);
}

interface Props {
  initial?: Partial<SearchParamsData>;
  glass?: boolean;
  /** "corridor": ô theo 4 tuyến chính (mặc định khi `initial.corridor` có); "free": chọn điểm đi/đến tự do. Không có tuyến nào trong cấu hình → luôn "free". */
  mode?: "corridor" | "free";
  /** Hàng "Chuyến hôm nay" dưới thẻ (chế độ tuyến). */
  todayChips?: boolean;
}

/**
 * Ô tìm vé: chế độ tuyến chính (`CorridorForm`) hoặc chọn điểm tự do (`FreeSearchForm`), đổi qua lại bằng liên kết cuối thẻ.
 * Chế độ tự do giữ nguyên hành vi cũ.
 */
export function SearchForm({ initial, glass = false, mode, todayChips = false }: Props) {
  const { corridors } = useBookingConfig();
  const entry = corridors.length ? (mode ?? (initial?.corridor ? "corridor" : "free")) : "free";
  const [current, setCurrent] = useState(entry);
  if (current === "corridor" && corridors.length) {
    return (
      <CorridorForm
        init={initial?.corridor}
        date={initial?.date}
        guests={initial?.numberGuest}
        type={initial?.type ?? 2}
        glass={glass}
        todayChips={todayChips}
        onFree={() => setCurrent("free")}
      />
    );
  }
  return <FreeSearchForm initial={initial} glass={glass} onCorridor={entry === "corridor" ? () => setCurrent("corridor") : undefined} />;
}

/**
 * Thẻ tìm vé nổi v4 (r-3, không viền, tab phân đoạn xám có icon, ô 48px). Form tìm vé xe liên tỉnh (tab "Xe liên tỉnh" → type=2 như web cũ).
 * Thiếu điểm: toast như web cũ + lỗi dưới ô và focus ô sai. `glass`: chỉ bật khi thẻ nổi trên ảnh; trên nền vàng phẳng dùng nền đặc.
 */
function FreeSearchForm({ initial, glass, onCorridor }: { initial?: Partial<SearchParamsData>; glass: boolean; onCorridor?: () => void }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const today = useToday();
  const [from, setFrom] = useState<SearchPoint | null>(initial?.from ?? null);
  const [to, setTo] = useState<SearchPoint | null>(initial?.to ?? null);
  // Ngày người dùng chọn. Như DatePicker web cũ: cho chọn từ hôm qua (now−1); chưa chọn hoặc sớm hơn nữa → hôm nay.
  const [picked, setDate] = useState(initial?.date ?? "");
  const minDate = addDaysIso(today, -1);
  const date = picked && picked >= minDate ? picked : today;
  const [guests, setGuests] = useState(initial?.numberGuest ?? 1);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const ids = useId();

  const submit = () => {
    const next = {
      from: from ? undefined : t("search.place_holder.pls_select_from"),
      to: to ? undefined : t("search.place_holder.pls_select_to"),
    };
    setErrors(next);
    if (!from || !to) {
      toast.warning(next.from ?? next.to ?? "");
      (from ? toRef : fromRef).current?.focus();
      return;
    }
    router.push(buildSearchUrl({ from, to, date, numberGuest: Math.max(1, guests), type: initial?.type ?? 2 }, localePrefix(locale)));
  };

  const guestsId = `${ids}-guests`;
  return (
    <section className={glass ? "hv-plate glass" : "hv-plate hv-plate-solid"} aria-label={t("search.searching_tickets")}>
      {/* Loại hình là liên kết sang trang khác (không phải tab đổi panel): <nav> với liên kết thường, trang hiện tại aria-current. */}
      {SHOW_SERVICE_TABS ? (
      <nav className="hv-tabs" aria-label={t("search.tab_label")}>
        {TABS.map((tab) =>
          tab.href ? (
            <a key={tab.key} href={localePrefix(locale) + tab.href} className="hv-tab">
              <tab.Icon className="size-icon shrink-0" aria-hidden />
              {t(tab.key)}
            </a>
          ) : (
            <span key={tab.key} aria-current="page" className="hv-tab">
              <tab.Icon className="size-icon shrink-0" aria-hidden />
              {t(tab.key)}
            </span>
          ),
        )}
      </nav>
      ) : null}
      <form
        noValidate
        className="hv-plate-grid"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <PlacePicker
          key={`from-${from?.name ?? ""}`}
          label={t("search.from")}
          placeholder={t("search.place_holder.pls_select_from")}
          value={from}
          error={errors.from}
          inputRef={fromRef}
          onChange={(p) => {
            setFrom(p);
            setErrors((e) => ({ ...e, from: undefined }));
          }}
        />
        <button
          type="button"
          aria-label={t("ux.swap_places")}
          disabled={!from || !to}
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="hv-swap"
        >
          <ArrowLeftRight className="size-icon rotate-90 sm:rotate-0" aria-hidden />
        </button>
        <PlacePicker
          key={`to-${to?.name ?? ""}`}
          label={t("search.to")}
          placeholder={t("search.place_holder.pls_select_to")}
          value={to}
          error={errors.to}
          inputRef={toRef}
          onChange={(p) => {
            setTo(p);
            setErrors((e) => ({ ...e, to: undefined }));
          }}
        />
        <label className="block min-w-0 sm:col-start-1 lg:col-start-auto">
          <span className="hv-label">{t("search.departure_date")}</span>
          <input type="date" value={date} min={minDate || undefined} max={maxDate(today)} onChange={(e) => setDate(e.target.value || today)} className="hv-field tabular-nums" />
        </label>
        <div role="group" aria-labelledby={`${guestsId}-label`} className="min-w-0 sm:col-start-3 lg:col-start-auto">
          <label id={`${guestsId}-label`} htmlFor={`${guestsId}-input`} className="hv-label">
            {t("search.number_of_people")}
          </label>
          <div className="hv-counter">
            <button type="button" aria-label={t("ux.guests_decrease")} disabled={guests <= 1} onClick={() => setGuests((g) => Math.max(1, g - 1))}>
              <Minus className="size-icon" aria-hidden />
            </button>
            <input
              id={`${guestsId}-input`}
              type="number"
              inputMode="numeric"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Math.max(0, Number(e.target.value) || 0))}
              onBlur={() => setGuests((g) => Math.max(1, g))}
            />
            <button type="button" aria-label={t("ux.guests_increase")} onClick={() => setGuests((g) => Math.max(1, g) + 1)}>
              <Plus className="size-icon" aria-hidden />
            </button>
          </div>
        </div>
        <button type="submit" className="hv-btn hv-btn-primary hv-plate-go sm:col-span-3 lg:col-span-1">
          {t("search.searching_tickets")}
        </button>
      </form>
      {onCorridor ? (
        <p className="hv-plate-foot">
          <button type="button" className="hv-link" onClick={onCorridor}>
            {t("corridor.back_to_corridors")}
          </button>
        </p>
      ) : null}
    </section>
  );
}
