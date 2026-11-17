"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { logStep, serverLog } from "@/lib/track";
import notFoundImg from "@/assets/notfound.png";
import { useT } from "@/components/providers";
import { useTrips } from "@/hooks/use-trips";
import type { SearchParamsData } from "@/lib/search-url";
import { applyTripFilters, classOptions, EMPTY_FILTERS, type TripFilters, type TripPreference } from "@/lib/trip-filters";
import { TripCard } from "./trip-card";
import { TripFilterBar } from "./trip-filter-bar";

/**
 * Danh sách chuyến + hàng lọc/sắp xếp phía client + "Xem thêm" (vẫn tải thêm trang; bộ lọc áp dụng cho phần đã tải);
 * rỗng → màn "RẤT TIẾC" như web cũ; lỗi tải (apigw chậm/không phản hồi) → báo lỗi riêng kèm nút thử lại, không giả làm "hết chuyến".
 */
/** `legTitle`: tiêu đề chặng cho thẻ chuyến ở trang tuyến (xem TripCard). */
export function TripList({ search, legTitle, prefer }: { search: SearchParamsData; legTitle?: string; prefer?: TripPreference }) {
  const t = useT();
  const trips = useTrips(search);
  const items = useMemo(() => trips.data?.pages.flatMap((p) => p.data) ?? [], [trips.data]);
  // Khung giờ chọn từ chip "Chuyến hôm nay" (query riêng `gio`) là bộ lọc ban đầu.
  const gio = search.corridor?.gio ?? null;
  const [filters, setFilters] = useState<TripFilters>(() => (gio ? { ...EMPTY_FILTERS, buckets: [gio] } : EMPTY_FILTERS));
  const classes = useMemo(() => classOptions(items), [items]);
  const visible = useMemo(() => applyTripFilters(items, filters, prefer), [items, filters, prefer]);
  // Bước "xem danh sách chuyến": một lần mỗi danh sách, khi có chuyến đầu tiên.
  const listSeen = useRef(false);
  useEffect(() => {
    if (items.length && !listSeen.current) {
      listSeen.current = true;
      serverLog("trip_list_view");
    }
  }, [items.length]);
  // Lỗi tải danh sách (khác "không có chuyến") → nhật ký máy chủ, để thấy apigw chậm/treo từ phía khách.
  useEffect(() => {
    if (trips.isError) logStep("tai-danh-sach-chuyen", 0, String(trips.error));
  }, [trips.isError, trips.error]);
  // Tuyến ưu tiên có thể nằm ở trang sau của API (10 chuyến/trang): tải hết các trang để xếp đúng ngay từ đầu.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = trips;
  useEffect(() => {
    if (prefer?.route && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [prefer?.route, hasNextPage, isFetchingNextPage, fetchNextPage]);
  // Một hàng mở tại một thời điểm: thẻ tổng ở cột phải thuộc về hàng đang mở.
  const [openId, setOpenId] = useState<number | null>(null);
  // Đổi bộ lọc làm hàng đang mở biến mất thì đóng luôn (không mở lại ngầm khi bỏ lọc).
  const changeFilters = (next: TripFilters) => {
    setFilters(next);
    if (openId !== null && !applyTripFilters(items, next, prefer).some((trip) => trip.id === openId)) setOpenId(null);
  };

  if (trips.isPending) {
    return (
      <div className="hv-trips" aria-busy role="status">
        <span className="sr-only">{t("list_trip.msg.in_progress")}</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="hv-card h-48 animate-pulse bg-paper-3" />
        ))}
      </div>
    );
  }

  if (trips.isError && !items.length) {
    return (
      <div className="hv-card grid justify-items-center gap-3 p-card py-12 text-center" role="alert">
        <p>
          {t("list_trip.load_error")}{" "}
          <a href="tel:19006763" className="hv-link">
            1900 6763
          </a>
          .
        </p>
        <button type="button" className="hv-btn hv-btn-primary" disabled={trips.isFetching} onClick={() => void trips.refetch()}>
          {t("error_page.retry")}
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="hv-card p-card py-12 text-center">
        <Image src={notFoundImg} alt="" className="mx-auto h-auto w-full max-w-sm" />
        <p className="mt-4 text-h2 font-extrabold text-ink">{t("not_found.search.oops")}!</p>
        <p className="mt-2">{t("not_found.search.not_found1")}</p>
        <p>
          {t("not_found.search.not_found2")}{" "}
          <a href="tel:19006763" className="hv-link">
            1900 6763
          </a>{" "}
          {t("not_found.search.not_found3")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <TripFilterBar filters={filters} onChange={changeFilters} classes={classes} shown={visible.length} loaded={items.length} hasMore={!!trips.hasNextPage} />
      <div className="hv-trips">
        {visible.length ? (
          visible.map((trip, i) => (
            <TripCard key={trip.id} trip={trip} search={search} legTitle={legTitle} priority={i === 0} open={openId === trip.id} onToggle={() => {
              if (openId !== trip.id) serverLog("trip_expand");
              setOpenId((id) => (id === trip.id ? null : trip.id));
            }} />
          ))
        ) : (
          <div className="hv-card grid justify-items-start gap-3 p-card" role="status">
            <p>{t("list_trip.filter.empty")}</p>
            <button type="button" className="hv-btn hv-btn-outline hv-btn-sm" onClick={() => changeFilters(EMPTY_FILTERS)}>
              {t("list_trip.filter.reset")}
            </button>
          </div>
        )}
        {trips.hasNextPage && !trips.isFetchingNextPage ? (
          <button type="button" onClick={() => void trips.fetchNextPage()} className="hv-btn hv-btn-outline w-fit">
            {t("list_trip.view_more")}
          </button>
        ) : null}
        <p role="status" className="text-center text-muted empty:sr-only">
          {trips.isFetchingNextPage ? t("list_trip.msg.in_progress") : null}
        </p>
      </div>
    </div>
  );
}
