"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TicketCard, type TicketView } from "@/components/booking/ticket-card";
import { Countdown } from "@/components/confirm/summary";
import { PageNote } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { Stepper } from "@/components/ui/stepper";
import { OrderMissing } from "./success-page";
import { localePrefix } from "@/i18n/t";
import { parseVnDateTime } from "@/lib/format";
import { ApiError, errorMessage, gw } from "@/lib/http";
import { paymentReturn, readPaymentContext, savePaymentContext, vnpayRawQuery } from "@/lib/payment-url";
import { bookingDetailSchema, infoPaymentBlockSchema, infoPaymentsSchema } from "@/schemas/booking";
import { useBookingDraft } from "@/stores/booking-draft";
import { MethodList } from "./method-list";
import { PayBar, type PayHint } from "./pay-bar";
import { PaymentSummary } from "./payment-summary";
import { TimeoutDialog } from "./timeout-dialog";

/** /xe-khach/thanh-toan dựng từ URL (cổng thanh toán quay về đây). Trạng thái đã trả lấy từ api/bookings/{code}. */
export function PaymentPage() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const ctx = readPaymentContext(params);
  const ret = paymentReturn(params);
  const verifying = ret === "verifying";
  const showPrice = (useBookingDraft((s) => s.draft?.show_price) ?? 1) !== 0;
  const [selected, setSelected] = useState(0);
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  // Gợi ý lỗi chọn thiếu hiện cạnh nút "Thanh toán" (aria-live), ngoài toast.
  const [hint, setHint] = useState<PayHint>(null);
  const p = localePrefix(locale);
  const successUrl = `${p}/xe-khach/thanh-toan/thanh-cong?booking_code=${ctx?.booking_code}&merchant_code=${ctx?.merchant_code}`;

  const info = useQuery({
    queryKey: ["info-payments", ctx],
    enabled: !!ctx,
    queryFn: async () => {
      const [methods, block] = await Promise.all([
        gw("info-payments", { query: { merchant_code: ctx!.merchant_code, trip_id: ctx!.trip_id, booking: ctx!.booking_code }, schema: infoPaymentsSchema }),
        gw("info-payment-block", { query: { merchant_code: ctx!.merchant_code }, schema: infoPaymentBlockSchema }).catch(() => null),
      ]);
      return { methods, block };
    },
  });
  const booking = useQuery({
    queryKey: ["booking", ctx?.booking_code],
    enabled: !!ctx,
    queryFn: () => gw(`bookings/${ctx!.booking_code}`, { query: { merchant_code: ctx!.merchant_code }, schema: bookingDetailSchema }),
    // Vừa quay về từ cổng (success/07): thăm dò 3×2 s chờ backend ghi nhận thanh toán.
    refetchInterval: (q) => (verifying && !q.state.data?.data.payment?.type && q.state.dataUpdateCount < 4 ? 2000 : false),
  });

  // Như web cũ: cổng báo thành công (vnp "00", PayOS PAID) → sang trang thành công ngay. Cờ `from=gateway` cho trang đó
  // biết đây là lượt quay về từ cổng: nếu backend chưa có `payment.type` thì hiện cảnh báo "không thanh toán lại" và thăm dò.
  useEffect(() => {
    if (ret === "success") router.replace(`${successUrl}&from=gateway`);
  }, [ret, router, successUrl]);
  useEffect(() => {
    if (ret === "failed") toast.warning("Thanh toán không thành công");
    if (ret === "cancelled") toast.info("Bạn đã huỷ thanh toán");
  }, [ret]);
  const paid = !!booking.data?.data.payment?.type;
  // Chỉ coi là đã trả khi backend báo `payment.type` (không tin query string).
  useEffect(() => {
    if (paid) router.replace(successUrl);
  }, [paid, router, successUrl]);

  if (!ctx) return <OrderMissing />;
  const failed = info.error ?? booking.error;
  if (failed) {
    return (
      <div className="hv-container hv-app-main grid max-w-md justify-items-center gap-3 text-center">
        <p role="alert" className="hv-err justify-center text-16">
          <CircleAlert className="size-icon shrink-0" aria-hidden />
          <span>{failed instanceof ApiError ? errorMessage(failed.body, failed.message) : t("booking_infor.msg.msg_error_occurred")}</span>
        </p>
        <button type="button" onClick={() => { void info.refetch(); void booking.refetch(); }} className="hv-btn hv-btn-primary">{t("account.retry")}</button>
      </div>
    );
  }
  if (!info.data || !booking.data) return <PageNote role="status">{verifying ? t("ux.verifying") : t("payment.msg.in_progress")}</PageNote>;
  if (verifying && !paid) {
    return (
      <div className="hv-container hv-app-main grid max-w-md justify-items-center gap-3 text-center">
        <p className="font-semibold">{t("ux.verifying")}</p>
        <p role="status" className="text-text">
          Hệ thống chưa ghi nhận thanh toán của đơn {ctx.booking_code}. <strong>Vui lòng không thanh toán lại</strong>; bấm làm mới sau ít giây.
        </p>
        <button type="button" disabled={booking.isFetching} onClick={() => void booking.refetch()} className="hv-btn hv-btn-primary">
          {booking.isFetching ? <Loader2 className="size-icon animate-spin" aria-hidden /> : null}
          Làm mới
        </button>
      </div>
    );
  }

  const data = booking.data.data;
  const tickets = data.tickets as unknown as TicketView[];
  const createdAt = parseVnDateTime(data.created_at);
  const deadline = Number.isFinite(createdAt) ? createdAt + 600_000 : Number.POSITIVE_INFINITY;
  const timed = data.method_payment_type === 0 && Number.isFinite(deadline);
  const customer = (data as { customer?: { phone?: string } }).customer;
  const routeId = (tickets[0]?.trip?.node?.route as { id?: number } | undefined)?.id;

  const pay = async (radio = selected, bankCode = bank) => {
    if (busy) return;
    if (!radio) {
      setHint("method");
      return toast.warning(t("payment.msg.pls_select_payment"));
    }
    if ((radio === 1 || radio === 2) && !bankCode) {
      setHint("bank");
      return toast.warning(t("payment.msg.pls_select_bank"));
    }
    setHint(null);
    setBusy(true);
    savePaymentContext(ctx);
    try {
      if (radio === 1 || radio === 2 || radio === 5) {
        const res = (await gw("payment/vnpay", { rawQuery: vnpayRawQuery({ href: window.location.href, bookingCode: ctx.booking_code, bankCode: radio === 5 ? "VNPAYQR" : bankCode, merchantCode: ctx.merchant_code, tripId: ctx.trip_id }) })) as { url?: string };
        if (res.url?.startsWith("https://")) return void (window.location.href = res.url); // giữ busy khi rời trang
        toast.warning(t("booking_infor.msg.msg_error_occurred"));
      } else if (radio === 6) {
        const res = (await gw("payment/payos", { query: { merchant_code: ctx.merchant_code, order_code: ctx.booking_code } })) as { data?: { checkoutUrl?: string } };
        if (res.data?.checkoutUrl?.startsWith("https://")) return void (window.location.href = res.data.checkoutUrl);
        toast.warning(t("booking_infor.msg.msg_error_occurred"));
      } else {
        await gw(`update-booking/${ctx.booking_code}`, { method: "POST", query: { merchant_code: ctx.merchant_code }, body: { method_payment: radio === 3 ? 2 : 3 } });
        return router.push(successUrl);
      }
    } catch (error) {
      toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_error_occurred"));
    }
    setBusy(false);
  };

  const block = info.data.block as { status?: boolean; data?: { use_payment_blocked_time_start?: string; use_payment_blocked_time_end?: string; configs?: { ticket_canceled_nums?: number } } } | null;
  return (
    <>
      {timed ? <Countdown deadline={deadline} onExpire={() => undefined} label={t("payment.count_time")} /> : null}
      <div className="hv-container hv-app-main">
        <Stepper current={3} />
        <div className="hv-page-title">
          <h1 className="text-h1">{t("payment.select_payment")}</h1>
        </div>
        <div className="hv-results-grid">
          <div className="grid min-w-0 gap-4">
            {block?.status ? (
              <p role="alert" className="hv-notice hv-notice-error font-semibold">
                <CircleAlert className="size-icon shrink-0" aria-hidden />
                <span>
                  {t("payment.msg.msg_block_booking")
                    .replace("xxx", String(block.data?.configs?.ticket_canceled_nums ?? ""))
                    .replace("yyy", (block.data?.use_payment_blocked_time_start ?? "").slice(0, 10).split("-").reverse().join("-"))
                    .replace("zzz", (block.data?.use_payment_blocked_time_end ?? "").slice(0, 10).split("-").reverse().join("-"))}
                </span>
              </p>
            ) : null}
            <MethodList
              methods={info.data.methods}
              selected={selected}
              bank={bank}
              onSelect={(v) => { setSelected(v); setBank(""); setHint(null); }}
              onBank={(code, now) => { setBank(code); setHint(null); if (now) void pay(selected, code); }}
              bookingCode={ctx.booking_code}
              phone={customer?.phone ?? ""}
              routeId={routeId}
              paid={data.payment?.type !== 0}
              cashOnly={!showPrice}
            />
          </div>
          <aside className="hv-results-aside grid gap-4 lg:max-h-[calc(100dvh-var(--s-8))] lg:overflow-y-auto" aria-label={t("payment.select_payment")}>
            <PayBar hint={hint} busy={busy} total={showPrice ? data.price : null} onPay={() => void pay()} />
            {showPrice ? <PaymentSummary tickets={tickets} total={data.price} /> : null}
            {tickets.map((tk) => <TicketCard key={tk.id} ticket={tk} showPrice={showPrice} />)}
          </aside>
        </div>
      </div>
      {timed ? <TimeoutDialog deadline={deadline} partner={params.get("partner") === "1"} /> : null}
    </>
  );
}
