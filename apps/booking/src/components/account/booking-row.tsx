"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, CircleAlert, CircleX } from "lucide-react";
import Link from "next/link";
import { useLocale, useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCreatedDate, isPriceHidden, payUrl, rowBadge, type TripTab } from "@/lib/account-trips";
import { formatMoney } from "@/lib/format";
import { gw } from "@/lib/http";
import { localePrefix } from "@/i18n/t";
import { bookingFullSchema, type BookingRowData } from "@/schemas/account";
import { BookingDetail } from "./booking-detail";
import type { CancelReason } from "./cancel-dialog";

interface Props {
  row: BookingRowData;
  tab: TripTab;
  open: boolean;
  onToggle: () => void;
  reasons: CancelReason[];
}

/** Một đơn trong danh sách: tiêu đề (mã, ngày, nhãn/nút thanh toán), mở ra thì tải chi tiết `bookings/{code}`. */
export function BookingRow({ row, tab, open, onToggle, reasons }: Props) {
  const t = useT();
  const p = localePrefix(useLocale());
  const info = row.booking.booking_info;
  const first = row.booking.booking_ticket[0];
  const merchantCode = row.merchant.code;
  const detail = useQuery({
    queryKey: ["account", "booking", info.code],
    enabled: open,
    queryFn: () => gw(`bookings/${info.code}`, { query: { merchant_code: merchantCode }, schema: bookingFullSchema }),
  });
  const hidePrice = isPriceHidden(first?.route?.code);
  const badge = rowBadge(info, { detailPrice: open ? detail.data?.data.price : undefined, hidePrice });

  const total = hidePrice ? null : (open && detail.data ? detail.data.data.price : info.total_money);
  return (
    <section className="hv-card overflow-hidden" aria-label={`${t("trip.order_code")} ${info.code}`}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 border-b border-rule bg-paper-2 px-card py-2">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-control min-w-0 items-center gap-3 text-left">
          <ChevronDown className={`size-icon shrink-0 ${open ? "" : "-rotate-90"}`} aria-hidden />
          <span className="text-14 text-muted">
            {t("trip.order_code")}
            <b className="block text-16 text-ink tabular-nums">{info.code}</b>
          </span>
          <span className="text-14 text-muted">
            {t("trip.order_date")}
            <b className="block text-16 text-ink tabular-nums">{formatCreatedDate(info.created_at)}</b>
          </span>
        </button>
        {badge.kind === "cancelled" ? (
          <span className="hv-tag hv-tag-out"><CircleX className="size-4" aria-hidden />{t("trip.cancelled")}</span>
        ) : badge.kind === "paid" ? (
          <span className="hv-tag hv-tag-ok"><Check className="size-4" aria-hidden />{t("trip.paid")}</span>
        ) : badge.kind === "pay" ? (
          <span className="hv-tag hv-tag-bad"><CircleAlert className="size-4" aria-hidden />{t("trip.unpaid")}</span>
        ) : null}
      </header>
      {badge.kind === "pay" || (total != null && total > 0) ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-card">
          {total != null && total > 0 ? (
            <p>
              <span className="block text-14 font-semibold text-muted">{t("trip.total_price")}</span>
              <span className="text-20 font-extrabold text-ink tabular-nums">{formatMoney(total)}</span>
            </p>
          ) : <span />}
          {badge.kind === "pay" ? (
            <Link href={payUrl(p, info.code, merchantCode, first?.trip_id)} className="hv-btn hv-btn-primary hv-btn-sm">
              {t("trip.payment")}
              {badge.amount != null ? <span className="tabular-nums">{formatMoney(badge.amount)}</span> : null}
            </Link>
          ) : null}
        </div>
      ) : null}
      {open ? (
        <div className="border-t border-rule">
          {detail.data ? (
            <BookingDetail
              detail={{ ...detail.data.data, merchant_code: detail.data.data.merchant_code ?? merchantCode }}
              merchantCode={merchantCode}
              reasons={reasons}
              paid={!!info.status_payment}
              showBill={tab === 2}
            />
          ) : detail.isError ? (
            <p role="alert" className="hv-err p-card">
              <CircleAlert className="size-icon shrink-0" aria-hidden />
              {t("msg.err_data")}
            </p>
          ) : (
            <div className="p-card" aria-busy="true"><Skeleton className="h-40" /></div>
          )}
        </div>
      ) : null}
    </section>
  );
}
