"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleAlert, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBookingConfig } from "@/components/booking-config-provider";
import { useLocale, useT } from "@/components/providers";
import { Stepper } from "@/components/ui/stepper";
import { StickyBar } from "@/components/ui/sticky-bar";
import { selectedServices, surcharge, type PricedService } from "@/lib/bonus-services";
import { buildBookingBody, seatsTotal, transitValues, validateCustomer, validateInvoice, type Customer, type Invoice } from "@/lib/booking-body";
import { hasHomeTransit, holdTransitBody } from "@/lib/confirm-queries";
import { findCorridor, pickupNote } from "@/lib/corridors";
import { eligibleAutoPromo } from "@/lib/promo-apply";
import { ApiError, gw } from "@/lib/http";
import { formatMoney } from "@/lib/format";
import { saveReturnCarry } from "@/lib/roundtrip-carry";
import { localePrefix } from "@/i18n/t";
import { useBookingDraft, type BookingDraft } from "@/stores/booking-draft";
import type { Promotion } from "@/schemas/promotion";
import { AutoPromo, autoPromoDismissed } from "./auto-promo";
import { BonusServices } from "./bonus-services";
import { CustomerForm, fieldErrors, InvoiceForm } from "./customer-forms";
import { PromoBox } from "./promo-dialog";
import { Countdown, PriceSummary, TripSummary } from "./summary";

interface CustomerData {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  invoice_info?: { company_name?: string | null; company_address?: string | null; tax_code?: string | null; email?: string | null } | null;
  account?: { balance?: number | null } | null;
}

interface Props {
  draft: BookingDraft;
  customerData: CustomerData | null;
  promotions: Promotion[];
  services: PricedService[];
  onExpire: () => void;
}

