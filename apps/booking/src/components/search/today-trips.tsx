"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useT } from "@/components/providers";
import { useToday } from "@/hooks/use-today";
import { useTrips } from "@/hooks/use-trips";
import type { CorridorParams, SearchParamsData, SearchPoint } from "@/lib/search-url";
import { bucketOf, departureMinutes, TIME_BUCKETS, type TimeBucketKey } from "@/lib/trip-filters";

/** Tối đa số trang `el/trips` (10 chuyến/trang) tự tải để đếm; tuyến Sài Gòn – Vũng Tàu có ~100 chuyến/ngày. */
const MAX_PAGES = 12;

/** Chờ khách ngừng đổi tuyến/trạm rồi mới đếm; apigw giới hạn ~60 request/phút. */
const DEBOUNCE_MS = 400;
/** Số đếm giữ mới 5 phút (cùng khoá thì dùng lại, không gọi lại). */
const STALE_MS = 5 * 60_000;

/** Giá trị trễ `ms` sau lần đổi cuối. */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/** Tab đang hiện không (tab nền không gọi apigw). */
function useTabVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

/** Phần tử có đang trong khung nhìn không (không có IntersectionObserver → coi như có). */
function useInView<E extends Element>(): [React.RefObject<E | null>, boolean] {
  const ref = useRef<E | null>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => setSeen(entries.some((e) => e.isIntersecting)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, seen];
}

interface Props {
  /** "Chuyến hôm nay" (đậm) */
  label: string;
  /** "Sài Gòn đi Vũng Tàu" (nhạt) */
  route: string;
  from: SearchPoint;
  to: SearchPoint;
  type: number;
  /** `null` = cả ngày. */
  onPick: (gio: CorridorParams["gio"]) => void;
}

/**
 * "Chuyến hôm nay · A đi B": chip khung giờ với số chuyến thật (cùng request `el/trips` của trang kết quả, hôm nay, 1 vé).
 * Khung không có chuyến bị vô hiệu; chọn khung → mở kết quả hôm nay với bộ lọc giờ đó.
 */
export function TodayTrips({ label: heading, route, from, to, type, onPick }: Props) {
  const t = useT();
  const today = useToday();
  const titleId = useId();
  const [ref, inViewNow] = useInView<HTMLDivElement>();
  const tabVisible = useTabVisible();
  const inView = inViewNow && tabVisible;
  // Khoá = điểm tìm thực (đã gồm tuyến, chiều, toạ độ trạm) + hôm nay + 1 vé (không theo số vé khách chọn).
  // Điểm so theo giá trị (cha dựng lại đối tượng mỗi lần render).
  const [fromName, fromLat, fromLng, toName, toLat, toLng] = [from.name, from.lat, from.lng, to.name, to.lat, to.lng];
  const wanted = useMemo<SearchParamsData | null>(
    () => (today ? { from: { name: fromName, lat: fromLat, lng: fromLng }, to: { name: toName, lat: toLat, lng: toLng }, date: today, numberGuest: 1, type } : null),
    [today, fromName, fromLat, fromLng, toName, toLat, toLng, type],
  );
  const search = useDebounced(wanted, DEBOUNCE_MS);
  const settled = search !== null && search === wanted;
  const trips = useTrips(search, { enabled: inView && settled, staleTime: STALE_MS, retry: false });
  const loadedPages = trips.data?.pages.length ?? 0;

  // Tự tải các trang còn lại để số đếm đủ; dừng ở MAX_PAGES và ngay khi có lỗi (kể cả 429: không thử lại, không dồn thêm request).
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = trips;
  useEffect(() => {
    if (inView && settled && hasNextPage && !isFetchingNextPage && !trips.isError && loadedPages < MAX_PAGES) void fetchNextPage();
  }, [inView, settled, hasNextPage, isFetchingNextPage, loadedPages, fetchNextPage, trips.isError]);

  const counts = useMemo(() => {
    const out = new Map<TimeBucketKey, number>();
    for (const page of trips.data?.pages ?? []) {
      for (const trip of page.data) {
        const minutes = departureMinutes(trip);
        const bucket = minutes === null ? null : bucketOf(minutes);
        if (bucket) out.set(bucket, (out.get(bucket) ?? 0) + 1);
      }
    }
    return out;
  }, [trips.data]);

  const total = useMemo(() => (trips.data?.pages ?? []).reduce((sum, page) => sum + page.data.length, 0), [trips.data]);
  const failed = trips.isError;
  // Đã biết đủ số đếm (không lỗi, tải hết trang); chưa biết thì chip vẫn bấm được và hiện dấu "…" thay số.
  const ready = settled && !trips.isPending && !failed && (!hasNextPage || loadedPages >= MAX_PAGES);
  const counted = (n: number) => (ready ? <span className="hv-chip-count">{n}</span> : failed ? null : <span className="hv-chip-count hv-chip-wait" aria-hidden>…</span>);

  return (
    <div ref={ref} className="hv-today">
      <p id={titleId} className="hv-today-title">
        <strong>{heading}</strong> <span className="hv-today-route">{route}</span>
      </p>
      <div className="hv-today-chips" role="group" aria-labelledby={titleId} aria-busy={!ready && !failed}>
        <button type="button" className="hv-chip" disabled={!today} onClick={() => onPick(null)}>
          {t("corridor.today_all")}
          {counted(total)}
        </button>
        {TIME_BUCKETS.map((b) => {
          const n = counts.get(b.key) ?? 0;
          const label = t(`corridor.b_${b.key}`);
          return (
            <button
              key={b.key}
              type="button"
              className="hv-chip"
              disabled={ready && n === 0}
              aria-label={ready ? t(n ? "corridor.today_count" : "corridor.today_none", { label, n }) : undefined}
              onClick={() => onPick(b.key)}
            >
              {label}
              {counted(n)}
            </button>
          );
        })}
      </div>
      <p role="status" className="sr-only">
        {ready || failed ? "" : t("corridor.today_loading")}
      </p>
    </div>
  );
}
