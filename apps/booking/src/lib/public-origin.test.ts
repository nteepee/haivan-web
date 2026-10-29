import { describe, expect, it } from "vitest";
import { publicOrigin } from "./public-origin";

describe("publicOrigin", () => {
  it("mặc định haivan.com; bỏ mọi dấu / cuối và khoảng trắng", () => {
    expect(publicOrigin({})).toBe("https://haivan.com");
    expect(publicOrigin({ PUBLIC_ORIGIN: "" })).toBe("https://haivan.com");
    expect(publicOrigin({ PUBLIC_ORIGIN: " https://haivan.com/ " })).toBe("https://haivan.com");
    expect(publicOrigin({ PUBLIC_ORIGIN: "http://localhost:8180//" })).toBe("http://localhost:8180");
  });
});
