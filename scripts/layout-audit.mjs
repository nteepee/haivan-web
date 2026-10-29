#!/usr/bin/env node
/**
 * Dò lỗi layout tự động trên stack local (nginx :8180 → WP + Next), thay cho soi từng trang.
 *
 *   node scripts/layout-audit.mjs                 # mỗi template 1 trang mẫu (≈45 URL × 2 khổ)
 *   node scripts/layout-audit.mjs --all           # mọi URL trong sitemap (lâu)
 *   node scripts/layout-audit.mjs /uu-dai /xe-khach   # chỉ các đường dẫn này
 *   BASE=http://localhost:8180 node scripts/layout-audit.mjs --shots   # luôn chụp ảnh (mặc định chỉ chụp trang có lỗi)
 *   node scripts/layout-audit.mjs --selftest      # tự kiểm: mỗi luật phải bắt được lỗi cài sẵn trong trang mẫu
 *
 * Kết quả: .layout-audit/<thời điểm>/report.md + report.json + ảnh. Thoát mã 1 nếu có lỗi mức "error".
 * Chỉ đọc (GET); các trang Next gọi API production chỉ để đọc như khi anh mở trình duyệt, không ghi gì.
 *
 * Luật (theo design.md v4):
 *   error: HTTP ≥ 400, lỗi JS/console, tài nguyên cùng origin lỗi, tràn ngang, ảnh hỏng,
 *          khoảng trống giữa hai khối liền nhau, số H1 ≠ 1
 *   warn:  hai khối liền nhau cùng nền, đệm khối ≠ --section-pad, bo góc ngoài {0,4,8,16,24,50%},
 *          viền tối ≥ 2px, chữ < 16px trên kính, vùng chạm < 44px (khổ điện thoại), nhảy cấp heading,
 *          chữ bị cắt, đoạn <p> rỗng
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(resolve(root, "apps/booking/package.json"))("@playwright/test");

const BASE = (process.env.BASE || "http://localhost:8180").replace(/\/$/, "");
const args = process.argv.slice(2);
const ALL = args.includes("--all");
const SHOTS = args.includes("--shots");
const only = args.filter((a) => a.startsWith("/"));
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844, mobile: true },
];
const CONCURRENCY = 4;

/* ---- 1. Danh sách URL --------------------------------------------------- */
async function sitemapUrls(path) {
  const res = await fetch(BASE + path, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return [];
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname + new URL(m[1]).search);
}

async function collectUrls() {
  if (only.length) return only;
  const maps = (await sitemapUrls("/sitemap_index.xml")).filter((p) => p.endsWith(".xml"));
  const groups = await Promise.all([...maps, "/xe-khach/sitemap.xml"].map(async (m) => [m, await sitemapUrls(m)]));
  if (ALL) return [...new Set(groups.flatMap(([, list]) => list))];

  const picked = new Set([
    "/", "/en/", "/uu-dai", "/en/uu-dai", "/xe-san-bay", "/diem-den", "/en/diem-den",
    "/?s=vung+tau", "/trang-khong-ton-tai-layout-audit",
    "/xe-khach", "/en/xe-khach", "/xe-khach/cap-nhat-dich-vu", "/xe-khach/xac-nhan", "/xe-khach/thanh-toan",
    "/xe-khach/thanh-toan/thanh-cong", "/tai-khoan/dang-nhap", "/tai-khoan/thong-tin-ca-nhan",
    "/tracking", "/tracking/hv", "/tracking/hshv", "/partner/booking",
    // Bỏ /email/verify: trang gọi API xác minh email production ngay khi mở.
  ]);
  for (const [map, list] of groups) {
    if (map.includes("page-sitemap")) {
      // Một trang cho mỗi nhóm đường dẫn (chung-toi, dich-vu, dat-ve-nhanh, en/…).
      const seen = new Set();
      for (const p of list) {
        const seg = p.split("/").filter(Boolean);
        const key = seg[0] === "en" ? `en/${seg[1] || ""}` : seg[0] || "";
        if (!seen.has(key)) seen.add(key), picked.add(p);
      }
    } else {
      // Trang lưu trữ + bài đầu tiên của mỗi loại; landing tuyến: 2 tuyến đầu.
      list.slice(0, map.includes("xe-khach") ? 3 : 2).forEach((p) => picked.add(p));
    }
  }
  return [...picked];
}

