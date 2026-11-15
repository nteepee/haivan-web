import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_CONFIG_TAG, wpPriceEpoch } from "@/lib/wp-price-cache";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const SECRET = "revalidate-secret-0123456789";
const SHARED = "shared-secret-0123456789abcd";

async function post(secret?: string) {
  const { POST } = await import("./route");
  const init: { method: string; headers: Record<string, string> } = { method: "POST", headers: {} };
  if (secret !== undefined) init.headers["X-HV-Secret"] = secret;
  return POST(new NextRequest("http://next.test/api/hv/revalidate", init));
}

describe("POST /api/hv/revalidate", () => {
  beforeEach(() => {
    revalidateTag.mockClear();
    vi.stubEnv("HV_REVALIDATE_SECRET", SECRET);
    vi.stubEnv("HV_WP_SHARED_SECRET", SHARED);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("đúng bí mật → hết hạn ngay cache booking-config (expire 0) và tăng thế hệ giá WP", async () => {
    const before = wpPriceEpoch();
    const res = await post(SECRET);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith(BOOKING_CONFIG_TAG, { expire: 0 });
    expect(wpPriceEpoch()).toBe(before + 1);
    expect(await res.json()).toMatchObject({ revalidated: [BOOKING_CONFIG_TAG, "promo-codes"], epoch: before + 1 });
  });

  it.each([
    ["thiếu header", undefined],
    ["sai bí mật", "wrong-secret-0123456789abcd"],
    ["sai độ dài", SECRET.slice(0, -1)],
    ["có HV_REVALIDATE_SECRET thì bí mật chung không còn được nhận", SHARED],
  ])("%s → 403, không làm mới gì", async (_label, secret) => {
    const before = wpPriceEpoch();
    const res = await post(secret);
    expect(res.status).toBe(403);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(wpPriceEpoch()).toBe(before);
  });

  it("chưa đặt HV_REVALIDATE_SECRET → dùng HV_WP_SHARED_SECRET", async () => {
    vi.stubEnv("HV_REVALIDATE_SECRET", "");
    expect((await post(SHARED)).status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledOnce();
  });

  it("bí mật server trống hoặc ngắn hơn 16 ký tự → luôn 403 (kể cả header trùng)", async () => {
    vi.stubEnv("HV_REVALIDATE_SECRET", "");
    vi.stubEnv("HV_WP_SHARED_SECRET", "short");
    expect((await post("short")).status).toBe(403);
    expect((await post("")).status).toBe(403);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
