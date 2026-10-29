import { describe, expect, it } from "vitest";
import fixture from "../../test/fixtures/wp-route.json";
import { routeLandingSchema } from "./route-landing";

describe("hợp đồng route landing WP ↔ Next", () => {
  it("fixture khớp hợp đồng", () => {
    const parsed = routeLandingSchema.parse(fixture);
    expect(parsed.path).toBe("my-dinh/dien-bien");
    expect(parsed.faq).toHaveLength(2);
    expect(parsed.vehicle_classes?.[0].amenities).toContain("Sạc USB");
  });

  it("chỉ `path` là bắt buộc; null cho ô trống vẫn hợp lệ", () => {
    expect(routeLandingSchema.safeParse({ path: "a/b" }).success).toBe(true);
    expect(routeLandingSchema.safeParse({ path: "a/b", h1: null, faq: null, reverse_route: null }).success).toBe(true);
    expect(routeLandingSchema.safeParse({}).success).toBe(false);
  });

  it("từ chối path sai dạng, URL bản đồ không phải http(s), faq thiếu câu trả lời", () => {
    expect(routeLandingSchema.safeParse({ path: "a" }).success).toBe(false);
    expect(routeLandingSchema.safeParse({ path: "../x/y" }).success).toBe(false);
    expect(routeLandingSchema.safeParse({ path: "a/b", offices: [{ name: "n", address: "a", map_url: "javascript:alert(1)" }] }).success).toBe(false);
    expect(routeLandingSchema.safeParse({ path: "a/b", faq: [{ q: "x" }] }).success).toBe(false);
  });
});
