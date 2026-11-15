import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/msw-server";
import { bumpWpPriceEpoch } from "@/lib/wp-price-cache";
import { getMaskSet, getPromoCodes, resetPromoSecretsForTest } from "./promo-secrets";

const WP = "http://wp.test";
const URL_CODES = `${WP}/wp-json/haivan-web/v1/promo-codes`;

/** WP giả: trả mã hiện tại của MKT, đếm số lần Next đọc. */
let codes: Record<string, string> = {};
let calls = 0;
let failing = false;

describe("promo-secrets: độ tươi lúc thanh toán và khi WP báo đổi", () => {
  beforeEach(() => {
    resetPromoSecretsForTest();
    vi.stubEnv("HV_WP_SHARED_SECRET", "shared-secret-0123456789abcd");
    vi.stubEnv("WP_ROUTE_URL", WP);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-15T03:00:00Z"));
    codes = { "7": "OLDCODE1" };
    calls = 0;
    failing = false;
    server.use(
      http.get(URL_CODES, () => {
        calls += 1;
        return failing ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ codes, mask: Object.values(codes) });
      }),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("WP báo đổi → lần đọc kế tiếp CHỜ bản mới (không trả mã cũ rồi làm mới nền)", async () => {
    expect((await getPromoCodes()).get("7")).toBe("OLDCODE1");
    codes = { "7": "NEWCODE2" };
    // Chưa báo đổi, còn trong hạn thanh toán: không đọc lại.
    expect((await getPromoCodes()).get("7")).toBe("OLDCODE1");
    expect(calls).toBe(1);

    bumpWpPriceEpoch();
    expect((await getPromoCodes()).get("7")).toBe("NEWCODE2");
    expect(calls).toBe(2);
    // Đã có bản sau lần báo đổi: không đọc thêm.
    await getPromoCodes();
    expect(calls).toBe(2);
  });

  it("thanh toán: bản cũ hơn 60 s bị đọc lại và chờ; che mã (mọi request BFF) vẫn dùng hạn 5 phút", async () => {
    await getPromoCodes();
    codes = { "7": "NEWCODE2" };
    vi.setSystemTime(Date.now() + 61_000);
    await getMaskSet();
    expect(calls).toBe(1);
    expect((await getPromoCodes()).get("7")).toBe("NEWCODE2");
    expect(calls).toBe(2);
  });

  it("che mã cũng chờ bản mới sau khi WP báo đổi", async () => {
    await getMaskSet();
    codes = { "8": "ADDED3" };
    bumpWpPriceEpoch();
    expect((await getMaskSet()).codes.get("added3")).toBe("8");
  });

  it("WP lỗi → cache âm 30 s; WP báo đổi (đã sống lại) thì đọc lại ngay", async () => {
    failing = true;
    expect((await getPromoCodes()).size).toBe(0);
    await getPromoCodes();
    expect(calls).toBe(1);

    failing = false;
    bumpWpPriceEpoch();
    expect((await getPromoCodes()).get("7")).toBe("OLDCODE1");
    expect(calls).toBe(2);
  });
});
