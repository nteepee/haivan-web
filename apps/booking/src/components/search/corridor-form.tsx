"use client";

import { ArrowLeftRight, ArrowRight, ChevronDown, MapPin, Minus, Plus, X } from "lucide-react";
import { openDatePicker } from "@/lib/open-date-picker";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useBookingConfig } from "@/components/booking-config-provider";
import { useLocale, useT } from "@/components/providers";
import { localePrefix } from "@/i18n/t";
import { useToday } from "@/hooks/use-today";
import { formatDateLabel } from "@/lib/format";
import {
  clampDate,
  corridorSearchPoints,
  defaultReturnDate,
  defaultStops,
  endsFor,
  localized,
  maxTravelDate,
  returnBounds,
  reverseChieu,
  stopsFor,
  stopsFromParams,
  stopsToParams,
  type StopPick,
} from "@/lib/corridors";
import { promoLabel, roundtripPromoForOutbound } from "@/lib/promo-match";
import { roundtripRuleForOutbound } from "@/lib/rule-offers";
import { appendCorridorParams, buildSearchUrl, type CorridorParams } from "@/lib/search-url";
import type { Corridor, CorridorDirection, CorridorStop } from "@/schemas/booking-config";
import { MAX_SEATS } from "@/lib/seats";
import { track } from "@/lib/track";
import { GroupCallNote } from "./group-call-note";
import { TodayTrips } from "./today-trips";

interface Props {
  /** Chọn sẵn từ URL/landing; thiếu hoặc không khớp cấu hình → tuyến đầu tiên, trạm mặc định. */
  init?: Partial<CorridorParams>;
  date?: string;
  guests?: number;
  /** `type` của link tìm chuyến (2 = xe liên tỉnh như web cũ). */
  type: number;
  glass: boolean;
  /** Thanh tìm vé gọn (trang kết quả), xem `plateClass`. */
  bar?: boolean;
  /** Hiện hàng "Chuyến hôm nay" dưới thẻ. */
  todayChips: boolean;
  /** Trang tuyến: khoá đúng tuyến của trang, ẩn 4 nút chọn tuyến (khách đang xem Vũng Tàu không thấy Điện Biên, Mộc Châu, Sơn La). */
  lockCorridor?: boolean;
  /**
   * Trang tuyến có trang chiều ngược lại: bấm "Đổi chiều" sang trang đó (như booking.haivan.com), mang theo ngày đi, số vé,
   * ngày về và trạm (đổi vai đón/trả) trên query `ngay`, `khach`, `ngay_ve`, `diem_di`, `diem_den`; mở thẳng ở thẻ tìm vé.
   */
  swapHref?: string | null;
}

function StopSelect({ id, label, stops, value, onChange }: { id: string; label: string; stops: CorridorStop[]; value: string; onChange: (id: string) => void }) {
  const locale = useLocale();
  const picked = stops.find((s) => s.id === value);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="hv-label">
        {label}
      </label>
      <div className="hv-selectbox hv-selectbox-pin">
        <MapPin className="hv-pin size-icon" aria-hidden />
        {/* title: tên trạm đầy đủ khi ô hẹp (thanh tìm vé) phải cắt "…". */}
        <select id={id} value={value} title={picked ? localized(picked, locale) : undefined} onChange={(e) => onChange(e.target.value)} className="hv-field">
          {stops.map((s) => (
            <option key={s.id} value={s.id}>
              {localized(s, locale)}
            </option>
          ))}
        </select>
        <ChevronDown className="hv-chev size-icon" aria-hidden />
      </div>
    </div>
  );
}

/** Ô ngày: input date gốc (chọn ngày, bàn phím) với chữ gốc ẩn; nhãn kiểu Việt/Anh phủ lên ("Thứ năm, 29/10/2026" / "Thu, 29 Oct 2026"). */
function DateField({ id, value, min, max, onChange }: { id: string; value: string; min?: string; max?: string; onChange: (iso: string) => void }) {
  const locale = useLocale();
  return (
    <div className="hv-datebox">
      <input id={id} type="date" value={value} min={min || undefined} max={max || undefined} onChange={(e) => onChange(e.target.value)} onClick={openDatePicker} className="hv-field tabular-nums" />
      <span className="hv-datebox-text" aria-hidden>
        {formatDateLabel(value, locale)}
      </span>
    </div>
  );
}

/**
 * Ô tìm vé theo tuyến chính (wireframe v2): 4 nút tuyến, Điểm đi ⇄ Điểm đến là trạm thật của tuyến theo chiều,
 * Ngày đi, "+ Thêm ngày về" (khứ hồi = 2 đơn liên tiếp, ngày về chỉ là ý định), Số vé, "Tìm vé".
 * Link tìm chuyến = `buildSearchUrl` (đầu tuyến hoặc toạ độ trạm) + query riêng của trang mình.
 */
/** Lớp của thẻ tìm vé: kính khi nổi trên ảnh, nền đặc trên nền phẳng; `bar` = thanh gọn luôn mở ở đầu trang kết quả (hv-corridor.css). */
export function plateClass(glass: boolean, bar = false) {
  return `${glass ? "hv-plate glass" : "hv-plate hv-plate-solid"}${bar ? " hv-plate--bar" : ""}`;
}

