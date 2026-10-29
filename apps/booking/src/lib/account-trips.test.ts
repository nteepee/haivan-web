import { describe, expect, it } from "vitest";
import { bookingsQuery, formatCreatedDate, isPriceHidden, payUrl, rowBadge, serviceInfoState, serviceUpdateUrl } from "./account-trips";
import { stringifyQuery } from "./qs";

describe("danh sách chuyến đi", () => {
  it("query như web cũ: qs indices, page chỉ từ trang 2 và đứng trước", () => {
    expect(stringifyQuery(bookingsQuery(1))).toBe("booking-status%5B0%5D=1");
    expect(stringifyQuery(bookingsQuery(3, 1))).toBe("booking-status%5B0%5D=3");
    expect(stringifyQuery(bookingsQuery(2, 2))).toBe("page=2&booking-status%5B0%5D=2");
  });

  it("nút Thanh toán dẫn tới đúng URL (3 tham số)", () => {
    expect(payUrl("", "B0124ZZ546DRNL", "01", 22054080)).toBe("/xe-khach/thanh-toan?booking_code=B0124ZZ546DRNL&merchant_code=01&trip_id=22054080");
    expect(payUrl("/en", "B02X", "02")).toBe("/en/xe-khach/thanh-toan?booking_code=B02X&merchant_code=02");
  });

  it("nhãn đầu hàng: huỷ > đã thanh toán > thanh toán (giá chi tiết ưu tiên)", () => {
    expect(rowBadge({ status: 3, status_payment: 0, total_money: 5 })).toEqual({ kind: "cancelled" });
    expect(rowBadge({ status: 1, status_payment: 1, total_money: 5 })).toEqual({ kind: "paid" });
    expect(rowBadge({ status: 1, status_payment: 0, total_money: 250000 })).toEqual({ kind: "pay", amount: 250000 });
    expect(rowBadge({ status: 1, status_payment: 0, total_money: 250000 }, { detailPrice: 200000 })).toEqual({ kind: "pay", amount: 200000 });
    expect(rowBadge({ status: 1, total_money: 250000 }, { detailPrice: 0 })).toEqual({ kind: "none" });
    expect(rowBadge({ status: 1, total_money: 0 })).toEqual({ kind: "none" });
    expect(rowBadge({ status: 1, total_money: 250000 }, { hidePrice: true })).toEqual({ kind: "pay", amount: null });
  });

  it("ẩn giá tuyến SBLK, định dạng ngày tạo", () => {
    expect(isPriceHidden("DLA-SBLK")).toBe(true);
    expect(isPriceHidden("MDI-DBI")).toBe(false);
    expect(isPriceHidden(undefined)).toBe(false);
    expect(formatCreatedDate("2026-10-26 09:15:51")).toBe("26/10/2026");
  });

  it("dịch vụ bổ sung: chỉ đối tác 02, khoá khi đã trả hoặc vé trạng thái 11", () => {
    const base = { merchant_code: "02", status: { type: 1 }, payment: { type: 0 }, tickets: [{ status: { type: 2 }, payment: { type: 0 } }] };
    expect(serviceInfoState(base)).toBe("open");
    expect(serviceInfoState({ ...base, merchant_code: "01" })).toBe("hidden");
    expect(serviceInfoState({ ...base, tickets: [] })).toBe("hidden");
    expect(serviceInfoState({ ...base, status: { type: 3 } })).toBe("hidden");
    expect(serviceInfoState({ ...base, status: { type: 2 } })).toBe("hidden");
    expect(serviceInfoState({ ...base, payment: { type: 1 } })).toBe("locked");
    expect(serviceInfoState({ ...base, tickets: [{ status: { type: 11 } }] })).toBe("locked");
    expect(serviceUpdateUrl("", "B02X", "02")).toBe("/xe-khach/cap-nhat-dich-vu?code=B02X&merchant_code=02");
  });
});
