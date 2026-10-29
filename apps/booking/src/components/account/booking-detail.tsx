"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TicketCard, type TicketView } from "@/components/booking/ticket-card";
import { useLocale, useT } from "@/components/providers";
import { cancelBookingBody, cancelSeatBody, cancelTransitBody, canCancelOrder, ticketAction, type CancelChoice } from "@/lib/account-cancel";
import { isPriceHidden, serviceInfoState, serviceUpdateUrl } from "@/lib/account-trips";
import { ApiError, gw } from "@/lib/http";
import { localePrefix } from "@/i18n/t";
import type { BookingFull } from "@/schemas/account";
import { BillDownload } from "./bill-download";
import { CancelDialog, type CancelReason } from "./cancel-dialog";
import { TransitCancelDialog } from "./transit-cancel-dialog";
import { TransitServiceCard } from "./transit-service-card";

type Target = { kind: "seat"; ticketCode: string } | { kind: "order" } | { kind: "transit" } | null;

interface Props {
  detail: BookingFull;
  merchantCode: string;
  reasons: CancelReason[];
  paid: boolean;
  showBill: boolean;
}

// Vé đã huỷ: sọc chéo bằng token (vạch edge 1px mỗi 12px).
const STRIPES = "repeating-linear-gradient(-45deg, var(--color-edge), var(--color-edge) var(--line), transparent var(--line), transparent var(--s-3))";
const routeCodeOf = (tk: TicketView) => (tk as { trip?: { node?: { route?: { code?: string } } } }).trip?.node?.route?.code;

/** Chi tiết đơn: thẻ vé + QR, huỷ vé / huỷ đơn / huỷ dịch vụ, tải hoá đơn, dịch vụ bổ sung. */
export function BookingDetail({ detail, merchantCode, reasons, paid, showBill }: Props) {
  const t = useT();
  const p = localePrefix(useLocale());
  const client = useQueryClient();
  const [target, setTarget] = useState<Target>(null);
  const [cancelling, setCancelling] = useState(false);
  const tickets = detail.tickets as unknown as TicketView[];
  const serviceState = serviceInfoState({ ...detail, merchant_code: detail.merchant_code ?? merchantCode });

  const run = async (request: () => Promise<unknown>) => {
    if (cancelling) return; // nhấn đúp không được gửi hai lệnh huỷ lên production
    setCancelling(true);
    try {
      await request();
      toast.success(t("msg.canceled"));
      await Promise.all([client.invalidateQueries({ queryKey: ["account", "booking", detail.code] }), client.invalidateQueries({ queryKey: ["account", "bookings"] })]);
    } catch (error) {
      toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_error_occurred"));
    }
    setCancelling(false);
  };

  const confirm = (choice: CancelChoice) => {
    const current = target;
    setTarget(null);
    if (current?.kind === "seat") void run(() => gw("cancel-seat", { method: "POST", body: cancelSeatBody(detail.code, current.ticketCode, merchantCode, choice) }));
    if (current?.kind === "order") void run(() => gw("cancel-booking", { method: "POST", body: cancelBookingBody(detail.code, merchantCode, choice) }));
  };
  const confirmTransit = (reason: string) => {
    setTarget(null);
    void run(() => gw(`transit/cancel-order/${detail.code}`, { method: "DELETE", body: cancelTransitBody(reason) }));
  };

  return (
    <div className="grid">
      {tickets.map((tk) => {
        const raw = detail.tickets.find((x) => x.code === tk.code);
        const action = ticketAction(raw ?? {});
        return (
          <div key={tk.id} className={`not-first:border-t not-first:border-rule ${raw?.status?.type === 5 ? "rounded-2 p-1" : ""}`} style={raw?.status?.type === 5 ? { backgroundImage: STRIPES } : undefined}>
            <TicketCard
              nested
              ticket={tk}
              showQr
              showPrice={!isPriceHidden(routeCodeOf(tk))}
              action={
                <span className="flex flex-wrap items-center gap-2">
                  {showBill ? <BillDownload ticketCode={tk.code} merchantCode={merchantCode} /> : null}
                  {action.kind === "cancel" ? (
                    <button type="button" onClick={() => setTarget({ kind: "seat", ticketCode: tk.code })} className="hv-btn hv-btn-outline hv-btn-sm">
                      {t("trip.cancel_ticket")}
                    </button>
                  ) : action.kind === "paid" ? (
                    <span className="hv-tag hv-tag-ok"><Check className="size-4" aria-hidden />{t("trip.paid")}</span>
                  ) : (
                    <span className="text-muted">{action.kind === "unpaid" ? t("trip.unpaid") : action.text}</span>
                  )}
                </span>
              }
            />
          </div>
        );
      })}
      <TransitServiceCard detail={detail} paid={paid} onCancel={() => setTarget({ kind: "transit" })} />
      <div className="flex flex-wrap gap-3 border-t border-rule p-card">
        {serviceState === "open" ? (
          <Link href={serviceUpdateUrl(p, detail.code, merchantCode)} className="hv-btn hv-btn-outline hv-btn-sm">
            {t("booking_infor.add_service")}
          </Link>
        ) : serviceState === "locked" ? (
          <button type="button" onClick={() => toast.warning(t("trip.note_cancel"))} className="hv-btn hv-btn-outline hv-btn-sm">
            {t("booking_infor.add_service")}
          </button>
        ) : null}
        {canCancelOrder(detail) ? (
          <button type="button" onClick={() => setTarget({ kind: "order" })} className="hv-btn hv-btn-sm bg-error-soft text-error hover:bg-error-soft">
            {t("trip.cancel_order")}
          </button>
        ) : null}
      </div>
      <CancelDialog open={target?.kind === "seat" || target?.kind === "order"} onOpenChange={(o) => !o && setTarget(null)} reasons={reasons} onConfirm={confirm} />
      <TransitCancelDialog open={target?.kind === "transit"} onOpenChange={(o) => !o && setTarget(null)} onConfirm={confirmTransit} />
    </div>
  );
}
