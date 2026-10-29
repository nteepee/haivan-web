"use client";

import { useT } from "@/components/providers";
import { formatMoney, parseVnDateTime } from "@/lib/format";
import type { BookingFull } from "@/schemas/account";

const num = (v: unknown) => Number.parseInt(String(v ?? 0), 10) || 0;
const stamp = (value?: string | null) => {
  const ms = parseVnDateTime(value ?? undefined);
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms + 7 * 3600_000).toISOString();
  return `${d.slice(11, 16)} ${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}`;
};

/** Thẻ phòng chờ / trung chuyển của đơn (khi có `room` hoặc `tco_ticket`) + nút "Huỷ dịch vụ". */
export function TransitServiceCard({ detail, paid, onCancel }: { detail: BookingFull; paid: boolean; onCancel: () => void }) {
  const t = useT();
  const { room, tco_ticket: tco } = detail;
  if (!room && !tco) return null;
  const cancelled = detail.ord_is_phong_cho === 2 || detail.ord_is_trung_chuyen === 2;
  const guests = detail.tickets.filter((tk) => tk.status?.type !== 5).length;
  const total = room ? num(room.price) + (tco ? num(tco.price) : 0) : 0;
  const line = "px-card py-2 font-semibold";
  return (
    <article className={`overflow-hidden border-t border-rule ${cancelled ? "opacity-55" : ""}`}>
      {room ? (
        <p className="flex justify-between gap-4 bg-paper-2 px-card py-3 font-extrabold">
          <span>
            {room.info?.hub_name} <span className="font-normal text-muted">({t("account.waiting_room")})</span>
          </span>
          <span>{room.info?.check_in_date}</span>
        </p>
      ) : null}
      <div className="flex justify-between border-t border-rule">
        <p className={line}>
          {t("account.guest_count")}: {guests}
        </p>
        <p className={line}>{formatMoney(total)}</p>
      </div>
      {tco?.don_info?.address ? <p className={line}>{t("account.pick_up_point")}: {tco.don_info.address}</p> : null}
      {tco?.tra_info?.address ? <p className={line}>{t("account.drop_off_point")}: {tco.tra_info.address}</p> : null}
      {tco?.check_in_date && tco.don_info ? <p className={line}>{t("account.time")}: {stamp(tco.check_in_date)}</p> : null}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-card py-3">
        <b>{tco?.code}</b>
        {paid ? (
          <span className="hv-tag hv-tag-ok">{t("trip.paid")}</span>
        ) : cancelled ? (
          <b>{t("account.cancelled_short")}</b>
        ) : (
          <button type="button" onClick={onCancel} className="hv-btn hv-btn-outline hv-btn-sm">
            {t("account.cancel_service")}
          </button>
        )}
      </footer>
    </article>
  );
}
