#!/usr/bin/env node
/**
 * Kiểm URL sau khi nhập CMS (chỉ GET).
 *
 *   node wordpress/scripts/verify-cms-urls.mjs cms     [--base http://localhost:8180] [--cache wordpress/data/cms-cache]
 *   node wordpress/scripts/verify-cms-urls.mjs archive [--base ...] [--log archive/old-site/log.jsonl]
 *   node wordpress/scripts/verify-cms-urls.mjs parity  [--base ...] [--sample 40]   (GET thêm haivan.com, chỉ đọc, so mã trạng thái)
 *
 * cms:     suy URL từ JSON CMS đã cache (bài điểm đến, tin, trang điểm đến + ?page=N, ưu đãi) và kiểm 200 + tiêu đề khớp.
 * archive: mọi trang trong log.jsonl của bản chụp web cũ (trừ phần Next) không được 404/5xx (theo redirect).
 * parity:  mẫu URL cũng GET trên https://haivan.com (giãn cách 1s) để so mã với bản local.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : def;
};
const base = opt("base", "http://localhost:8180").replace(/\/$/, "");
const cacheDir = resolve(opt("cache", resolve(root, "wordpress/data/cms-cache")));
const UA = "HaiVanWeb-Verify/1.0 (read-only)";

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[n]);
const norm = (s) => decode(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().toLowerCase();

const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));
const enc = (path) => path.split("/").map((s) => encodeURIComponent(decodeURIComponent(s)).replace(/%26/g, "&")).join("/");

async function get(url, { follow = true, maxHops = 5 } = {}) {
  let u = url;
  const chain = [];
  for (let i = 0; i <= maxHops; i++) {
    let res;
    try {
      res = await fetch(u, { redirect: "manual", headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(60000) });
    } catch (e) {
      return { status: 0, chain, error: String(e.cause?.code || e.message), url: u };
    }
    chain.push(res.status);
    const loc = res.headers.get("location");
    if (follow && res.status >= 300 && res.status < 400 && loc) {
      u = new URL(loc, u).toString();
      await res.arrayBuffer();
      continue;
    }
    const body = res.status === 200 ? await res.text() : (await res.arrayBuffer(), "");
    return { status: res.status, chain, body, url: u };
  }
  return { status: 0, chain, error: "quá nhiều redirect", url: u };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

/* ---- danh sách URL từ cache CMS ---------------------------------------- */
function cmsUrls() {
  const L = (f) => readJson(resolve(cacheDir, "lists", f));
  const urls = []; // {path, kind, title}
  const locs = L("location.json").data;
  const slugOf = new Map(locs.map((l) => [l.id, l.slug]));
  urls.push({ path: "/diem-den", kind: "archive", title: null });
  urls.push({ path: "/chung-toi/bao-chi-tin-tuc", kind: "archive", title: null });
  const listing = new Map();
  for (const loc of locs) {
    const p1 = L(`location-${loc.slug}-p1.json`);
    const total = p1.Posts.total;
    const last = p1.Posts.last_page;
    urls.push({ path: `/diem-den/${loc.slug}`, kind: "destination", title: `Kinh nghiệm du lịch ${loc.name}` });
    for (let p = 2; p <= last; p++) urls.push({ path: `/diem-den/${loc.slug}?page=${p}`, kind: "destination-page", title: `Kinh nghiệm du lịch ${loc.name}` });
    for (let p = 1; p <= last; p++) {
      const d = p === 1 ? p1 : L(`location-${loc.slug}-p${p}.json`);
      for (const it of d.Posts.data) listing.set(String(it.id), { loc: loc.slug, it });
    }
    if (total !== [...listing.values()].filter((v) => v.loc === loc.slug).length) console.warn(`cảnh báo: ${loc.slug} total=${total}`);
  }
  // Bài điểm đến: chỉ bài status=1 (có trong danh sách trang điểm đến). Slug trùng: bài sau có hậu tố -2 (bỏ qua ở đây).
  const seen = new Set();
  const ids = [...listing.keys()].sort((a, b) => a - b);
  for (const id of ids) {
    const { loc, it } = listing.get(id);
    const key = it.slug.toLowerCase();
    const dup = seen.has(key);
    seen.add(key);
    // Slug trùng (không phân biệt hoa thường) trong CMS: WP đặt hậu tố -2 cho bài sau (web cũ không phục vụ được bài đó).
    urls.push({ path: `/diem-den/${loc}/${it.slug}${dup ? "-2" : ""}`, kind: dup ? "post-dup-slug" : "post", title: it.title, dup });
  }
  const gn = L("get-news.json").data_news;
  for (const n of gn) urls.push({ path: `/chung-toi/bao-chi-tin-tuc/${n.slug}`, kind: "news", title: n.title });
  const promo = L("promotion-listing.json");
  for (const p of promo.data ?? []) urls.push({ path: `/uu-dai/${p.id}`, kind: "promotion", title: p.title });
  return urls;
}

const kindOrder = ["archive", "destination", "destination-page", "post", "post-dup-slug", "news", "promotion"];

