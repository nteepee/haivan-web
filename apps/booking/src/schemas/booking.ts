import { z } from "zod";

export const holdResponseSchema = z.looseObject({
  message: z.string().optional(),
  expire_time: z.string(), // "DD-MM-YYYY HH:mm:ss"
  order_code: z.string(),
  tickets: z.array(z.looseObject({ id: z.number(), code: z.string() })),
});
export type HoldResponse = z.infer<typeof holdResponseSchema>;

const statusSchema = z.looseObject({ type: z.number(), type_name: z.string() });

export const bookingTicketSchema = z.looseObject({
  id: z.number(),
  code: z.string(),
  price: z.number(),
  price_discount: z.number().optional(),
  number: z.union([z.number(), z.string()]).optional(),
  trip: z.looseObject({ id: z.number(), departure_time: z.string().optional(), destination_time: z.string().optional() }).optional(),
  payment: statusSchema.optional(),
  status: statusSchema.optional(),
});

/** Phản hồi `POST api/bookings`, `GET api/bookings/{code}`, `cancel-seat` (live 2026-10-28). */
export const bookingDetailSchema = z.looseObject({
  data: z.looseObject({
    id: z.number(),
    code: z.string(),
    status: statusSchema,
    price: z.number(),
    surcharge_price: z.number().optional(),
    tickets: z.array(bookingTicketSchema),
    payment: statusSchema.nullable().optional(),
    created_at: z.string().optional(),
    method_payment_type: z.number().optional(),
    merchant_code: z.string().optional(),
  }),
});
export type BookingDetail = z.infer<typeof bookingDetailSchema>["data"];

export const paymentMethodSchema = z.looseObject({
  type: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_locked: z.boolean().optional(),
  info: z.array(z.looseObject({ code: z.string().optional(), name_cp: z.string().optional(), name: z.string().optional(), branch: z.string().optional() })).optional(),
});
/** `info-payments` trả mảng ở cấp ngoài (đã xác minh live). */
export const infoPaymentsSchema = z.array(paymentMethodSchema);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const infoPaymentBlockSchema = z.looseObject({ status: z.boolean(), data: z.unknown() });

export const cancelReasonsSchema = z.looseObject({
  data: z.array(z.looseObject({ id: z.number(), reason_vi: z.string(), reason_en: z.string().optional() })),
});

export const myBookingsSchema = z.looseObject({
  data: z.array(
    z.looseObject({
      merchant: z.looseObject({ code: z.string(), name: z.string(), hotline: z.string().optional() }),
      booking: z.looseObject({
        booking_info: z.looseObject({ code: z.string(), status: z.number(), status_text: z.string(), created_at: z.string(), total_money: z.number().optional(), num_ticket: z.number().optional(), method_payment: z.number().optional() }),
        booking_ticket: z.array(z.looseObject({ trip_id: z.number().optional(), code: z.string(), is_cancel: z.boolean().optional(), start_datetime: z.string().optional() })),
      }),
    }),
  ),
  meta: z.looseObject({ current_page: z.number(), last_page: z.number() }).optional(),
});
