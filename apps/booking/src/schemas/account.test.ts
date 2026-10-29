import { describe, expect, it } from "vitest";
import cancel from "../../test/fixtures/cancel.json";
import myBookings from "../../test/fixtures/my_bookings.json";
import { bookingFullSchema, bookingsPageSchema, customerSchema, promotionListSchema, trackingSchema, transitServicesSchema, transitTicketsSchema } from "./account";

describe("schemas tài khoản", () => {
  it("danh sách chuyến đi (fixture live ẩn danh) có status_payment, is_cancel, route", () => {
    const parsed = bookingsPageSchema.parse(myBookings);
    const first = parsed.data[0];
    expect(first.booking.booking_info).toMatchObject({ code: "B0124ZZ546DRNL", status: 3, status_payment: 0, is_cancel: true });
    expect(first.booking.booking_ticket[0]).toMatchObject({ trip_id: 22054080, is_cancel: true, route: { code: "MDI-DBI" } });
    expect(first.merchant.code).toBe("01");
  });

  it("chi tiết đơn parse fixture và giữ trường lạ", () => {
    const parsed = bookingFullSchema.parse(cancel);
    expect(parsed.data.code).toBe("B02ELR3J6PD62D");
    expect(parsed.data.room).toBeUndefined();
    expect((parsed.data as Record<string, unknown>).customer).toBeDefined();
  });

  it("hồ sơ: trường hiển thị sai hình dạng không làm hỏng cả trang", () => {
    const parsed = customerSchema.parse({ data: { name: "A", title: "Ông", province: 5, subscribe_loyalty: 0, rank: { rank: 2, period_transaction: 4 } } });
    expect(parsed.data).toMatchObject({ name: "A", subscribe_loyalty: 0, rank: { rank: 2 } });
    expect(parsed.data.title).toBeUndefined();
    expect(parsed.data.province).toBeUndefined();
  });

  it("dịch vụ trung chuyển: mảng trần hoặc bọc data", () => {
    const item = { dvbs_id: 1, dvbs_code: "TCDON", dvbs_tickets: [{ code: "V1" }] };
    expect(transitServicesSchema.parse([item])).toHaveLength(1);
    expect(transitServicesSchema.parse({ data: [item] })).toHaveLength(1);
    expect(transitTicketsSchema.parse({ data: [{ code: "V1" }] })).toHaveLength(1);
    expect(transitServicesSchema.parse([{ dvbs_id: 1, dvbs_code: "TCTRA" }])[0]).toMatchObject({ dvbs_tickets: [] });
  });

  it("khuyến mãi + tracking", () => {
    expect(promotionListSchema.parse({ data: [{ name: "KM", code: "ABC", available_quantity: 2, content: "<p>x</p>" }] }).data[0].code).toBe("ABC");
    expect(trackingSchema.parse({ data: { name: "Tài xế", xe_bks: "29B-123", lat: "21.0", long: 105.8, duration: 10 } }).data?.xe_bks).toBe("29B-123");
    expect(trackingSchema.parse({ data: null }).data).toBeNull();
  });
});
