"use client";

import { QRCodeSVG } from "qrcode.react";
import { useT } from "@/components/providers";
import { formatMoney } from "@/lib/format";

export interface TicketView {
  id: number;
  code: string;
  name?: string;
  price: number;
  price_discount?: number;
  trip?: { departure_time?: string; destination_time?: string; duration?: number; product?: { name?: string }; node?: { direction?: string; route?: { name?: string } } };
  departure?: { name?: string };
  destination?: { name?: string };
  pick_up?: { address?: string };
  drop_off?: { address?: string };
  transit?: { departure?: boolean; destination?: boolean };
  transit_price?: { tcp_price?: number }[];
}

const hhmm = (v?: string) => (v ? v.slice(11, 16) : "");
const routeName = (tk: TicketView) => {
  const name = tk.trip?.node?.route?.name ?? "";
  return tk.trip?.node?.direction === "B" ? name.split("-").map((s) => s.trim()).reverse().join(" - ") : name;
};

/** Thẻ vé (trang thanh toán, thành công, chuyến đi của tôi): tuyến, ngày, giờ, chặng, mã vé, ghế, QR. */
export function TicketCard({ ticket, showQr, showPrice = true, action, nested }: { ticket: TicketView; showQr?: boolean; showPrice?: boolean; action?: React.ReactNode; nested?: boolean }) {
  const t = useT();
  const surcharge = (ticket.transit_price ?? []).reduce((s, x) => s + (x.tcp_price ?? 0), 0);
  const dep = ticket.trip?.departure_time;
  const duration = ticket.trip?.duration ?? 0;
  // Chấm trên đường ray: ink = lên xe, vàng có vòng chọn = xuống xe; ghi chú đón/trả là dòng phụ.
  const stop = "relative pl-6 before:absolute before:left-0 before:top-2 before:size-3 before:rounded-round";
  const note = "relative pl-6 text-14 text-muted";
  return (
    // nested: nằm trong thẻ đơn hàng → chỉ vạch ngang, không thẻ trong thẻ.
    <article className={nested ? "overflow-hidden" : "hv-card overflow-hidden"}>
      <header className="flex flex-wrap justify-between gap-x-4 border-b border-rule bg-paper-2 px-card py-3 font-extrabold text-ink">
        <span>{routeName(ticket)}</span>
        <span className="font-normal text-muted">{dep ? new Date(dep.replace(" ", "T")).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long" }) : ""}</span>
      </header>
      <div className="flex gap-4 p-card">
        <div className="min-w-0 flex-1">
          <p className="flex justify-between gap-4 font-semibold">
            <span>{ticket.trip?.product?.name}</span>
            {showPrice ? <span className="tabular-nums">{formatMoney(ticket.price)}</span> : null}
          </p>
          {/* Giá chính là giá thực trả (như trang thành công web cũ); có khuyến mãi thì thêm giá niêm yết và dòng giảm (không hiện mã). */}
          {showPrice && (ticket.price_discount ?? 0) > 0 ? (
            <>
              <p className="flex justify-between gap-4 text-14 text-muted tabular-nums"><span>{t("payment.list_price")}</span><span>{formatMoney(ticket.price + (ticket.price_discount ?? 0))}</span></p>
              <p className="flex justify-between gap-4 text-14 font-semibold text-success tabular-nums"><span>{t("payment.promotion")}</span><span>-{formatMoney(ticket.price_discount ?? 0)}</span></p>
            </>
          ) : null}
          {showQr || surcharge ? <p className="text-right text-14 text-muted tabular-nums">{t("booking_infor.surcharge")} : {formatMoney(surcharge)}</p> : null}
          <ol className="relative mt-3 grid gap-2 before:absolute before:left-[calc(var(--s-3)/2)] before:top-3 before:bottom-3 before:w-(--line-strong) before:-translate-x-1/2 before:bg-edge">
            {ticket.pick_up?.address && ticket.pick_up.address !== ticket.departure?.name ? (
              <li className={note}>{ticket.pick_up.address} ({t(ticket.transit?.departure ? "payment.transit_vehicle" : "payment.self_service")})</li>
            ) : null}
            <li className={`${stop} bg-transparent before:bg-ink`}><strong className="mr-2 tabular-nums">{hhmm(dep)}</strong>{ticket.departure?.name}</li>
            <li className={`${note} flex flex-wrap gap-x-3`}>
              <span>{Math.floor(duration / 60)}h{duration % 60}p</span>
              <span>{t("payment.intercity")}</span>
            </li>
            <li className={`${stop} before:bg-accent before:select-ring`}><strong className="mr-2 tabular-nums">{hhmm(ticket.trip?.destination_time)}</strong>{ticket.destination?.name}</li>
            {ticket.drop_off?.address && ticket.drop_off.address !== ticket.destination?.name ? (
              <li className={note}>{ticket.drop_off.address} ({t(ticket.transit?.destination ? "payment.transit_vehicle" : "payment.self_service")})</li>
            ) : null}
          </ol>
        </div>
        {showQr ? <QRCodeSVG value={ticket.code} size={96} className="shrink-0" role="img" aria-label={`QR ${ticket.code}`} /> : null}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-card py-3">
        <span className="flex flex-wrap gap-x-3 tabular-nums">
          <strong>{ticket.code}</strong>
          <span>{t("payment.seats")} {ticket.name}</span>
        </span>
        {action}
      </footer>
    </article>
  );
}
