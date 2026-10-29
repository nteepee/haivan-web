/** Mô hình dịch vụ đón/trả tận nhà ở trang cập nhật dịch vụ (sau khi đã đặt vé). */
export interface TransitTicket {
  code?: string;
  name?: string | null;
  phone?: string | null;
  price?: number | null;
  number?: number | string;
  pick_up?: string | null;
  pick_up_lat?: number | string | null;
  pick_up_lng?: number | string | null;
  drop_off?: string | null;
  drop_off_lat?: number | string | null;
  drop_off_lng?: number | string | null;
  date?: string;
  check?: boolean;
  [key: string]: unknown;
}

export interface TransitService {
  dvbs_id: number | string;
  dvbs_code: string;
  dvbs_order_id?: number | string | null;
  dvbs_is_active?: unknown;
  dvbs_is_group?: unknown;
  dvbs_ticket_number?: number;
  dvbs_transit_number?: number;
  dvbs_text_discount?: string | null;
  dvbs_tickets: TransitTicket[];
  check: boolean;
  seat: number;
  seatCheck: number;
  address: { number: number; address: string }[];
  [key: string]: unknown;
}

export const isPickUp = (s: Pick<TransitService, "dvbs_code">) => s.dvbs_code === "TCDON";
/** Backend/ web cũ so sánh lỏng `0 == dvbs_is_group`. */
const isZero = (v: unknown) => v === 0 || v === false || v === "0" || v === "";
export const isMultiPoint = (s: Pick<TransitService, "dvbs_is_group">) => isZero(s.dvbs_is_group);
const addressOf = (s: Pick<TransitService, "dvbs_code">, t: TransitTicket | undefined) => String((isPickUp(s) ? t?.pick_up : t?.drop_off) ?? "");

/** Chuẩn hoá một dịch vụ từ `v4/detail-transit` như web cũ (check = đang bật, địa chỉ từng vé hoặc gộp). */
export function normalizeService(raw: Record<string, unknown> & Pick<TransitService, "dvbs_id" | "dvbs_code" | "dvbs_tickets">): TransitService {
  const base = raw as unknown as TransitService;
  const tickets = base.dvbs_tickets ?? [];
  const address = isMultiPoint(base)
    ? tickets.filter((t) => t.check).map((t) => ({ number: 1, address: addressOf(base, t) }))
    : [{ number: Number(base.dvbs_transit_number ?? 0), address: addressOf(base, tickets[0]) }];
  return { ...base, dvbs_tickets: tickets, check: !!base.dvbs_is_active, seat: Number(base.dvbs_ticket_number ?? 0), seatCheck: Number(base.dvbs_transit_number ?? 0), address };
}

/** Gộp số khách theo địa chỉ (lodash groupBy cũ), giữ thứ tự xuất hiện. */
export function groupAddresses(s: TransitService): { number: number; address: string }[] {
  const counts = new Map<string, number>();
  for (const t of s.dvbs_tickets) counts.set(addressOf(s, t), (counts.get(addressOf(s, t)) ?? 0) + 1);
  return [...counts].map(([address, number]) => ({ number, address }));
}

/** Bật/tắt cả dịch vụ: đúng như web cũ (`dvbs_is_group` = 0 khi bật, 1 khi tắt; mọi vé theo dịch vụ). */
export function applyServiceCheck(s: TransitService, checked: boolean): TransitService {
  return {
    ...s,
    check: checked,
    dvbs_is_group: checked ? 0 : 1,
    dvbs_tickets: s.dvbs_tickets.map((t) => ({ ...t, check: checked })),
    address: checked ? groupAddresses(s) : [],
    seatCheck: checked ? s.dvbs_tickets.length : 0,
  };
}

/** Query `GET api/v4/check-transit` cho một vé (điểm đón/trả đã nằm trong vùng trung chuyển?). */
export function checkTransitQuery(s: TransitService, t: TransitTicket | undefined, merchantCode: string) {
  return {
    pick_up: t?.pick_up,
    pick_up_lat: t?.pick_up_lat,
    pick_up_lng: t?.pick_up_lng,
    drop_off: t?.drop_off,
    drop_off_lat: t?.drop_off_lat,
    drop_off_lng: t?.drop_off_lng,
    code: t?.code,
    merchant_code: merchantCode,
    type_transit: isPickUp(s) ? 1 : 2,
  };
}

/** Query `GET api/v4/get-price-ticket` khi đổi địa chỉ một vé: đầu còn lại giữ nguyên của vé. */
export function priceTicketQuery(s: TransitService, t: TransitTicket, picked: { address: string; lat: number; lng: number }, merchantCode: string) {
  const own = isPickUp(s)
    ? { pick_up: picked.address, pick_up_lat: picked.lat, pick_up_lng: picked.lng, drop_off: t.drop_off, drop_off_lat: t.drop_off_lat, drop_off_lng: t.drop_off_lng }
    : { drop_off: picked.address, drop_off_lat: picked.lat, drop_off_lng: picked.lng, pick_up: t.pick_up, pick_up_lat: t.pick_up_lat, pick_up_lng: t.pick_up_lng };
  return { ...own, date: t.date, quantity: 1, merchant_code: merchantCode, code: t.code, type_transit: isPickUp(s) ? 1 : 2 };
}

export const withAddress = (s: TransitService, t: TransitTicket, picked: { address: string; lat: number; lng: number }, price: number): TransitTicket =>
  isPickUp(s)
    ? { ...t, price, pick_up: picked.address, pick_up_lat: picked.lat, pick_up_lng: picked.lng }
    : { ...t, price, drop_off: picked.address, drop_off_lat: picked.lat, drop_off_lng: picked.lng };

/** Kết quả modal "Cập nhật": ghi vé mới, số vé đã chọn, chế độ nhiều điểm và địa chỉ hiển thị. */
export function applyDialogResult(s: TransitService, tickets: TransitTicket[], multi: boolean): TransitService {
  const checked = tickets.filter((t) => t.check);
  return {
    ...s,
    dvbs_is_group: multi ? 0 : 1,
    dvbs_tickets: tickets,
    seatCheck: checked.length,
    check: checked.length > 0,
    address: multi ? checked.map((t) => ({ number: 1, address: addressOf(s, t) })) : [{ number: checked.length, address: addressOf(s, tickets[0]) }],
  };
}

/** Body `POST api/v4/update-transit`: mọi vé đã chọn của mọi dịch vụ kèm `is_group` và `dvbs_id`. */
export function updateTransitBody(orderCode: string, merchantCode: string, services: TransitService[]) {
  return {
    order_code: orderCode,
    merchant_code: merchantCode,
    seats: services.flatMap((s) => s.dvbs_tickets.filter((t) => t.check).map((t) => ({ ...t, is_group: s.dvbs_is_group, dvbs_id: s.dvbs_id }))),
  };
}
