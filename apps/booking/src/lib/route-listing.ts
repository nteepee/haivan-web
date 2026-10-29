import { cacheLife } from "next/cache";
import { z } from "zod";
import { ApiError, cms } from "./http";
import { createLastGood, unwrapFetched, type Fetched } from "./last-good";

const placeSchema = z.looseObject({ name: z.string(), lat: z.number(), lng: z.number(), slug: z.string().nullable().optional() });

export const routeListingSchema = z.looseObject({
  status: z.string().optional(),
  data: z.looseObject({
    slug: z.string(),
    start_place: placeSchema,
    end_place: placeSchema,
    wayroad: z
      .looseObject({
        name: z.string(),
        price_avg: z.string().nullable().optional(),
        run_time: z.union([z.number(), z.string()]).nullable().optional(),
        distance: z.number().nullable().optional(),
        img_path: z.string().nullable().optional(),
        meta_title: z.string().nullable().optional(),
        meta_desc: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
  questions_wayroad: z.array(z.looseObject({ question: z.string(), answer: z.string() })).optional(),
  /** Tiện ích của tuyến: tên + URL icon (CMS trả URL tuyệt đối, có thể chứa khoảng trắng/dấu). */
  services: z.array(z.looseObject({ name: z.string(), image: z.string().nullable().optional() })).nullish(),
});
export type RouteListing = z.infer<typeof routeListingSchema>;

const SLUG = /^[a-z0-9-]+$/;

/** Bản tốt gần nhất theo tuyến; chưa có mà CMS lỗi thì ném lỗi (ISR giữ HTML cũ, request-time trả 500) thay vì 200 noindex. */
const lastGood = createLastGood<RouteListing>("[route-listing]", "throw");

/**
 * CMS thật trả 200 với `[]` cho slug không có tuyến (đã kiểm chứng bằng GET), nên "không có tuyến" = 404/410 hoặc thân rỗng
 * (`[]`, `{}`, `null`, `data` rỗng) → `none`. Thân khác mà sai hợp đồng, mạng, 5xx, timeout → `error`. Cả ba đều cache ngắn
 * trừ `ok`.
 */
const isEmptyBody = (v: unknown): boolean => {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v !== "object") return false;
  const record = v as Record<string, unknown>;
  return Object.keys(record).length === 0 || ("data" in record && isEmptyBody(record.data));
};

async function loadRouteListing(start: string, end: string): Promise<Fetched<RouteListing>> {
  "use cache";
  try {
    const raw = await cms("route-listing", { query: { route: `${start}/${end}` } });
    if (isEmptyBody(raw)) {
      cacheLife("minutes");
      return { status: "none" };
    }
    const parsed = routeListingSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`sai hợp đồng: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    cacheLife("hours");
    return { status: "ok", data: parsed.data };
  } catch (error) {
    cacheLife("minutes");
    if (error instanceof ApiError && (error.status === 404 || error.status === 410)) return { status: "none" };
    return { status: "error", message: String(error) };
  }
}

/**
 * Trang tuyến SSR (như `__NEXT_DATA__.route` web cũ): CMS `route-listing?route=<start>/<end>`, cache 1 giờ.
 * `null` = slug sai hoặc CMS xác nhận không có tuyến. Lỗi tạm (mạng, 5xx, timeout, sai hợp đồng) → bản tốt gần nhất, hoặc ném lỗi.
 */
export async function getRouteListing(start: string, end: string): Promise<RouteListing | null> {
  if (!SLUG.test(start) || !SLUG.test(end)) return null;
  try {
    return await lastGood.resolve(`${start}/${end}`, async () => unwrapFetched(await loadRouteListing(start, end)));
  } catch (error) {
    if (offlineVerifyBuild()) return null;
    throw error;
  }
}

/** `pnpm build:verify` cố ý chạy không mạng (CMS trỏ 127.0.0.1:9); chỉ bản build kiểm tra đó (không bao giờ deploy) được dựng trang rỗng thay vì dừng build. */
const offlineVerifyBuild = () => process.env.NEXT_PHASE === "phase-production-build" && process.env.HV_BUILD_OFFLINE === "1";
