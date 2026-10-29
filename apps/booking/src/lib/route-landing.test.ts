import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../../test/fixtures/wp-route.json";
import { server } from "../../test/msw-server";

// `cacheLife` chỉ hợp lệ trong phạm vi 'use cache' của Next; test chạy hàm thường.
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
const { getRouteLanding, routeBaseUrl } = await import("./route-landing");

const WP = "http://wp.test";
const URL_AB = `${WP}/wp-json/haivan-web/v1/route/my-dinh/dien-bien`;

describe("routeBaseUrl", () => {
  it("ưu tiên WP_ROUTE_URL, rồi suy từ WP_LAYOUT_URL, thiếu cả hai → null", () => {
    expect(routeBaseUrl({ WP_ROUTE_URL: "https://wp.x/", WP_LAYOUT_URL: "https://other/wp-json/haivan-web/v1/layout" } as never)).toBe("https://wp.x");
    expect(routeBaseUrl({ WP_LAYOUT_URL: "http://localhost:8089/wp-json/haivan-web/v1/layout" } as never)).toBe("http://localhost:8089");
    expect(routeBaseUrl({} as never)).toBeNull();
  });
});

describe("getRouteLanding", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.stubEnv("WP_ROUTE_URL", WP);
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("200 hợp lệ → dữ liệu đã parse", async () => {
    server.use(http.get(URL_AB, () => HttpResponse.json(fixture)));
    expect((await getRouteLanding("my-dinh", "dien-bien"))?.h1).toBe(fixture.h1);
  });

  it("404 → null và cảnh báo [route] fallback một lần", async () => {
    server.use(http.get(`${WP}/wp-json/haivan-web/v1/route/a/b`, () => new HttpResponse(null, { status: 404 })));
    expect(await getRouteLanding("a", "b")).toBeNull();
    expect(await getRouteLanding("a", "b")).toBeNull();
    expect(warn.mock.calls.filter((c: unknown[]) => String(c[0]).startsWith("[route] fallback"))).toHaveLength(1);
  });

  it("5xx hoặc mạng lỗi → null (không ném)", async () => {
    server.use(http.get(`${WP}/wp-json/haivan-web/v1/route/c/d`, () => new HttpResponse(null, { status: 503 })));
    expect(await getRouteLanding("c", "d")).toBeNull();
    server.use(http.get(`${WP}/wp-json/haivan-web/v1/route/e/f`, () => HttpResponse.error()));
    expect(await getRouteLanding("e", "f")).toBeNull();
  });

  it("sai hợp đồng → null", async () => {
    server.use(http.get(`${WP}/wp-json/haivan-web/v1/route/g/h`, () => HttpResponse.json({ h1: "thiếu path" })));
    expect(await getRouteLanding("g", "h")).toBeNull();
  });

  it("lỗi tạm sau khi đã có nội dung (5xx, mạng, sai hợp đồng) → giữ nội dung WP cũ, không rơi về mẫu; một cảnh báo", async () => {
    const url = `${WP}/wp-json/haivan-web/v1/route/k/l`;
    server.use(http.get(url, () => HttpResponse.json({ ...fixture, path: "k/l", h1: "bản tốt" })));
    expect((await getRouteLanding("k", "l"))?.h1).toBe("bản tốt");
    for (const failing of [() => new HttpResponse(null, { status: 503 }), () => HttpResponse.error(), () => HttpResponse.json({ h1: "thiếu path" })]) {
      server.use(http.get(url, failing));
      expect((await getRouteLanding("k", "l"))?.h1).toBe("bản tốt");
    }
    expect(warn.mock.calls.filter((c: unknown[]) => String(c[0]).startsWith("[route] fallback k/l"))).toHaveLength(1);
    // WP hồi phục → nội dung mới thay bản cũ.
    server.use(http.get(url, () => HttpResponse.json({ ...fixture, path: "k/l", h1: "bản mới" })));
    expect((await getRouteLanding("k", "l"))?.h1).toBe("bản mới");
  });

  it("404 sau khi từng có nội dung (bài bị gỡ) → null, lỗi sau đó không hồi sinh bản cũ", async () => {
    const url = `${WP}/wp-json/haivan-web/v1/route/m/n`;
    server.use(http.get(url, () => HttpResponse.json({ ...fixture, path: "m/n" })));
    expect(await getRouteLanding("m", "n")).not.toBeNull();
    server.use(http.get(url, () => new HttpResponse(null, { status: 404 })));
    expect(await getRouteLanding("m", "n")).toBeNull();
    server.use(http.get(url, () => new HttpResponse(null, { status: 503 })));
    expect(await getRouteLanding("m", "n")).toBeNull();
  });

  it("slug lạ hoặc chưa cấu hình WP → null, không gọi mạng", async () => {
    expect(await getRouteLanding("../x", "y")).toBeNull();
    vi.stubEnv("WP_ROUTE_URL", "");
    vi.stubEnv("WP_LAYOUT_URL", "");
    expect(await getRouteLanding("a", "b")).toBeNull();
  });
});