async function cmdCms() {
  const urls = cmsUrls();
  const results = await pool(urls, 6, async (u) => {
    const r = await get(base + enc(u.path.split("?")[0]) + (u.path.includes("?") ? "?" + u.path.split("?")[1] : ""));
    let titleOk = null;
    if (r.status === 200 && u.title) {
      const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(r.body)?.[1] ?? "";
      const t = norm(u.title);
      titleOk = norm(h1).includes(t) || norm(/<title>([\s\S]*?)<\/title>/i.exec(r.body)?.[1] ?? "").includes(t);
    }
    return { ...u, status: r.status, chain: r.chain, titleOk, finalUrl: r.url };
  });
  const sum = {};
  const bad = [];
  for (const r of results) {
    const s = (sum[r.kind] ??= { total: 0, ok200: 0, titleOk: 0, titleBad: 0, other: {} });
    s.total++;
    if (r.status === 200) s.ok200++;
    else s.other[r.status] = (s.other[r.status] ?? 0) + 1;
    if (r.titleOk === true) s.titleOk++;
    if (r.titleOk === false) s.titleBad++;
    if (r.status !== 200 || r.titleOk === false) bad.push(r);
  }
  for (const k of kindOrder) if (sum[k]) console.log(k.padEnd(18), JSON.stringify(sum[k]));
  console.log(`TỔNG ${results.length} URL; lỗi/không khớp tiêu đề: ${bad.length}`);
  for (const b of bad.slice(0, 40)) console.log("  ✗", b.status, b.chain.join(">"), b.path, b.titleOk === false ? `(tiêu đề không khớp: ${b.title})` : "");
  process.exitCode = bad.some((b) => b.kind !== "post-dup-slug") ? 1 : 0;
}

async function cmdArchive() {
  const log = resolve(opt("log", resolve(root, "archive/old-site/log.jsonl")));
  const rows = readFileSync(log, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const nextOwned = /^\/(?:en\/)?(xe-khach|tai-khoan|partner|tracking|email)(\/|$)|^\/_next\/|^\/(?:en\/)?(?:500|_error)$/; // + trang lỗi nội bộ của Next
  const paths = [...new Set(rows.filter((r) => r.kind === "page" && !nextOwned.test(r.path)).map((r) => r.path))];
  console.log(`archive: ${paths.length} trang không thuộc Next`);
  const out = await pool(paths, 6, async (p) => {
    const r = await get(base + enc(p));
    return { p, status: r.status, chain: r.chain };
  });
  const by = {};
  for (const r of out) by[r.status] = (by[r.status] ?? 0) + 1;
  console.log("trạng thái cuối:", JSON.stringify(by));
  const oldStatus = new Map(rows.filter((r) => r.kind === "page").map((r) => [r.path, r.status]));
  const bad = out.filter((r) => r.status !== 200 && oldStatus.get(r.p) === 200);
  const same = out.filter((r) => r.status !== 200 && oldStatus.get(r.p) !== 200);
  console.log(`không 200 mà web cũ 200 (404 MỚI/lỗi): ${bad.length}; không 200 và web cũ cũng không 200: ${same.length}`);
  for (const b of bad.slice(0, 40)) console.log("  ✗", b.status, b.chain.join(">"), b.p);
  for (const b of same.slice(0, 10)) console.log("  =", b.status, b.p, "(cũ:", oldStatus.get(b.p) + ")");
  const hops = out.filter((r) => r.chain.length > 2);
  console.log(`chuỗi redirect > 1 bước: ${hops.length}`);
  process.exitCode = bad.length ? 1 : 0;
}

async function cmdParity() {
  const n = Number(opt("sample", 40));
  const all = cmsUrls().filter((u) => u.kind !== "post-dup-slug");
  // Mẫu phân tầng: mỗi loại lấy đều theo bước nhảy.
  const sample = [];
  const byKind = Object.groupBy(all, (u) => u.kind);
  const kinds = Object.keys(byKind);
  const per = Math.max(2, Math.floor(n / kinds.length));
  for (const k of kinds) {
    const arr = byKind[k];
    const step = Math.max(1, Math.floor(arr.length / per));
    for (let i = 0; i < arr.length && sample.filter((s) => s.kind === k).length < per; i += step) sample.push(arr[i]);
  }
  // Ca đặc biệt: sai điểm đến trên URL, chữ hoa, trang ?page, bài không tồn tại.
  const post = all.find((u) => u.kind === "post");
  sample.push({ path: post.path.replace(/^\/diem-den\/[^/]+\//, "/diem-den/zzz-khong-co/"), kind: "post-wrong-location" });
  sample.push({ path: post.path.replace(/^\/diem-den\/([^/]+)\//, (_, l) => `/diem-den/${l.toUpperCase()}/`), kind: "post-upper-location" });
  sample.push({ path: "/diem-den/ha-noi/bai-khong-ton-tai-xyz", kind: "post-missing" });
  sample.push({ path: "/chung-toi/bao-chi-tin-tuc/tin-khong-ton-tai-xyz", kind: "news-missing" });
  let diff = 0;
  console.log(`parity: ${sample.length} URL (local ${base} vs https://haivan.com)`);
  for (const s of sample) {
    const local = await get(base + enc(s.path.split("?")[0]) + (s.path.includes("?") ? "?" + s.path.split("?")[1] : ""));
    const old = await get("https://haivan.com" + enc(s.path.split("?")[0]) + (s.path.includes("?") ? "?" + s.path.split("?")[1] : ""));
    const same = local.status === old.status;
    if (!same) diff++;
    console.log(`${same ? "=" : "≠"} ${String(old.status).padEnd(4)} cũ | ${String(local.status).padEnd(4)} mới  ${s.kind.padEnd(20)} ${s.path.slice(0, 90)}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`khác mã: ${diff}/${sample.length}`);
}

const cmds = { cms: cmdCms, archive: cmdArchive, parity: cmdParity };
if (!cmds[cmd]) {
  console.error("Dùng: verify-cms-urls.mjs cms|archive|parity [--base URL]");
  process.exit(2);
}
await cmds[cmd]();
