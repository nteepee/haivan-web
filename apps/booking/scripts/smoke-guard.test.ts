import { describe, expect, it } from "vitest";
import { assertAllowed, SmokeRefused } from "./smoke-guard";

describe("smoke allowlist", () => {
  it.each([
    "https://apigw.haivan.com/api/places?type=0",
    "https://apigw.haivan.com/api/el/trips?date=2026-11-01",
    "https://apigw.haivan.com/api/trips/41389806?departure_id=95",
    "https://apigw.haivan.com/api/el/trip_detail?trip_id=1&merchant_code=02",
    "https://cms.haivan.com/api/route-listing?route=quan-1%2Fvung-tau",
    "https://cms.haivan.com/api/list-banner?language=vi",
  ])("cho phép GET %s", (url) => {
    expect(assertAllowed(url, "GET").href).toBe(url);
  });

  it.each([
    "https://apigw.haivan.com/api/hold-booking",
    "https://apigw.haivan.com/api/bookings",
    "https://apigw.haivan.com/api/get-otp?phone=0900000000",
    "https://apigw.haivan.com/api/payment/vnpay",
    "https://apigw.haivan.com/api/trips/123/../bookings",
    "https://apigw.haivan.com/api/trips/abc",
    "https://cms.haivan.com/api/places",
    "https://haivan.com/api/places",
    "http://apigw.haivan.com/api/places",
    "https://apigw.haivan.com:8443/api/places",
    "https://apigw.haivan.com.evil.example/api/places",
    "https://apigw.haivan.com@evil.example/api/places",
    "https://user:pw@apigw.haivan.com/api/places",
    "not a url",
  ])("từ chối %s", (url) => {
    expect(() => assertAllowed(url, "GET")).toThrow(SmokeRefused);
  });

  it.each(["POST", "PUT", "DELETE", "PATCH", "HEAD", "get"])("từ chối method %s kể cả với endpoint trong allowlist", (method) => {
    expect(() => assertAllowed("https://apigw.haivan.com/api/places?type=0", method)).toThrow(/chỉ được GET/);
  });
});
