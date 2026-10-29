"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Check, CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { TicketCard, type TicketView } from "@/components/booking/ticket-card";
import Link from "next/link";
import { PageNote, StatusPage } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { localePrefix } from "@/i18n/t";
import { formatMoney } from "@/lib/format";
import { gw } from "@/lib/http";
import { bookingDetailSchema } from "@/schemas/booking";
import { ReturnCta } from "./return-cta";
import { useBookingDraft } from "@/stores/booking-draft";

/** Thiếu mã đơn: thẻ có h1, một câu và nút chính về đặt vé (dùng chung với trang thanh toán). */
export function OrderMissing() {
  const t = useT();
  const locale = useLocale();
  return (
    <StatusPage title={t("confirmed.order_missing_title")} text={t("confirmed.order_missing_text")}>
      <Link href={`${localePrefix(locale)}/xe-khach`} className="hv-btn hv-btn-primary">
        {t("account.book_ticket_cta")}
      </Link>
    </StatusPage>
  );
}

/** /xe-khach/thanh-toan/thanh-cong: "Đặt chỗ thành công" + trạng thái thanh toán theo `payment.type`, vé có QR. */
export function SuccessPage() {
  const t = useT();
  const locale = useLocale();
  const params = useSearchParams();
  const code = params.get("booking_code") ?? "";
  const merchantParam = params.get("merchant_code") ?? undefined;
  const draft = useBookingDraft((s) => s.draft);
  const clear = useBookingDraft((s) => s.clear);
  const showPrice = (draft?.show_price ?? 1) !== 0;
  // Trang đặt cờ `from=gateway` khi cổng báo thành công (vnp "00", PayOS PAID): chỉ tin `payment.type` của backend.
  const fromGateway = params.get("from") === "gateway";
  const queryKey = ["booking-success", code];
  const queryClient = useQueryClient();

  const booking = useQuery({
    queryKey,
    enabled: !!code,
    // Vừa quay về từ cổng mà backend chưa ghi nhận thanh toán: thăm dò mỗi 2 s, tối đa 4 lần cập nhật.
    refetchInterval: (q) => (fromGateway && !q.state.data?.data.payment?.type && q.state.dataUpdateCount < 4 ? 2000 : false),
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1500)); // web cũ chờ 1,5 s cho backend cập nhật
      // Đơn 0đ (không qua thanh toán) từ link cũ không mang merchant_code mà apigw bắt buộc (422): lấy từ nháp của chính đơn này.
      const saved = useBookingDraft.getState().draft;
      const merchant = merchantParam ?? (saved?.order_code === code ? saved.trip_info.merchant.code : undefined);
      return gw(`bookings/${code}`, { query: { merchant_code: merchant }, schema: bookingDetailSchema });
    },
  });

  useEffect(() => {
    if (booking.data && draft?.order_code === code) clear();
  }, [booking.data, draft?.order_code, code, clear]);

  if (!code) return <OrderMissing />;
  if (booking.isError) {
    return (
      <div className="hv-container hv-app-main grid max-w-md justify-items-center gap-3 text-center">
        <p role="alert" className="hv-err">{booking.error.message}</p>
        <button type="button" onClick={() => void booking.refetch()} className="hv-btn hv-btn-primary">{t("account.retry")}</button>
      </div>
    );
  }
  if (!booking.data) return <PageNote role="status">{t("payment.msg.in_progress")}</PageNote>;
  const data = booking.data.data;
  const customer = (data as { customer?: { name?: string; phone?: string } }).customer;
  const paid = !!data.payment?.type;
  const verifying = fromGateway && !paid;
  const polling = verifying && (queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0) < 4;

  return (
    <div className="hv-container hv-app-main grid max-w-3xl gap-6">
      <header className="hv-card grid gap-3 p-card text-center">
        <span className="hv-ico hv-ico-leaf mx-auto size-16">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        {verifying ? (
          <p role="status" className="hv-notice justify-center text-left font-semibold">
            {polling ? <Loader2 className="size-icon shrink-0 animate-spin" aria-hidden /> : <CircleAlert className="size-icon shrink-0" aria-hidden />}
            <span>
              {t("ux.verifying")} <strong className="font-extrabold">{t("ux.do_not_repay")}</strong>
            </span>
          </p>
        ) : null}
        <h1 className="text-h2">{t("confirmed.booking_confirm")}</h1>
        <p>{t("confirmed.msg_confirm_thanks1")}</p>
        <p className="text-muted">{t("confirmed.msg_confirm_thanks2")}</p>
        <dl className="mx-auto grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-1 text-left">
          <dt className="text-muted">{t("confirmed.passengers")}</dt><dd className="font-semibold">{customer?.name}</dd>
          <dt className="text-muted">{t("confirmed.phone")}</dt><dd className="font-semibold">{customer?.phone}</dd>
          {showPrice ? (<><dt className="text-muted">{t("confirmed.total_price")}</dt><dd className="text-20 font-extrabold text-ink tabular-nums">{formatMoney(data.price)}</dd></>) : null}
        </dl>
        <p className="flex flex-wrap items-center justify-center gap-3">
          <span className={`hv-tag ${paid ? "hv-tag-ok" : "hv-tag-bad"}`}>
            {paid ? <Check className="size-4" aria-hidden /> : <CircleAlert className="size-4" aria-hidden />}
            {t(paid ? "confirmed.paid" : "confirmed.unpaid")}
          </span>
          {!paid ? <button type="button" onClick={() => void booking.refetch()} className="hv-btn hv-btn-outline hv-btn-sm">Làm mới</button> : null}
        </p>
      </header>
      <ReturnCta order={code} tickets={data.tickets.length} paid={paid} />
      {(data.tickets as unknown as TicketView[]).map((tk) => <TicketCard key={tk.id} ticket={tk} showQr showPrice={showPrice} />)}
      <section className="hv-card grid gap-2 p-card">
        <h2 className="text-20 font-extrabold">{t("confirmed.note")}</h2>
        <p>{t("confirmed.msg_note1")} <a href="tel:19006763" className="font-extrabold underline">1900 6763</a></p>
        <p>
          {t("confirmed.msg_note2")} <a href={`${localePrefix(locale)}/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh`} className="hv-link text-link">{t("confirmed.my_trip")}</a>
        </p>
      </section>
    </div>
  );
}