export function ConfirmForm({ draft, customerData, promotions, services: initialServices, onExpire }: Props) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const updateSeats = useBookingDraft((s) => s.updateSeats);
  const [customer, setCustomer] = useState<Customer>({ name: customerData?.name ?? "", phone: customerData?.phone ?? "", email: customerData?.email ?? null });
  const config = useBookingConfig();
  // Tìm chuyến theo tuyến chính: ghi chú điền sẵn "Đón: <trạm>; Trả: <trạm>" (khách sửa được).
  const [note, setNote] = useState(() => {
    const own = draft.search.corridor;
    const corridor = findCorridor(config, own?.tuyen);
    return own && corridor ? pickupNote(corridor, own) : "";
  });
  // Chương trình tự áp: quyết định một lần lúc vào trang; trong lúc đang kiểm với server, khoá "Tiếp tục" và hộp khuyến mãi.
  const [autoPromo] = useState(() => (autoPromoDismissed(draft.order_code) ? null : eligibleAutoPromo(config, draft)));
  const [promoPending, setPromoPending] = useState(autoPromo !== null);
  const settlePromo = useCallback(() => setPromoPending(false), []);
  const [invoiceOn, setInvoiceOn] = useState(false);
  const [kind, setKind] = useState<1 | 2>(1);
  const inv = customerData?.invoice_info;
  const [invoice, setInvoice] = useState<Invoice>({ name: inv?.company_name ?? "", address: inv?.company_address ?? "", code: inv?.tax_code ?? "", email: inv?.email ?? "" });
  const [services, setServices] = useState(initialServices);
  const { valueStart, valueEnd } = transitValues(draft);
  const [submitted, setSubmitted] = useState(false);
  // Câu tổng báo thiếu thông tin (nhãn nghiệp vụ cũ) hiện cạnh nút "Tiếp tục"; chi tiết từng ô nằm dưới ô.
  const [formError, setFormError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const showServices = hasHomeTransit(draft) && (draft.transit.departure || draft.transit.destination) && services.length > 0;

  const book = useMutation({
    mutationFn: (body: Record<string, unknown>) => gw("bookings", { method: "POST", body }),
    onSuccess: () => {
      // Khứ hồi: nhớ ý định chiều về theo mã đơn để trang thành công mời đặt chiều về.
      saveReturnCarry(draft.order_code, draft.search.corridor, draft.seats.length);
      // Như web cũ: hold-transit sau mọi booking thành công, không chờ.
      void gw("v4/hold-transit", { method: "POST", body: holdTransitBody(draft, selectedServices(services)) }).catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 400) toast.warning(e.message);
      });
      const p = localePrefix(locale);
      router.push(
        seatsTotal(draft.seats) === 0
          // Web cũ không gửi merchant_code ở đường 0đ, nhưng apigw `bookings/{code}` nay bắt buộc nó (422) nên ta mang theo.
          ? `${p}/xe-khach/thanh-toan/thanh-cong?booking_code=${draft.order_code}&merchant_code=${draft.trip_info.merchant.code}`
          : `${p}/xe-khach/thanh-toan?booking_code=${draft.order_code}&merchant_code=${draft.trip_info.merchant.code}&trip_id=${draft.trip.trip_id}`,
      );
    },
    onError: (error) => toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_error_occurred")),
  });

  const submit = () => {
    if (book.isPending || book.isSuccess || promoPending) return;
    // Đặt vé luôn đã đăng nhập (giữ chỗ cần token) → web cũ luôn có if_customer và bắt nhập đủ tên + SĐT.
    const c = customer;
    const invalid = validateCustomer(c) ?? validateInvoice(invoiceOn ? invoice : null, kind);
    setSubmitted(true);
    setFormError(invalid ? t(invalid) : "");
    if (invalid) {
      // Lỗi hiện ngay dưới ô (không toast); focus ô sai đầu tiên sau khi lỗi đã render.
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    book.mutate(buildBookingBody(draft, { customer: c, invoice: invoiceOn ? invoice : null, note }));
  };

  const errors = submitted ? fieldErrors(customer, invoiceOn ? invoice : null, kind, t) : {};
  const pending = book.isPending || book.isSuccess || promoPending;

  const total = seatsTotal(draft.seats) + surcharge(services);
  const showPrice = draft.show_price !== 0;

  // Điện thoại: đồng hồ dính đỉnh, thanh đáy cố định (tổng + "Tiếp tục"). Từ 60rem: thẻ tóm tắt dính cột phải, thanh đáy thành thẻ nút.
  return (
    <div ref={root}>
      <Countdown deadline={draft.expiresAt} onExpire={onExpire} label={t("booking_infor.count_time")} />
      <div className="hv-container hv-app-main">
        <Stepper current={2} />
        <div className="hv-page-title">
          <h1 className="text-h1">{t("booking_infor.check_ticket")}</h1>
        </div>
        <div className="hv-results-grid">
          <div className="grid min-w-0 gap-6">
            <CustomerForm customer={customer} note={note} errors={errors} onCustomer={setCustomer} onNote={setNote} />
            {showServices ? <BonusServices draft={draft} services={services} onChange={setServices} /> : null}
            <InvoiceForm enabled={invoiceOn} kind={kind} invoice={invoice} errors={errors} onEnabled={setInvoiceOn} onKind={setKind} onInvoice={setInvoice}>
              <AutoPromo draft={draft} promo={autoPromo} onApply={updateSeats} onSettled={settlePromo} />
              <PromoBox draft={draft} promotions={promotions} points={customerData?.account?.balance ?? 0} onApply={updateSeats} disabled={promoPending} />
            </InvoiceForm>
            <p className="max-w-prose text-14 text-muted">{t("booking_infor.privacy_policy")}</p>
          </div>
          <aside className="hv-results-aside grid gap-4" aria-label={t("booking_infor.check_ticket")}>
            <div className="hv-card grid gap-4 p-card">
              <TripSummary draft={draft} valueStart={valueStart} valueEnd={valueEnd} />
              <PriceSummary seats={draft.seats} surcharge={surcharge(services)} show={showPrice} />
            </div>
            <StickyBar>
              <div className="hv-sticky-inner">
                {showPrice ? (
                  <p className="hv-sticky-sum lg:hidden">
                    <span className="hv-sticky-label">{t("booking_infor.total")}</span>
                    <span className="hv-total">{formatMoney(total)}</span>
                  </p>
                ) : null}
                <button type="button" onClick={submit} aria-busy={pending} disabled={pending} className="hv-btn hv-btn-primary hv-btn-lg lg:w-full">
                  {book.isPending ? <Loader2 className="size-icon animate-spin" aria-hidden /> : null}
                  {book.isPending ? t("list_trip.msg.in_progress") : <>{t("booking_infor.continue")}{" "}</>}
                  {book.isPending ? null : <ChevronRight className="size-icon" aria-hidden />}
                </button>
                {formError && Object.keys(errors).length > 0 ? (
                  <p role="alert" className="hv-err hv-sticky-msg mt-0">
                    <CircleAlert className="size-icon shrink-0" aria-hidden />
                    {formError}
                  </p>
                ) : null}
              </div>
            </StickyBar>
          </aside>
        </div>
      </div>
    </div>
  );
}
