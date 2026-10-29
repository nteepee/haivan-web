import type { BookingDraft } from "@/stores/booking-draft";

export interface BonusService {
  dvbs_id: number;
  dvbs_code: string;
  dvbs_name: string;
  [key: string]: unknown;
}

export interface TransitTicketState {
  id: number;
  code: string;
  price: number;
  check?: boolean;
  pick_up?: string;
  drop_off?: string;
  [key: string]: unknown;
}

export interface PricedService extends BonusService {
  dvbs_tickets: TransitTicketState[];
  dvbs_text_discount?: string | null;
  check: boolean;
  address: { number: number; address: string }[];
  seat: number;
  seatCheck: number;
  title: string;
}

/** Bước 1 web cũ: gắn trạng thái mặc định cho dịch vụ trước khi gọi `v4/get-price-transit` (khớp body live). */
export function servicesForPricing(list: BonusService[], draft: BookingDraft, titles: { pickUp: string; dropOff: string }) {
  const count = draft.seats.length;
  const from = draft.trip_info.from.location ?? [];
  const to = draft.trip_info.to.location ?? [];
  return list.map((s) => {
    const pickUp = s.dvbs_code === "TCDON";
    return {
      ...s,
      check: false,
      seat: count,
      seatCheck: count,
      address: [{ number: count, address: pickUp ? draft.pick_up.address : draft.drop_off.address }],
      title: pickUp ? titles.pickUp : titles.dropOff,
      transit_location: pickUp ? draft.trip_info.from.place_name : draft.trip_info.to.place_name,
      transit_lat: pickUp ? from[1] : to[1],
      transit_lng: pickUp ? from[0] : to[0],
    };
  });
}

/** Body `POST api/v4/get-price-transit`: {...newParams, services, trip_id, merchant_code}. */
export function priceTransitBody(draft: BookingDraft, services: unknown[]) {
  return { ...(draft.newParams ?? {}), services, trip_id: draft.trip_info.id, merchant_code: draft.trip_info.merchant.code };
}

/** Dịch vụ đã chọn để gửi hold-transit: chỉ service `check` với vé `check`. */
export function selectedServices(services: PricedService[]) {
  return services.filter((s) => s.check).map((s) => ({ ...s, dvbs_tickets: s.dvbs_tickets.filter((t) => t.check) }));
}

/** Phụ thu hiển thị = Σ giá vé dịch vụ đã chọn. */
export function surcharge(services: PricedService[]) {
  return selectedServices(services).reduce((sum, s) => sum + s.dvbs_tickets.reduce((a, t) => a + (Number(t.price) || 0), 0), 0);
}
