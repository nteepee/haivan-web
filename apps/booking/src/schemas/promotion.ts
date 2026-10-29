import { z } from "zod";

/**
 * Mã khuyến mãi của apigw (`promotion/get-promotions`, `promotion/promotional_code_list_all`, `admin/search-code-hide`).
 * Số lượng có thể là số hoặc chữ ("không giới hạn"); trường lạ giữ nguyên (looseObject). Mẫu thật (live 2026-10-29):
 * `available_quantity: "không giới hạn"`, `mkp_total_one_user: "không giới hạn"`, `min_price: "Không giới hạn"`, `discount_route: 50000|100`,
 * `route: string[]`, `content` HTML, `mkp_time_start_travel`/`mkp_time_end_travel` "YYYY-MM-DD HH:mm:ss", `mkp_unlimited: 1`, không có `date_end`.
 */
const quantity = z.union([z.number(), z.string()]).nullish();

export const promotionSchema = z.looseObject({
  code: z.string(),
  name: z.string().nullish(),
  date_start: z.string().nullish(),
  date_end: z.string().nullish(),
  available_quantity: quantity,
  mkp_time_start_travel: z.string().nullish(),
  mkp_time_end_travel: z.string().nullish(),
  content: z.string().nullish(),
});
export type Promotion = z.infer<typeof promotionSchema>;

const warned = new Set<string>();
const warnOnce = (key: string, message: string) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[promotions] ${message}`);
};

/**
 * Danh sách mã từ phản hồi thô (`{ data: [...] }` hoặc mảng): từng phần tử được kiểm riêng, phần tử sai hợp đồng nhưng có `code`
 * chuỗi vẫn được giữ (kèm cảnh báo) thay vì làm trống cả danh sách; không có `code` thì bỏ. Không bao giờ ném lỗi.
 */
export function parsePromotions(raw: unknown): Promotion[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data) ? (raw as { data: unknown[] }).data : [];
  return list.flatMap((item): Promotion[] => {
    const parsed = promotionSchema.safeParse(item);
    if (parsed.success) return [parsed.data];
    const code = item && typeof item === "object" ? (item as { code?: unknown }).code : undefined;
    warnOnce(`item:${String(code)}`, `mã ${String(code)} sai hợp đồng: ${parsed.error.issues.slice(0, 2).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    return typeof code === "string" && code ? [{ ...(item as object), code } as Promotion] : [];
  });
}

/** Hết lượt: chỉ khi số lượng đúng bằng 0 (như web cũ `available_quantity === 0`); "không giới hạn", rỗng, thiếu → vẫn hiện. */
export const isExhausted = (q: Promotion["available_quantity"]): boolean => q === 0 || (typeof q === "string" && q.trim() === "0");

const numeric = (q: Promotion["available_quantity"]): number | null => {
  if (typeof q === "number") return Number.isFinite(q) ? q : null;
  if (typeof q === "string" && /^\s*\d+\s*$/.test(q)) return Number(q);
  return null;
};

/** Huy hiệu số lượng trong danh sách chọn mã: số → "x5" (như web cũ); chữ ("không giới hạn") → giữ nguyên chữ; thiếu → "". */
export function quantityBadge(q: Promotion["available_quantity"]): string {
  const n = numeric(q);
  if (n !== null) return n > 0 ? `x${n}` : "";
  return typeof q === "string" ? q.trim() : "";
}

/** Chữ ngắn trên ô số lượng của trang ưu đãi: số → số; chữ không phải số → "∞" (nhãn đầy đủ để ở aria-label); thiếu → "". */
export function quantityShort(q: Promotion["available_quantity"]): string {
  const n = numeric(q);
  if (n !== null) return String(n);
  return typeof q === "string" && q.trim() ? "∞" : "";
}

/** Hạn dùng hiển thị: `date_end`, thiếu thì `mkp_time_end_travel`. */
export const expiryOf = (p: Pick<Promotion, "date_end" | "mkp_time_end_travel">): string | null => p.date_end || p.mkp_time_end_travel || null;
/** Ngày bắt đầu hiển thị: `date_start`, thiếu thì `mkp_time_start_travel`. */
export const startOf = (p: Pick<Promotion, "date_start" | "mkp_time_start_travel">): string | null => p.date_start || p.mkp_time_start_travel || null;
