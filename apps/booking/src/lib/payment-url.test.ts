import { describe, expect, it } from "vitest";
import { parseVnDateTime } from "./format";
import { paymentReturn, readPaymentContext, vnpayRawQuery } from "./payment-url";

describe("thanh toán", () => {
  it("query vnpay nối thô byte-for-byte như web cũ (cả /en)", () => {
    expect(vnpayRawQuery({ href: "https://haivan.com/xe-khach/thanh-toan?booking_code=B1&merchant_code=02&trip_id=9", bookingCode: "B1", bankCode: "VNPAYQR", merchantCode: "02", tripId: "9" })).toBe(
      "return_url=https://haivan.com/xe-khach/thanh-toan?booking_code=B1&order_code=B1&bank_code=VNPAYQR&merchant_code=02&trip_id=9",
    );
    expect(vnpayRawQuery({ href: "https://haivan.com/en/xe-khach/thanh-toan?x", bookingCode: "B1", bankCode: "NCB", merchantCode: "02", tripId: "9" })).toMatch(/^return_url=https:\/\/haivan\.com\/en\/xe-khach\/thanh-toan\?/);
  });

  it("đọc kết quả quay về", () => {
    expect(paymentReturn(new URLSearchParams("vnp_ResponseCode=00"))).toBe("success");
    expect(paymentReturn(new URLSearchParams("vnp_ResponseCode=24"))).toBe("cancelled");
    expect(paymentReturn(new URLSearchParams("vnp_ResponseCode=07"))).toBe("verifying");
    expect(paymentReturn(new URLSearchParams("vnp_ResponseCode=51"))).toBe("failed");
    expect(paymentReturn(new URLSearchParams("code=00&cancel=false&status=PAID"))).toBe("success");
    expect(paymentReturn(new URLSearchParams("booking_code=B1"))).toBeNull();
  });

  it("thiếu merchant/trip trên URL quay về → lấy bản lưu cùng mã đơn", () => {
    sessionStorage.setItem("hv_payment_ctx", JSON.stringify({ booking_code: "B1", merchant_code: "02", trip_id: "9" }));
    expect(readPaymentContext(new URLSearchParams("booking_code=B1&vnp_ResponseCode=00"))).toEqual({ booking_code: "B1", merchant_code: "02", trip_id: "9" });
    expect(readPaymentContext(new URLSearchParams("booking_code=B2"))).toEqual({ booking_code: "B2", merchant_code: "", trip_id: "" });
    expect(readPaymentContext(new URLSearchParams("booking_code=B1&merchant_code=02%26return_url%3Dhttps%3A%2F%2Fevil.tld"))).toBeNull();
    expect(readPaymentContext(new URLSearchParams("vnp_ResponseCode=00"))).toEqual({ booking_code: "B1", merchant_code: "02", trip_id: "9" });
  });

  it("created_at nhiều định dạng", () => {
    expect(new Date(parseVnDateTime("27-10-2026 00:00")).toISOString()).toBe("2026-10-26T17:00:00.000Z");
    expect(new Date(parseVnDateTime("2026-10-28 14:28:29")).toISOString()).toBe("2026-10-28T07:28:29.000Z");
    expect(Number.isNaN(parseVnDateTime("x"))).toBe(true);
  });
});
