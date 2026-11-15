import { z } from "zod";

/**
 * Luật giá v2: MỘT mô hình cho mọi khuyến mãi (combo, khứ hồi, sát giờ, đặt sớm, theo hạng ghế, theo SBU/tuyến/giờ/chiều).
 * Loại khuyến mãi KHÔNG phải một trường: nó là cách điền phạm vi (scope) + thời gian (when) + khách/ghế (who) + hiệu ứng (effect).
 * Nguồn sự thật cho WP (validate qua `schema.json` xuất từ file này), Next (engine), CLI/AI (`wp hv rules schema`).
 * Tài liệu: docs/price-rules.md. Kế hoạch: plans/261111-0439-price-rules-engine.
 *
 * Quy ước: giờ "HH:mm" theo giờ Việt Nam, mốc cuối cửa sổ giờ TÍNH CẢ (05:00–05:30 gồm 05:30). Thứ: 1 = thứ hai … 7 = chủ nhật.
 * Danh sách rỗng hoặc thiếu = không giới hạn theo chiều đó.
 */

export const RULE_SCHEMA_VERSION = 2;

const ruleId = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{1,63}$/, "id chỉ gồm a-z, 0-9, '-' (2–64 ký tự), vd. vt-combo-nhom")
  .describe("Mã luật duy nhất, không đổi sau khi tạo (token tự áp mã và hạn mức dựa vào nó).");
const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ngày dạng YYYY-MM-DD");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "giờ dạng HH:mm");
const vnd = z.number().int().min(0).max(100_000_000);
const weekday = z.number().int().min(1).max(7);
const direction = z.enum(["ab", "ba"]).describe("a → b / b → a theo thứ tự tên tuyến (hv_corridor).");
const textList = (d: string) => z.array(z.string().min(1).max(60)).max(50).optional().describe(d);
/** Hạng xe = TỪ KHOÁ có trong product.name của apigw (không phân biệt hoa thường), như hệ booking cũ: "lux" khớp "Luxury". */
const productList = () => textList("Từ khoá hạng xe có trong product.name (vd. royal, luxury, tiết kiệm); thiếu = mọi hạng.");
/** Số chỗ của xe (Luxury 9 chỗ vs 11 chỗ là hai dòng khác nhau ở Vũng Tàu). */
const vehicleSeatsList = () => z.array(z.number().int().min(1).max(60)).max(20).optional().describe("Số chỗ của xe; thiếu = mọi xe.");
const localized = z.object({ vi: z.string().max(200), en: z.string().max(200).default("") });
const localizedLines = z.object({ vi: z.array(z.string().max(300)).max(20).default([]), en: z.array(z.string().max(300)).max(20).default([]) });

/** Khoảng ngày; thiếu đầu nào = không giới hạn đầu đó. */
const dateRange = z
  .object({ from: dateIso.optional(), to: dateIso.optional() })
  .refine((r) => !r.from || !r.to || r.from <= r.to, { message: "from phải trước hoặc bằng to" });

/**
 * Cửa sổ giờ xuất bến. Chuyến khớp luật khi khớp ÍT NHẤT MỘT cửa sổ. `seats` = chỉ các số vé này được áp trong cửa sổ
 * (lịch combo theo khung vắng: vd. thứ 7 chiều đi 19:00 chỉ bán combo 2 vé).
 */
export const windowSchema = z
  .object({
    directions: z.array(direction).optional(),
    weekdays: z.array(weekday).min(1).optional(),
    products: productList(),
    vehicle_seats: vehicleSeatsList(),
    from: hhmm,
    to: hhmm,
    seats: z.array(z.number().int().min(1).max(60)).min(1).optional(),
  })
  .refine((w) => w.from <= w.to, { message: "from phải trước hoặc bằng to (không qua nửa đêm; tách làm 2 cửa sổ)" });

const leadSchema = z
  .object({
    min_days: z.number().int().min(0).max(366).optional().describe("Ngày đi phải từ hôm nay + N ngày (theo lịch, giờ VN)."),
    min_minutes: z.number().int().min(0).max(525_600).optional().describe("Đặt trước giờ chạy ÍT NHẤT bấy nhiêu phút (đặt sớm)."),
    max_minutes: z.number().int().min(0).max(525_600).optional().describe("Đặt trước giờ chạy NHIỀU NHẤT bấy nhiêu phút (giảm sát giờ)."),
  })
  .refine((l) => l.min_minutes === undefined || l.max_minutes === undefined || l.min_minutes <= l.max_minutes, { message: "min_minutes ≤ max_minutes" });

