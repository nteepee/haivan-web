import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/msw-server";
import { cancelBookingBody, cancelSeatBody, cancelTransitBody } from "./account-cancel";
import { profileBody, profileInitial, profileRequest, taxBody } from "./account-profile";
import { bookingsQuery } from "./account-trips";
import { updateTransitBody } from "./account-transit";
import { ApiError, gw } from "./http";
import { customerSchema, definitionSchema } from "@/schemas/account";

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;

interface Seen {
  method: string;
  url: URL;
  body: string;
  headers: Headers;
}

function capture(method: "get" | "post" | "put" | "delete", path: string, reply: unknown = { status: "OK" }) {
  const seen: Seen[] = [];
  server.use(
    http[method](`${BASE}/${path}`, async ({ request }) => {
      seen.push({ method: request.method, url: new URL(request.url), body: await request.text(), headers: request.headers });
      return HttpResponse.json(reply as Record<string, unknown>);
    }),
  );
  return seen;
}

// gw() gọi đường dẫn tương đối (cùng origin); fetch của Node cần URL tuyệt đối.
beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
});
afterEach(() => vi.unstubAllGlobals());

describe("request tài khoản khớp spec + live capture", () => {
  it("GET bookings: query thô booking-status[0] và page", async () => {
    const seen = capture("get", "bookings", { data: [] });
    await gw("bookings", { query: bookingsQuery(1) });
    await gw("bookings", { query: bookingsQuery(2, 2) });
    expect(seen.map((s) => s.url.search)).toEqual(["?booking-status%5B0%5D=1", "?page=2&booking-status%5B0%5D=2"]);
    expect(seen[0].headers.get("x-hv-req")).toBe("1");
  });

  it("POST cancel-seat gửi đúng body live", async () => {
    const seen = capture("post", "cancel-seat", { data: {} });
    await gw("cancel-seat", { method: "POST", body: cancelSeatBody("B02SAMPLE00001", "V02SAMPLE000001", "02", { reasonId: 3, note: "" }) });
    expect(seen[0].body).toBe('{"order_code":"B02SAMPLE00001","seat_code":"V02SAMPLE000001","merchant_code":"02","reason_cancel_id":3,"reason_cancel_note":""}');
  });

  it("POST cancel-booking có type:0; lỗi 422 hiện message backend", async () => {
    const seen = capture("post", "cancel-booking");
    await gw("cancel-booking", { method: "POST", body: cancelBookingBody("B02X", "02", { reasonId: 1, note: "đổi ý" }) });
    expect(JSON.parse(seen[0].body)).toEqual({ order_code: "B02X", merchant_code: "02", reason_cancel_id: 1, reason_cancel_note: "đổi ý", type: 0 });
    server.use(http.post(`${BASE}/cancel-booking`, () => HttpResponse.json({ message: "Đã quá thời gian huỷ vé" }, { status: 422 })));
    const err = (await gw("cancel-booking", { method: "POST", body: {} }).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Đã quá thời gian huỷ vé");
  });

  it("DELETE transit/cancel-order/{code} giữ body {reason,type:0}", async () => {
    const seen = capture("delete", "transit/cancel-order/B02X", {});
    await gw("transit/cancel-order/B02X", { method: "DELETE", body: cancelTransitBody("không đi") });
    expect(seen[0].method).toBe("DELETE");
    expect(JSON.parse(seen[0].body)).toEqual({ reason: "không đi", type: 0 });
  });

  it("GET download-bill: ticket_code + merchant_code", async () => {
    const seen = capture("get", "bookings/download-bill", { base64pdf: "JVBERg==" });
    await gw("bookings/download-bill", { query: { ticket_code: "V02X", merchant_code: "02" } });
    expect(seen[0].url.search).toBe("?ticket_code=V02X&merchant_code=02");
  });

  it("hồ sơ: thành viên → PUT update-profile, chưa → POST customers; hoá đơn → POST tax", async () => {
    const customer = customerSchema.parse({ data: { name: "An", phone: "0900000000", address: "x", date_of_birth: "1990-01-02", title: { key: "mr", text: "Ông" }, province: { code: "79", name: "a" }, district: { code: "79760", name: "b" }, occupation: { key: 1, text: "c" }, travel_purpose: { key: 2, text: "d" } } }).data;
    const def = definitionSchema.parse({ titles: [{ key: "mr", text: "Ông" }], jobs: [{ key: 1, text: "c" }], travel_purposes: [{ key: 2, text: "d" }] }) as Parameters<typeof profileBody>[1];
    const body = profileBody(profileInitial(customer), def);
    const put = capture("put", "customer/customers/update-profile");
    const post = capture("post", "customer/customers");
    const tax = capture("post", "customer/customers/tax", { status: "success" });
    for (const member of [true, false]) {
      const request = profileRequest(member);
      await gw(request.path, { method: request.method, body });
    }
    await gw("customer/customers/tax", { method: "POST", body: taxBody({ email: "", company_name: "Cty", tax_code: "01", company_address: "HN" }) });
    expect(put).toHaveLength(1);
    expect(post).toHaveLength(1);
    expect(JSON.parse(put[0].body)).toMatchObject({ title: "mr", date_of_birth: "1990-01-02", occupation: 1, travel_purpose: 2, province_code: "79" });
    expect(JSON.parse(put[0].body)).not.toHaveProperty("phone");
    expect(JSON.parse(tax[0].body)).toEqual({ email: "", company_name: "Cty", tax_code: "01", company_address: "HN" });
  });

  it("ưu đãi: promotional_code_list_all?source=1", async () => {
    const seen = capture("get", "promotion/promotional_code_list_all", { data: [] });
    await gw("promotion/promotional_code_list_all", { query: { source: 1 } });
    expect(seen[0].url.search).toBe("?source=1");
  });

  it("cập nhật dịch vụ: detail-transit, get-info-ticket, update-transit", async () => {
    const detail = capture("get", "v4/detail-transit/B02X", []);
    const info = capture("get", "v4/get-info-ticket", []);
    const update = capture("post", "v4/update-transit", {});
    await gw("v4/detail-transit/B02X", { query: { merchant_code: "02" } });
    await gw("v4/get-info-ticket", { query: { order_id: 99, service_code: "TCDON", merchant_code: "02" } });
    await gw("v4/update-transit", { method: "POST", body: updateTransitBody("B02X", "02", [{ dvbs_id: 7, dvbs_code: "TCDON", dvbs_is_group: 0, dvbs_tickets: [{ code: "V1", check: true }], check: true, seat: 1, seatCheck: 1, address: [] }]) });
    expect(detail[0].url.search).toBe("?merchant_code=02");
    expect(info[0].url.search).toBe("?order_id=99&service_code=TCDON&merchant_code=02");
    expect(JSON.parse(update[0].body)).toEqual({ order_code: "B02X", merchant_code: "02", seats: [{ code: "V1", check: true, is_group: 0, dvbs_id: 7 }] });
  });
});
