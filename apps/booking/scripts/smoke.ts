/**
 * Smoke live chỉ đọc: kiểm backend thật vẫn trả đúng hợp đồng mà app đang parse.
 *
 *   HV_SMOKE_LIVE=1 pnpm smoke
 *
 * - Chỉ chạy khi HV_SMOKE_LIVE=1; thiếu cờ thì thoát (mã 2) trước khi có bất kỳ request nào.
 * - Chỉ GET, chỉ các endpoint trong scripts/smoke-guard.ts (allowlist cứng), không Authorization, không cookie.
 * - Parse bằng đúng zod schema của app (src/schemas/trip.ts, src/lib/route-listing.ts).
 */
import { z } from "zod";
import { routeListingSchema } from "../src/lib/route-listing";
import { stringifyQuery } from "../src/lib/qs";
import { tripsQuery } from "../src/lib/search-url";
import { journeyResponseSchema, placesResponseSchema, seatMapResponseSchema, tripSchema, tripsResponseSchema } from "../src/schemas/trip";
import { APIGW, assertAllowed, CMS } from "./smoke-guard";

if (process.env.HV_SMOKE_LIVE !== "1") {
  console.error("smoke: không chạy. Đây là smoke test GET-only trên backend THẬT (apigw/cms.haivan.com).");
  console.error("       Bật rõ ràng bằng HV_SMOKE_LIVE=1 (vd. `HV_SMOKE_LIVE=1 pnpm smoke`).");
  process.exit(2);
}

// list-banner chưa có schema trong app (app không dùng); chỉ kiểm trả JSON object/mảng.
const bannerSchema = z.union([z.array(z.unknown()), z.looseObject({})]);

const failures: string[] = [];

async function get(origin: string, path: string, query: string, headers: Record<string, string> = {}): Promise<unknown> {
  const url = assertAllowed(`${origin}${path}${query ? `?${query}` : ""}`, "GET");
  const started = Date.now();
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  console.log(`  GET ${url.origin}${url.pathname}${url.search} → ${res.status} (${Date.now() - started} ms)`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return JSON.parse(text) as unknown;
}

async function step<T>(name: string, run: () => Promise<T>): Promise<T | undefined> {
  console.log(`[smoke] ${name}`);
  try {
    const result = await run();
    console.log("  ok");
    return result;
  } catch (error) {
    const detail = error instanceof z.ZodError ? error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : String(error);
    console.error(`  FAIL ${detail}`);
    failures.push(`${name}: ${detail}`);
    return undefined;
  }
}

const apigw = (path: string, query = "") => get(APIGW, `/api/${path}`, query, { Domain: "haivan.com" });
const cms = (path: string, query = "") => get(CMS, `/api/${path}`, query);

async function main() {
  await step("places?type=0", async () => {
    const groups = placesResponseSchema.parse(await apigw("places", stringifyQuery({ type: 0 })));
    if (!groups.some((g) => g.places.length)) throw new Error("danh sách điểm rỗng");
  });

  // Quận 1 → TP Vũng Tàu (cặp điểm live 2026-10-28), ngày mai theo giờ Việt Nam.
  const tomorrow = new Date(Date.now() + (7 + 24) * 3600_000).toISOString().slice(0, 10);
  const search = { from: { name: "Quận 1", lat: 10.7753882, lng: 106.702825 }, to: { name: "Vũng Tàu", lat: 10.3391989, lng: 107.0710401 }, date: tomorrow, numberGuest: 1, type: 0 };
  const trips = await step(`el/trips date=${tomorrow}`, async () => {
    const page = tripsResponseSchema.parse(await apigw("el/trips", stringifyQuery(tripsQuery(search))));
    const bad = page.data.map((item) => tripSchema.safeParse(item)).filter((r) => !r.success);
    if (bad.length) throw new Error(`${bad.length}/${page.data.length} chuyến sai schema`);
    return page.data.map((item) => tripSchema.parse(item));
  });

  const first = trips?.[0];
  if (trips && !first) {
    console.warn(`[smoke] WARN: không có chuyến ngày ${tomorrow}; bỏ qua trips/{id} và el/trip_detail`);
  } else if (first) {
    await step(`trips/${first.id}`, async () => {
      const q = stringifyQuery({ departure_id: first.from.place_id, destination_id: first.to.place_id, merchant_code: first.merchant.code, numberGuest: 1 });
      const map = seatMapResponseSchema.parse(await apigw(`trips/${first.id}`, q));
      if (!map.data.length) throw new Error("sơ đồ ghế rỗng");
    });
    await step(`el/trip_detail trip_id=${first.id}`, async () => {
      journeyResponseSchema.parse(await apigw("el/trip_detail", stringifyQuery({ trip_id: first.id, merchant_code: first.merchant.code })));
    });
  }

  await step("CMS route-listing quan-1/vung-tau", async () => {
    // Query dựng đúng như app (`cms("route-listing", { query: { route } })` → dấu "/" được mã hoá).
    routeListingSchema.parse(await cms("route-listing", stringifyQuery({ route: "quan-1/vung-tau" })));
  });
  await step("CMS list-banner language=vi", async () => {
    bannerSchema.parse(await cms("list-banner", stringifyQuery({ language: "vi" })));
  });

  if (failures.length) {
    console.error(`\nsmoke: ${failures.length} bước lỗi`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nsmoke: tất cả bước đạt");
}

main().catch((error) => {
  console.error("smoke: lỗi không mong đợi", error);
  process.exit(1);
});
