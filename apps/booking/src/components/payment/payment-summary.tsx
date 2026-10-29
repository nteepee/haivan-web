"use client";

import type { TicketView } from "@/components/booking/ticket-card";
import { useT } from "@/components/providers";
import { formatMoney } from "@/lib/format";

/** "Chi tiết giá" bên phải trang thanh toán: thẻ r-3 bóng 1, hàng 16, tổng 20/800 có vạch 1px phía trên. */
export function PaymentSummary({ tickets, total }: { tickets: TicketView[]; total: number }) {
  const t = useT();
  const surcharge = tickets.reduce((s, tk) => s + (tk.transit_price ?? []).reduce((a, x) => a + (x.tcp_price ?? 0), 0), 0);
  const line = "flex justify-between gap-4 tabular-nums";
  return (
    <div className="hv-card grid gap-1 p-card">
      {tickets.map((tk) => {
        const reward = (tk as { is_reward?: boolean }).is_reward;
        return (
          <div key={tk.id}>
            <p className={`${line} font-semibold`}><span>{t("payment.seats")} {tk.name}</span><span>{formatMoney(tk.price + (tk.price_discount ?? 0))}</span></p>
            {reward ? <p className={`${line} text-success`}><span>{t("payment.exchange_points")}</span><span>-{formatMoney(tk.price)}</span></p> : null}
            {!reward && (tk.price_discount ?? 0) > 0 ? <p className={`${line} text-muted`}><span>{t("payment.promotion")}</span><span>-{formatMoney(tk.price_discount ?? 0)}</span></p> : null}
          </div>
        );
      })}
      <p className={line}><span>{t("booking_infor.surcharge")}</span><span>{formatMoney(surcharge)}</span></p>
      <p className={`${line} mt-2 border-t border-rule pt-4 text-20 font-extrabold text-ink`}><span>{t("payment.total_price")}</span><span>{formatMoney(total)}</span></p>
    </div>
  );
}