const seatMatchSchema = z
  .object({
    ranks: textList("Hạng ghế áp dụng (seat_rank của sơ đồ ghế: A, B, C, D, Thường…)."),
    numbers: textList("Chỉ các số ghế này."),
    exclude_numbers: textList("Không áp khi đơn có ghế này (ghế đầu, ghế tài xế…)."),
    exact_sets: z
      .array(z.object({ seats: z.number().int().min(1).max(60), products: productList(), vehicle_seats: vehicleSeatsList(), numbers: z.array(z.string().min(1).max(20)).min(1) }))
      .max(20)
      .optional()
      .describe("Với số vé `seats` (và hạng xe), đơn phải chọn ĐÚNG tập ghế này (vd. combo 3 = trọn hàng cuối)."),
  })
  .describe("Ghế được áp: thiếu = mọi ghế của chặng.");

const tierSchema = z.object({
  seats: z.number().int().min(1).max(60),
  products: productList(),
  vehicle_seats: vehicleSeatsList(),
  total_vnd: vnd.describe("Tổng tiền cho đúng số vé này (giá trọn gói)."),
});

/** Hiệu ứng: đúng MỘT cách tính. Áp lên các ghế khớp `who.seat_match` (thiếu = mọi ghế) của chặng/đơn. */
export const effectSchema = z
  .object({
    seat_off_vnd: vnd.optional().describe("Giảm mỗi ghế bấy nhiêu đồng (khứ hồi 20k, sát giờ 30k…)."),
    seat_off_percent: z.number().min(0).max(100).optional().describe("Giảm % giá mỗi ghế; bắt buộc kèm cap_vnd."),
    seat_set_vnd: vnd.optional().describe("Đặt giá mỗi ghế bằng số này (không cao hơn giá thường nếu not_cheaper)."),
    total_tiers: z.array(tierSchema).min(1).max(50).optional().describe("Combo: tổng tiền theo số vé (+ hạng xe)."),
    cap_vnd: vnd.optional().describe("Trần tổng tiền giảm của luật cho một đơn."),
    not_cheaper: z.boolean().default(true).describe("true = luật không bao giờ làm giá cao hơn giá thường (ghế/ đơn)."),
  })
  .refine((e) => [e.seat_off_vnd, e.seat_off_percent, e.seat_set_vnd, e.total_tiers].filter((v) => v !== undefined).length === 1, {
    message: "effect phải có đúng một trong seat_off_vnd, seat_off_percent, seat_set_vnd, total_tiers",
  })
  .refine((e) => e.seat_off_percent === undefined || e.cap_vnd !== undefined, { message: "giảm % phải có cap_vnd", path: ["cap_vnd"] });

