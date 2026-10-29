import fallback from "@/content/booking-config-fallback.json";
import { bookingConfigSchema, type BookingConfig } from "@/schemas/booking-config";

/** Bản dự phòng trong repo: 4 tuyến chính + trạm theo đặc tả, không có chương trình giảm giá (không bao giờ hiện nhãn khi WP không trả). Dùng được cả ở client. */
export const FALLBACK_BOOKING_CONFIG: BookingConfig = bookingConfigSchema.parse(fallback);