/* ---- 2. Đo trong trang -------------------------------------------------- */
// Chạy trong trình duyệt: trả về danh sách vấn đề { level, rule, msg, where }.
function inspectPage({ mobile }) {
  const out = [];
  const add = (level, rule, msg, el) => out.push({ level, rule, msg, where: el ? describe(el) : "" });
  const vw = document.documentElement.clientWidth;
  const css = (el) => getComputedStyle(el);
  function describe(el) {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
    const own = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (cls.length ? "." + cls.join(".") : "");
    const p = el.parentElement;
    if (!p || p === document.body) return own;
    const pc = typeof p.className === "string" ? p.className.trim().split(/\s+/)[0] : "";
    return `${p.tagName.toLowerCase()}${pc ? "." + pc : ""} > ${own}`;
  }
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = css(el);
    return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
  };
  const transparent = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
  const px = (v) => parseFloat(v) || 0;
  // Chỉ cho trình đọc màn hình (.hv-sr, .sr-only): cố ý bị cắt.
  const srOnly = (el) => { const s = css(el); return s.position === "absolute" && (s.clip !== "auto" || s.clipPath !== "none"); };
  const all = [...document.body.querySelectorAll("*")].filter((el) => !el.closest("svg") || el.tagName === "svg");

  /* tràn ngang */
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) add("error", "tràn-ngang", `trang rộng ${sw}px > ${vw}px`);
  const clipsX = (el) => {
    for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      if (/(hidden|auto|scroll|clip)/.test(css(a).overflowX)) return true;
    }
    return false;
  };
  let spill = 0;
  for (const el of all) {
    if (spill >= 5 || !visible(el) || css(el).position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !clipsX(el)) {
      // Chỉ báo phần tử sâu nhất trong nhánh tràn (cha cũng tràn thì bỏ cha).
      if ([...el.children].some((c) => visible(c) && c.getBoundingClientRect().right > vw + 1)) continue;
      add("error", "tràn-ngang", `vượt khung ${Math.round(r.left)}…${Math.round(r.right)} / ${vw}`, el), spill++;
    }
  }

  /* ảnh hỏng */
  for (const img of document.images) {
    if (img.currentSrc && img.complete && img.naturalWidth === 0 && visible(img)) add("error", "ảnh-hỏng", img.currentSrc.slice(0, 120), img);
  }

  /* nhịp khối: con trong luồng của body, mở rộng <main> */
  const inflow = (el) => visible(el) && !["fixed", "absolute"].includes(css(el).position) && !["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName);
  const blocks = [];
  for (const el of document.body.children) {
    if (!inflow(el)) continue;
    if (el.tagName === "MAIN") blocks.push(...[...el.children].filter(inflow));
    else blocks.push(el);
  }
  const bodyBg = css(document.body).backgroundColor;
  const edgeGround = (el, edge) => {
    if (!transparent(css(el).backgroundColor)) return css(el).backgroundColor;
    const kids = [...el.children].filter(inflow);
    const k = edge === "top" ? kids[0] : kids[kids.length - 1];
    if (k && Math.abs(k.getBoundingClientRect().width - el.getBoundingClientRect().width) < 2) {
      const r = k.getBoundingClientRect(), pr = el.getBoundingClientRect();
      const flush = edge === "top" ? Math.abs(r.top - pr.top) < 2 : Math.abs(r.bottom - pr.bottom) < 2;
      if (flush) return edgeGround(k, edge);
    }
    return bodyBg;
  };
  const pad = px(css(document.documentElement).getPropertyValue("--section-pad")) ||
    (() => { const t = document.createElement("div"); t.style.padding = "var(--section-pad)"; document.body.append(t); const v = px(css(t).paddingTop); t.remove(); return v; })();
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i], s = css(b);
    const isChrome = ["HEADER", "FOOTER"].includes(b.tagName);
    if (!isChrome && pad && b.getBoundingClientRect().width >= vw - 2) {
      const pt = px(s.paddingTop), pb = px(s.paddingBottom);
      const hero = i <= 1 || /hero|band/.test(b.className);
      if (!hero && ((pt && pt !== pad) || (pb && pb !== pad))) add("warn", "đệm-khối", `padding ${pt}/${pb}, chuẩn ${pad}`, b);
    }
    if (i === 0) continue;
    const a = blocks[i - 1];
    const gap = b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
    if (gap > 0.5) add("error", "khoảng-trống", `${Math.round(gap)}px trống giữa "${describe(a)}" và khối này`, b);
    if (gap < -0.5 && !/bleed|overlap/.test(b.className)) add("warn", "chồng-khối", `chồng ${Math.round(-gap)}px lên khối trước`, b);
    const ga = edgeGround(a, "bottom"), gb = edgeGround(b, "top");
    if (ga === gb && !["HEADER"].includes(a.tagName)) add("warn", "cùng-nền", `khối liền trước cùng nền ${ga}`, b);
  }

  /* bo góc, viền tối, chữ trên kính */
  const okRadius = new Set([0, 4, 8, 16, 24]);
  const radii = new Map();
  const dark = (c) => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
    if (!m || (m[4] !== undefined && +m[4] < 0.5)) return false;
    const [r, g, b] = [m[1], m[2], m[3]].map((v) => { v = v / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.1;
  };
  let darkCount = 0;
  for (const el of all) {
    if (!visible(el)) continue;
    const s = css(el);
    for (const c of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"]) {
      const v = s[c];
      if (v.includes("%")) { if (v !== "50%") radii.set(v, (radii.get(v) || new Set()).add(describe(el))); continue; }
      const n = Math.round(px(v));
      const r = el.getBoundingClientRect();
      if (okRadius.has(n) || n >= Math.min(r.width, r.height) / 2 - 0.5) continue; // tròn hẳn = --r-round
      radii.set(n + "px", (radii.get(n + "px") || new Set()).add(describe(el)));
    }
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (px(s[`border${side}Width`]) >= 2 && s[`border${side}Style`] !== "none" && dark(s[`border${side}Color`]) && darkCount < 5) {
        add("warn", "viền-tối", `border-${side.toLowerCase()} ${s[`border${side}Width`]} ${s[`border${side}Color`]}`, el), darkCount++;
        break;
      }
    }
  }
  for (const [v, where] of radii) add("warn", "bo-góc", `radius ${v} ngoài bộ token (${where.size} chỗ): ${[...where].slice(0, 3).join(" | ")}`);

  for (const g of all.filter((el) => visible(el) && /blur/.test(css(el).backdropFilter || css(el).webkitBackdropFilter || ""))) {
    const small = new Set();
    const walker = document.createTreeWalker(g, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const p = t.parentElement;
      if (!t.textContent.trim() || !p || !visible(p)) continue;
      if (px(css(p).fontSize) < 16) small.add(`${describe(p)} ${css(p).fontSize}`);
    }
    if (small.size) add("warn", "chữ-nhỏ-trên-kính", [...small].slice(0, 4).join(" | "), g);
  }

  /* vùng chạm (điện thoại) */
  if (mobile) {
    const seen = new Set();
    for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary")) {
      if (!visible(el) || el.closest("[aria-hidden=true]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width >= 44 && r.height >= 44) continue;
      // Ngoại lệ WCAG 2.5.8: liên kết nằm trong dòng chữ.
      if (el.tagName === "A" && css(el).display === "inline" && el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      if (["checkbox", "radio"].includes(el.type) && el.closest("label")?.getBoundingClientRect().height >= 44) continue;
      const key = describe(el);
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size <= 8) add("warn", "vùng-chạm", `${Math.round(r.width)}×${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}"`, el);
    }
  }

  /* heading */
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.textContent.trim() && (visible(h) || h.closest(".hv-sr, .sr-only")));
  const h1 = hs.filter((h) => h.tagName === "H1").length;
  if (h1 !== 1) add("error", "h1", `${h1} thẻ H1`);
  let last = 0;
  for (const h of hs) {
    const lv = +h.tagName[1];
    if (last && lv > last + 1) add("warn", "nhảy-heading", `H${last} → H${lv} "${h.textContent.trim().slice(0, 40)}"`, h);
    last = lv;
  }

  /* chữ bị cắt, đoạn rỗng */
  let clipped = 0;
  for (const el of all) {
    if (clipped >= 5 || !visible(el) || !el.childNodes.length) continue;
    const s = css(el);
    if (!/(hidden|clip)/.test(s.overflowX + s.overflowY) || s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none" || srOnly(el)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) add("warn", "chữ-bị-cắt", `${el.scrollWidth}×${el.scrollHeight} trong ${el.clientWidth}×${el.clientHeight}`, el), clipped++;
  }
  const empties = [...document.querySelectorAll("main p")].filter((p) => !srOnly(p) && !p.closest("[aria-live],[role=status],[role=alert]") && !p.textContent.replace(/ /g, "").trim() && !p.querySelector("img,iframe,video,svg,input,a,button") && css(p).display !== "none" && (p.getBoundingClientRect().height > 0 || px(css(p).marginTop) + px(css(p).marginBottom) > 0));
  if (empties.length) add("warn", "p-rỗng", `${empties.length} đoạn rỗng`, empties[0]);
  return out;
}

