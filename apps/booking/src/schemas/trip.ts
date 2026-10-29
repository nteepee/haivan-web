import { z } from "zod";

// Chỉ bắt buộc trường đang dùng; looseObject giữ trường khác (backend có thể thêm trường mới).

export const placeSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  lat: z.union([z.string(), z.number()]).nullable(),
  lng: z.union([z.string(), z.number()]).nullable(),
  address: z.string().nullable().optional(),
});
export const placeGroupSchema = z.looseObject({ id: z.number(), name: z.string(), places: z.array(placeSchema) });
export const placesResponseSchema = z.array(placeGroupSchema);

const tripPointSchema = z.looseObject({
  place_id: z.number(),
  place_name: z.string(),
  location: z.array(z.number()).optional(), // [lng, lat]
  reached_at: z.string().optional(),
});

export const tripSchema = z.looseObject({
  id: z.number(),
  from: tripPointSchema,
  to: tripPointSchema,
  duration: z.string().nullish(),
  direction: z.string(),
  node_code: z.string().optional(),
  date: z.string(),
  time: z.string(),
  node_time: z.string(),
  amenities: z.array(z.unknown()).optional(),
  car_imgs: z.array(z.string()).optional(),
  available_seats: z.number(),
  total_seats: z.number().optional(),
  has_discount: z.boolean().optional(),
  price: z.looseObject({ min: z.number(), max: z.number().optional(), min_ny: z.number().optional(), percent: z.number().optional(), price_discount: z.number().optional() }),
  product: z.looseObject({ code: z.string(), name: z.string() }),
  merchant: z.looseObject({ code: z.string(), name: z.string().nullish(), id: z.union([z.string(), z.number()]) }),
  route: z.looseObject({ code: z.string(), name: z.string(), show_price: z.number().nullish() }),
  transit: z.looseObject({ start: z.boolean().nullish(), end: z.boolean().nullish() }).nullish(),
});
export type Trip = z.infer<typeof tripSchema>;

export const pageMetaSchema = z.looseObject({ current_page: z.number(), last_page: z.number(), total: z.number().optional() });
export const tripsResponseSchema = z.looseObject({ data: z.array(z.unknown()), meta: pageMetaSchema.optional() });

export const seatSchema = z.looseObject({
  id: z.number(),
  ticket_code: z.string().nullable().optional(),
  name: z.string(),
  price: z.number(),
  priceNy: z.number().nullable().optional(),
  is_empty: z.boolean(),
  color: z.string().nullable().optional(),
  seat_rank: z.string().nullable().optional(),
  seat_type: z.number().nullable().optional(),
});
export type Seat = z.infer<typeof seatSchema>;

export const seatMapResponseSchema = z.looseObject({
  data: z.array(z.array(z.array(seatSchema.nullable()))),
  seat_group: z.array(z.unknown()).optional(),
  is_locked: z.boolean().optional(),
  message: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  is_combo: z.number().optional(),
});
export type SeatMapResponse = z.infer<typeof seatMapResponseSchema>;

export const journeyResponseSchema = z.looseObject({
  journey: z.array(
    z.looseObject({
      address: z.string().nullable().optional(),
      location: z.looseObject({ lat: z.number(), lng: z.number() }).nullable().optional(),
      place_id: z.number(),
      place_name: z.string(),
      place_time: z.string(),
    }),
  ),
});
