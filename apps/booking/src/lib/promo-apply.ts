import { z } from "zod";
import type { BookingConfig, Promo } from "@/schemas/booking-config";
import type { BookingDraft, DraftSeat } from "@/stores/booking-draft";
import { checkPromotionsQuery } from "./confirm-queries";
import { ApiError, gw } from "./http";
import { autoToken, autoTokenPromoId } from "./auto-promo-token";
import { AUTO_COMBO_ENABLED } from "./promo-flags";
import { comboPromoFor, roundtripPromoForReturnLeg } from "./promo-match";
import { stringifyQuery } from "./qs";

/** Phần tử `codes[]` của check-promotions: `ticketPrice` có thể là chuỗi ("200000"), `priceDiscount` số hoặc chuỗi; trường lạ giữ nguyên. */
const codeSchema = z.looseObject({ ticketCode: z.string(), priceDiscount: z.union([z.number(), z.string()]).nullish() });

export const clearPromo = (seats: DraftSeat[]): DraftSeat[] => seats.map((s) => ({ ...s, promotion: undefined, discount: undefined }));

/**
 * `POST api/promotion/check-promotions` cho các ghế đã gắn mã (`seat.promotion`); trả ghế cùng `discount` do server tính.
 * Dùng chung cho nút "Áp dụng" của hộp khuyến mãi và cho tự áp mã chương trình: web không bao giờ tự tính tiền giảm.
 */
export async function checkPromotions(draft: BookingDraft, withCode: DraftSeat[]): Promise<DraftSeat[]> {
  const raw: unknown = await gw("promotion/check-promotions", { method: "POST", rawQuery: stringifyQuery(checkPromotionsQuery(draft, withCode)), signal: AbortSignal.timeout(30_000) });
  return applyCheckedCodes(withCode, raw);
}

/**
 * Gắn giảm giá server tính vào ghế theo `ticketCode` (như web cũ: `seat.code === c.ticketCode` → `discount = parseInt(priceDiscount)`).
 * Phản hồi thật (live 2026-10-29): `{ message, codes: [{ code, ticketCode, ticketPrice: "200000", priceDiscount: 200000 }] }`, không có `status`/`data`.
 * Không có mảng `codes` → ném lỗi kèm `message` của server (để hộp hiện lý do thay vì treo); mảng rỗng = không ghế nào được giảm.
 */
export function applyCheckedCodes(seats: DraftSeat[], raw: unknown): DraftSeat[] {
  const body = raw && typeof raw === "object" ? (raw as { codes?: unknown; message?: unknown }) : {};
  if (!Array.isArray(body.codes)) {
    throw new ApiError(422, typeof body.message === "string" && body.message ? body.message : "Phản hồi khuyến mãi không hợp lệ", raw);
  }
  const discounts = new Map<string, number>();
  for (const item of body.codes) {
    const parsed = codeSchema.safeParse(item);
    if (parsed.success) discounts.set(parsed.data.ticketCode, Number.parseInt(String(parsed.data.priceDiscount ?? 0), 10) || 0);
  }
  return seats.map((s) => (s.code && discounts.has(s.code) ? { ...s, discount: discounts.get(s.code) } : s));
}

/**
 * Chương trình tự áp cho đơn đang xác nhận (hoặc null): khứ hồi chỉ ở chặng về (`chang=ve` kèm `don_di`); combo tạm tắt (`AUTO_COMBO_ENABLED`).
 * Đơn đã ở giá combo của hệ thống (`is_combo`) thì không tự áp — gắn mã sẽ làm mất giá combo đó. Cũng bỏ qua khi khách đã gắn mã.
 * Đây chỉ là gợi ý hiển thị: BFF kiểm lại toàn bộ điều kiện phía server trước khi đổi token thành mã thật.
 */
export function eligibleAutoPromo(config: BookingConfig, draft: BookingDraft, nowMs = Date.now()): Promo | null {
  const own = draft.search.corridor;
  if (!own || draft.is_combo === 1 || draft.seats.some((s) => s.promotion || s.is_reward)) return null;
  const from = draft.trip_info.from.reached_at;
  const trip = {
    travelDate: draft.trip_info.date.slice(0, 10),
    departure: from?.slice(11, 16) || draft.trip_info.time.slice(0, 5) || null,
    seatCount: draft.seats.length,
    nowMs,
  };
  if (AUTO_COMBO_ENABLED) {
    const combo = comboPromoFor(config, { corridorId: own.tuyen, chieu: own.chieu, ...trip });
    if (combo) return combo;
  }
  return own.chang === "ve" && own.donDi ? roundtripPromoForReturnLeg(config, own.tuyen, own.chieu, trip) : null;
}

/** Token ẩn gắn vào ghế cho chương trình này: mã thật chỉ có phía server (xem lib/auto-promo-token.ts). */
const tokenFor = (draft: BookingDraft, promo: Promo): string => autoToken(promo.id, draft.search.corridor?.donDi ?? "");

/** Gắn token chương trình cho các ghế đủ điều kiện (tối đa `seats.max`, ghế id nhỏ trước) rồi để server kiểm + tính giảm. */
export async function applyAutoPromo(draft: BookingDraft, promo: Promo): Promise<DraftSeat[]> {
  const eligible = [...draft.seats].sort((a, b) => a.id - b.id).slice(0, promo.seats.max).map((s) => s.id);
  const token = tokenFor(draft, promo);
  const withCode = clearPromo(draft.seats).map((s) => (eligible.includes(s.id) ? { ...s, promotion: token } : s));
  return checkPromotions(draft, withCode);
}

/** Server có thực sự giảm cho ít nhất một ghế của chương trình này không (kết quả rỗng/0 đồng = từ chối ngầm). */
export const hasServerDiscount = (seats: DraftSeat[], promo: Promo) => seats.some((s) => autoTokenPromoId(s.promotion) === promo.id && (s.discount ?? 0) > 0);