/* ---- 3. Chạy ----------------------------------------------------------- */
async function auditOne(browser, path, vp, outDir) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const issues = [];
  const add = (level, rule, msg, where = "") => issues.push({ level, rule, msg, where });
  const origin = new URL(BASE).origin;
  page.on("pageerror", (e) => add("error", "js", String(e.message).slice(0, 200)));
  // "Failed to load resource" bỏ qua: luật tài-nguyên đã báo kèm URL.
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) add("error", "console", m.text().slice(0, 200)); });
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && u !== BASE + path) add(u.startsWith(origin) ? "error" : "warn", "tài-nguyên", `${r.status()} ${u.slice(0, 140)}`);
  });
  let status = 0;
  try {
    const res = await page.goto(BASE + path, { waitUntil: "load", timeout: 45000 });
    status = res ? res.status() : 0;
    const expect404 = path.includes("khong-ton-tai");
    if (status >= 400 && !(expect404 && status === 404)) add("error", "http", `HTTP ${status}`);
    // Cuộn hết trang để ảnh lazy tải, rồi về đầu.
    await page.evaluate(async () => {
      // behavior "instant": trang dùng scroll-behavior: smooth, cuộn mượt làm lệch số đo.
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 120)); }
      scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);
    issues.push(...(await page.evaluate(inspectPage, { mobile: !!vp.mobile })));
  } catch (e) {
    add("error", "tải-trang", String(e.message).split("\n")[0].slice(0, 200));
  }
  let shot = "";
  if (SHOTS || issues.some((i) => i.level === "error")) {
    shot = `${path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}-${vp.name}.jpg`;
    await page.screenshot({ path: resolve(outDir, shot), fullPage: true, type: "jpeg", quality: 60 }).catch(() => (shot = ""));
  }
  await ctx.close();
  return { path, viewport: vp.name, status, issues, shot };
}

