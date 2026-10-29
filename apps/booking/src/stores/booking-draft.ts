"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchParamsData } from "@/lib/search-url";
import type { Seat, Trip } from "@/schemas/trip";

export interface DraftSeat extends Seat {
  is_select?: boolean;
  /** mã vé từ hold (`tickets[].code`) */
  code?: string;
  /** mã khuyến mãi áp cho ghế (gửi trong seats[].code của api/bookings) */
  promotion?: string;
  discount?: number;
  is_reward?: boolean;
}

export interface TransitTicket {
  id: number;
  code: string;
  ticket_code: string;
  phone: string | null;
  name: string | null;
  pick_up: string;
  pick_up_lat: number;
  pick_up_lng: number;
  drop_off: string;
  drop_off_lat: number;
  drop_off_lng: number;
  number: string;
  quantity: 1;
  date: string;
}

/** Nháp đặt vé giữa các trang (redux `booking` của web cũ), lưu sessionStorage. */
export interface BookingDraft {
  search: SearchParamsData;
  trip_info: Trip;
  trip: { trip_id: number; departure_id: number; destination_id: number };
  transit: { departure: boolean; destination: boolean };
  pick_up: { address: string; coordinates: { lat: number; lng: number } };
  drop_off: { address: string; coordinates: { lat: number; lng: number } };
  seats: DraftSeat[];
  order_code: string;
  expire_time: string;
  expiresAt: number;
  is_combo: 0 | 1;
  show_price: number;
  newParams?: { order_code: string; merchant_code: string; seats: TransitTicket[] };
}

interface DraftState {
  draft: BookingDraft | null;
  setDraft: (draft: BookingDraft) => void;
  updateSeats: (seats: DraftSeat[]) => void;
  clear: () => void;
}

export const useBookingDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      updateSeats: (seats) => set((s) => (s.draft ? { draft: { ...s.draft, seats } } : s)),
      clear: () => set({ draft: null }),
    }),
    { name: "hv_booking_draft", storage: createJSONStorage(() => sessionStorage) },
  ),
);

export const isDraftExpired = (draft: BookingDraft, now = Date.now()) => now >= draft.expiresAt;
