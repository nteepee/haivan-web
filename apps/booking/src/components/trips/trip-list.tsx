"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import notFoundImg from "@/assets/notfound.png";
import { useT } from "@/components/providers";
import { useTrips } from "@/hooks/use-trips";
import type { SearchParamsData } from "@/lib/search-url";
import { applyTripFilters, classOptions, EMPTY_FILTERS, type TripFilters } from "@/lib/trip-filters";
import { TripCard } from "./trip-card";
import { TripFilterBar } from "./trip-filter-bar";

/**
 * Danh sách chuyến + hàng lọc/sắp xếp phía client + "Xem thêm" (vẫn tải thêm trang; bộ lọc áp dụng cho phần đã tải);
 * rỗng hoặc lỗi → màn "RẤT TIẾC" như web cũ.
 */
export function TripList({ search }: { search: SearchParamsData }) {
  const t = useT();
  const trips = useTrips(search);
  const items = useMemo(() => trips.data?.pages.flatMap((p) => p.data) ?? [], [trips.data]);
  // Khung giờ chọn từ chip "Chuyến hôm nay" (query riêng `gio`) là bộ lọc ban đầu.
  const gio = search.corridor?.gio ?? null;
  const [filters, setFilters] = useState<TripFilters>(() => (gio ? { ...EMPTY_FILTERS, buckets: [gio] } : EMPTY_FILTERS));
  const classes = useMemo(() => classOptions(items), [items]);
  const visible = useMemo(() => applyTripFilters(items, filters), [items, filters]);
  // Một hàng mở tại một thời điểm: thẻ tổng ở cột phải thuộc về hàng đang mở.
  const [openId, setOpenId] = useState<number | null>(null);
  // Đổi bộ lọc làm hàng đang mở biến mất thì đóng luôn (không mở lại ngầm khi bỏ lọc).
  const changeFilters = (next: TripFilters) => {
    setFilters(next);
    if (openId !== null && !applyTripFilters(items, next).some((trip) => trip.id === openId)) setOpenId(null);
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
            <TripCard key={trip.id} trip={trip} search={search} priority={i === 0} open={openId === trip.id} onToggle={() => setOpenId((id) => (id === trip.id ? null : trip.id))} />
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
