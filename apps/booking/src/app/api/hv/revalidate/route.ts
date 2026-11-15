import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { BOOKING_CONFIG_TAG, bumpWpPriceEpoch } from "@/lib/wp-price-cache";

/**
 * WordPress báo dữ liệu ảnh hưởng giá vừa đổi (lưu/xoá/bật/tắt chương trình giảm giá, combo, tuyến chính, luật giá):
 * `POST /api/hv/revalidate`, header `X-HV-Secret` = `HV_REVALIDATE_SECRET` (trống thì dùng `HV_WP_SHARED_SECRET`), ≥ 16 ký tự.
 * Thân bị bỏ qua: luôn làm mới TOÀN BỘ dữ liệu giá WP (vài request WP nhỏ) để không sót loại nào.
 *
 * - Cache `booking-config` hết hạn ngay (`expire: 0`: request kế tiếp chờ đọc WP, không phục vụ bản cũ); trang ISR dùng nó tạo lại.
 * - Mã ERP + luật giá đầy đủ trong bộ nhớ (`promo-secrets.ts`) đọc lại WP ở lần dùng kế tiếp.
 * Không có bí mật hợp lệ ở server → 403 (tính năng tắt, chỉ còn hạn cache 60 s).
 */
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function expectedSecret(): string {
  const own = process.env.HV_REVALIDATE_SECRET?.trim() ?? "";
  const secret = own || (process.env.HV_WP_SHARED_SECRET?.trim() ?? "");
  return secret.length >= 16 ? secret : "";
}

function secretOk(given: string | null): boolean {
  const secret = expectedSecret();
  if (!secret || !given) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretOk(request.headers.get("x-hv-secret"))) return Response.json({ error: "forbidden" }, { status: 403, headers });
  revalidateTag(BOOKING_CONFIG_TAG, { expire: 0 });
  const epoch = bumpWpPriceEpoch();
  return Response.json({ revalidated: [BOOKING_CONFIG_TAG, "promo-codes"], epoch }, { headers });
}