/* ---- 3b. Tự kiểm luật trên trang mẫu có lỗi cài sẵn ------------------- */
const FIXTURE = `<!doctype html><html><head><meta name=viewport content="width=device-width"><style>
:root { --section-pad: 32px } body { margin: 0; background: #fff; font: 16px sans-serif }
section { padding: 32px 0 } .a { background: #eee } .b { background: #eee; margin-top: 20px }
.r12 { border-radius: 12px; width: 200px; height: 100px; background: #ccc } .ink { border: 2px solid #111; height: 40px }
.glass { backdrop-filter: blur(8px); font-size: 12px } .wide { width: 600px; height: 10px; background: red }
.clip { overflow: hidden; white-space: nowrap; width: 40px }
</style></head><body><main>
<section class="a"><h1>Một</h1><h1>Hai</h1><h4>Nhảy cấp</h4><div class="r12"></div><div class="ink"></div></section>
<section class="b"><div class="glass">chữ nhỏ trên kính</div><button style="width:30px;height:30px">x</button>
<img src="/khong-co-anh.png" width="50" height="50" alt=""><p></p><div class="wide"></div><div class="clip">chữ dài bị cắt mất</div></section>
</main></body></html>`;
const EXPECT = ["tràn-ngang", "ảnh-hỏng", "khoảng-trống", "cùng-nền", "bo-góc", "viền-tối", "chữ-nhỏ-trên-kính", "vùng-chạm", "h1", "nhảy-heading", "chữ-bị-cắt", "p-rỗng"];

