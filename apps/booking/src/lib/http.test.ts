import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/msw-server";
import { ApiError, apigw, cms, errorMessage } from "./http";

describe("http client", () => {
  it("apigw gửi Accept + Domain, không có PartnerId/Authorization", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get("https://apigw.haivan.com/api/places", ({ request }) => {
        seen = request.headers;
        return HttpResponse.json([]);
      }),
    );
    await apigw("places", { query: { type: 0 } });
    expect(seen?.get("accept")).toBe("application/json");
    expect(seen?.get("domain")).toBe("haivan.com");
    expect(seen?.has("partnerid")).toBe(false);
    expect(seen?.has("authorization")).toBe(false);
  });

  it("POST có Content-Type JSON và body nguyên vẹn", async () => {
    let body: unknown;
    let type: string | null = null;
    server.use(
      http.post("https://apigw.haivan.com/api/x", async ({ request }) => {
        type = request.headers.get("content-type");
        body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await apigw("x", { method: "POST", body: { a: 1, email: null } });
    expect(type).toBe("application/json");
    expect(body).toEqual({ a: 1, email: null });
  });

  it("lỗi lấy message backend (giới hạn đơn chưa thanh toán)", async () => {
    const message = "Bạn chỉ được đặt tối đa 2 đơn hàng với trạng thái chưa thanh toán.";
    server.use(http.post("https://apigw.haivan.com/api/hold-booking", () => HttpResponse.json({ message }, { status: 400 })));
    const err = (await apigw("hold-booking", { method: "POST", body: {} }).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe(message);
  });

  it("errorMessage ưu tiên errors rồi message", () => {
    expect(errorMessage({ errors: { phone: ["Số điện thoại sai"] }, message: "x" }, "f")).toBe("Số điện thoại sai");
    expect(errorMessage({ message: "m" }, "f")).toBe("m");
    expect(errorMessage("<html>", "f")).toBe("f");
  });

  it("cms không gửi Domain/Authorization", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get("https://cms.haivan.com/api/route-listing", ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ status: "OK", data: {} });
      }),
    );
    await cms("route-listing", { query: { route: "quan-1/vung-tau" } });
    expect(seen?.has("domain")).toBe(false);
    expect(seen?.has("authorization")).toBe(false);
  });
});

describe("gw path an toàn", () => {
  it("từ chối path có .., ?, #, \\, // hoặc dạng mã hoá, không gửi request", async () => {
    const { gw } = await import("./http");
    for (const bad of ["bookings/../payment/vnpay", "bookings/.\t./payment/vnpay", "bookings/.\n./x", "bookings/X?y=1", "bookings/X#a", "bookings/%2e%2e/x", "bookings/a%2Fb", "a\\b", "bookings//x", "bookings/B 1", ""]) {
      await expect(gw(bad), bad).rejects.toMatchObject({ status: 400 });
    }
  });
});

describe("gw path hợp lệ", () => {
  it("cho qua path thật của app", async () => {
    const { gw } = await import("./http");
    const { server } = await import("../../test/msw-server");
    const { http: h, HttpResponse: R } = await import("msw");
    server.use(h.all("*/api/hv/gw/*", () => R.json({ ok: true })));
    for (const ok of ["bookings/B02ABC123", "v4/check-transit", "customer/customers/update-profile", "transit/cancel-order/B02X_1"]) {
      await expect(gw(ok), ok).resolves.toEqual({ ok: true });
    }
  });
});
