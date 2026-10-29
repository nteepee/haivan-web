import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/msw-server";

// `cacheLife` chỉ hợp lệ trong phạm vi 'use cache' của Next; test chạy hàm thường (không memo), nên mỗi lần gọi đều tới MSW.
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const CMS = "http://cms.test";
const ENDPOINT = `${CMS}/api/route-listing`;
const place = (name: string) => ({ name, lat: 10, lng: 106 });
const listing = (slug: string, name: string) => ({ status: "OK", data: { slug, start_place: place("A"), end_place: place("B"), wayroad: { name } } });

/** Nạp module mới mỗi test: kho "bản tốt" nằm ở module nên phải reset. */
async function load() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CMS_URL", CMS);
  return import("./route-listing");
}

describe("getRouteListing", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("200 hợp lệ → dữ liệu; slug lạ → null không gọi mạng", async () => {
    const { getRouteListing } = await load();
    server.use(http.get(ENDPOINT, () => HttpResponse.json(listing("a/b", "A - B"))));
    expect((await getRouteListing("a", "b"))?.data.wayroad?.name).toBe("A - B");
    expect(await getRouteListing("../x", "y")).toBeNull();
  });

  it("404 thật → null (tuyến không tồn tại), không ném", async () => {
    const { getRouteListing } = await load();
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ message: "Route not found" }, { status: 404 })));
    expect(await getRouteListing("khong", "co")).toBeNull();
  });

  it("CMS thật trả 200 với [] (hoặc thân rỗng) cho slug không có tuyến → null, không phải lỗi tạm", async () => {
    const { getRouteListing } = await load();
    for (const body of [[], {}, null, { status: "OK", data: [] }, { status: "OK", data: null }]) {
      server.use(http.get(ENDPOINT, () => HttpResponse.json(body)));
      expect(await getRouteListing("khong", "co")).toBeNull();
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("lỗi tạm sau khi đã thành công (5xx, mạng, sai hợp đồng) → giữ bản tốt, một cảnh báo", async () => {
    const { getRouteListing } = await load();
    server.use(http.get(ENDPOINT, () => HttpResponse.json(listing("a/b", "bản tốt"))));
    await getRouteListing("a", "b");
    for (const failing of [() => new HttpResponse(null, { status: 503 }), () => HttpResponse.error(), () => HttpResponse.json({ data: "sai" })]) {
      server.use(http.get(ENDPOINT, failing));
      expect((await getRouteListing("a", "b"))?.data.wayroad?.name).toBe("bản tốt");
    }
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("lỗi tạm mà chưa có bản tốt → ném lỗi (không trả null để dựng trang noindex 200)", async () => {
    const { getRouteListing } = await load();
    server.use(http.get(ENDPOINT, () => new HttpResponse(null, { status: 502 })));
    await expect(getRouteListing("a", "b")).rejects.toThrow(/502/);
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ data: "sai" })));
    await expect(getRouteListing("c", "d")).rejects.toThrow();
  });

  it("404 sau khi từng thành công → null (tuyến đã bị gỡ), lỗi sau đó không hồi sinh bản cũ", async () => {
    const { getRouteListing } = await load();
    server.use(http.get(ENDPOINT, () => HttpResponse.json(listing("a/b", "cũ"))));
    await getRouteListing("a", "b");
    server.use(http.get(ENDPOINT, () => new HttpResponse(null, { status: 404 })));
    expect(await getRouteListing("a", "b")).toBeNull();
    server.use(http.get(ENDPOINT, () => new HttpResponse(null, { status: 503 })));
    await expect(getRouteListing("a", "b")).rejects.toThrow();
  });
});
