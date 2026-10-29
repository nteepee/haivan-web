import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { upstreamSearch } from "./raw-query";

const RAW = "return_url=http://localhost:8180/xe-khach/thanh-toan?booking_code=B1&order_code=B1&bank_code=VNPAYQR&merchant_code=02&trip_id=7";
// Dạng Next đưa cho route handler sau khi chuẩn hoá.
const NORMALIZED = "return_url=http%3A%2F%2Flocalhost%3A8180%2Fxe-khach%2Fthanh-toan%3Fbooking_code%3DB1&order_code=B1&bank_code=VNPAYQR&merchant_code=02&trip_id=7";
const req = (search: string, raw?: string) =>
  new NextRequest(`http://localhost:8180/api/hv/gw/payment/vnpay?${search}`, { headers: raw === undefined ? {} : { "x-hv-query": raw } });

describe("upstreamSearch", () => {
  it("dùng chuỗi gốc khi tương đương với query thật → giữ byte như web cũ", () => {
    expect(upstreamSearch(req(NORMALIZED, RAW))).toBe(`?${RAW}`);
  });
  it("khoảng trắng %20 giữ nguyên thay vì '+'", () => {
    expect(upstreamSearch(req("departure_time=2026-10-29+12%3A30%3A00", "departure_time=2026-10-29%2012:30:00"))).toBe("?departure_time=2026-10-29%2012:30:00");
  });
  it("header khác ngữ nghĩa (chèn/đổi tham số) → bỏ qua, dùng query thật", () => {
    expect(upstreamSearch(req(NORMALIZED, `${RAW}&extra=1`))).toBe(`?${NORMALIZED}`);
    expect(upstreamSearch(req("a=1", "a=2"))).toBe("?a=1");
  });
  it("chuỗi có '#', bắt đầu bằng '?' hoặc UTF-8 hỏng → bỏ qua", () => {
    expect(upstreamSearch(req("a=%FF", "a=%FE"))).toBe("?a=%FF");
    expect(upstreamSearch(req("a=1", "?a=1"))).toBe("?a=1");
    expect(upstreamSearch(req("a=1%23x", "a=1#x"))).toBe("?a=1%23x");
  });
  it("không có header → query thật", () => {
    expect(upstreamSearch(req("a=1"))).toBe("?a=1");
  });
});
