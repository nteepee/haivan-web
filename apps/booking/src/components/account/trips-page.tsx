"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLocale, useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingsQuery, TRIP_TABS, type TripTab } from "@/lib/account-trips";
import { gw } from "@/lib/http";
import { localePrefix } from "@/i18n/t";
import { cancelReasonsSchema } from "@/schemas/booking";
import { bookingsPageSchema } from "@/schemas/account";
import { BookingRow } from "./booking-row";

const TAB_LABEL: Record<TripTab, string> = { 1: "trip.upcoming_trip", 2: "trip.completed", 3: "trip.cancelled_trip" };

/** /tai-khoan/chuyen-di-cua-toi/xe-lien-tinh: 3 tab trạng thái (cuộn ngang, không xuống dòng), "Xem thêm" theo `meta`, mở đơn xem vé. */
export function TripsPage() {
  const t = useT();
  const p = localePrefix(useLocale());
  const [tab, setTab] = useState<TripTab>(1);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const reasons = useQuery({ queryKey: ["account", "reasons"], staleTime: 10 * 60_000, queryFn: () => gw("list-reason", { schema: cancelReasonsSchema }) });
  const list = useInfiniteQuery({
    queryKey: ["account", "bookings", tab],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => gw("bookings", { query: bookingsQuery(tab, pageParam), schema: bookingsPageSchema }),
    getNextPageParam: (last) => (last.meta && last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
  const rows = list.data?.pages.flatMap((page) => page.data) ?? [];

  const body = (
    <>
      {list.isPending ? (
        <div className="hv-card grid gap-3 p-card" aria-busy="true">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      ) : list.isError ? (
        <div className="hv-card grid gap-3 p-card">
          <p role="alert" className="hv-notice hv-notice-error">
            <CircleAlert className="size-icon shrink-0" aria-hidden />
            <span className="font-semibold">{t("msg.err_data")}</span>
          </p>
          <button type="button" onClick={() => void list.refetch()} className="hv-btn hv-btn-outline hv-btn-sm w-fit">{t("account.retry")}</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="hv-card grid justify-items-start gap-3 p-card">
          <p className="font-semibold">{t("trip.not_trip")}</p>
          <Link href={`${p}/xe-khach`} className="hv-btn hv-btn-primary hv-btn-sm">{t("trip.find_other")}</Link>
        </div>
      ) : (
        <div className="grid gap-cards">
          {rows.map((row) => (
            <BookingRow
              key={row.booking.booking_info.code}
              row={row}
              tab={tab}
              open={openCode === row.booking.booking_info.code}
              onToggle={() => setOpenCode((c) => (c === row.booking.booking_info.code ? null : row.booking.booking_info.code))}
              reasons={reasons.data?.data ?? []}
            />
          ))}
        </div>
      )}
      {list.hasNextPage ? (
        <button type="button" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage} aria-busy={list.isFetchingNextPage} className="hv-btn hv-btn-outline w-full">
          {list.isFetchingNextPage ? t("list_trip.msg.in_progress") : t("list_trip.view_more")}
        </button>
      ) : null}
    </>
  );

  // Cột lưới minmax(0,1fr): dải tab/nút nowrap không được nới cột rộng hơn khung điện thoại.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="hv-page-title mb-0">
        <h1 className="text-h1">{t("header.my_trip")}</h1>
      </div>
      <Tabs
        value={String(tab)}
        onValueChange={(value) => {
          setTab(Number(value) as TripTab);
          setOpenCode(null);
        }}
        className="gap-6"
      >
        <TabsList aria-label={t("header.my_trip")}>
          {TRIP_TABS.map((value) => (
            <TabsTrigger key={value} value={String(value)}>
              {t(TAB_LABEL[value])}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Chỉ panel của tab đang chọn được dựng (Radix); dữ liệu theo `tab` ở query phía trên. */}
        {TRIP_TABS.map((value) => (
          <TabsContent key={value} value={String(value)} className="grid gap-6">
            {body}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
