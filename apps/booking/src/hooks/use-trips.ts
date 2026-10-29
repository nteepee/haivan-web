"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apigw } from "@/lib/http";
import { tripsQuery, type SearchParamsData } from "@/lib/search-url";
import { journeyResponseSchema, placesResponseSchema, seatMapResponseSchema, tripSchema, tripsResponseSchema, type Trip } from "@/schemas/trip";

/** `api/places?type=0|1` (cả hai như web cũ); lỗi → danh sách rỗng. */
export function usePlaces(type: 0 | 1) {
  return useQuery({
    queryKey: ["places", type],
    queryFn: () => apigw("places", { query: { type }, schema: placesResponseSchema }),
    staleTime: 24 * 3600_000,
  });
}

let warnedDroppedTrips = false;

/** Giữ các chuyến hợp lệ; chuyến lỗi dữ liệu bị bỏ và báo số lượng bằng console.warn đúng một lần mỗi lần tải trang. */
function parseTrips(items: unknown[]): Trip[] {
  const trips = items.flatMap((item) => {
    const parsed = tripSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
  const dropped = items.length - trips.length;
  if (dropped > 0 && !warnedDroppedTrips) {
    warnedDroppedTrips = true;
    console.warn(`[trips] Bỏ ${dropped}/${items.length} chuyến do dữ liệu không đúng schema`);
  }
  return trips;
}

interface TripsOptions {
  /** Tắt hẳn việc gọi (vd. chưa hiện trên màn hình). */
  enabled?: boolean;
  /** Thời gian dữ liệu còn mới (ms); mặc định theo QueryClient. */
  staleTime?: number;
  /** Số lần thử lại khi lỗi (mặc định theo QueryClient). `false` cho lượt đếm nền để 429 không bị nhân lên. */
  retry?: false;
}

/** `api/el/trips` có "Xem thêm" theo meta.current_page < last_page. Request đang bay bị huỷ khi khoá đổi hoặc component gỡ. */
export function useTrips(search: SearchParamsData | null, { enabled = true, staleTime, retry }: TripsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ["trips", search],
    enabled: !!search && enabled,
    staleTime,
    ...(retry === false ? { retry: false } : {}),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apigw("el/trips", { query: tripsQuery(search!, pageParam === 1 ? undefined : pageParam), schema: tripsResponseSchema, signal }).then((r) => ({
        ...r,
        // Một chuyến lỗi dữ liệu không được làm trống cả danh sách.
        data: parseTrips(r.data),
      })),
    getNextPageParam: (last) => (last.meta && last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

const placeIdOf = (p: Trip["from"]) => p.place_id;

/** Mở thẻ chuyến: sơ đồ ghế + lộ trình gọi song song như web cũ. */
export function useTripDetail(trip: Trip, numberGuest: number, enabled: boolean) {
  return useQuery({
    queryKey: ["trip-detail", trip.id, numberGuest],
    enabled,
    queryFn: async () => {
      const [seats, journey] = await Promise.all([
        apigw(`trips/${trip.id}`, {
          query: { departure_id: placeIdOf(trip.from), destination_id: placeIdOf(trip.to), merchant_code: trip.merchant.code, numberGuest },
          schema: seatMapResponseSchema,
        }),
        apigw("el/trip_detail", { query: { trip_id: trip.id, merchant_code: trip.merchant.code }, schema: journeyResponseSchema }).catch(() => ({ journey: [] })),
      ]);
      return { seats, journey: sliceJourney(journey.journey, placeIdOf(trip.from), placeIdOf(trip.to)) };
    },
    staleTime: 0,
    placeholderData: keepPreviousData, // đổi số khách không làm mất sơ đồ đang chọn
  });
}

type Journey = z.infer<typeof journeyResponseSchema>["journey"];

/** Cắt lộ trình từ điểm đón tới điểm trả của chuyến (web cũ vẽ đoạn này). */
export function sliceJourney(journey: Journey, fromId: number, toId: number): Journey {
  const start = journey.findIndex((p) => p.place_id === fromId);
  const end = journey.findIndex((p) => p.place_id === toId);
  if (start < 0 || end < start) return journey;
  return journey.slice(start, end + 1);
}
