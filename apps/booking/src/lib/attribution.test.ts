import { afterEach, describe, expect, it } from "vitest";
import { attributionFromUrl, captureAttribution, cleanAttribution, currentAttribution, sourceLabel } from "./attribution";

afterEach(() => {
  document.cookie = "hv_attribution=; Max-Age=0; path=/";
  window.history.replaceState(null, "", "/");
});

describe("nguồn quảng cáo", () => {
  it("chỉ có gclid vẫn giữ (quảng cáo Google thường không có utm_source); tham số lặp lấy giá trị cuối; giá trị sai bị bỏ", () => {
    expect(attributionFromUrl(new URLSearchParams("gclid=Cj0a_b-c"))).toEqual({ gclid: "Cj0a_b-c" });
    expect(attributionFromUrl(new URLSearchParams("utm_source=fb&utm_source=google&utm_campaign=vt sale"))).toEqual({ utm_source: "google" });
    expect(cleanAttribution({ utm_medium: "cpc" })).toBeNull();
  });

  it("vào trang có tham số → lưu cookie; trang sau đọc lại; nhãn nguồn gads/fb/utm/org", () => {
    window.history.replaceState(null, "", "/xe-khach/quan-1/vung-tau?utm_source=google&utm_medium=cpc&gclid=abc123");
    captureAttribution();
    window.history.replaceState(null, "", "/xe-khach/tim-chuyen");
    expect(currentAttribution()).toEqual({ utm_source: "google", utm_medium: "cpc", gclid: "abc123" });
    expect(sourceLabel(currentAttribution())).toBe("gads");
    expect(sourceLabel({ fbclid: "x" })).toBe("fb");
    expect(sourceLabel(null)).toBe("org");
  });
});
