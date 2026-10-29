"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { districtsOf, identityEditable, isMember, profileBody, profileInitial, profileRequest, validateProfile, type ProfileErrors, type ProfileValues } from "@/lib/account-profile";
import { ApiError, gw } from "@/lib/http";
import { writeStatusSchema, type CustomerData, type Definition } from "@/schemas/account";
import { Field, inputClass } from "./form-field";
import { useCustomerCache, useDefinition } from "./use-customer";

const selectClass = `${inputClass} appearance-auto`;

function Options({ items, placeholder }: { items: { key?: string | number; code?: string; text?: string; name?: string }[]; placeholder: string }) {
  return (
    <>
      <option value="">{placeholder}</option>
      {items.map((o) => (
        <option key={String(o.key ?? o.code)} value={String(o.key ?? o.code)}>
          {o.text ?? o.name}
        </option>
      ))}
    </>
  );
}

function ProfileForm({ customer, def, onDone }: { customer: CustomerData; def: Definition; onDone: () => void }) {
  const t = useT();
  const cache = useCustomerCache();
  const member = isMember(customer);
  const identity = identityEditable(customer);
  const [values, setValues] = useState<ProfileValues>(() => profileInitial(customer));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof ProfileValues, value: string) => setValues((v) => ({ ...v, [key]: value, ...(key === "province_code" ? { district_code: "" } : {}) }));
  const text = (key: keyof ProfileValues, label: string, extra: { disabled?: boolean; type?: string; ph?: string } = {}) => (
    <Field label={label} error={errors[key]}>
      <input className={inputClass} type={extra.type ?? "text"} value={values[key]} disabled={extra.disabled} placeholder={extra.ph} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const select = (key: keyof ProfileValues, label: string, items: Parameters<typeof Options>[0]["items"], placeholder: string) => (
    <Field label={label} error={errors[key]}>
      <select className={selectClass} value={values[key]} onChange={(e) => set(key, e.target.value)}>
        <Options items={items} placeholder={placeholder} />
      </select>
    </Field>
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateProfile(values, { identityLocked: !identity });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const request = profileRequest(member);
    setBusy(true);
    try {
      const res = await gw(request.path, { method: request.method, body: profileBody(values, def), schema: writeStatusSchema });
      if (res.status !== "OK") throw new Error("unexpected status");
      toast.success(member && values.email.trim() !== (customer.email ?? "") ? t("account.check_email") : t("msg.msg_success_update"));
      await cache.refetch();
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("account.update_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="grid gap-field">
      {select("title", t("booking_infor.title"), def.titles, t("booking_infor.title"))}
      {text("name", t("booking_infor.full_name"), { disabled: !identity, ph: t("place_holder.pls_insert_name") })}
      {text("date_of_birth", t("booking_infor.date_of_birth"), { disabled: !identity, type: "date" })}
      {text("address", t("booking_infor.address"), { ph: t("place_holder.pls_insert_address") })}
      {select("province_code", t("booking_infor.province_city"), def.provinces, t("place_holder.pls_chooose_city"))}
      {select("district_code", t("booking_infor.district"), districtsOf(def.districts, values.province_code), t("place_holder.pls_choose_district"))}
      {text("email", t("booking_infor.email"), { type: "email", ph: t("place_holder.pls_insert_email") })}
      {select("occupation", t("booking_infor.profession"), def.jobs, t("place_holder.pls_insert_occuoation"))}
      {select("travel_purpose", t("booking_infor.reason_for_travel"), def.travel_purposes, t("place_holder.pls_insert_travel_purpose"))}
      <button type="submit" disabled={busy} className="hv-btn hv-btn-primary w-full" aria-busy={busy}>
        {busy ? t("list_trip.msg.in_progress") : t("login_form.confirm")}
      </button>
    </form>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData;
  title: string;
  /** Bắt buộc cập nhật: không đóng bằng nút X / Esc / bấm ra ngoài. */
  locked?: boolean;
  onDone?: () => void;
}

/** Modal hồ sơ cá nhân: sửa hồ sơ, đăng ký khách hàng thân thiết, hoặc cập nhật bắt buộc. */
export function ProfileDialog({ open, onOpenChange, customer, title, locked, onDone }: Props) {
  const t = useT();
  const def = useDefinition(open);
  const block = locked ? (e: Event) => e.preventDefault() : undefined;
  return (
    <Dialog open={open} onOpenChange={(o) => !locked && onOpenChange(o)}>
      <DialogContent showCloseButton={!locked} onEscapeKeyDown={block} onInteractOutside={block} className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        {def.data ? (
          <ProfileForm
            customer={customer}
            def={def.data}
            onDone={() => {
              onDone?.();
              onOpenChange(false);
            }}
          />
        ) : def.isError ? (
          // Modal bắt buộc không đóng được → phải có đường thử lại, nếu không sẽ chặn cả trang.
          <div className="grid justify-items-center gap-3 text-center">
            <p className="text-muted">{t("msg.err_data")}</p>
            <button type="button" onClick={() => void def.refetch()} className="hv-btn hv-btn-primary">{t("account.retry")}</button>
          </div>
        ) : (
          <p className="text-center text-muted">{t("list_trip.msg.in_progress")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
