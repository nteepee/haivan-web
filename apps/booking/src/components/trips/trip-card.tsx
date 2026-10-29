"use client";

import { Ban, Check, ChevronDown, Clock, Flag, Info, MapPin } from "lucide-react";
import { useId } from "react";
import { useBookingConfig } from "@/components/booking-config-provider";
import { useLocale, useT } from "@/components/providers";
import { formatMoney } from "@/lib/format";
import { AUTO_COMBO_ENABLED } from "@/lib/promo-flags";
import { comboPromoFor, comboTierFor, promoBadge } from "@/lib/promo-match";
import type { SearchParamsData } from "@/lib/search-url";
import type { Trip } from "@/schemas/trip";
import { PriceBox } from "./price-box";
import { TripExpanded } from "./trip-expanded";

const hhmm = (v?: string) => (v ? v.slice(11, 16) : "");
/** Thời lượng giữ nguyên như web cũ ("02h40"). */
const duration = (v?: string | null) => (v ?? "").trim();

/** Tên tuyến: chiều B đảo "A - B" → "B - A" như web cũ. */
export function routeTitle(trip: Trip): string {
  return trip.direction === "B" ? trip.route.name.split("-").map((s) => s.trim()).reverse().join(" - ") : trip.route.name;
}

/** Màu huy hiệu hạng xe theo tên hạng (Royal cam, Luxury xanh dương, Economy xanh lá); hạng khác dùng nền ink mặc định. */
export function classBadgeTone(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("royal")) return "hv-badge-orange";
  if (n.includes("lux")) return "hv-badge-blue";
  if (n.includes("eco")) return "hv-badge-leaf";
  return "";
}

/** Số chỗ: hết = viền + gạch + icon; sắp hết (<=3) = huy hiệu cảnh báo san hô + đồng hồ + chữ "Còn ít chỗ"; còn nhiều = tick. Luôn có chữ, không chỉ màu. */
function SeatsBadge({ seats, t }: { seats: number; t: (key: string, vars?: Record<string, string | number>) => string }) {
  if (seats === 0) {
    return (
      <span className="hv-tag hv-tag-out">
        <Ban className="size-4" aria-hidden />
        {t("booking_infor.sold_out")}
      </span>
    );
  }
  if (seats <= 3) {
    return (
      <span className="hv-badge hv-badge-few">
        <Clock className="size-4" aria-hidden />
        {t("list_trip.few_seats")}, {t("list_trip.seats_left", { n: seats })}
      </span>
    );
  }
  return (
    <span className="hv-tag hv-tag-in">
      <Check className="size-4" aria-hidden />
      {t("list_trip.seats_left", { n: seats })}
    </span>
  );
}

interface Props {
  trip: Trip;
  search: SearchParamsData;
  open: boolean;
  onToggle: () => void;
  /** Hàng đầu danh sách: ảnh tải ngay với ưu tiên cao (không lazy). */
  priority?: boolean;
}

/**
 * Hàng chuyến v3: ảnh xe + huy hiệu hạng, tên tuyến (h3), giờ đi/đến 32px với đường kẻ "thời lượng + Xe liên tỉnh", hai điểm, huy hiệu chỗ,
 * giá nổi, nút "Chọn ghế". Dòng "*Khởi hành" hiện cả khi đóng nếu giờ/ngày khác. Mở = viền ink + ảnh + sơ đồ ghế.
 */
