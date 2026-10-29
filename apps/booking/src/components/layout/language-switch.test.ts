import { describe, expect, it } from "vitest";
import { switchLocalePath, switchLocaleQuery } from "./language-switch";

describe("đổi ngôn ngữ", () => {
  it("không nối ?en / ?en= / ?vi rỗng; giữ tham số khác", () => {
    expect(switchLocaleQuery("")).toBe("");
    expect(switchLocaleQuery("en")).toBe("");
    expect(switchLocaleQuery("en=")).toBe("");
    expect(switchLocaleQuery("vi=&lang=en")).toBe("");
    expect(switchLocaleQuery("en=&date=01-11-2026&numberGuest=2")).toBe("?date=01-11-2026&numberGuest=2");
  });

  it("đường dẫn đổi vi ↔ en", () => {
    expect(switchLocalePath("/xe-khach/my-dinh/son-la", "en")).toBe("/en/xe-khach/my-dinh/son-la");
    expect(switchLocalePath("/en/xe-khach", "vi")).toBe("/xe-khach");
    expect(switchLocalePath("/en", "vi")).toBe("/");
  });
});
