import dns from "node:dns";
import { http, HttpResponse, passthrough } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./msw-server";
import { blockedProductionRequests, isProductionUrl } from "./network-guard";

const takeBlocked = () => blockedProductionRequests.splice(0);

describe("network guard", () => {
  it("nhận diện host production (cổng, chấm cuối, hoa thường, subdomain)", () => {
    for (const url of [
      "https://apigw.haivan.com/api/el/trips",
      "https://APIGW.HAIVAN.COM/x",
      "https://apigw.haivan.com:8443/x.json",
      "https://cms.haivan.com./a.png",
      "https://haivan.com/locales/vi/common.json",
      "https://api.cpn.haivanexpress.vn/api/v1/x",
    ]) expect(isProductionUrl(url), url).toBe(true);
    expect(isProductionUrl("http://127.0.0.1:4010/api/el/trips")).toBe(false);
    expect(isProductionUrl("https://nothaivan.com/x")).toBe(false);
  });

  it.each([
    "https://apigw.haivan.com/api/__guard_probe",
    "https://apigw.haivan.com:8443/__guard_probe.json",
    "https://cms.haivan.com./__guard_probe.png",
    "https://haivan.com/locales/vi/__guard_probe.json",
  ])("chặn fetch không có handler: %s", async (url) => {
    await expect(fetch(url)).rejects.toThrow();
    expect(takeBlocked().length).toBeGreaterThan(0);
  });

  it("passthrough() tới production vẫn bị chặn ở tầng DNS", async () => {
    const url = "https://apigw.haivan.com/api/__guard_probe_passthrough";
    server.use(http.get(url, () => passthrough()));
    await expect(fetch(url)).rejects.toThrow();
    expect(takeBlocked()).toContain("DNS apigw.haivan.com");
  });

  it("tra DNS trực tiếp tới production bị từ chối", async () => {
    await expect(dns.promises.lookup("apigw.haivan.com")).rejects.toMatchObject({ code: "ENOTFOUND" });
    const err = await new Promise<NodeJS.ErrnoException | null>((resolve) => dns.lookup("cms.haivan.com.", (e) => resolve(e)));
    expect(err?.code).toBe("ENOTFOUND");
    expect(takeBlocked()).toEqual(["DNS apigw.haivan.com", "DNS cms.haivan.com."]);
  });

  it("cấm XHR đồng bộ", () => {
    const xhr = new XMLHttpRequest();
    expect(() => xhr.open("GET", "https://apigw.haivan.com/api/__guard_probe", false)).toThrow(/đồng bộ/);
  });

  it("cấm resetHandlers(handlers) vì làm mất catch-all", () => {
    expect(() => server.resetHandlers(http.get("https://example.test/x", () => HttpResponse.json({})))).toThrow();
  });

  it("cho phép request production đã có handler MSW", async () => {
    server.use(http.get("https://apigw.haivan.com/api/places", () => HttpResponse.json([])));
    const res = await fetch("https://apigw.haivan.com/api/places?type=0");
    expect(await res.json()).toEqual([]);
    expect(takeBlocked()).toEqual([]);
  });
});
