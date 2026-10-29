"use client";

import { Banknote, Check, ChevronDown, Clock, ListFilter, Bus } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/components/providers";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isFiltering, isActive, TIME_BUCKETS, toggleIn, EMPTY_FILTERS, type SortKey, type TripFilters } from "@/lib/trip-filters";

interface Props {
  filters: TripFilters;
  onChange: (next: TripFilters) => void;
  /** Hạng xe có trong các chuyến đã tải (`product.name`). */
  classes: string[];
  /** Số chuyến sau lọc / số chuyến đã tải. */
  shown: number;
  loaded: number;
  /** Còn trang chưa tải ("Xem thêm" vẫn tải thêm; bộ lọc chỉ áp dụng cho phần đã tải). */
  hasMore: boolean;
}

const SORT_KEY: Record<SortKey, string> = {
  time: "list_trip.filter.sort_time",
  "price-asc": "list_trip.filter.sort_price",
  "price-desc": "list_trip.filter.sort_price_desc",
  seats: "list_trip.filter.sort_seats",
};

/** Một chip mở menu Radix: đang lọc = nền select + vòng chọn + dấu tick thay icon (không chỉ màu); chevron phải. */
function Chip({ label, icon, active, children }: { label: string; icon: ReactNode; active: boolean; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hv-chip" data-active={active}>
          {active ? <Check className="size-5" strokeWidth={3} aria-hidden /> : icon}
          {label}
          <ChevronDown className="hv-chip-chevron size-5" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hàng chip "Giờ đi / Hạng xe / Giá / Sắp xếp": lọc và sắp xếp thật trên các chuyến đã tải (không gọi API).
 * Giờ đi và Hạng xe chọn nhiều; Giá và Sắp xếp dùng chung một khoá sắp xếp. Đang lọc thì có dòng "Đang lọc N/M chuyến" + "Bỏ lọc".
 */
export function TripFilterBar({ filters, onChange, classes, shown, loaded, hasMore }: Props) {
  const t = useT();
  const set = (patch: Partial<TripFilters>) => onChange({ ...filters, ...patch });
  // Giữ menu mở khi bật/tắt từng mục của nhóm chọn nhiều.
  const keepOpen = (e: Event) => e.preventDefault();
  const sortItem = (key: SortKey) => (
    <DropdownMenuRadioItem key={key} value={key}>
      {t(SORT_KEY[key])}
    </DropdownMenuRadioItem>
  );
  const filtering = isFiltering(filters);

  return (
    <div className="hv-filters glass" role="group" aria-label={t("list_trip.filter.label")}>
      <div className="hv-chips">
        <Chip label={`${t("list_trip.filter.time")}${filters.buckets.length ? ` (${filters.buckets.length})` : ""}`} icon={<Clock className="size-5" aria-hidden />} active={filters.buckets.length > 0}>
          {TIME_BUCKETS.map((b) => (
            <DropdownMenuCheckboxItem key={b.key} checked={filters.buckets.includes(b.key)} onSelect={keepOpen} onCheckedChange={() => set({ buckets: toggleIn(filters.buckets, b.key) })}>
              {t(`list_trip.filter.${b.key}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </Chip>
        <Chip label={`${t("list_trip.filter.class")}${filters.classes.length ? ` (${filters.classes.length})` : ""}`} icon={<Bus className="size-5" aria-hidden />} active={filters.classes.length > 0}>
          {classes.map((name) => (
            <DropdownMenuCheckboxItem key={name} checked={filters.classes.includes(name)} onSelect={keepOpen} onCheckedChange={() => set({ classes: toggleIn(filters.classes, name) })}>
              {name}
            </DropdownMenuCheckboxItem>
          ))}
        </Chip>
        <Chip label={t("list_trip.filter.price")} icon={<Banknote className="size-5" aria-hidden />} active={filters.sort === "price-asc" || filters.sort === "price-desc"}>
          <DropdownMenuRadioGroup value={filters.sort ?? ""} onValueChange={(v) => set({ sort: v as SortKey })}>
            <DropdownMenuRadioItem value="price-asc">{t("list_trip.filter.price_asc")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="price-desc">{t("list_trip.filter.price_desc")}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </Chip>
        <Chip label={filters.sort ? t(SORT_KEY[filters.sort]) : t("list_trip.filter.sort")} icon={<ListFilter className="size-5" aria-hidden />} active={filters.sort !== null}>
          <DropdownMenuRadioGroup value={filters.sort ?? ""} onValueChange={(v) => set({ sort: v as SortKey })}>
            {(["time", "price-asc", "seats"] as const).map(sortItem)}
          </DropdownMenuRadioGroup>
        </Chip>
      </div>
      {isActive(filters) ? (
        <p className="hv-filter-status" role="status">
          <span>{filtering ? t("list_trip.filter.status", { n: shown, m: loaded }) : t("list_trip.filter.sort_status", { by: t(SORT_KEY[filters.sort!]) })}</span>
          <button type="button" className="hv-link" onClick={() => onChange(EMPTY_FILTERS)}>
            {t("list_trip.filter.reset")}
          </button>
        </p>
      ) : null}
      {filtering && hasMore ? <p className="hv-hint">{t("list_trip.filter.more_note", { m: loaded })}</p> : null}
    </div>
  );
}
