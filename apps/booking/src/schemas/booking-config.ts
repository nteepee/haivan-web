import { z } from "zod";

/**
 * Hợp đồng `GET /wp-json/haivan-web/v1/booking-config` (WordPress sinh ra; xem plans/261029-1444-core-routes-search-promos/contract.md).
 * 4 tuyến chính + trạm đón/trả của ô tìm vé, và chương trình giảm giá đang chạy (đã có mã ERP).
 * Next chỉ HIỂN THỊ nhãn/giá tham khảo từ đây; số tiền giảm thật luôn do apigw tính khi áp mã.
 */
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "slug chỉ gồm a-z, 0-9, '-'");
const localized = z.object({ vi: z.string(), en: z.string() });
const geoPoint = z.object({ name: z.string().min(1), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ngày phải dạng YYYY-MM-DD");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "giờ phải dạng HH:mm");
/** Đường dẫn tương đối dưới /xe-khach: `a/b` (không dấu / đầu cuối, không `..`). */
const landingSlug = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "landing phải dạng <a>/<b>");

const end = localized.extend({ point: geoPoint });
const stop = z.object({
  id: slug,
  vi: z.string().min(1),
  en: z.string().min(1),
  note: z.string().default(""),
  /** Có toạ độ riêng → tìm chuyến theo toạ độ trạm (SG–VT: Q1 vs Tân Sơn Nhất); null → dùng điểm đầu tuyến. */
  point: geoPoint.nullable().default(null),
});

export const corridorSchema = z
  .object({
    id: slug,
    label: localized,
    ends: z.object({ a: end, b: end }),
    landing: z.object({ ab: landingSlug.nullable(), ba: landingSlug.nullable() }),
    sleeper: z.boolean(),
    max_days: z.number().int().min(0).max(366),
    stops: z.object({ a: z.array(stop).min(1), b: z.array(stop).min(1) }),
    default_stop: z.object({ a: slug, b: slug }),
  })
  .refine((c) => c.stops.a.some((s) => s.id === c.default_stop.a) && c.stops.b.some((s) => s.id === c.default_stop.b), {
    message: "default_stop phải là một trạm của tuyến",
  });

const promoBase = z.object({
  id: z.number().int(),
  corridor: slug,
  direction: z.enum(["ab", "ba", "both"]),
  book_from: dateIso.nullable().default(null),
  book_to: dateIso.nullable().default(null),
  travel_from: dateIso.nullable().default(null),
  travel_to: dateIso.nullable().default(null),
  weekdays: z.array(z.number().int().min(1).max(7)).nullable().default(null),
  hours: z.object({ from: hhmm, to: hhmm }).nullable().default(null),
  book_ahead_minutes: z.number().int().min(0).nullable().default(null),
  seats: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }).default({ min: 1, max: 9 }),
  per_seat_vnd: z.number().int().min(0).nullable().default(null),
  tiers: z
    .array(z.object({ seats: z.number().int().min(1), class: z.string().default(""), price_vnd: z.number().int().min(0), was_vnd: z.number().int().min(0).nullish() }))
    .default([]),
  /**
   * Công khai chỉ có `has_code` (mã thật nằm ở route riêng của WP, Next đọc phía server và không bao giờ gửi xuống trình duyệt).
   * Bản WP cũ còn gửi `code` thì chấp nhận nhưng bị loại ngay sau khi đọc (xem `bookingConfigSchema`).
   */
  has_code: z.boolean().optional(),
  code: z.string().min(1).optional(),
  label: localized,
  badge: localized,
});
const promoRaw = z.discriminatedUnion("type", [promoBase.extend({ type: z.literal("roundtrip") }), promoBase.extend({ type: z.literal("combo") })]);
/** Chương trình công khai: không có mã (loại `code` nếu WP vẫn gửi) và phải có mã thật phía WP (`has_code` hoặc `code`). */
export const promoSchema = promoRaw
  .refine((p) => p.has_code === true || !!p.code, { message: "chương trình chưa có mã" })
  .transform(({ code, has_code, ...rest }) => {
    void code;
    void has_code;
    return { ...rest, has_code: true as const };
  });

/** Từng phần tử được kiểm riêng: một tuyến/chương trình sai hợp đồng bị bỏ, không làm hỏng cả cấu hình. */
const dropped = new Set<string>();
const lenient = <S extends z.ZodType>(kind: "corridor" | "promo", schema: S) =>
  z.array(z.unknown()).transform((items): z.output<S>[] =>
    items.flatMap((item) => {
      const parsed = schema.safeParse(item);
      if (parsed.success) return [parsed.data as z.output<S>];
      // Cảnh báo một lần cho mỗi phần tử (cấu hình được đọc lại mỗi vài phút): MKT cần biết vì sao tuyến/chương trình không hiện.
      const id = item && typeof item === "object" && "id" in item ? String((item as { id: unknown }).id) : "?";
      const key = `${kind}:${id}`;
      if (!dropped.has(key)) {
        dropped.add(key);
        console.warn(`[booking-config] bỏ ${kind} ${id}: ${parsed.error.issues.slice(0, 2).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
      }
      return [];
    }),
  );

export const bookingConfigSchema = z.object({
  version: z.literal(1),
  corridors: lenient("corridor", corridorSchema),
  promos: lenient("promo", promoSchema),
});

export type Corridor = z.infer<typeof corridorSchema>;
export type CorridorStop = Corridor["stops"]["a"][number];
export type CorridorEnd = Corridor["ends"]["a"];
export type Promo = z.infer<typeof promoSchema>;
export type BookingConfig = z.infer<typeof bookingConfigSchema>;
export type CorridorDirection = "ab" | "ba";
