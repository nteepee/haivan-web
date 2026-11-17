import type { Seat, SeatMapResponse } from "@/schemas/trip";

/**
 * Chỗ trên sơ đồ ERP mà web không được bán (như booking.haivan.com, theme haivan-booking-child):
 * - Xe Hải Vân tuyến Điện Biên (merchant "01"): 4 vị trí giường đầu xe theo chính sách CS — Royal phòng 1, 2, 11, 12;
 *   Luxury/Eco giường A1-1, C1-1, A2-1, C2-1. Tuyến Vũng Tàu (limousine ghế ngồi) không áp dụng: ghế 1, 2, 11 là ghế thường.
 * - Mọi xe: chỗ trung chuyển "TC1", "TC2"… (không phải chỗ trên xe) và chỗ giá tượng trưng dưới giá sàn.
 * Chỗ bị khoá hiện "Không bán online", không chọn được; máy chủ (gw hold-booking) chặn lại lần nữa.
 */
const CS_FRONT_SEATS = new Set(["1", "2", "11", "12", "A1-1", "C1-1", "A2-1", "C2-1"]);
const CS_FRONT_MERCHANT = "01";
/** Không tuyến nào trên web bán vé dưới mức này (xe Cao cấp Sơn La có TC "Hạng D" 50.000đ trong khi vé thật từ 320.000đ). */
export const MIN_SEAT_PRICE = 100_000;
const TRANSFER_SEAT = /^TC\d+$/i;

export type PolicySeat = Seat & { web_blocked?: boolean; transfer?: boolean };

/** Lý do web không bán chỗ này; null = bán được. */
export function seatBlockReason(seat: Pick<Seat, "name" | "price">, merchantCode: string): "front" | "transfer" | "price" | null {
  const name = seat.name.trim();
  if (TRANSFER_SEAT.test(name)) return "transfer";
  if (merchantCode === CS_FRONT_MERCHANT && CS_FRONT_SEATS.has(name)) return "front";
  if (seat.price > 0 && seat.price < MIN_SEAT_PRICE) return "price";
  return null;
}

/** Sơ đồ ghế sau khi khoá các chỗ web không bán (đánh dấu `web_blocked`, `is_empty: false`). */
export function applySeatPolicy(map: SeatMapResponse, merchantCode: string): SeatMapResponse {
  const data = map.data.map((floor) =>
    floor.map((row) =>
      row.map((seat): PolicySeat | null => {
        if (!seat) return seat;
        const reason = seatBlockReason(seat, merchantCode);
        if (!reason || !seat.is_empty) return reason === "transfer" ? { ...seat, transfer: true } : seat;
        return { ...seat, is_empty: false, web_blocked: true, ...(reason === "transfer" ? { transfer: true } : {}) };
      }),
    ),
  );
  return { ...map, data };
}

/** Tên các chỗ trong đơn giữ chỗ mà web không được bán (kiểm ở máy chủ trước khi gửi apigw). */
export function blockedInHold(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const { seats, merchant_code: merchant } = body as { seats?: unknown; merchant_code?: unknown };
  if (!Array.isArray(seats)) return [];
  const code = typeof merchant === "string" ? merchant : "";
  return seats.flatMap((s) => {
    const seat = s as { name?: unknown; price?: unknown };
    if (typeof seat?.name !== "string") return [];
    return seatBlockReason({ name: seat.name, price: typeof seat.price === "number" ? seat.price : 0 }, code) ? [seat.name] : [];
  });
}
