import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const req = (path: string, headers: Record<string, string> = {}) => new NextRequest(`http://localhost:8180${path}`, { headers });

describe("proxy (URL công khai vi không tiền tố, en có /en)", () => {
  it("/xe-khach → rewrite /vi/xe-khach, giữ query, đánh dấu đã rewrite", () => {
    const res = proxy(req("/xe-khach/tim-chuyen?from=a&to=b"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:8180/vi/xe-khach/tim-chuyen?from=a&to=b");
    expect(res.headers.get("x-middleware-request-x-hv-rewritten")).toBe("1");
  });

  it("/vi/... từ ngoài → 308 về dạng không tiền tố", () => {
    const res = proxy(req("/vi/xe-khach?x=1"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("http://localhost:8180/xe-khach?x=1");
  });

  it("lượt chạy lại cho đích đã rewrite không redirect (tránh vòng lặp 308)", () => {
    const res = proxy(req("/vi/xe-khach", { "x-hv-rewritten": "1" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/en/... cho qua", () => {
    expect(proxy(req("/en/xe-khach")).headers.get("x-middleware-rewrite")).toBeNull();
  });
});
