"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { taxBody, taxInitial, validateTax, type TaxErrors, type TaxValues } from "@/lib/account-profile";
import { ApiError, gw } from "@/lib/http";
import { writeStatusSchema, type CustomerData } from "@/schemas/account";
import { Field, inputClass } from "./form-field";
import { useCustomerCache } from "./use-customer";

function TaxForm({ customer, onDone }: { customer: CustomerData; onDone: () => void }) {
  const t = useT();
  const cache = useCustomerCache();
  const [values, setValues] = useState<TaxValues>(() => taxInitial(customer));
  const [errors, setErrors] = useState<TaxErrors>({});
  const [busy, setBusy] = useState(false);
  const field = (key: keyof TaxValues, label: string, type = "text") => (
    <Field label={label} error={errors[key]}>
      <input className={inputClass} type={type} value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />
    </Field>
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateTax(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      const body = taxBody(values);
      const res = await gw("customer/customers/tax", { method: "POST", body, schema: writeStatusSchema });
      if (res.status !== "success") throw new Error("unexpected status");
      toast.success(t("msg.msg_success_update"));
      cache.patch({ invoice_info: body });
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("account.update_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="grid gap-field">
      {field("email", t("account.invoice_email"), "email")}
      {field("company_name", t("account.company_name"))}
      {field("tax_code", t("account.tax_code"))}
      {field("company_address", t("account.company_address"))}
      <button type="submit" disabled={busy} className="hv-btn hv-btn-primary w-full" aria-busy={busy}>
        {busy ? t("list_trip.msg.in_progress") : t("login_form.confirm")}
      </button>
      <p className="font-semibold text-error">{t("account.invoice_note")}</p>
    </form>
  );
}

/** Modal "Đổi thông tin xuất hoá đơn": `POST customer/customers/tax`. */
export function TaxDialog({ open, onOpenChange, customer }: { open: boolean; onOpenChange: (open: boolean) => void; customer: CustomerData }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>{t("account.change_invoice")}</DialogTitle>
        <DialogDescription className="sr-only">{t("account.change_invoice")}</DialogDescription>
        <TaxForm customer={customer} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
