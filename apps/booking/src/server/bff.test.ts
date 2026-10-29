// @vitest-environment node
import { sealData } from "iron-session";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/msw-server";
import { GET as gwGet, POST as gwPost } from "@/app/api/hv/gw/[...path]/route";
import { POST as verify } from "@/app/api/hv/auth/verify/route";
import { GET as session } from "@/app/api/hv/auth/session/route";
import { allowedPath } from "./gw-allowlist";
import { SESSION_COOKIE } from "./session";
import { callApigw, UpstreamBlocked } from "./upstream";

const ORIGIN = "http://127.0.0.1:3100";
const MOCK = "http://127.0.0.1:4010";
const SECRET = "test-secret-test-secret-test-secret-123";
const AUTH = "Bearer tok123";

const envBackup = { ...process.env };
beforeEach(() => {
  Object.assign(process.env, { APIGW_URL: MOCK, PUBLIC_ORIGIN: ORIGIN, SESSION_SECRET: SECRET });
  delete process.env.HV_LIVE_BACKEND;
  delete process.env.HV_LIVE_WRITES;
  delete process.env.E2E;
});
afterEach(() => {
  process.env = { ...envBackup };
});

async function sessionCookie() {
  return `${SESSION_COOKIE}=${await sealData({ authorization: AUTH, user: { name: "A", phone: null } }, { password: SECRET })}`;
}

function req(path: string, init: { method?: string; body?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`${ORIGIN}${path}`, { method: init.method ?? "GET", body: init.body, headers: { "x-hv-req": "1", ...init.headers } });
}
const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });
const postHeaders = (cookie: string) => ({ cookie, "content-type": "application/json", "x-hv-req": "1", origin: ORIGIN, "sec-fetch-site": "same-origin" });

describe("allowlist", () => {
  it("chỉ cho method + đường dẫn đúng", () => {
    expect(allowedPath("POST", ["hold-booking"])).toBe("hold-booking");
    expect(allowedPath("GET", ["bookings", "B02SAMPLE00001"])).toBe("bookings/B02SAMPLE00001");
    expect(allowedPath("GET", ["hold-booking"])).toBeNull();
    expect(allowedPath("DELETE", ["bookings", "X1"])).toBeNull();
    expect(allowedPath("GET", ["v4", "..", "admin"])).toBeNull();
    expect(allowedPath("GET", ["v4", "a/../../x"])).toBeNull();
    expect(allowedPath("GET", ["", "evil.com", "x"])).toBeNull();
    expect(allowedPath("GET", ["admin", "users"])).toBeNull();
  });

  it("mọi endpoint trang tài khoản / cập nhật dịch vụ đều qua được, đúng method", () => {
    const used: Array<[string, string[]]> = [
      ["GET", ["bookings"]],
      ["GET", ["bookings", "B02SAMPLE00001"]],
      ["GET", ["bookings", "download-bill"]],
      ["GET", ["list-reason"]],
      ["POST", ["cancel-seat"]],
      ["POST", ["cancel-booking"]],
      ["DELETE", ["transit", "cancel-order", "B02SAMPLE00001"]],
      ["GET", ["customer", "customers"]],
      ["POST", ["customer", "customers"]],
      ["PUT", ["customer", "customers", "update-profile"]],
      ["POST", ["customer", "customers", "tax"]],
      ["GET", ["customer", "definition"]],
      ["GET", ["promotion", "promotional_code_list_all"]],
      ["GET", ["v4", "detail-transit", "B02SAMPLE00001"]],
      ["GET", ["v4", "get-info-ticket"]],
      ["GET", ["v4", "check-transit"]],
      ["GET", ["v4", "get-price-ticket"]],
      ["POST", ["v4", "update-transit"]],
    ];
    for (const [method, segments] of used) expect(allowedPath(method, segments), `${method} ${segments.join("/")}`).toBe(segments.join("/"));
    // Sai method vẫn bị chặn.
    expect(allowedPath("GET", ["cancel-seat"])).toBeNull();
    expect(allowedPath("POST", ["customer", "customers", "update-profile"])).toBeNull();
    expect(allowedPath("DELETE", ["customer", "customers"])).toBeNull();
  });
});

