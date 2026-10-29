"use client";

import { useState, type ReactNode } from "react";
import { useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBirthday } from "@/lib/account-profile";
import { ProfileDialog } from "./profile-dialog";
import { TaxDialog } from "./tax-dialog";
import { useCustomer } from "./use-customer";

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const t = useT();
  return (
    <section className="hv-card overflow-hidden">
      <h2 className="border-b border-rule bg-paper-2 px-card py-3 text-18 font-extrabold">{title}</h2>
      <dl className="grid gap-1 px-card py-3">{children}</dl>
      <div className="flex justify-end px-card pb-card">
        <button type="button" onClick={onEdit} className="hv-btn hv-btn-outline hv-btn-sm">
          {t("account.edit")}
        </button>
      </div>
    </section>
  );
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col py-1 sm:flex-row sm:gap-6">
    <dt className="text-14 font-semibold text-muted sm:w-40 sm:shrink-0 sm:text-16">{label}</dt>
    <dd className="min-w-0 flex-1 font-semibold break-words">{value}</dd>
  </div>
);

/** /tai-khoan/thong-tin-ca-nhan: hồ sơ + thông tin xuất hoá đơn; "Sửa" mở modal; chưa là thành viên thân thiết thì có nút đăng ký. */
export function ProfilePage() {
  const t = useT();
  const query = useCustomer();
  const [dialog, setDialog] = useState<"profile" | "tax" | null>(null);
  const c = query.data?.data;
  if (query.isPending) return <Skeleton className="h-96" />;
  if (!c) return <p role="alert" className="hv-notice hv-notice-error font-semibold">{t("msg.err_data")}</p>;
  const invoice = c.invoice_info;
  const registered = !!c.subscribe_loyalty;

  return (
    <div className="grid gap-6">
      <h1 className="text-h1">{t("header.personal_infor")}</h1>
      {!registered ? (
        <div className="hv-notice flex-wrap items-center justify-between p-card">
          <p>
            <b>{t("msg.register_loyalty")}</b>
            <span className="block">{t("msg.msg_ticket_free")}</span>
          </p>
          <button type="button" onClick={() => setDialog("profile")} className="hv-btn hv-btn-primary hv-btn-sm shrink-0">
            {t("booking_infor.register_loyalty")}
          </button>
        </div>
      ) : null}
      <Section title={t("header.personal_infor")} onEdit={() => setDialog("profile")}>
        <Row label={t("booking_infor.title")} value={c.title?.text} />
        <Row label={t("booking_infor.full_name")} value={c.name === c.phone ? t("booking_infor.full_name") : c.name} />
        <Row label={t("booking_infor.mobile_phone")} value={c.phone} />
        <Row label={t("booking_infor.date_of_birth")} value={formatBirthday(c.date_of_birth)} />
        <Row label={t("booking_infor.address")} value={c.address} />
        <Row label={t("booking_infor.province_city")} value={c.province?.name} />
        <Row label={t("booking_infor.district")} value={c.district?.name} />
        <Row label={t("booking_infor.email")} value={c.email} />
        <Row label={t("booking_infor.profession")} value={c.occupation?.text} />
        <Row label={t("booking_infor.reason_for_travel")} value={c.travel_purpose?.text} />
      </Section>
      <Section title={t("booking_infor.invoicing_details")} onEdit={() => setDialog("tax")}>
        <Row label={t("account.invoice_email")} value={invoice?.email} />
        <Row label={t("account.company_name")} value={invoice?.company_name} />
        <Row label={t("account.tax_code")} value={invoice?.tax_code} />
        <Row label={t("account.company_address")} value={invoice?.company_address} />
      </Section>
      <ProfileDialog
        open={dialog === "profile"}
        onOpenChange={(o) => !o && setDialog(null)}
        customer={c}
        title={registered ? t("account.change_info") : t("booking_infor.register_loyalty")}
      />
      <TaxDialog open={dialog === "tax"} onOpenChange={(o) => !o && setDialog(null)} customer={c} />
    </div>
  );
}