async function selftest() {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (r.request().url().endsWith("/fixture") ? r.fulfill({ contentType: "text/html", body: FIXTURE }) : r.fulfill({ status: 404 })));
  await page.goto("http://audit.test/fixture", { waitUntil: "load" });
  const found = new Set((await page.evaluate(inspectPage, { mobile: true })).map((i) => i.rule));
  await browser.close();
  const missing = EXPECT.filter((r) => !found.has(r));
  for (const r of EXPECT) console.log(`${found.has(r) ? "✓" : "✗"} ${r}`);
  if (missing.length) console.error(`Luật không bắt được lỗi mẫu: ${missing.join(", ")}`);
  process.exit(missing.length ? 1 : 0);
}

if (args.includes("--selftest")) await selftest();

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = resolve(root, ".layout-audit", stamp);
mkdirSync(outDir, { recursive: true });
const urls = await collectUrls();
console.log(`Audit ${urls.length} URL × ${VIEWPORTS.length} khổ trên ${BASE} → ${outDir}`);

// Chrome có thể chết giữa lượt quét dài (máy hết RAM, bị kill): mở lại rồi quét lại đúng trang đó, không bỏ cả lượt.
const launch = () => chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
let browser = await launch();
let relaunching = null;
async function liveBrowser() {
  if (browser.isConnected()) return browser;
  relaunching ||= launch().then((b) => ((browser = b), (relaunching = null), b));
  return relaunching;
}
const jobs = urls.flatMap((u) => VIEWPORTS.map((vp) => [u, vp]));
const results = [];
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < jobs.length) {
    const [u, vp] = jobs[next++];
    let r;
    for (let attempt = 1; ; attempt++) {
      try {
        r = await auditOne(await liveBrowser(), u, vp, outDir);
        break;
      } catch (e) {
        if (attempt >= 3) { r = { path: u, viewport: vp.name, status: 0, issues: [{ level: "error", rule: "tải-trang", msg: `trình duyệt lỗi: ${String(e.message).split("\n")[0].slice(0, 160)}`, where: "" }], shot: "" }; break; }
      }
    }
    results.push(r);
    const e = r.issues.filter((i) => i.level === "error").length, w = r.issues.length - e;
    console.log(`${e ? "✗" : "✓"} ${vp.name.padStart(4)} ${u}  ${e} lỗi, ${w} cảnh báo`);
  }
}));
await browser.close();

/* ---- 4. Báo cáo -------------------------------------------------------- */
results.sort((a, b) => urls.indexOf(a.path) - urls.indexOf(b.path) || a.viewport.localeCompare(b.viewport));
const count = (r, lv) => r.issues.filter((i) => i.level === lv).length;
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const byRule = {};
for (const r of results) for (const i of r.issues) {
  const k = `${i.level} · ${i.rule}`;
  (byRule[k] ||= new Set()).add(r.path);
}
const lines = [
  `# Layout audit ${stamp}`,
  "",
  `${BASE} · ${urls.length} URL × ${VIEWPORTS.map((v) => v.name).join("/")} · lỗi ${results.reduce((n, r) => n + count(r, "error"), 0)} · cảnh báo ${results.reduce((n, r) => n + count(r, "warn"), 0)}`,
  "",
  "## Theo luật",
  "| Luật | Số trang |",
  "|---|---|",
  ...Object.entries(byRule).sort().map(([k, s]) => `| ${k} | ${s.size} |`),
  "",
  "## Theo trang",
  "| URL | Khổ | HTTP | Lỗi | Cảnh báo | Ảnh |",
  "|---|---|---|---|---|---|",
  ...results.map((r) => `| ${esc(r.path)} | ${r.viewport} | ${r.status} | ${count(r, "error")} | ${count(r, "warn")} | ${r.shot} |`),
  "",
  "## Chi tiết",
];
for (const r of results.filter((x) => x.issues.length)) {
  lines.push("", `### ${r.path} @${r.viewport}`);
  for (const i of [...r.issues].sort((a, b) => a.level.localeCompare(b.level))) lines.push(`- **${i.level}** ${i.rule}: ${esc(i.msg)}${i.where ? ` — \`${esc(i.where)}\`` : ""}`);
}
writeFileSync(resolve(outDir, "report.md"), lines.join("\n") + "\n");
writeFileSync(resolve(outDir, "report.json"), JSON.stringify({ base: BASE, stamp, results }, null, 2));
const errors = results.reduce((n, r) => n + count(r, "error"), 0);
console.log(`\n${resolve(outDir, "report.md")}\nLỗi: ${errors}`);
process.exit(errors ? 1 : 0);