export const ruleSchema = z
  .object({
    schema: z.literal(RULE_SCHEMA_VERSION),
    id: ruleId,
    title: z.string().min(1).max(160).describe("Tên nội bộ cho MKT."),
    status: z.enum(["draft", "test", "on", "off"]).describe("draft: nháp; test: chỉ SĐT thử; on: chạy thật (chỉ Biên tập viên bật); off: tắt."),
    priority: z.number().int().min(0).max(10_000).default(100).describe("Cao thắng khi cùng exclusive_group."),
    exclusive_group: z
      .string()
      .regex(/^[a-z0-9-]{1,64}$/)
      .optional()
      .describe("Các luật cùng nhóm không cộng dồn: chỉ luật ưu tiên cao nhất được áp. Thiếu = nhóm chung \"default\" (không cộng dồn). Muốn cộng dồn: đặt nhóm riêng."),
    scope: z
      .object({
        merchants: textList("Mã chi nhánh ERP (SBU): 01 Điện Biên/Tây Bắc, 02 Vũng Tàu, 17 Xuân Tráng…"),
        corridors: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/)).max(50).optional().describe("Mã tuyến hv_corridor (sg-vt, hn-db…)."),
        directions: z.array(direction).optional(),
        products: productList(),
        vehicle_seats: vehicleSeatsList(),
        stops: z
          .object({ from: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(50).optional(), to: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(50).optional() })
          .optional()
          .describe("Trạm đón/trả (mã trạm của tuyến hv_corridor, vd. q1, tsn-t1); thiếu = mọi trạm."),
      })
      .default({}),
    when: z
      .object({
        book: dateRange.optional().describe("Ngày ĐẶT VÉ (thời gian chạy chương trình)."),
        travel: dateRange.optional().describe("Ngày ĐI được áp."),
        weekdays: z.array(weekday).min(1).optional().describe("Thứ của ngày đi."),
        departure: z.array(windowSchema).min(1).max(200).optional().describe("Cửa sổ giờ xuất bến; thiếu = mọi giờ."),
        lead: leadSchema.optional(),
        lead_by_product: z
          .array(z.object({ products: z.array(z.string().min(1)).min(1), vehicle_seats: vehicleSeatsList(), lead: leadSchema }))
          .max(20)
          .optional()
          .describe("Đặt trước riêng theo hạng xe (ghi đè `lead` cho hạng đó)."),
      })
      .default({}),
    who: z
      .object({
        seats: z
          .object({ min: z.number().int().min(1).max(60).default(1), max: z.number().int().min(1).max(60).default(60) })
          .refine((s) => s.min <= s.max, { message: "min ≤ max" })
          .optional()
          .describe("Số vé của đơn (hoặc cả 2 chặng khi across_legs)."),
        across_legs: z.boolean().default(false).describe("Đếm vé và tính combo trên cả đơn chiều đi + chiều về (combo Điện Biên)."),
        seat_match: seatMatchSchema.optional(),
        linked_order: z
          .object({
            reverse: z.literal(true),
            paid: z.boolean().default(true),
            same_customer: z.literal(true),
            seats_lte: z.boolean().default(true).describe("Số ghế được giảm ≤ số vé đơn liên kết."),
          })
          .optional()
          .describe("Khứ hồi: cần đơn chiều ngược lại của cùng khách (đã thanh toán), đi trước chuyến này."),
        payments: z.array(z.enum(["qr", "cash", "card", "wallet"])).min(1).optional().describe("Chỉ áp khi khách trả bằng các cách này."),
        channels: z.array(z.enum(["web", "app", "zalo"])).min(1).optional(),
      })
      .default({ across_legs: false }),
    quota: z
      .object({
        per_trip: z.number().int().min(1).max(100).optional().describe("Số ghế tối đa được áp mỗi chuyến."),
        per_phone: z.number().int().min(1).max(50).optional().describe("Số ghế tối đa mỗi SĐT trên một chuyến."),
        total: z.number().int().min(1).max(1_000_000).optional().describe("Tổng số ghế của cả chương trình."),
      })
      .optional(),
    effect: effectSchema,
    apply: z
      .object({
        mode: z.enum(["auto", "optin"]).default("auto").describe("auto: tự áp; optin: khách phải bấm chọn ưu đãi."),
        settlement: z
          .enum(["erp_code", "erp_direct"])
          .default("erp_code")
          .describe("erp_code: gắn mã chương trình ERP (IT tạo); erp_direct: ghi giảm trực tiếp lên vé ERP."),
      })
      .default({ mode: "auto", settlement: "erp_code" }),
    display: z
      .object({
        label: localized,
        badge: localized,
        headline: localized.optional(),
        terms: localizedLines.default({ vi: [], en: [] }),
        show_on: z.array(z.enum(["route", "trip_card", "form"])).default(["route", "trip_card"]),
      })
      .describe("Chữ công khai; KHÔNG được chứa mã ERP."),
    notes: z.string().max(2000).optional().describe("Ghi chú nội bộ (không công khai)."),
  })
  .strict()
  .refine((r) => r.effect.total_tiers === undefined || (!r.who.seat_match?.ranks?.length && !r.who.seat_match?.numbers?.length), {
    message: "combo (total_tiers) tính trên MỌI ghế của đơn: không dùng cùng seat_match.ranks/numbers (dùng exclude_numbers/exact_sets)",
    path: ["who", "seat_match"],
  })
  .refine((r) => r.effect.total_tiers === undefined || !r.who.linked_order, {
    message: "combo (total_tiers) không kết hợp với linked_order trong cùng một luật",
    path: ["effect"],
  });

export type PriceRule = z.output<typeof ruleSchema>;
export type PriceRuleInput = z.input<typeof ruleSchema>;
export type RuleWindow = z.output<typeof windowSchema>;
export type RuleEffect = PriceRule["effect"];

/** Phần công khai (booking-config v2): bỏ quota, ghi chú; mã ERP vốn không nằm trong luật. */
export const publicRuleSchema = ruleSchema.transform(({ quota, notes, ...rest }) => {
  void notes;
  return { ...rest, has_quota: !!quota };
});
export type PublicPriceRule = z.output<typeof publicRuleSchema>;

/** Đọc luật, trả lỗi dạng "đường.dẫn: thông báo" (CLI/CMS/AI hiển thị trực tiếp). */
export function parseRule(input: unknown): { ok: true; rule: PriceRule } | { ok: false; errors: string[] } {
  const parsed = ruleSchema.safeParse(input);
  if (parsed.success) return { ok: true, rule: parsed.data };
  return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(gốc)"}: ${i.message}`) };
}
