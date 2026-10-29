"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import type { PricedService, TransitTicketState } from "@/lib/bonus-services";
import { ApiError, gw } from "@/lib/http";
import type { BookingDraft } from "@/stores/booking-draft";
import { ServiceAddressDialog } from "./service-address-dialog";

interface Props {
  draft: BookingDraft;
  services: PricedService[];
  onChange: (update: (prev: PricedService[]) => PricedService[]) => void;
}

const groupAddress = (tickets: TransitTicketState[], key: "pick_up" | "drop_off") => {
  const groups = new Map<string, number>();
  for (const tk of tickets) {
    const a = String(tk[key] ?? "");
    groups.set(a, (groups.get(a) ?? 0) + 1);
  }
  return [...groups].map(([address, number]) => ({ number, address }));
};

/** "Thông tin dịch vụ bổ sung" (merchant 02/16/17): tick → `v4/check-transit`; "Cập nhật" → modal địa chỉ. */
export function BonusServices({ draft, services, onChange }: Props) {
  const t = useT();
  const [editing, setEditing] = useState<PricedService | null>(null);
  const set = (code: string, patch: Partial<PricedService>) => onChange((prev) => prev.map((s) => (s.dvbs_code === code ? { ...s, ...patch } : s)));

  const toggle = async (service: PricedService, checked: boolean) => {
    const key = service.dvbs_code === "TCDON" ? "pick_up" : "drop_off";
    if (!checked) return set(service.dvbs_code, { check: false, address: [], seatCheck: 0, dvbs_tickets: service.dvbs_tickets.map((tk) => ({ ...tk, check: false })) });
    const first = service.dvbs_tickets[0] ?? {};
    try {
      await gw("v4/check-transit", {
        query: {
          pick_up: first.pick_up as string, pick_up_lat: first.pick_up_lat as number, pick_up_lng: first.pick_up_lng as number,
          drop_off: first.drop_off as string, drop_off_lat: first.drop_off_lat as number, drop_off_lng: first.drop_off_lng as number,
          code: first.code, merchant_code: draft.trip_info.merchant.code, type_transit: service.dvbs_code === "TCDON" ? 1 : 2,
        },
      });
      set(service.dvbs_code, {
        check: true,
        dvbs_is_group: 0,
        seatCheck: service.dvbs_tickets.length,
        address: groupAddress(service.dvbs_tickets, key),
        dvbs_tickets: service.dvbs_tickets.map((tk) => ({ ...tk, check: true })),
      });
    } catch (error) {
      toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_point_transit"));
    }
  };

  return (
    <section className="grid gap-cards">
      <h2 className="text-20 font-extrabold">{t("booking_infor.add_service")}</h2>
      {services.map((s) => (
        <div key={s.dvbs_code} className="hv-card grid gap-3 p-card">
          <label className="flex min-h-control cursor-pointer items-center gap-3 text-18 font-extrabold">
            <input type="checkbox" checked={s.check} onChange={(e) => void toggle(s, e.target.checked)} className="size-icon shrink-0 accent-ink" />
            {s.title} - {s.seatCheck}/{s.seat} {t("booking_infor.guest")}
          </label>
          {s.dvbs_text_discount ? <p className="font-semibold text-error">{s.dvbs_text_discount}</p> : null}
          {s.check ? (
            <ul className="grid gap-1 text-muted">
              {s.address.map((a) => (
                <li key={a.address}>
                  {a.number} {t("booking_infor.guest")} : {a.address}
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" onClick={() => setEditing(s)} className="hv-btn hv-btn-outline hv-btn-sm w-fit">
            {t("booking_infor.update")}
          </button>
        </div>
      ))}
      {editing ? (
        <ServiceAddressDialog
          key={editing.dvbs_code}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          service={editing}
          draft={draft}
          onSave={(tickets, multi) => {
            const checked = tickets.filter((tk) => tk.check);
            const key = editing.dvbs_code === "TCDON" ? "pick_up" : "drop_off";
            set(editing.dvbs_code, {
              check: checked.length > 0,
              dvbs_is_group: checked.length ? 0 : 1,
              seatCheck: checked.length,
              dvbs_tickets: tickets,
              address: multi ? checked.map((tk) => ({ number: 1, address: String(tk[key] ?? "") })) : checked.length ? [{ number: checked.length, address: String(checked[0][key] ?? "") }] : [],
            });
          }}
        />
      ) : null}
    </section>
  );
}