describe("BFF gw proxy", () => {
  it("chưa đăng nhập → 401", async () => {
    const res = await gwGet(req("/api/hv/gw/list-reason"), ctx(["list-reason"]));
    expect(res.status).toBe(401);
  });

  it("đường dẫn ngoài allowlist → 404", async () => {
    const res = await gwGet(req("/api/hv/gw/admin/users", { headers: { cookie: await sessionCookie() } }), ctx(["admin", "users"]));
    expect(res.status).toBe(404);
  });

  it("chuyển tiếp với header cố định, Authorization từ phiên, query thô", async () => {
    let seen: Request | undefined;
    server.use(
      http.get(`${MOCK}/api/bookings`, ({ request }) => {
        seen = request;
        return HttpResponse.json({ data: [] }, { headers: { "x-internal": "1", "set-cookie": "a=b" } });
      }),
    );
    const res = await gwGet(
      req("/api/hv/gw/bookings?booking-status%5B0%5D=1&page=2", { headers: { cookie: await sessionCookie(), "x-http-method-override": "DELETE" } }),
      ctx(["bookings"]),
    );
    expect(res.status).toBe(200);
    expect(new URL(seen!.url).search).toBe("?booking-status%5B0%5D=1&page=2");
    expect(seen!.headers.get("authorization")).toBe(AUTH);
    expect(seen!.headers.get("domain")).toBe("haivan.com");
    expect(seen!.headers.get("accept")).toBe("application/json");
    expect(seen!.headers.has("x-http-method-override")).toBe(false);
    expect(seen!.headers.has("cookie")).toBe(false);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-internal")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("POST thiếu X-HV-Req hoặc sai Origin → 403 (CSRF)", async () => {
    const cookie = await sessionCookie();
    const noHeader = await gwPost(req("/api/hv/gw/hold-booking", { method: "POST", body: "{}", headers: { cookie, "content-type": "application/json", origin: ORIGIN, "x-hv-req": "" } }), ctx(["hold-booking"]));
    expect(noHeader.status).toBe(403);
    const badOrigin = await gwPost(req("/api/hv/gw/hold-booking", { method: "POST", body: "{}", headers: { ...postHeaders(cookie), origin: "https://evil.example" } }), ctx(["hold-booking"]));
    expect(badOrigin.status).toBe(403);
    const crossSite = await gwPost(req("/api/hv/gw/hold-booking", { method: "POST", body: "{}", headers: { ...postHeaders(cookie), "sec-fetch-site": "cross-site" } }), ctx(["hold-booking"]));
    expect(crossSite.status).toBe(403);
  });

  it("upstream 401 → xoá cookie phiên", async () => {
    server.use(http.get(`${MOCK}/api/list-reason`, () => HttpResponse.json({ message: "Unauthenticated." }, { status: 401 })));
    const res = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie: await sessionCookie() } }), ctx(["list-reason"]));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toMatch(/hv_session=;.*Max-Age=0/i);
  });

  it("backend thật bị chặn khi chưa bật cờ; ghi thật bị chặn khi chưa bật HV_LIVE_WRITES", async () => {
    process.env.APIGW_URL = "https://apigw.haivan.com";
    const cookie = await sessionCookie();
    const read = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie } }), ctx(["list-reason"]));
    expect(read.status).toBe(503);
    process.env.HV_LIVE_BACKEND = "1";
    const write = await gwPost(req("/api/hv/gw/hold-booking", { method: "POST", body: "{}", headers: postHeaders(cookie) }), ctx(["hold-booking"]));
    expect(write.status).toBe(503);
    expect(await write.json()).toMatchObject({ message: expect.stringContaining("HV_LIVE_WRITES") });
  });
});

describe("auth", () => {
  it("verify gửi {phone, otp, channel:1}, set cookie httpOnly, không trả token", async () => {
    let body: unknown;
    server.use(
      http.post(`${MOCK}/api/verify-otp`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: 200, status: "success", access_token: "tok123", token_type: "Bearer", expires_in: 1 });
      }),
      http.get(`${MOCK}/api/customer/customers`, () => HttpResponse.json({ data: { name: "Khach Test", phone: "0900000000" } })),
    );
    const res = await verify(req("/api/hv/auth/verify", { method: "POST", body: JSON.stringify({ phone: "0900000000", otp: "123456" }), headers: postHeaders("") }));
    expect(body).toEqual({ phone: "0900000000", otp: "123456", channel: 1 });
    const text = await res.text();
    expect(text).not.toContain("tok123");
    expect(JSON.parse(text)).toMatchObject({ loggedIn: true, user: { name: "Khach Test" } });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/hv_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).not.toMatch(/Domain=/i);
  });

  it("verify không có token → khách mới", async () => {
    server.use(http.post(`${MOCK}/api/verify-otp`, () => HttpResponse.json({ code: 200, status: "success" })));
    const res = await verify(req("/api/hv/auth/verify", { method: "POST", body: JSON.stringify({ phone: "a@b.vn", otp: "123456" }), headers: postHeaders("") }));
    expect(await res.json()).toEqual({ loggedIn: false, isNew: true });
  });

  it("session không bao giờ trả token", async () => {
    const res = await session(req("/api/hv/auth/session", { headers: { cookie: await sessionCookie() } }));
    const text = await res.text();
    expect(text).not.toContain("tok123");
    expect(JSON.parse(text)).toMatchObject({ loggedIn: true });
  });
});