export function CorridorForm({ init, date: initialDate, guests: initialGuests, type, glass, bar = false, todayChips, lockCorridor = false, swapHref = null }: Props) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const today = useToday();
  const config = useBookingConfig();
  const { corridors } = config;
  const ids = useId();

  const initCorridor = corridors.find((c) => c.id === init?.tuyen) ?? corridors[0];
  const [corridorId, setCorridorId] = useState(initCorridor.id);
  const [chieu, setChieu] = useState<CorridorDirection>(init?.chieu ?? "ab");
  const [picks, setPicks] = useState<StopPick>(() => stopsFromParams(initCorridor, init?.chieu ?? "ab", init?.diemDi ?? null, init?.diemDen ?? null));
  const [pickedDate, setPickedDate] = useState(initialDate ?? "");
  // Sửa lại một tìm kiếm có ngày về (query `ngay_ve`) thì ô ngày về mở sẵn; chặng về (chang=ve) thì không.
  const [returnOn, setReturnOn] = useState(!!init?.ngayVe && init.chang !== "ve");
  const [returnPicked, setReturnPicked] = useState(init?.ngayVe ?? "");
  const [picked, setGuests] = useState(Math.max(1, initialGuests ?? 1));
  const overMax = picked > MAX_SEATS;
  const guests = Math.min(Math.max(1, picked), MAX_SEATS);

  const corridor: Corridor = corridors.find((c) => c.id === corridorId) ?? initCorridor;
  const minDate = today;
  const maxDate = maxTravelDate(today, corridor);
  const date = pickedDate && pickedDate >= minDate ? clampDate(pickedDate, minDate, maxDate) : today;

  // Chặng về (đã đi chiều đi, đang tìm chiều về): không đặt tiếp khứ hồi, giữ chang/don_di khi tìm lại cùng tuyến + chiều.
  const sameLeg = init?.chang === "ve" && corridor.id === init.tuyen && chieu === init.chieu;
  const bounds = returnBounds(corridor, date, today);
  const returnDate = returnOn ? clampDate(returnPicked, bounds.min, bounds.max) : null;
  // today === "" khi prerender (chưa biết giờ): không đánh giá chương trình — đọc Date.now() lúc prerender làm cả khối nội dung bị bỏ khỏi HTML.
  const roundtrip = sameLeg || !today ? null : (roundtripPromoForOutbound(config, corridor.id, chieu, { returnDate, range: bounds, seatCount: guests }) ?? roundtripRuleForOutbound(config, corridor.id, chieu));

  const ends = endsFor(corridor, chieu);
  const stops = stopsFor(corridor, chieu);
  const stopIds = stopsToParams(chieu, picks);
  const points = corridorSearchPoints(corridor, chieu, picks);
  // Ghi chú trạm chỉ có tiếng Việt (WP): bản en không hiện, tên trạm en đã đủ ý.
  const notes = locale !== "vi" ? [] : [stops.from.find((s) => s.id === stopIds.diemDi)?.note, stops.to.find((s) => s.id === stopIds.diemDen)?.note].filter((n): n is string => !!n);

  const pickCorridor = (next: Corridor) => {
    setCorridorId(next.id);
    setChieu("ab");
    setPicks(defaultStops(next));
  };
  const ownParams = (gio: CorridorParams["gio"] = null): CorridorParams => ({
    tuyen: corridor.id,
    chieu,
    diemDi: stopIds.diemDi,
    diemDen: stopIds.diemDen,
    ngayVe: returnDate,
    chang: sameLeg ? "ve" : null,
    donDi: sameLeg ? (init?.donDi ?? null) : null,
    gio,
  });
  const urlFor = (searchDate: string, searchGuests: number, own: CorridorParams) =>
    appendCorridorParams(buildSearchUrl({ ...points, date: searchDate, numberGuest: searchGuests, type }, localePrefix(locale)), own);

  const swap = () => {
    if (!lockCorridor || !swapHref) return setChieu(reverseChieu(chieu));
    const back = stopsToParams(reverseChieu(chieu), picks);
    const q = new URLSearchParams();
    if (pickedDate) q.set("ngay", date);
    if (picked > 1) q.set("khach", String(picked));
    if (returnDate) q.set("ngay_ve", returnDate);
    q.set("diem_di", back.diemDi);
    q.set("diem_den", back.diemDen);
    router.push(`${swapHref}?${q}#tim-ve`);
  };

  const submit = () => {
    if (!date || overMax) return;
    track("search_trip", { date, guests, target: `${corridor.id}:${chieu}` });
    router.push(urlFor(date, guests, ownParams()));
  };

  const dateId = `${ids}-date`;
  const returnId = `${ids}-return`;
  return (
    <>
      <section className={plateClass(glass, bar)} aria-label={t("search.searching_tickets")}>
        {lockCorridor ? null : (
        <div className="hv-corr-btns" role="group" aria-label={t("corridor.label")}>
          {corridors.map((c) => (
            // Tên truy cập = nhãn đầy đủ; bên trong có hai bản hiển thị (điện thoại: hai dòng từ hai đầu tuyến; từ 40rem: một dòng nhãn đầy đủ).
            <button key={c.id} type="button" className="hv-corr-btn" aria-pressed={c.id === corridor.id} aria-label={localized(c.label, locale)} onClick={() => pickCorridor(c)}>
              <span className="hv-corr-full" aria-hidden>
                {localized(c.label, locale)}
              </span>
              <span className="hv-corr-ends" aria-hidden>
                <span className="hv-corr-a">{localized(c.ends.a, locale)}</span>
                <span className="hv-corr-b">
                  <ArrowRight className="size-icon shrink-0" aria-hidden />
                  {localized(c.ends.b, locale)}
                </span>
              </span>
            </button>
          ))}
        </div>
        )}
        <form
          noValidate
          className="hv-plate-grid hv-corr-grid"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="hv-corr-from">
            <StopSelect
              id={`${ids}-from`}
              label={t("corridor.from")}
              stops={stops.from}
              value={stopIds.diemDi}
              onChange={(id) => setPicks((p) => (chieu === "ab" ? { ...p, a: id } : { ...p, b: id }))}
            />
          </div>
          <button type="button" aria-label={t("ux.swap_places")} onClick={swap} className="hv-swap hv-corr-swap">
            <ArrowLeftRight className="size-icon rotate-90 sm:rotate-0" aria-hidden />
          </button>
          <div className="hv-corr-to">
            <StopSelect
              id={`${ids}-to`}
              label={t("corridor.to")}
              stops={stops.to}
              value={stopIds.diemDen}
              onChange={(id) => setPicks((p) => (chieu === "ab" ? { ...p, b: id } : { ...p, a: id }))}
            />
          </div>
          {notes.length ? (
            <p className="hv-corr-note" role="note">
              {notes.map((n) => t("corridor.stop_note", { note: n })).join(" · ")}
            </p>
          ) : null}
          <div className="hv-corr-row">
            <div className="min-w-0">
              <label htmlFor={dateId} className="hv-label">
                {t("search.departure_date")}
              </label>
              <DateField id={dateId} value={date} min={minDate} max={maxDate} onChange={(v) => setPickedDate(v || today)} />
            </div>
            {sameLeg ? null : (
              <div className="min-w-0">
                <div className="hv-label hv-label-row">
                  <label htmlFor={returnDate ? returnId : undefined}>{t("corridor.return_date")}</label>
                  {roundtrip ? <span className="hv-badge hv-badge-offer">{promoLabel(roundtrip, locale)}</span> : null}
                </div>
                {returnDate ? (
                  <div className="hv-return-field">
                    <DateField id={returnId} value={returnDate} min={bounds.min} max={bounds.max} onChange={(v) => setReturnPicked(v || bounds.min)} />
                    <button type="button" className="hv-return-clear" aria-label={t("corridor.remove_return")} onClick={() => setReturnOn(false)}>
                      <X className="size-icon" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="hv-return-add"
                    disabled={!today}
                    onClick={() => {
                      setReturnPicked(defaultReturnDate(corridor, date, today));
                      setReturnOn(true);
                    }}
                  >
                    <Plus className="size-icon" aria-hidden />
                    {t("corridor.add_return")}
                  </button>
                )}
              </div>
            )}
            <div className="hv-corr-last">
              <div className="min-w-0">
                <label htmlFor={`${ids}-guests`} className="hv-label">
                  {t("corridor.tickets")}
                </label>
                <div className="hv-counter">
                  <button type="button" aria-label={t("ux.guests_decrease")} disabled={picked <= 1} onClick={() => setGuests((g) => Math.max(1, g - 1))}>
                    <Minus className="size-icon" aria-hidden />
                  </button>
                  {/* Gõ được số bất kỳ (đoàn đông); mỗi đơn tối đa MAX_SEATS vé nên trên mức đó hiện số tổng đài cho đoàn. */}
                  <input
                    id={`${ids}-guests`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    aria-describedby={overMax ? `${ids}-group` : undefined}
                    value={picked || ""}
                    onChange={(e) => setGuests(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
                    onBlur={() => setGuests((g) => Math.max(1, g))}
                    className="tabular-nums"
                  />
                  <button type="button" aria-label={t("ux.guests_increase")} onClick={() => setGuests((g) => Math.max(1, g) + 1)}>
                    <Plus className="size-icon" aria-hidden />
                  </button>
                </div>
              </div>
              <button type="submit" className="hv-btn hv-btn-primary hv-corr-go">
                {t("search.searching_tickets")}
              </button>
            </div>
          </div>
          {overMax ? <GroupCallNote id={`${ids}-group`} /> : null}
        </form>
        {todayChips ? (
          <TodayTrips
            label={t("corridor.today_label")}
            route={t("corridor.today_route", { from: localized(ends.from, locale), to: localized(ends.to, locale) })}
            from={points.from}
            to={points.to}
            type={type}
            onPick={(gio) => !overMax && router.push(urlFor(today, guests, { ...ownParams(gio), ngayVe: null }))}
          />
        ) : null}
      </section>
    </>
  );
}
