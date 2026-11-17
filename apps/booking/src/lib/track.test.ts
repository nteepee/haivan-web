import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/lib/track");
const { logStep, track } = await import("./track");

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() => Promise.resolve(new Response(null, { status: 204 })));
type W = Window & { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  (window as W).dataLayer = [];
  window.history.replaceState(null, "", "/xe-khach/quan-1/vung-tau");
  document.cookie = `hv_attribution=${encodeURIComponent(JSON.stringify({ v: 1, data: { utm_source: "google", utm_campaign: "vt_sale", gclid: "Cj0abc" }, capturedAt: Date.now(), expiresAt: Date.now() + 86_400_000 }))}; path=/`;
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as W).fbq;
  document.cookie = "hv_attribution=; Max-Age=0; path=/";
});

const sent = (i = 0) => JSON.parse(fetchMock.mock.calls[i][1]!.body as string);

describe("track: mốc phễu đặt vé", () => {
  it("đẩy dataLayer + Meta Pixel + nhật ký máy chủ, kèm tuyến của trang và nguồn quảng cáo, không có thông tin cá nhân", () => {
    const fbq = vi.fn();
    (window as W).fbq = fbq;
    track("start_checkout", { value: 420000, guests: 2, time: "07:00" });
    expect((window as W).dataLayer).toEqual([{ event: "start_checkout", value: 420000, guests: 2, time: "07:00", route: "quan-1/vung-tau" }]);
    expect(fbq).toHaveBeenCalledWith("track", "InitiateCheckout", { value: 420000, currency: "VND" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/hv/client-log");
    expect(sent()).toMatchObject({ ev: "start_checkout", route: "quan-1/vung-tau", src: "gads", camp: "vt_sale", gclid: "Cj0abc", val: 420000 });
  });
});

describe("logStep: lỗi / chậm", () => {
  it("bước nhanh không lỗi thì không gửi; lỗi hoặc chậm thì gửi, tối đa 8 bản mỗi trang", () => {
    logStep("tai-so-do-ghe", 300);
    expect(fetchMock).not.toHaveBeenCalled();
    logStep("tai-so-do-ghe", 9000);
    expect(sent()).toMatchObject({ ev: "client_step", step: "tai-so-do-ghe", ms: 9000, err: "" });
    for (let i = 0; i < 20; i++) logStep("js-error", 0, "boom");
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});

describe("pageRoute", () => {
  it("trang tuyến → a/b; trang tìm chuyến theo tuyến chính → tuyen:chieu; trang thanh toán → rỗng", async () => {
    const { pageRoute } = await import("./track");
    window.history.replaceState(null, "", "/en/xe-khach/vung-tau/quan-1-san-bay");
    expect(pageRoute()).toBe("vung-tau/quan-1-san-bay");
    window.history.replaceState(null, "", "/xe-khach/tim-chuyen?tuyen=sg-vt&chieu=ba");
    expect(pageRoute()).toBe("sg-vt:ba");
    window.history.replaceState(null, "", "/xe-khach/thanh-toan/thanh-cong?booking_code=X");
    expect(pageRoute()).toBe("");
  });
});
