import { describe, expect, it } from "vitest";
import { ApiError } from "./http";
import { applyCheckedCodes } from "./promo-apply";

const seats = [
  { id: 1, name: "5", price: 200000, code: "V02DEMOTICKET01" },
  { id: 2, name: "6", price: 200000, code: "V02OTHER" },
] as never;

describe("applyCheckedCodes", () => {
  it("phản hồi thật: ticketPrice là chuỗi, priceDiscount là số, không có status/data → giảm theo ticketCode", () => {
    const raw = { message: "Mã khuyến mại khả dụng", codes: [{ code: "MADEMO01", ticketCode: "V02DEMOTICKET01", ticketPrice: "200000", priceDiscount: 200000 }] };
    const out = applyCheckedCodes(seats, raw);
    expect(out.map((s) => s.discount)).toEqual([200000, undefined]);
  });

  it("priceDiscount dạng chuỗi được parseInt; phần tử lạ bị bỏ; mảng rỗng = không ghế nào giảm", () => {
    expect(applyCheckedCodes(seats, { codes: [{ ticketCode: "V02OTHER", priceDiscount: "50000" }, { nope: 1 }, null] }).map((s) => s.discount)).toEqual([undefined, 50000]);
    expect(applyCheckedCodes(seats, { codes: [] }).every((s) => s.discount === undefined)).toBe(true);
  });

  it("thiếu mảng codes: ném lỗi kèm message của server (không treo)", () => {
    expect(() => applyCheckedCodes(seats, { message: "Mã đã hết hạn" })).toThrow(ApiError);
    try {
      applyCheckedCodes(seats, { message: "Mã đã hết hạn" });
    } catch (error) {
      expect((error as ApiError).message).toBe("Mã đã hết hạn");
    }
    expect(() => applyCheckedCodes(seats, null)).toThrow("Phản hồi khuyến mãi không hợp lệ");
  });
});
