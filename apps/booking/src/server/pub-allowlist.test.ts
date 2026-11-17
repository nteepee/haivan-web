import { describe, expect, it } from "vitest";
import { allowedPubPath } from "./pub-allowlist";

describe("allowedPubPath", () => {
  it("chỉ endpoint công khai trong danh sách, đúng method", () => {
    expect(allowedPubPath("GET", ["el", "trips"])).toBe("el/trips");
    expect(allowedPubPath("GET", ["trips", "46864002"])).toBe("trips/46864002");
    expect(allowedPubPath("POST", ["qrcode", "agency-qr-code-scan-logs"])).toBe("qrcode/agency-qr-code-scan-logs");
    expect(allowedPubPath("POST", ["el", "trips"])).toBeNull();
    expect(allowedPubPath("GET", ["hold-booking"])).toBeNull();
    expect(allowedPubPath("GET", ["bookings", "ABC"])).toBeNull();
    expect(allowedPubPath("GET", ["trips", ".."])).toBeNull();
  });
});
