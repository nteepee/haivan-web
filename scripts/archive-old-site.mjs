#!/usr/bin/env node
// Chụp lưu web haivan.com cũ (chỉ GET tới haivan.com, tuần tự, có giãn cách) vào archive/old-site/.
// Dùng làm nguồn nhập nội dung WP và đối chiếu hành vi khi host cũ không còn.
// Chạy: node scripts/archive-old-site.mjs [--max=800]
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const ORIGIN = "https://haivan.com";
const OUT = resolve(process.cwd(), "archive/old-site");
const MAX_ARG = process.argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? "800";
const MAX = Number.parseInt(MAX_ARG, 10);
if (!Number.isFinite(MAX) || MAX <= 0) throw new Error(`--max không hợp lệ: ${MAX_ARG}`);
const MAX_ASSETS = 5000;
const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const DELAY_MS = 300;
const LOG = resolve(OUT, "log.jsonl");
// Trang chỉ chạy phía client hoặc cần đăng nhập: không crawl (so trên pathname đã chuẩn hoá).
const SKIP = [/^\/(en\/)?tai-khoan/, /^\/(en\/)?xe-khach\/(tim-chuyen|xac-nhan|thanh-toan|phong-cho|cap-nhat-dich-vu|dat-)/, /^\/(en\/)?xe-san-bay\/(thanh-toan|xac-nhan|dat-)/, /^\/_next\//, /^\/api\//, /^\/test$/, /^\/sentry/];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seen = new Set();
const queued = new Set();
const assets = new Set();

/** Chuẩn hoá đường dẫn nội bộ; trả null nếu khác origin hoặc không parse được. */
function normalize(raw) {
  try {
    const u = new URL(raw, ORIGIN);
    return u.origin === ORIGIN ? u.pathname : null;
  } catch {
    return null;
  }
}

/** Đường dẫn ghi file phải nằm trong OUT. */
function target(rel) {
  const path = resolve(OUT, rel.replace(/^\/+/, ""));
  if (!path.startsWith(OUT + sep)) throw new Error(`path escapes archive: ${rel}`);
  return path;
}

async function save(rel, data) {
  const path = target(rel);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
}

const record = (entry) => appendFile(LOG, JSON.stringify(entry) + "\n");

async function get(pathname) {
  const res = await fetch(ORIGIN + pathname, {
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": "HaiVan-Web archiver (owner backup)" },
  });
  const size = Number(res.headers.get("content-length") ?? 0);
  if (size > MAX_BYTES) throw new Error(`too large: ${size}`);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > MAX_BYTES) throw new Error(`too large: ${body.length}`);
  return { status: res.status, location: res.headers.get("location"), body, type: res.headers.get("content-type") ?? "" };
}

const pageFile = (p) => `pages${p.replace(/\/$/, "") || "/index"}.html`;

function extract(html) {
  const links = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => normalize(m[1])).filter(Boolean);
  for (const m of html.matchAll(/(?:src|href)="(\/(?:_next\/static|assets|userfiles)\/[^"]+)"/g)) {
    const p = normalize(m[1]);
    if (p && assets.size < MAX_ASSETS) assets.add(p);
  }
  for (const m of html.matchAll(/\/_next\/image\?url=([^&"]+)/g)) {
    let decoded;
    try { decoded = decodeURIComponent(m[1]); } catch { continue; }
    const p = normalize(decoded); // ảnh ngoài haivan.com (vd. cms) bị bỏ qua
    if (p && assets.size < MAX_ASSETS) assets.add(p);
  }
  const data = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1];
  return { links, data };
}

async function withBackoff(fn) {
  for (let attempt = 0; ; attempt++) {
    const r = await fn();
    if ((r.status === 429 || r.status === 503) && attempt < 3) { await sleep(5000 * (attempt + 1)); continue; }
    return r;
  }
}

async function crawl(start, buildId) {
  const queue = [];
  const enqueue = (p) => { if (p && !queued.has(p)) { queued.add(p); queue.push(p); } };
  start.forEach(enqueue);
  while (queue.length && seen.size < MAX) {
    const path = queue.shift();
    if (SKIP.some((r) => r.test(path))) continue;
    seen.add(path);
    try {
      const r = await withBackoff(() => get(path));
      await record({ kind: "page", path, status: r.status, location: r.location });
      if (r.status === 200 && r.type.includes("text/html")) {
        const html = r.body.toString("utf8");
        await save(pageFile(path), html);
        const { links, data } = extract(html);
        if (data) {
          await save(pageFile(path).replace(/\.html$/, ".next-data.json"), data);
          const page = JSON.parse(data);
          if (page.gssp || page.gsp || page.isFallback === false) {
            const locale = path.startsWith("/en/") || path === "/en" ? "en" : "vi";
            const bare = path.replace(/^\/en(?=\/|$)/, "") || "/";
            const dataPath = `/_next/data/${buildId}/${locale}${bare === "/" ? "" : bare}.json`;
            const d = await get(dataPath).catch(() => null);
            if (d?.status === 200) await save(dataPath, d.body);
            await record({ kind: "data", path: dataPath, status: d?.status ?? "error" });
          }
        }
        links.forEach(enqueue);
      }
    } catch (e) {
      await record({ kind: "page", path, error: String(e) });
    }
    await sleep(DELAY_MS);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await writeFile(LOG, "");
  const home = (await get("/")).body.toString("utf8");
  const buildId = JSON.parse(home.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)[1]).buildId;
  const manifestPath = `/_next/static/${buildId}/_buildManifest.js`;
  const manifest = (await get(manifestPath)).body.toString("utf8");
  await save(manifestPath, manifest);
  const decoded = manifest.replace(/\\u002F/g, "/");
  const routes = [...decoded.matchAll(/"(\/[^"]*)":\[/g)].map((m) => m[1]).filter((p) => !p.includes("["));
  for (const m of decoded.matchAll(/"(static\/[^"]+\.js)"/g)) assets.add(normalize(`/_next/${m[1]}`));

  await crawl([...routes, ...routes.map((p) => `/en${p === "/" ? "" : p}`)], buildId);

  for (const lang of ["vi", "en"]) assets.add(`/locales/${lang}/common.json`);
  for (const a of assets) {
    try {
      const r = await withBackoff(() => get(a));
      if (r.status === 200) await save(a, r.body);
      await record({ kind: "asset", path: a, status: r.status });
    } catch (e) {
      await record({ kind: "asset", path: a, error: String(e) });
    }
    await sleep(100);
  }
  await save("index.json", JSON.stringify({ origin: ORIGIN, buildId, archivedAt: new Date().toISOString(), pages: seen.size, assets: assets.size, log: "log.jsonl" }, null, 1));
  console.log(`done: ${seen.size} pages, ${assets.size} assets → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
