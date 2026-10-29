"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AddressSearch, type PickedAddress } from "@/components/confirm/address-search";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { checkTransitQuery, isMultiPoint, isPickUp, priceTicketQuery, withAddress, type TransitService, type TransitTicket } from "@/lib/account-transit";
import { formatMoney } from "@/lib/format";
import { ApiError, gw } from "@/lib/http";
import { inputClass } from "./form-field";

interface Props {
  service: TransitService;
  title: string;
  merchantCode: string;
  onSave: (tickets: TransitTicket[], multi: boolean) => void;
  onClose: () => void;
}

const priceOf = (res: unknown) => {
  const r = res as { price?: number; data?: { price?: number } } | null;
  return Number(r?.data?.price ?? r?.price ?? 0);
};

function UpdateForm({ service, merchantCode, onSave }: Omit<Props, "title" | "onClose">) {
  const t = useT();
  const pickUp = isPickUp(service);
  const [multi, setMulti] = useState(isMultiPoint(service));
  const [tickets, setTickets] = useState<TransitTicket[]>(() => service.dvbs_tickets.map((tk) => ({ ...tk })));
  const [common, setCommon] = useState({ name: String(tickets[0]?.name ?? ""), phone: String(tickets[0]?.phone ?? "") });
  const [busy, setBusy] = useState(false);
  const patch = (i: number, p: Partial<TransitTicket>) => setTickets((prev) => prev.map((tk, k) => (k === i ? { ...tk, ...p } : tk)));
  const fail = (error: unknown) => toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_error_occurred"));
  const addressOf = (tk?: TransitTicket) => String((pickUp ? tk?.pick_up : tk?.drop_off) ?? "");

  const toggle = async (i: number, checked: boolean) => {
    if (checked) {
      try {
        await gw("v4/check-transit", { query: checkTransitQuery(service, tickets[i], merchantCode) });
      } catch (error) {
        return fail(error);
      }
    }
    patch(i, { check: checked });
  };

  const pick = async (index: number | "all", picked: PickedAddress) => {
    const targets = index === "all" ? tickets.map((_, i) => i) : [index];
    setBusy(true);
    try {
      const prices = await Promise.all(targets.map(async (i) => priceOf(await gw("v4/get-price-ticket", { query: priceTicketQuery(service, tickets[i], picked, merchantCode) }))));
      setTickets((prev) => prev.map((tk, i) => (targets.includes(i) ? withAddress(service, tk, picked, prices[targets.indexOf(i)]) : tk)));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (multi && tickets.some((tk) => tk.check && !String(tk.name ?? "").trim())) return toast.warning(t("account.enter_full_name"));
    onSave(multi ? tickets : tickets.map((tk) => ({ ...tk, name: common.name || tk.name, phone: common.phone || tk.phone })), multi);
  };

  return (
    <div className="grid gap-3">
      {tickets.length > 1 ? (
        <label className="flex min-h-control cursor-pointer items-center gap-3 font-extrabold">
          <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} className="size-icon shrink-0 accent-ink" />
          {t("booking_infor.pick_up_multiple_points")}
        </label>
      ) : null}
      {tickets.map((tk, i) => (
        <fieldset key={tk.code ?? i} className="grid gap-2 rounded-2 bg-paper-2 p-3">
          <legend className="px-1 font-extrabold">
            {t("booking_infor.seats")} {String(tk.number ?? i + 1)} - {formatMoney(Number(tk.price) || 0)}
          </legend>
          <label className="flex min-h-control cursor-pointer items-center gap-3">
            <input type="checkbox" checked={!!tk.check} onChange={(e) => void toggle(i, e.target.checked)} className="size-icon shrink-0 accent-ink" />
            {t(pickUp ? "booking_infor.pick_up" : "booking_infor.drop_off")}
          </label>
          {multi ? (
            <>
              <input className={inputClass} aria-label={t("booking_infor.full_name")} placeholder={t("booking_infor.full_name")} value={String(tk.name ?? "")} onChange={(e) => patch(i, { name: e.target.value })} />
              <input className={inputClass} aria-label={t("booking_infor.mobile_phone")} placeholder={t("booking_infor.mobile_phone")} value={String(tk.phone ?? "")} onChange={(e) => patch(i, { phone: e.target.value })} />
              <AddressSearch value={addressOf(tk)} placeholder={t(pickUp ? "booking_infor.pick_up" : "booking_infor.drop_off")} onPick={(a) => void pick(i, a)} />
            </>
          ) : null}
        </fieldset>
      ))}
      {!multi ? (
        <div className="grid gap-2">
          <input className={inputClass} aria-label={t("booking_infor.full_name")} placeholder={t("booking_infor.full_name")} value={common.name} onChange={(e) => setCommon((c) => ({ ...c, name: e.target.value }))} />
          <input className={inputClass} aria-label={t("booking_infor.mobile_phone")} placeholder={t("booking_infor.mobile_phone")} value={common.phone} onChange={(e) => setCommon((c) => ({ ...c, phone: e.target.value }))} />
          <AddressSearch value={addressOf(tickets[0])} placeholder={t(pickUp ? "booking_infor.pick_up" : "booking_infor.drop_off")} onPick={(a) => void pick("all", a)} />
        </div>
      ) : null}
      <button type="button" disabled={busy} onClick={save} className="hv-btn hv-btn-primary w-full">
        {t("list_trip.update")}
      </button>
    </div>
  );
}

/** Modal "Cập nhật" dịch vụ đón/trả tận nhà của một đơn đã đặt. */
export function ServiceUpdateDialog({ title, onClose, ...form }: Props) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle className="text-center">{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <UpdateForm {...form} />
      </DialogContent>
    </Dialog>
  );
}
