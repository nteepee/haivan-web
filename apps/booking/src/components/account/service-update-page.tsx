"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageNote } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { applyDialogResult, applyServiceCheck, checkTransitQuery, isPickUp, normalizeService, updateTransitBody, type TransitService } from "@/lib/account-transit";
import { ApiError, gw } from "@/lib/http";
import { localePrefix } from "@/i18n/t";
import { transitServicesSchema, transitTicketsSchema } from "@/schemas/account";
import { RequireLogin } from "./require-login";
import { ServiceUpdateDialog } from "./service-update-dialog";

function ServiceUpdate({ code, merchantCode }: { code: string; merchantCode: string }) {
  const t = useT();
  const router = useRouter();
  const client = useQueryClient();
  const p = localePrefix(useLocale());
  const query = useQuery({ queryKey: ["account", "transit", code, merchantCode], staleTime: 0, queryFn: () => gw(`v4/detail-transit/${code}`, { query: { merchant_code: merchantCode }, schema: transitServicesSchema }) });
  const base = useMemo(() => (query.data ?? []).map((s) => normalizeService(s)), [query.data]);
  const [edited, setEdited] = useState<TransitService[] | null>(null);
  const [dialogIndex, setDialogIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const services = edited ?? base;
  const replace = (index: number, next: TransitService) => setEdited(services.map((s, i) => (i === index ? next : s)));
  const titleOf = (s: TransitService) => t(isPickUp(s) ? "booking_infor.pick_up_transit" : "booking_infor.drop_off_transit");
  const fail = (error: unknown) => toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_error_occurred"));

  const toggle = async (index: number, checked: boolean) => {
    const s = services[index];
    if (checked && s.address.length <= 1 && s.dvbs_tickets.length > 0) {
      try {
        await gw("v4/check-transit", { query: checkTransitQuery(s, s.dvbs_tickets[0], merchantCode) });
      } catch (error) {
        return fail(error);
      }
    }
    replace(index, applyServiceCheck(s, checked));
  };

  const openUpdate = async (index: number) => {
    const s = services[index];
    if (s.dvbs_tickets.length > 0) return setDialogIndex(index);
    setBusy(true);
    try {
      const tickets = await gw("v4/get-info-ticket", { query: { order_id: s.dvbs_order_id, service_code: s.dvbs_code, merchant_code: merchantCode }, schema: transitTicketsSchema });
      replace(index, { ...s, dvbs_tickets: tickets });
      setDialogIndex(index);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await gw("v4/update-transit", { method: "POST", body: updateTransitBody(code, merchantCode, services) });
      toast.success(t("msg.msg_success_update"));
      await client.invalidateQueries({ queryKey: ["account"] });
      router.push(`${p}/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh`);
      window.scrollTo(0, 0);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const current = dialogIndex === null ? null : services[dialogIndex];
  return (
    <div className="hv-container hv-app-main grid max-w-3xl gap-6">
      <h1 className="text-h1">{t("booking_infor.add_service")}</h1>
      {query.isPending ? <Skeleton className="h-40" /> : null}
      {query.isError ? <p role="alert" className="hv-notice hv-notice-error font-semibold">{t("msg.err_data")}</p> : null}
      {services.map((s, index) => (
        <section key={String(s.dvbs_id)} className="hv-card grid gap-3 p-card">
          <label className="flex min-h-control cursor-pointer items-center gap-3">
            <input type="checkbox" checked={s.check} onChange={(e) => void toggle(index, e.target.checked)} className="size-icon shrink-0 accent-ink" />
            <b className="text-20 font-extrabold text-ink">
              {titleOf(s)} - {s.seatCheck}/{s.seat} {t("booking_infor.guest")}
            </b>
          </label>
          <div className="grid gap-1">
            {s.address.map((a, i) => (
              <p key={i}>
                <b>{a.number} {t("booking_infor.guest")}: </b>
                {a.address}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" disabled={busy} onClick={() => void openUpdate(index)} className="hv-btn hv-btn-outline hv-btn-sm">
              {t("list_trip.update")}
            </button>
            {s.dvbs_text_discount ? <span className="hv-tag hv-tag-bad">{s.dvbs_text_discount}</span> : null}
          </div>
        </section>
      ))}
      {services.length > 0 ? (
        <div className="flex justify-end">
          <button type="button" disabled={busy} aria-busy={busy} onClick={() => void submit()} className="hv-btn hv-btn-primary hv-btn-lg">
            {t("login_form.continue")} ›
          </button>
        </div>
      ) : null}
      {current ? (
        <ServiceUpdateDialog
          key={dialogIndex}
          service={current}
          title={titleOf(current)}
          merchantCode={merchantCode}
          onClose={() => setDialogIndex(null)}
          onSave={(tickets, multi) => {
            replace(dialogIndex!, applyDialogResult(current, tickets, multi));
            setDialogIndex(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** /xe-khach/cap-nhat-dich-vu?code&merchant_code: chỉnh dịch vụ đón/trả tận nhà sau khi đặt vé. */
export function ServiceUpdatePage() {
  const t = useT();
  const params = useSearchParams();
  const code = params.get("code");
  const merchantCode = params.get("merchant_code");
  return (
    <RequireLogin>
      {code && merchantCode ? <ServiceUpdate code={code} merchantCode={merchantCode} /> : <PageNote>{t("msg.err_data")}</PageNote>}
    </RequireLogin>
  );
}
