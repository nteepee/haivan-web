import { z } from "zod";
import { RULE_SCHEMA_VERSION, ruleSchema } from "./schema";

/**
 * JSON Schema của luật giá v2 (xuất từ zod) cho WP (kiểm cấu trúc khi lưu nháp), WP-CLI `wp hv rules schema` và AI.
 * Các ràng buộc liên trường (đúng một cách tính, % phải có trần…) chỉ có ở zod: WP gọi Next `/api/hv/rules/validate` trước khi bật.
 * Bản trong theme phải khớp (test json-schema.test.ts); cập nhật: `HV_WRITE_RULE_SCHEMA=1 pnpm exec vitest run src/price-rules/json-schema.test.ts`.
 */
export function ruleJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(ruleSchema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
  return {
    ...schema,
    $id: "https://haivan.com/schemas/price-rule-v2.json",
    title: `Luật giá Hải Vân v${RULE_SCHEMA_VERSION}`,
    description:
      "Một khuyến mãi = scope (SBU/tuyến/chiều/hạng xe) + when (ngày đặt, ngày đi, thứ, khung giờ, đặt trước/sát giờ) + who (số vé, ghế, khứ hồi, thanh toán) + quota + effect (đúng một cách tính) + apply (tự áp/khách chọn, mã ERP/giảm trực tiếp) + display. Xem docs/price-rules.md.",
  };
}

export const THEME_SCHEMA_PATH = "wordpress/wp-content/themes/haivan-web-child/price-rules/schema.json";
