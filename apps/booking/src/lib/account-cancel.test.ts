import { describe, expect, it } from "vitest";
import { canCancelOrder, cancelBookingBody, cancelSeatBody, cancelTransitBody, noteEnabled, reasonLabel, ticketAction } from "./account-cancel";

const unpaid = { status: { type: 2, type_name: "Cập nhật" }, payment: { type: 0 } };

describe("huỷ vé / huỷ đơn", () => {
  it("body cancel-seat khớp live (khoá + thứ tự, không có type)", () => {
    const body = cancelSeatBody("B02SAMPLE00001", "V02SAMPLE000001", "02", { reasonId: 3, note: "bỏ qua" });
    expect(JSON.stringify(body)).toBe(
      JSON.stringify({ order_code: "B02SAMPLE00001", seat_code: "V02SAMPLE000001", merchant_code: "02", reason_cancel_id: 3, reason_cancel_note: "" }),
    );
  });

  it("ghi chú chỉ gửi khi chọn 'Lý do khác' (id 1)", () => {
    expect(cancelSeatBody("B", "V", "02", { reasonId: 1, note: "đổi kế hoạch" }).reason_cancel_note).toBe("đổi kế hoạch");
    expect(noteEnabled(1)).toBe(true);
    expect(noteEnabled(3)).toBe(false);
    expect(noteEnabled(undefined)).toBe(false);
  });

  it("body cancel-booking có type:0", () => {
    expect(JSON.stringify(cancelBookingBody("B02X", "02", { reasonId: 9, note: "" }))).toBe(
      JSON.stringify({ order_code: "B02X", merchant_code: "02", reason_cancel_id: 9, reason_cancel_note: "", type: 0 }),
    );
  });

  it("body huỷ dịch vụ trung chuyển {reason, type:0}", () => {
    expect(cancelTransitBody("  không đi nữa ")).toEqual({ reason: "không đi nữa", type: 0 });
  });

  it("cột hành động của vé", () => {
    expect(ticketAction(unpaid)).toEqual({ kind: "cancel" });
    expect(ticketAction({ ...unpaid, payment: { type: 1 } })).toEqual({ kind: "paid" });
    expect(ticketAction({ status: { type: 5, type_name: "Huỷ" }, payment: { type: 0 } })).toEqual({ kind: "status", text: "Huỷ" });
    expect(ticketAction({})).toEqual({ kind: "status", text: "" });
  });

  it("chỉ huỷ cả đơn khi chưa thanh toán, giá > 0, > 1 vé, chưa huỷ", () => {
    const base = { payment: { type: 0 }, price: 400000, tickets: [{}, {}], status: { type: 2 } };
    expect(canCancelOrder(base)).toBe(true);
    expect(canCancelOrder({ ...base, tickets: [{}] })).toBe(false);
    expect(canCancelOrder({ ...base, price: 0 })).toBe(false);
    expect(canCancelOrder({ ...base, payment: { type: 1 } })).toBe(false);
    expect(canCancelOrder({ ...base, payment: null })).toBe(false);
    expect(canCancelOrder({ ...base, status: { type: 3 } })).toBe(false);
  });

  it("lý do theo ngôn ngữ, thiếu bản en thì rơi về vi", () => {
    const r = { reason_vi: "Tôi đặt nhầm chỗ", reason_en: "I made the wrong reservation" };
    expect(reasonLabel(r, "vi")).toBe("Tôi đặt nhầm chỗ");
    expect(reasonLabel(r, "en")).toBe("I made the wrong reservation");
    expect(reasonLabel({ reason_vi: "x" }, "en")).toBe("x");
  });
});