describe("BFF hardening (review phase 2-3)", () => {
  it("GET qua gw cần X-HV-Req; điều hướng top-level bị chặn", async () => {
    const cookie = await sessionCookie();
    const noHeader = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie, "x-hv-req": "" } }), ctx(["list-reason"]));
    expect(noHeader.status).toBe(403);
    const nav = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie, "x-hv-req": "1", "sec-fetch-mode": "navigate" } }), ctx(["list-reason"]));
    expect(nav.status).toBe(403);
  });

  it("payment/vnpay là thao tác ghi: backend thật cần HV_LIVE_WRITES", async () => {
    process.env.APIGW_URL = "https://apigw.haivan.com";
    process.env.HV_LIVE_BACKEND = "1";
    const res = await gwGet(req("/api/hv/gw/payment/vnpay?return_url=x", { headers: { cookie: await sessionCookie(), "x-hv-req": "1" } }), ctx(["payment", "vnpay"]));
    expect(res.status).toBe(503);
  });

  it("204 không thành 502; HTML upstream → 502 JSON; header an toàn", async () => {
    const cookie = await sessionCookie();
    server.use(
      http.post(`${MOCK}/api/cancel-seat`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${MOCK}/api/list-reason`, () => new HttpResponse("<html>oops</html>", { status: 500, headers: { "content-type": "text/html" } })),
    );
    const ok = await gwPost(req("/api/hv/gw/cancel-seat", { method: "POST", body: "{}", headers: postHeaders(cookie) }), ctx(["cancel-seat"]));
    expect(ok.status).toBe(204);
    const html = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie, "x-hv-req": "1" } }), ctx(["list-reason"]));
    expect(html.status).toBe(502);
    expect(html.headers.get("content-type")).toContain("application/json");
    expect(html.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("DELETE chuyển tiếp body {reason, type:0}", async () => {
    let body: unknown;
    server.use(http.delete(`${MOCK}/api/transit/cancel-order/AB12`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ ok: 1 }); }));
    const { DELETE } = await import("@/app/api/hv/gw/[...path]/route");
    const res = await DELETE(req("/api/hv/gw/transit/cancel-order/AB12", { method: "DELETE", body: JSON.stringify({ reason: "x", type: 0 }), headers: postHeaders(await sessionCookie()) }), ctx(["transit", "cancel-order", "AB12"]));
    expect(res.status).toBe(200);
    expect(body).toEqual({ reason: "x", type: 0 });
  });

  it("verify chặn sau 5 lần thử theo SĐT", async () => {
    server.use(http.post(`${MOCK}/api/verify-otp`, () => HttpResponse.json({ message: "Sai OTP" }, { status: 400 })));
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const res = await verify(req("/api/hv/auth/verify", { method: "POST", body: JSON.stringify({ phone: "0911111111", otp: "000000" }), headers: postHeaders("") }));
      last = res.status;
    }
    expect(last).toBe(429);
  });
});

describe("E2E=1: BFF chỉ nói chuyện với loopback", () => {
  beforeEach(() => {
    process.env.E2E = "1";
  });
  afterEach(() => vi.restoreAllMocks());

  it("callApigw từ chối mọi host không phải loopback, kể cả khi đã bật HV_LIVE_BACKEND/HV_LIVE_WRITES", async () => {
    process.env.HV_LIVE_BACKEND = "1";
    process.env.HV_LIVE_WRITES = "1";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const origin of ["https://apigw.haivan.com", "https://cms.haivan.com", "https://api.cpn.haivanexpress.vn", "http://127.0.0.1.evil.example:4010", "http://localhost.haivan.com"]) {
      process.env.APIGW_URL = origin;
      await expect(callApigw({ method: "GET", path: "list-reason" }), `GET ${origin}`).rejects.toThrow(UpstreamBlocked);
      await expect(callApigw({ method: "POST", path: "hold-booking", body: "{}" }), `POST ${origin}`).rejects.toThrow(/E2E=1/);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("các route BFF trả 503 và không gửi request nào khi APIGW_URL là production", async () => {
    process.env.APIGW_URL = "https://apigw.haivan.com";
    process.env.HV_LIVE_BACKEND = "1";
    process.env.HV_LIVE_WRITES = "1";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const cookie = await sessionCookie();
    const read = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie } }), ctx(["list-reason"]));
    const write = await gwPost(req("/api/hv/gw/hold-booking", { method: "POST", body: "{}", headers: postHeaders(cookie) }), ctx(["hold-booking"]));
    const login = await verify(req("/api/hv/auth/verify", { method: "POST", body: JSON.stringify({ phone: "0900000000", otp: "123456" }), headers: postHeaders("") }));
    expect([read.status, write.status, login.status]).toEqual([503, 503, 503]);
    expect(await write.json()).toMatchObject({ message: expect.stringContaining("E2E=1") });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loopback vẫn đi qua bình thường", async () => {
    server.use(http.get(`${MOCK}/api/list-reason`, () => HttpResponse.json({ data: [] })));
    const res = await gwGet(req("/api/hv/gw/list-reason", { headers: { cookie: await sessionCookie() } }), ctx(["list-reason"]));
    expect(res.status).toBe(200);
  });
});
