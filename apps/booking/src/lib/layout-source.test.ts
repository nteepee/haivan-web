import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../../test/fixtures/wp-layout.json";
import fallback from "@/content/layout-fallback.json";
import { server } from "../../test/msw-server";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const URL_LAYOUT = "http://wp.test/wp-json/haivan-web/v1/layout";

/** Module mới mỗi test: kho "bản tốt" nằm ở module. */
async function load() {
  vi.resetModules();
  vi.stubEnv("WP_LAYOUT_URL", URL_LAYOUT);
  return import("./layout-source");
}
const wpLayout = (hotline: string) => ({ ...fixture, hotline });

describe("getSiteLayout", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("không cấu hình WP_LAYOUT_URL → bản dự phòng, không gọi mạng", async () => {
    vi.resetModules();
    vi.stubEnv("WP_LAYOUT_URL", "");
    const { getSiteLayout } = await import("./layout-source");
    expect((await getSiteLayout()).hotline).toBe(fallback.hotline);
  });

  it("WP trả layout hợp lệ → dùng nó", async () => {
    const { getSiteLayout } = await load();
    server.use(http.get(URL_LAYOUT, () => HttpResponse.json(wpLayout("1900 0001"))));
    expect((await getSiteLayout()).hotline).toBe("1900 0001");
  });

  it("WP lỗi (5xx, mạng, sai hợp đồng) sau khi thành công → giữ layout WP gần nhất, không rơi về bản dự phòng; một cảnh báo", async () => {
    const { getSiteLayout } = await load();
    server.use(http.get(URL_LAYOUT, () => HttpResponse.json(wpLayout("1900 0002"))));
    await getSiteLayout();
    for (const failing of [() => new HttpResponse(null, { status: 500 }), () => HttpResponse.error(), () => HttpResponse.json({ version: 2 })]) {
      server.use(http.get(URL_LAYOUT, failing));
      expect((await getSiteLayout()).hotline).toBe("1900 0002");
    }
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("WP lỗi mà chưa từng thành công → bản dự phòng", async () => {
    const { getSiteLayout } = await load();
    server.use(http.get(URL_LAYOUT, () => new HttpResponse("oops", { status: 503 })));
    expect((await getSiteLayout()).hotline).toBe(fallback.hotline);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("WP hồi phục sau lỗi → dùng nội dung mới", async () => {
    const { getSiteLayout } = await load();
    server.use(http.get(URL_LAYOUT, () => HttpResponse.json(wpLayout("1900 0003"))));
    await getSiteLayout();
    server.use(http.get(URL_LAYOUT, () => new HttpResponse(null, { status: 500 })));
    await getSiteLayout();
    server.use(http.get(URL_LAYOUT, () => HttpResponse.json(wpLayout("1900 0004"))));
    expect((await getSiteLayout()).hotline).toBe("1900 0004");
  });
});

describe("getSiteLayout: {year} trong bản quyền", () => {
  it("bản dự phòng giữ chỗ {year} và được thay bằng năm hiện tại theo từng ngôn ngữ", async () => {
    vi.resetModules();
    vi.stubEnv("WP_LAYOUT_URL", "");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-03-01T00:00:00Z"));
    try {
      const { getSiteLayout } = await import("./layout-source");
      const layout = await getSiteLayout();
      expect(layout.copyright).toEqual({ vi: "Bản quyền © 2027 Hải Vân", en: "Copyright © 2027 Hai Van" });
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });
});
