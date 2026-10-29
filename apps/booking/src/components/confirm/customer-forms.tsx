"use client";

import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import { useT } from "@/components/providers";
import { FieldError } from "@/components/ui/field-error";
import type { Customer, Invoice } from "@/lib/booking-body";

export type FieldErrors = Partial<Record<"name" | "phone" | "invEmail" | "invName" | "invCode" | "invAddress", string>>;

/** Lỗi theo từng ô (cùng điều kiện với validateCustomer/validateInvoice): hiện dưới ô sau lần "Tiếp tục" đầu và tự hết khi sửa đúng. */
export function fieldErrors(customer: Customer, invoice: Invoice | null, kind: 1 | 2, t: (key: string) => string): FieldErrors {
  const errors: FieldErrors = {};
  if (!customer.name) errors.name = t("ux.need_name");
  if (!customer.phone) errors.phone = t("ux.need_phone");
  if (invoice) {
    if (!invoice.email) errors.invEmail = t("ux.need_field");
    if (!invoice.name) errors.invName = t("ux.need_field");
    if (kind === 2 && !invoice.code) errors.invCode = t("ux.need_field");
    if (!invoice.address) errors.invAddress = t("ux.need_field");
  }
  return errors;
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: (a: { id: string; describedBy: string; invalid: true | undefined }) => React.ReactNode;
}

/** Nhãn hiện trên ô (không dùng placeholder làm nhãn); lỗi nằm ngoài `<label>` để không lẫn vào tên ô. */
function Field({ label, required, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="hv-label">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      {children({ id, describedBy: `${id}-err`, invalid: error ? true : undefined })}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

/** "Thông tin của bạn": họ tên, SĐT, email, ghi chú (điền sẵn từ hồ sơ như web cũ). */
export function CustomerForm({ customer, note, errors, onCustomer, onNote }: { customer: Customer; note: string; errors: FieldErrors; onCustomer: (c: Customer) => void; onNote: (n: string) => void }) {
  const t = useT();
  return (
    <section className="hv-card grid gap-field p-card">
      <h2 className="text-20 font-extrabold">{t("booking_infor.your_infor")}</h2>
      <div className="grid gap-field sm:grid-cols-2">
      <Field label={t("booking_infor.full_name")} required error={errors.name}>
        {(a) => <input id={a.id} className="hv-field" value={customer.name} onChange={(e) => onCustomer({ ...customer, name: e.target.value })} autoComplete="name" aria-invalid={a.invalid} aria-describedby={a.describedBy} />}
      </Field>
      <Field label={t("booking_infor.mobile_phone")} required error={errors.phone}>
        {(a) => <input id={a.id} className="hv-field" value={customer.phone} onChange={(e) => onCustomer({ ...customer, phone: e.target.value })} inputMode="tel" autoComplete="tel" aria-invalid={a.invalid} aria-describedby={a.describedBy} />}
      </Field>
      </div>
      <Field label={t("booking_infor.email")}>
        {(a) => <input id={a.id} className="hv-field" value={customer.email ?? ""} onChange={(e) => onCustomer({ ...customer, email: e.target.value || null })} type="email" inputMode="email" autoComplete="email" />}
      </Field>
      <Field label={t("booking_infor.notes")}>
        {(a) => <textarea id={a.id} className="hv-field h-16" value={note} onChange={(e) => onNote(e.target.value)} placeholder={t("booking_infor.msg.pls_insert_note")} />}
      </Field>
    </section>
  );
}

interface InvoiceProps {
  enabled: boolean;
  kind: 1 | 2;
  invoice: Invoice;
  errors: FieldErrors;
  onEnabled: (v: boolean) => void;
  onKind: (k: 1 | 2) => void;
  onInvoice: (i: Invoice) => void;
  /** Nút phụ cuối thẻ (vd. "Dùng mã hoặc điểm"). */
  children?: ReactNode;
}

/** Hàng bấm được >= 48px cho checkbox/radio; hộp 24px accent ink. Hàng radio chọn = nền select + vòng chọn + dấu tick (không viền ink). */
const choiceRow = "flex min-h-control cursor-pointer items-center gap-3";
const optRow = `${choiceRow} rounded-1 bg-paper-2 px-4 hover:bg-accent-soft has-checked:bg-select has-checked:select-ring`;
const choiceBox = "size-icon shrink-0 accent-ink";

/** "Thông tin xuất hóa đơn": cá nhân (tên, địa chỉ, email) / doanh nghiệp (+ mã số thuế). */
export function InvoiceForm({ enabled, kind, invoice, errors, onEnabled, onKind, onInvoice, children }: InvoiceProps) {
  const t = useT();
  type A = { id: string; describedBy: string; invalid: true | undefined };
  const input = (key: keyof Invoice, a: A, mode?: "email") => (
    <input id={a.id} className="hv-field" value={invoice[key]} onChange={(e) => onInvoice({ ...invoice, [key]: e.target.value })} type={mode} inputMode={mode} aria-invalid={a.invalid} aria-describedby={a.describedBy} />
  );
  return (
    <section className="hv-card grid gap-field p-card" aria-labelledby="invoice-title">
      <h2 id="invoice-title" className="sr-only">{t("booking_infor.invoicing_details")}</h2>
      <div className="grid gap-field">
        <label className={`${choiceRow} min-h-tap font-semibold`}>
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} className={choiceBox} />
          {t("booking_infor.get_invoices")}
        </label>
        {enabled ? (
          <>
            <div className="grid gap-field sm:grid-cols-2">
              {([1, 2] as const).map((k) => (
                <label key={k} className={optRow}>
                  <input type="radio" name="invoice-kind" checked={kind === k} onChange={() => onKind(k)} className={choiceBox} />
                  <span className="flex-1">{t(k === 1 ? "booking_infor.individual" : "booking_infor.coporate")}</span>
                  {kind === k ? <Check className="size-icon shrink-0" strokeWidth={3} aria-hidden /> : null}
                </label>
              ))}
            </div>
            <Field label={t("booking_infor.e_invoice")} required error={errors.invEmail}>
              {(a) => input("email", a, "email")}
            </Field>
            <Field label={t("booking_infor.customer_invoice")} required error={errors.invName}>
              {(a) => input("name", a)}
            </Field>
            <Field label={t("booking_infor.tax_ID")} required={kind === 2} error={errors.invCode}>
              {(a) => input("code", a)}
            </Field>
            <Field label={t("booking_infor.invoicing_address")} required error={errors.invAddress}>
              {(a) => input("address", a)}
            </Field>
            <p className="font-semibold text-error">{t("booking_infor.note_invoices")}</p>
          </>
        ) : null}
        {children}
      </div>
    </section>
  );
}
