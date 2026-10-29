#!/usr/bin/env node
/**
 * Chốt chặn sau build: mọi trang /xe-khach/** đã prerender (vi + en) phải có <h1> và nội dung chính trong HTML tĩnh.
 *
 * Lỗi đã xảy ra: một Client Component đọc Date.now() lúc prerender → Next (cacheComponents) bỏ cả khối `<Suspense>` của <main> khỏi
 * HTML (`<main id="main" class="flex-1"><!--$?-->` + `$RX("B:0")`), Google chỉ thấy header/footer, 0 <h1>.
 * Trang động có chủ đích (tìm chuyến, xác nhận, thanh toán… đọc useSearchParams, noindex) được bỏ qua.
 *
 * Dùng: node scripts/check-ssr-h1.mjs [distDir] [--home-only]   (distDir mặc định NEXT_DIST_DIR hoặc .next)
 * `--home-only`: chỉ /xe-khach (vi, en). Dùng cho `build:verify` chạy không mạng: không có CMS thì trang tuyến không có nội dung (H1) theo thiết kế;
 * bộ đầy đủ chạy sau build E2E (CMS mock) trong playwright.config.ts.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
const homeOnly = args.includes("--home-only");
const dist = args.find((a) => !a.startsWith("--")) ?? process.env.NEXT_DIST_DIR ?? ".next";
const root = join(dist, "server", "app");
const BY_DESIGN_DYNAMIC = /(^|\/)(tim-chuyen|xac-nhan|thanh-toan|cap-nhat-dich-vu)(\/|\.html$)/;
// <main> còn chờ một khối Suspense: bình thường (nội dung nằm trong <div hidden id="S:n"> cùng HTML và được `$RC` đưa vào chỗ).
// Lỗi thật là khối đó bị bỏ cho client render (`$RX("B:n")`, nội dung KHÔNG có trong HTML).
const MAIN_PENDING = /<main id="main"[^>]*><!--\$\?--><template id="(B:\d+)">/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = [];
const failures = [];
for (const lang of ["vi", "en"]) {
  files.push(join(root, lang, "xe-khach.html")); // trang chủ đặt vé luôn phải có (thiếu file = lỗi bên dưới)
  if (!homeOnly) {
    try {
      files.push(...walk(join(root, lang, "xe-khach")));
    } catch {
      failures.push(`${lang}/xe-khach: thiếu thư mục prerender`);
    }
  }
}
// `[start]/[end].html` là khung của tham số động (không phải trang thật): bỏ qua.
const pages = [...new Set(files)].filter((f) => f.endsWith(".html") && !f.includes("[") && !BY_DESIGN_DYNAMIC.test(relative(root, f)));
const checked = [];
for (const file of pages) {
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch {
    // Trang kỳ vọng mà thiếu file = build hỏng hoặc đường dẫn đổi: báo lỗi thay vì lặng lẽ bỏ qua.
    failures.push(`${relative(root, file)}: thiếu file html prerender`);
    continue;
  }
  checked.push(file);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 < 1) failures.push(`${relative(root, file)}: 0 <h1>`);
  const pending = MAIN_PENDING.exec(html)?.[1];
  if (pending && html.includes(`$RX("${pending}"`)) failures.push(`${relative(root, file)}: <main> bị bỏ cho client render (${pending}), nội dung không có trong HTML`);
}
if (!checked.length) {
  console.error(`[check-ssr-h1] không thấy trang prerender nào dưới ${root}`);
  process.exit(1);
}
if (failures.length) {
  console.error(`[check-ssr-h1] ${failures.length} lỗi trên ${checked.length} trang:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`[check-ssr-h1] ${checked.length} trang prerender: đều có <h1> và nội dung chính trong HTML`);
