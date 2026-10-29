import { FALLBACK_BOOKING_CONFIG } from "@/lib/booking-config-fallback";
import type { BookingConfig, Promo } from "@/schemas/booking-config";

/** Chương trình mẫu theo contract.md (đã qua schema: mọi trường có mặt). */
export function makePromo(overrides: Partial<Promo> & Pick<Promo, "type" | "corridor">): Promo {
  return {
    id: 1,
    direction: "both",
    book_from: null,
    book_to: null,
    travel_from: null,
    travel_to: null,
    weekdays: null,
    hours: null,
    book_ahead_minutes: null,
    seats: { min: 1, max: 9 },
    per_seat_vnd: null,
    tiers: [],
    has_code: true,
    label: { vi: "Ưu đãi thử", en: "Test offer" },
    badge: { vi: "Ưu đãi", en: "Offer" },
    ...overrides,
  } as Promo;
}

export const ROUNDTRIP_PROMO = makePromo({
  id: 10,
  type: "roundtrip",
  corridor: "hn-moc",
  direction: "ba",
  per_seat_vnd: 20000,
  label: { vi: "Giảm 20k/ghế chiều về", en: "20k off per return seat" },
  badge: { vi: "Khứ hồi -20k", en: "Return -20k" },
});

export const COMBO_PROMO = makePromo({
  id: 11,
  type: "combo",
  corridor: "sg-vt",
  direction: "ab",
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  hours: { from: "05:00", to: "23:00" },
  book_ahead_minutes: 60,
  seats: { min: 2, max: 4 },
  tiers: [
    { seats: 2, class: "Luxury", price_vnd: 419000, was_vnd: 520000 },
    { seats: 3, class: "Luxury", price_vnd: 599000, was_vnd: 780000 },
  ],
  label: { vi: "Combo 2 vé Luxury 419k", en: "Combo 2 Luxury tickets 419k" },
  badge: { vi: "Combo", en: "Combo" },
});

export const withPromos = (promos: Promo[]): BookingConfig => ({ ...FALLBACK_BOOKING_CONFIG, promos });
