import type { CorridorParams } from "./search-url";

/**
 * Khứ hồi = hai đơn liên tiếp. Ý định chiều về (tuyến, chiều, trạm, ngày về, số vé) đi cùng nháp từ tìm chuyến tới xác nhận; khi chiều đi
 * đặt xong ta ghi thêm vào localStorage theo mã đơn để trang "Đặt chỗ thành công" (có thể mở lại sau cổng thanh toán, kể cả tab khác)
 * vẫn dựng được nút "Đặt chiều về". Chỉ chứa mã trạm, ngày và số vé — không có thông tin cá nhân.
 */
const KEY = "hv_return_carry";
const KEEP = 5;
const TTL_MS = 14 * 24 * 3600_000;

export interface ReturnCarry {
  order: string;
  own: CorridorParams;
  guests: number;
  at: number;
}

function read(): ReturnCarry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? (raw as ReturnCarry[]).filter((c) => c && typeof c.order === "string" && c.own && Date.now() - c.at < TTL_MS) : [];
  } catch {
    return [];
  }
}

/** Ghi ý định chiều về của đơn chiều đi `order` (bỏ qua nếu không có ngày về, hoặc đây đã là chặng về). Lỗi bộ nhớ trình duyệt không chặn đặt vé. */
export function saveReturnCarry(order: string, own: CorridorParams | undefined, guests: number): void {
  if (!own?.ngayVe || own.chang === "ve") return;
  try {
    const next = [...read().filter((c) => c.order !== order), { order, own, guests, at: Date.now() }].slice(-KEEP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* hết dung lượng / chế độ riêng tư: bỏ qua */
  }
}

export function readReturnCarry(order: string): ReturnCarry | null {
  return read().find((c) => c.order === order) ?? null;
}
