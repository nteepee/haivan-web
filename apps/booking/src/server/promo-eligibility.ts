import "server-only";
import { identifyLeg } from "@/lib/corridors";
import { roundtripPromoForReturnLeg } from "@/lib/promo-match";
import type { BookingConfig, Promo } from "@/schemas/booking-config";

/** Dữ kiện tối thiểu của một đơn lấy từ `GET bookings/{code}` (bằng token của khách, nên chỉ đơn của chính họ). */
export interface OrderFacts {
  code: string;
  /** Đã thanh toán: `payment.type === 1` (đã xác minh live; 0 = chưa trả). */
  paid: boolean;
  /** Đơn đã huỷ (`status.type === 3`). */
  cancelled: boolean;
  /** Khoá khách hàng để so hai đơn có cùng chủ không: số điện thoại (chỉ chữ số) rồi mới tới id người tạo; null = không xác minh được. */
  customerKeys: string[];
  /** Vé còn hiệu lực (không huỷ). */
  liveTickets: number;
  /** Chuyến của đơn (mọi vé cùng chuyến). null nếu thiếu toạ độ/giờ. */
  trip: { dep: { lat: number; lng: number }; dest: { lat: number; lng: number }; departureTime: string } | null;
}

export type Rejection = "not_owner" | "order_cancelled" | "not_active" | "not_matching" | "no_outbound" | "outbound_unpaid" | "outbound_not_reverse" | "outbound_after" | "seats_exceed" | "order_unknown";

export const REJECTION_MESSAGE: Record<Rejection, string> = {
  not_active: "Chương trình giảm giá không còn áp dụng.",
  not_matching: "Ưu đãi khứ hồi không áp dụng cho chuyến này (tuyến, chiều, ngày hoặc giờ chưa đúng điều kiện).",
  no_outbound: "Ưu đãi chiều về cần đơn chiều đi hợp lệ của quý khách. Vui lòng đặt chiều về từ trang thành công của đơn chiều đi.",
  outbound_unpaid: "Đơn chiều đi chưa thanh toán nên chưa áp dụng được ưu đãi chiều về.",
  outbound_not_reverse: "Đơn chiều đi không phải chiều ngược lại của chuyến này.",
  outbound_after: "Ngày đi của đơn chiều đi phải trước hoặc bằng ngày của chuyến về.",
  seats_exceed: "Số ghế chiều về nhiều hơn số ghế đơn chiều đi nên chưa áp dụng được ưu đãi.",
  order_unknown: "Không xác minh được đơn hàng để áp ưu đãi. Vui lòng thử lại.",
  not_owner: "Đơn chiều đi không thuộc cùng khách hàng với đơn này nên chưa áp dụng được ưu đãi.",
  order_cancelled: "Đơn đã huỷ nên không áp dụng được ưu đãi.",
};

export interface EligibilityInput {
  config: BookingConfig;
  promoId: number;
  /** Đơn đang đặt (chặng về). */
  current: OrderFacts | null;
  /** Đơn chiều đi do client khai (`don_di`), đã được tải bằng token của khách. */
  outbound: OrderFacts | null;
  /** Số ghế mang token trong yêu cầu. */
  seats: number;
  nowMs?: number;
}

/** Ngày "YYYY-MM-DD" và giờ "HH:mm" của chuỗi giờ VN "YYYY-MM-DD HH:mm:ss". */
const dateOf = (t: string) => t.slice(0, 10);
const hhmmOf = (t: string) => t.slice(11, 16);

/**
 * Điều kiện BẮT BUỘC trước khi đổi token thành mã thật (khứ hồi): chương trình đang chạy và đúng loại; chuyến đang đặt đúng tuyến/chiều/
 * ngày/giờ của chương trình (xác định bằng toạ độ vé từ apigw); đơn chiều đi thuộc khách, đã thanh toán, đúng chiều ngược, đi trước chuyến về,
 * và số ghế về không vượt số ghế đi. Trả null = đủ điều kiện, ngược lại lý do (BFF trả 422, không đổi token).
 */
export function checkRoundtripEligibility(input: EligibilityInput): { promo: Promo; rejection: null } | { promo: null; rejection: Rejection } {
  const { config, promoId, current, outbound, seats } = input;
  const promo = config.promos.find((p) => p.id === promoId);
  if (!promo || promo.type !== "roundtrip") return { promo: null, rejection: "not_active" };
  if (!current?.trip) return { promo: null, rejection: "order_unknown" };
  const leg = identifyLeg(config, current.trip.dep, current.trip.dest);
  if (!leg || leg.corridor.id !== promo.corridor) return { promo: null, rejection: "not_matching" };
  const matched = roundtripPromoForReturnLeg({ ...config, promos: [promo] }, leg.corridor.id, leg.chieu, {
    travelDate: dateOf(current.trip.departureTime),
    departure: hhmmOf(current.trip.departureTime),
    seatCount: seats,
    nowMs: input.nowMs,
  });
  if (!matched) return { promo: null, rejection: "not_matching" };

  if (!outbound || outbound.code === current.code) return { promo: null, rejection: "no_outbound" };
  if (current.cancelled || outbound.cancelled) return { promo: null, rejection: "order_cancelled" };
  // Cùng một khách: phải có ít nhất một khoá chung (SĐT hoặc id người tạo); không có khoá nào để so = không xác minh được.
  if (!current.customerKeys.some((k) => outbound.customerKeys.includes(k))) return { promo: null, rejection: current.customerKeys.length && outbound.customerKeys.length ? "not_owner" : "order_unknown" };
  if (!outbound.paid) return { promo: null, rejection: "outbound_unpaid" };
  if (!outbound.trip) return { promo: null, rejection: "order_unknown" };
  const outLeg = identifyLeg(config, outbound.trip.dep, outbound.trip.dest);
  if (!outLeg || outLeg.corridor.id !== leg.corridor.id || outLeg.chieu === leg.chieu) return { promo: null, rejection: "outbound_not_reverse" };
  if (outbound.trip.departureTime > current.trip.departureTime) return { promo: null, rejection: "outbound_after" };
  if (seats > outbound.liveTickets) return { promo: null, rejection: "seats_exceed" };
  return { promo, rejection: null };
}
