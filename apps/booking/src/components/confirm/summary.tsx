"use client";

import { Hourglass, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/providers";
import { countdown, formatMoney } from "@/lib/format";
import type { BookingDraft, DraftSeat } from "@/stores/booking-draft";

/**
 * Thanh đồng hồ giữ chỗ: icon + chữ "Còn mm:ss". Điện thoại: tràn mép, dính đỉnh (header không dính) nên là kính vàng;
 * từ lg đứng yên trong dòng chảy → nền đặc accent-soft, không blur (`!` thắng lớp .glass không-layer).
 * Dưới 2 phút thêm câu cảnh báo (không chỉ màu). Hết giờ → onExpire (một lần).
 */
export function Countdown({ deadline, onExpire, label }: { deadline: number; onExpire: () => void; label: string }) {
  const t = useT();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const expired = now >= deadline;
  useEffect(() => {
    if (expired) onExpire();
  }, [expired, onExpire]);
  const [mm, ss] = countdown(deadline, now).split(":");
  const soon = !expired && deadline - now < 120_000;
  return (
    <div className="glass-yellow sticky top-0 z-(--z-sticky) lg:static lg:bg-accent-soft! lg:backdrop-filter-none! lg:shadow-none!">
      <div className="hv-container flex items-center gap-3 py-3">
        <Hourglass className="size-icon shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{label}</p>
          <p role="status" className="flex items-center gap-2 text-16 font-semibold empty:hidden">
            {soon ? (
              <>
                <TriangleAlert className="size-icon shrink-0" aria-hidden />
                {t("ux.hold_soon")}
              </>
            ) : null}
          </p>
        </div>
        <strong className="text-24 font-extrabold tabular-nums" role="timer" aria-live="off">
          <span aria-hidden>{t("ux.hold_clock", { mm, ss })}</span>
          <span className="sr-only">{t("ux.hold_left", { mm: Number(mm), ss: Number(ss) })}</span>
        </strong>
      </div>
    </div>
  );
}

/** "Chi tiết giá": từng ghế, phụ thu, khuyến mãi/đổi điểm, tổng có vạch 1px (chỉ khi show_price !== 0). */
export function PriceSummary({ seats, surcharge, show }: { seats: DraftSeat[]; surcharge: number; show: boolean }) {
  const t = useT();
  if (!show) return null;
  const total = seats.reduce((s, x) => (x.is_reward ? s : s + x.price - (x.discount ?? 0)), 0) + surcharge;
  const cell = "border-b border-rule py-3 align-top";
  const sub = "block text-14 text-muted";
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{t("booking_infor.price_details")}</caption>
      <thead>
        <tr className="text-14 text-muted">
          <th scope="col" colSpan={2} className={`${cell} font-semibold`}>{t("booking_infor.price_details")}</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {seats.map((s) => (
          <tr key={s.id}>
            <td className={cell}>
              {t("booking_infor.seats")} {s.name}
              {s.is_reward ? <span className={sub}>{t("booking_infor.exchange_points")}</span> : s.discount ? <span className={sub}>{t("booking_infor.promotion")}</span> : null}
            </td>
            <td className={`${cell} text-right`}>
              {formatMoney(s.price)}
              {s.is_reward ? <span className={sub}>-{formatMoney(s.price)}</span> : s.discount ? <span className={sub}>-{formatMoney(Math.min(s.discount, s.price))}</span> : null}
            </td>
          </tr>
        ))}
        <tr>
          <td className={cell}>{t("booking_infor.surcharge")}</td>
          <td className={`${cell} text-right`}>{formatMoney(surcharge)}</td>
        </tr>
      </tbody>
      <tfoot className="tabular-nums">
        <tr className="text-24 font-extrabold text-ink">
          <th scope="row" className="border-t border-rule pt-4 text-left">{t("booking_infor.total")}</th>
          <td className="border-t border-rule pt-4 text-right">{formatMoney(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

const hhmm = (v?: string) => (v ? v.slice(11, 16) : "");

/** Tóm tắt chuyến: hạng xe, ngày khởi hành, các chặng đón/tuyến/trả trên một đường ray (chấm ink = bến lên xe, chấm vàng = bến xuống và điểm đón/trả). */
export function TripSummary({ draft, valueStart, valueEnd }: { draft: BookingDraft; valueStart: string; valueEnd: string }) {
  const t = useT();
  const { trip_info: trip } = draft;
  const date = trip.from.reached_at ? new Date(trip.from.reached_at.replace(" ", "T")) : null;
  const stop = "relative pl-6 before:absolute before:left-0 before:top-2 before:size-3 before:rounded-round";
  const solid = `${stop} before:bg-ink`;
  const hollow = `${stop} before:bg-accent before:select-ring`;
  const mode = (home: boolean) => t(home ? "booking_infor.transit_vehicle" : "booking_infor.self_service");
  return (
    <>
      <h2 className="text-18 font-extrabold">{trip.product.name}</h2>
      <p className="text-14 font-semibold text-muted">
        {date ? date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long" }) : trip.date}
        {", "}
        {hhmm(trip.from.reached_at)} - {hhmm(trip.to.reached_at)}
      </p>
      <ol className="relative grid gap-2 before:absolute before:left-[calc(var(--s-3)/2)] before:top-3 before:bottom-3 before:w-(--line-strong) before:-translate-x-1/2 before:bg-edge">
        {draft.pick_up.address !== trip.from.place_name ? (
          <li className={hollow}>
            <strong>{draft.pick_up.address}</strong> ({mode(!!draft.transit.departure && draft.pick_up.address === valueStart)})
          </li>
        ) : null}
        <li className={solid}>
          <strong className="mr-2 tabular-nums">{hhmm(trip.from.reached_at)}</strong>
          {trip.from.place_name} <span className="text-14 text-muted">({t("booking_infor.intercity")})</span>
        </li>
        <li className={hollow}>
          <strong className="mr-2 tabular-nums">{hhmm(trip.to.reached_at)}</strong>
          {trip.to.place_name}
        </li>
        {draft.drop_off.address !== trip.to.place_name ? (
          <li className={hollow}>
            <strong>{draft.drop_off.address}</strong> ({mode(!!draft.transit.destination && draft.drop_off.address === valueEnd)})
          </li>
        ) : null}
      </ol>
    </>
  );
}