export function TripCard({ trip, search, open, onToggle, priority = false }: Props) {
  const t = useT();
  const locale = useLocale();
  const config = useBookingConfig();
  // Nhãn combo chỉ khi chuyến thuộc tuyến chính đang tìm và khớp chương trình đang chạy; không có chương trình thì không hiện gì.
  const combo = AUTO_COMBO_ENABLED && search.corridor
    ? comboPromoFor(config, {
        corridorId: search.corridor.tuyen,
        chieu: search.corridor.chieu,
        travelDate: trip.date.slice(0, 10),
        departure: hhmm(trip.from.reached_at) || trip.time.slice(0, 5) || null,
        seatCount: search.numberGuest,
      })
    : null;
  const comboTier = combo ? comboTierFor(combo, trip.product.name, search.numberGuest) : null;
  const panelId = useId();
  const seats = trip.available_seats;
  const soldOut = seats === 0;
  const thumb = trip.car_imgs?.[0];
  const transit = (trip.transit ?? {}) as { start?: boolean; end?: boolean; is_check_transit_start?: boolean; is_check_transit_end?: boolean };
  const showDepartureNote = hhmm(trip.from.reached_at) !== trip.time;
  const percent = trip.price.percent ?? 0;
  const transitLine = (name: string, vehicle?: boolean) => (
    <p className="hv-trip-transit">
      {name} ({t(vehicle ? "booking_infor.transit_vehicle" : "booking_infor.self_service")})
    </p>
  );

  const classBadge = <span className={`hv-badge ${classBadgeTone(trip.product.name)}`}>{trip.product.name}</span>;

  return (
    <article className="hv-trip" data-open={open} aria-label={`${routeTitle(trip)} ${hhmm(trip.from.reached_at)}`}>
      <div className="hv-trip-main" data-thumb={thumb ? "true" : "false"}>
        {thumb ? (
          <div className="hv-trip-thumb hv-photo">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ CMS nhiều host */}
            <img src={thumb} width={815} height={400} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} alt={t("list_trip.vehicle_alt", { name: trip.product.name })} />
            <span className={`hv-badge hv-badge-photo ${classBadgeTone(trip.product.name)}`}>{trip.product.name}</span>
          </div>
        ) : null}
        <div className="hv-trip-body">
          <h3 className="hv-trip-title">{routeTitle(trip)}</h3>
          <div className="hv-trip-times">
            <span className="hv-time">{hhmm(trip.from.reached_at)}</span>
            <p className="hv-stop-mid">
              <span className="hv-dur">{duration(trip.duration)}</span>
              {t("list_trip.intercity_bus")}
            </p>
            <span className="hv-time">{hhmm(trip.to.reached_at)}</span>
          </div>
          <div className="hv-trip-route">
            {transit.is_check_transit_start ? transitLine(search.from.name, transit.start) : null}
            <p className="hv-stop">
              <MapPin className="size-5" aria-hidden />
              <span>{trip.from.place_name}</span>
            </p>
            <p className="hv-stop hv-stop-end">
              <Flag className="size-5" aria-hidden />
              <span>{trip.to.place_name}</span>
            </p>
            {transit.is_check_transit_end ? transitLine(search.to.name, transit.end) : null}
          </div>
          <div className="hv-trip-meta">
            {thumb ? null : classBadge}
            <SeatsBadge seats={seats} t={t} />
            {percent > 0 ? <span className="hv-tag hv-tag-bad">{t("list_trip.today_discount", { percent })}</span> : null}
            {combo ? <span className="hv-badge hv-badge-sale">{promoBadge(combo, locale)}</span> : null}
            {comboTier ? <span className="font-semibold tabular-nums">{t("corridor.tier_from", { seats: comboTier.seats, price: formatMoney(comboTier.price_vnd) })}</span> : null}
          </div>
        </div>
        <div className="hv-trip-side">
          <PriceBox trip={trip} t={t} />
          <div className="hv-trip-act">
            <button
              type="button"
              className={`hv-btn hv-btn-lg ${soldOut ? "hv-btn-outline" : "hv-btn-primary"}`}
              onClick={soldOut ? undefined : onToggle}
              aria-disabled={soldOut || undefined}
              aria-expanded={soldOut ? undefined : open}
              aria-controls={open ? panelId : undefined}
            >
              {soldOut ? t("booking_infor.sold_out") : t("ux.choose_seat")}
              {soldOut ? null : <ChevronDown className="hv-trip-chevron size-6" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
      {showDepartureNote ? (
        <p className="hv-trip-note">
          <Info className="size-6 shrink-0" aria-hidden />
          <span>*{t("list_trip.depart_note", { time: trip.time, date: trip.date.split("-").reverse().join("/") })}</span>
        </p>
      ) : null}
      {open ? (
        <div id={panelId}>
          <TripExpanded trip={trip} search={search} />
        </div>
      ) : null}
    </article>
  );
}
