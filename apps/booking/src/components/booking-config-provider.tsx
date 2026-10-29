"use client";

import { createContext, useContext, type ReactNode } from "react";
import { FALLBACK_BOOKING_CONFIG } from "@/lib/booking-config-fallback";
import type { BookingConfig } from "@/schemas/booking-config";

const BookingConfigContext = createContext<BookingConfig>(FALLBACK_BOOKING_CONFIG);

/** Cấu hình tuyến chính + chương trình giảm giá do server (WP hoặc dự phòng) cấp; thiếu provider (test) → bản dự phòng, không có chương trình. */
export function useBookingConfig(): BookingConfig {
  return useContext(BookingConfigContext);
}

export function BookingConfigProvider({ config, children }: { config: BookingConfig; children: ReactNode }) {
  return <BookingConfigContext.Provider value={config}>{children}</BookingConfigContext.Provider>;
}
