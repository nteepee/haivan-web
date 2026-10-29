"use client";

import { useSyncExternalStore } from "react";
import { todayIsoVn } from "@/lib/format";

const noop = () => () => undefined;

/**
 * Ngày hôm nay (giờ VN) dạng "YYYY-MM-DD"; "" khi prerender/SSR. Đọc giờ hiện tại lúc render ở prerender làm
 * Next (cacheComponents) bỏ trống cả khối Suspense và để client tự render → trang mất nội dung trong HTML (SEO).
 */
export function useToday(): string {
  return useSyncExternalStore(noop, todayIsoVn, () => "");
}
