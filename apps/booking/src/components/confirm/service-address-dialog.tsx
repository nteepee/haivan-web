"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PricedService, TransitTicketState } from "@/lib/bonus-services";
import { formatMoney } from "@/lib/format";
import { ApiError, gw } from "@/lib/http";
import type { BookingDraft } from "@/stores/booking-draft";
import { AddressSearch, type PickedAddress } from "./address-search";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PricedService;
  draft: BookingDraft;
  onSave: (tickets: TransitTicketState[], multi: boolean) => void;
}

const field = "hv-field";

/** Modal "Cập nhật" dịch vụ tận nhà: một điểm cho mọi vé hoặc "Đón nhiều điểm"; giá từ `v4/get-price-ticket`. */
export function ServiceAddressDialog({ open, onOpenChange, service, draft, onSave }: Props) {
  const t = useT();
  const pickUp = service.dvbs_code === "TCDON";
  const [multi, setMulti] = useState(false);
  const [tickets, setTickets] = useState<TransitTicketState[]>(() => service.dvbs_tickets.map((tk) => ({ ...tk })));
  const station = pickUp ? draft.trip_info.from : draft.trip_info.to;
  const [lng, lat] = station.location ?? [0, 0];

  const priceFor = async (ticket: TransitTicketState, a: PickedAddress) => {
    const own = { lat: a.lat, lng: a.lng, address: a.address };
    const query = pickUp
      ? { pick_up: own.address, pick_up_lat: own.lat, pick_up_lng: own.lng, drop_off: station.place_name, drop_off_lat: lat, drop_off_lng: lng }
      : { pick_up: station.place_name, pick_up_lat: lat, pick_up_lng: lng, drop_off: own.address, drop_off_lat: own.lat, drop_off_lng: own.lng };
    const res = (await gw("v4/get-price-ticket", {
      query: { ...query, date: draft.trip_info.date, quantity: 1, code: ticket.code, merchant_code: draft.trip_info.merchant.code, type_transit: pickUp ? 1 : 2 },
    })) as { price?: number; data?: { price?: number } };
    return Number(res?.data?.price ?? res?.price ?? 0);
  };

  const setAddress = async (index: number | "all", a: PickedAddress) => {
    try {
      const targets = index === "all" ? tickets.map((_, i) => i) : [index];
      const prices = await Promise.all(targets.map((i) => priceFor(tickets[i], a)));
      setTickets((prev) =>
        prev.map((tk, i) => {
          const k = targets.indexOf(i);
          if (k < 0) return tk;
          return { ...tk, check: true, price: prices[k], ...(pickUp ? { pick_up: a.address, pick_up_lat: a.lat, pick_up_lng: a.lng } : { drop_off: a.address, drop_off_lat: a.lat, drop_off_lng: a.lng }) };
        }),
      );
    } catch (error) {
      toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_point_transit"));
    }
  };

  // Tick từng vé → `v4/check-transit` với địa chỉ của vé đó (web cũ); lỗi → báo và giữ bỏ tick.
  const toggleTicket = async (i: number, checked: boolean) => {
    if (!checked) return update(i, { check: false });
    const tk = tickets[i];
    try {
      await gw("v4/check-transit", {
        query: {
          pick_up: tk.pick_up as string, pick_up_lat: tk.pick_up_lat as number, pick_up_lng: tk.pick_up_lng as number,
          drop_off: tk.drop_off as string, drop_off_lat: tk.drop_off_lat as number, drop_off_lng: tk.drop_off_lng as number,
          code: tk.code, merchant_code: draft.trip_info.merchant.code, type_transit: pickUp ? 1 : 2,
        },
      });
      update(i, { check: true });
    } catch (error) {
      toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_point_transit"));
    }
  };
  const [nameError, setNameError] = useState(false);
  const save = () => {
    if (multi && tickets.some((tk) => tk.check && !String(tk.name ?? "").trim())) return setNameError(true);
    onSave(tickets, multi);
    onOpenChange(false);
  };

  const update = (i: number, patch: Partial<TransitTicketState>) => setTickets((prev) => prev.map((tk, k) => (k === i ? { ...tk, ...patch } : tk)));
  const addr = (tk: TransitTicketState) => String((pickUp ? tk.pick_up : tk.drop_off) ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogTitle>{service.title}</DialogTitle>
        <p className="text-muted">{t(pickUp ? "booking_infor.pickup_transshipment" : "booking_infor.dropoff_transshipment")}</p>
        {tickets.length > 1 ? (
          <label className="flex min-h-control cursor-pointer items-center gap-3 font-semibold">
            <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} className="size-icon shrink-0 accent-ink" />
            {t("booking_infor.pick_up_multiple_points")}
          </label>
        ) : null}
        {multi ? (
          tickets.map((tk, i) => (
            <fieldset key={tk.id} className="grid gap-2 rounded-2 bg-paper-2 p-3">
              <legend className="px-1 font-extrabold">
                {t("booking_infor.seats")} {String(tk.number ?? i + 1)} – {formatMoney(Number(tk.price) || 0)}
              </legend>
              <label className="flex min-h-control cursor-pointer items-center gap-3">
                <input type="checkbox" checked={!!tk.check} onChange={(e) => void toggleTicket(i, e.target.checked)} className="size-icon shrink-0 accent-ink" /> {service.title}
              </label>
              <input className={field} aria-label={t("booking_infor.full_name")} placeholder={t("booking_infor.full_name")} value={String(tk.name ?? "")} onChange={(e) => update(i, { name: e.target.value })} aria-invalid={nameError && !!tk.check && !String(tk.name ?? "").trim()} />
              {nameError && tk.check && !String(tk.name ?? "").trim() ? <p role="alert" className="hv-err text-16">{t("account.enter_full_name")}</p> : null}
              <input className={field} aria-label={t("booking_infor.mobile_phone")} inputMode="tel" placeholder={t("booking_infor.mobile_phone")} value={String(tk.phone ?? "")} onChange={(e) => update(i, { phone: e.target.value })} />
              <AddressSearch value={addr(tk)} placeholder={t(pickUp ? "booking_infor.pick_up" : "booking_infor.drop_off")} onPick={(a) => void setAddress(i, a)} />
            </fieldset>
          ))
        ) : (
          <div className="grid gap-2">
            <AddressSearch value={addr(tickets[0] ?? ({} as TransitTicketState))} placeholder={t(pickUp ? "booking_infor.pick_up" : "booking_infor.drop_off")} onPick={(a) => void setAddress("all", a)} />
            <p>{tickets.length} {t("booking_infor.guest")} • {formatMoney(tickets.reduce((s, tk) => s + (tk.check ? Number(tk.price) || 0 : 0), 0))}</p>
          </div>
        )}
        <button type="button" onClick={save} className="hv-btn hv-btn-primary w-full">
          {t("list_trip.update")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
