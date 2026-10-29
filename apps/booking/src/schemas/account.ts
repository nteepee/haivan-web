import { z } from "zod";
import { bookingDetailSchema } from "./booking";
import { parsePromotions, promotionSchema } from "./promotion";

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const flag = z.union([z.number(), z.boolean()]);
const money = z.union([z.number(), z.string()]);
/** Trường chỉ để hiển thị: sai hình dạng thì bỏ qua thay vì làm hỏng cả trang. */
const soft = <T extends z.ZodType>(schema: T) => schema.nullish().catch(undefined);

const optionSchema = z.looseObject({ key: z.union([z.string(), z.number()]), text: z.string() });
const placeSchema = z.looseObject({ code: z.string(), name: z.string() });

export const transactionSchema = z.looseObject({ description: z.string().nullish(), updated_at: z.string().nullish(), type: z.string().nullish(), amount: z.number().catch(0) });

/** `GET api/customer/customers` → `data` (hồ sơ + điểm + hạng + thông tin hoá đơn). */
export const customerSchema = z.looseObject({
  data: z.looseObject({
    id: soft(z.number()),
    name: soft(z.string()),
    phone: soft(z.string()),
    email: soft(z.string()),
    address: soft(z.string()),
    date_of_birth: soft(z.string()),
    title: soft(optionSchema),
    province: soft(placeSchema),
    district: soft(placeSchema),
    occupation: soft(optionSchema),
    travel_purpose: soft(optionSchema),
    subscribe_loyalty: soft(flag),
    data_source: soft(z.number()),
    invoice_info: soft(z.looseObject({ email: z.string().nullish(), company_name: z.string().nullish(), tax_code: z.string().nullish(), company_address: z.string().nullish() })),
    account: soft(z.looseObject({ balance: z.number().nullish(), transactions: z.array(transactionSchema).nullish() })),
    rank: soft(z.looseObject({ rank: z.number().nullish(), rank_code: z.string().nullish(), period_transaction: z.number().nullish() })),
  }),
});
export type CustomerData = z.infer<typeof customerSchema>["data"];

const optionList = z.array(optionSchema).catch([]);
const placeList = z.array(z.looseObject({ id: z.number().optional(), code: z.string(), name: z.string() })).catch([]);
const definitionInner = z.looseObject({
  titles: optionList,
  jobs: optionList,
  travel_purposes: optionList,
  provinces: placeList,
  districts: placeList,
  rank_evaluators: z.array(z.looseObject({ description: z.array(z.string()).catch([]) })).catch([]),
});
/** `GET api/customer/definition`: web cũ dùng thẳng body; chấp nhận cả dạng bọc `data`. */
export const definitionSchema = z.preprocess((v) => (isObject(v) && !("titles" in v) && isObject(v.data) ? v.data : v), definitionInner);
export type Definition = z.output<typeof definitionInner>;
export type DefinitionOption = z.infer<typeof optionSchema>;

/** `GET api/bookings?booking-status[0]=N`: bản đủ trường cho trang "Chuyến đi của tôi". */
export const bookingsPageSchema = z.looseObject({
  data: z.array(
    z.looseObject({
      merchant: z.looseObject({ code: z.string(), name: z.string().optional() }),
      booking: z.looseObject({
        booking_info: z.looseObject({
          code: z.string(),
          status: z.number(),
          created_at: z.string(),
          total_money: z.number().nullish(),
          status_payment: soft(flag),
          is_cancel: soft(z.boolean()),
        }),
        booking_ticket: z.array(
          z.looseObject({
            trip_id: z.number().nullish(),
            code: z.string(),
            is_cancel: soft(z.boolean()),
            route: soft(z.looseObject({ code: z.string().nullish() })),
          }),
        ),
      }),
    }),
  ),
  meta: z.looseObject({ current_page: z.number(), last_page: z.number() }).optional(),
});
export type BookingsPage = z.infer<typeof bookingsPageSchema>;
export type BookingRowData = BookingsPage["data"][number];

/** `GET api/bookings/{code}` + dịch vụ phòng chờ / trung chuyển (TCO) nếu có. */
export const bookingFullSchema = z.looseObject({
  data: bookingDetailSchema.shape.data.extend({
    room: soft(z.looseObject({ price: money.nullish(), info: z.looseObject({ hub_name: z.string().nullish(), check_in_date: z.string().nullish() }).nullish() })),
    tco_ticket: soft(
      z.looseObject({
        code: z.string().nullish(),
        price: money.nullish(),
        check_in_date: z.string().nullish(),
        don_info: z.looseObject({ address: z.string().nullish() }).nullish(),
        tra_info: z.looseObject({ address: z.string().nullish() }).nullish(),
      }),
    ),
    ord_is_phong_cho: soft(z.number()),
    ord_is_trung_chuyen: soft(z.number()),
  }),
});
export type BookingFull = z.infer<typeof bookingFullSchema>["data"];

/** Phản hồi `download-bill`: web cũ đọc `base64pdf` ở body; chấp nhận cả dạng bọc `data`. */
export const billSchema = z.looseObject({ base64pdf: z.string().optional(), data: z.looseObject({ base64pdf: z.string().optional() }).optional() });

/** Danh sách mã của tài khoản: số lượng có thể là chữ ("không giới hạn"), hạn có thể chỉ có ở `mkp_time_end_travel`; xem schemas/promotion.ts. */
export const promotionListSchema = z.preprocess((raw) => ({ data: parsePromotions(raw) }), z.object({ data: z.array(promotionSchema) }));

/** Phản hồi ghi hồ sơ: thành công khi `status` đúng ("OK" hồ sơ, "success" hoá đơn). */
export const writeStatusSchema = z.looseObject({ status: z.string().optional() });

const transitTicketSchema = z.looseObject({ code: z.string().optional(), name: z.string().nullish(), phone: z.string().nullish(), price: z.number().nullish() });
const transitServiceSchema = z.looseObject({
  dvbs_id: z.union([z.number(), z.string()]),
  dvbs_code: z.string(),
  dvbs_order_id: z.union([z.number(), z.string()]).nullish(),
  dvbs_text_discount: z.string().nullish(),
  dvbs_tickets: z.array(transitTicketSchema).catch([]),
});
const unwrapList = (v: unknown) => (isObject(v) && Array.isArray(v.data) ? v.data : v);
/** `GET api/v4/detail-transit/{code}` (mảng dịch vụ; chấp nhận dạng bọc `data`). */
export const transitServicesSchema = z.preprocess(unwrapList, z.array(transitServiceSchema));
/** `GET api/v4/get-info-ticket` (mảng vé của dịch vụ). */
export const transitTicketsSchema = z.preprocess(unwrapList, z.array(transitTicketSchema));

/** `GET api/trip/search-location-detail`: thông tin xe + điểm đón. */
export const trackingSchema = z.looseObject({
  data: z
    .looseObject({
      name: z.string().nullish(),
      phone: z.string().nullish(),
      xe_bks: z.string().nullish(),
      place_start: z.string().nullish(),
      lat: z.union([z.number(), z.string()]).nullish(),
      long: z.union([z.number(), z.string()]).nullish(),
      duration: z.number().nullish(),
      is_flag: z.number().nullish(),
    })
    .nullish(),
});
export type TrackingInfo = NonNullable<z.infer<typeof trackingSchema>["data"]>;
