#!/usr/bin/env node
/**
 * Kiểm tra GET /wp-json/haivan-web/v1/layout khớp hợp đồng của Next (apps/booking/src/schemas/layout.ts).
 *
 *   node wordpress/scripts/check-layout.mjs [URL]      (mặc định http://localhost:8089/wp-json/haivan-web/v1/layout)
 *   WP_LAYOUT_URL=... node wordpress/scripts/check-layout.mjs
 *
 * Thứ tự kiểm: (1) import thẳng schema zod thật của app (Node >= 22.18 chạy được .ts);
 * (2) nếu không import được thì dùng bản sao schema bằng zod trong apps/booking/node_modules;
 * (3) không có zod → kiểm cấu trúc thủ công. Thoát mã 1 nếu sai.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Import thẳng .ts của app sinh cảnh báo "MODULE_TYPELESS_PACKAGE_JSON": không liên quan tới kết quả kiểm.
process.emitWarning = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const booking = resolve(here, "../../apps/booking");
const url = process.argv[2] || process.env.WP_LAYOUT_URL || "http://localhost:8089/wp-json/haivan-web/v1/layout";

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

/* ---- 1. Lấy dữ liệu ---------------------------------------------------- */
let res;
try {
  res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
} catch (e) {
  fail(`không gọi được ${url}: ${e.message}`);
}
if (res.status !== 200) fail(`HTTP ${res.status} từ ${url}`);
const ctype = res.headers.get("content-type") || "";
if (!ctype.includes("json")) fail(`content-type không phải JSON: ${ctype}`);
const cache = res.headers.get("cache-control") || "";
if (!/public/.test(cache) || !/max-age=3600/.test(cache)) fail(`Cache-Control phải là "public, max-age=3600", nhận: "${cache}"`);
const data = await res.json();

/* ---- 2. Validate ------------------------------------------------------- */
let how = "";
let result;
try {
  const schemaUrl = pathToFileURL(resolve(booking, "src/schemas/layout.ts")).href;
  const mod = await import(schemaUrl);
  result = mod.layoutSchema.safeParse(data);
  how = "schema thật apps/booking/src/schemas/layout.ts";
} catch (importError) {
  const zodPath = resolve(booking, "node_modules/zod");
  if (existsSync(zodPath)) {
    const { z } = createRequire(resolve(booking, "package.json"))("zod");
    const menuItem = z.lazy(() => z.object({ label: z.string(), href: z.string(), children: z.array(menuItem).optional() }));
    const localized = z.object({
      primary: z.array(menuItem),
      footer_columns: z.array(z.object({ title: z.string(), items: z.array(menuItem) })),
      company: z.object({ name: z.string(), lines: z.array(z.string()) }),
    });
    // Trường tuỳ chọn của footer/dải app (khớp apps/booking/src/schemas/layout.ts).
    const img = z.string().regex(/^(\/(?![/\\])|https:\/\/)/);
    const link = z.url({ protocol: /^https?$/ });
    const logo = z.object({ img, href: link.optional(), alt: z.string() });
    const schema = z.object({
      version: z.literal(1),
      hotline: z.string(),
      messenger: z.string().optional(),
      apps: z.object({ ios: z.string(), android: z.string() }).optional(),
      partners: z.array(logo).optional(),
      members: z.array(logo).optional(),
      payments: z.array(logo).optional(),
      social: z.object({ facebook: link.optional(), youtube: link.optional() }).optional(),
      certificate: z.object({ href: link, img, alt: z.string().optional() }).optional(),
      qr: img.optional(),
      badges: z.object({ appstore: img, playstore: img, appstore_icon: img.optional(), playstore_icon: img.optional() }).optional(),
      copyright: z.string().optional(),
      logo_white: img.optional(),
      vi: localized,
      en: localized,
    });
    result = schema.safeParse(data);
    how = `bản sao schema bằng zod (import .ts lỗi: ${importError.code || importError.message})`;
  } else {
    const isItem = (x) => x && typeof x.label === "string" && typeof x.href === "string" && (x.children === undefined || (Array.isArray(x.children) && x.children.every(isItem)));
    const isLoc = (l) =>
      l && Array.isArray(l.primary) && l.primary.every(isItem) &&
      Array.isArray(l.footer_columns) && l.footer_columns.every((c) => typeof c.title === "string" && Array.isArray(c.items) && c.items.every(isItem)) &&
      l.company && typeof l.company.name === "string" && Array.isArray(l.company.lines) && l.company.lines.every((s) => typeof s === "string");
    const okImg = (x) => typeof x === "string" && /^(\/(?![/\\])|https:\/\/)/.test(x);
    const okLogos = (l) => l === undefined || (Array.isArray(l) && l.every((x) => x && okImg(x.img) && typeof x.alt === "string"));
    const ok = data && data.version === 1 && okLogos(data.partners) && okLogos(data.members) && okLogos(data.payments) &&
      (data.qr === undefined || okImg(data.qr)) && (data.logo_white === undefined || okImg(data.logo_white)) &&
      (data.badges === undefined || (okImg(data.badges.appstore) && okImg(data.badges.playstore))) &&
      (data.certificate === undefined || (typeof data.certificate.href === "string" && okImg(data.certificate.img))) && typeof data.hotline === "string" && isLoc(data.vi) && isLoc(data.en) &&
      (data.messenger === undefined || typeof data.messenger === "string") &&
      (data.apps === undefined || (typeof data.apps.ios === "string" && typeof data.apps.android === "string"));
    result = ok ? { success: true } : { success: false, error: { issues: [{ message: "sai cấu trúc" }] } };
    how = "kiểm cấu trúc thủ công (không có zod)";
  }
}
if (!result.success) {
  console.error(JSON.stringify(result.error.issues.slice(0, 10), null, 2));
  fail(`layout sai hợp đồng (${how})`);
}

/* ---- 3. Thông tin thêm ------------------------------------------------- */
// Trường tuỳ chọn có mặt trong payload (WP trả đủ bộ thì Next không cần layout-fallback.json cho chúng).
const OPTIONAL = ["partners", "members", "payments", "social", "certificate", "qr", "badges", "copyright", "logo_white"];
const missing = OPTIONAL.filter((k) => data[k] === undefined);
const count = (items) => items.reduce((n, i) => n + 1 + (i.children ? count(i.children) : 0), 0);
console.log(`OK: ${url}`);
console.log(`  validate bằng: ${how}`);
console.log(`  Cache-Control: ${cache}`);
console.log(`  trường tuỳ chọn: ${OPTIONAL.length - missing.length}/${OPTIONAL.length} có mặt${missing.length ? `, thiếu: ${missing.join(", ")} (Next dùng bản dự phòng)` : ""}`);
for (const k of ["partners", "members", "payments"]) if (Array.isArray(data[k])) console.log(`  ${k}: ${data[k].length} logo${data[k].length ? "" : " (hàng bị ẩn)"}`);
console.log(`  vi: ${data.vi.primary.length} mục menu chính (${count(data.vi.primary)} link), ${data.vi.footer_columns.length} cột footer`);
console.log(`  en: ${data.en.primary.length} mục menu chính (${count(data.en.primary)} link), ${data.en.footer_columns.length} cột footer`);
const fallbackPath = resolve(booking, "src/content/layout-fallback.json");
if (existsSync(fallbackPath)) {
  const same = JSON.stringify(JSON.parse(readFileSync(fallbackPath, "utf8"))) === JSON.stringify(data);
  console.log(`  so với layout-fallback.json: ${same ? "giống hệt" : "khác (menu đã được MKT sửa trong WP, bình thường)"}`);
}
