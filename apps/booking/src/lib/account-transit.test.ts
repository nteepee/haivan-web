import { describe, expect, it } from "vitest";
import { applyDialogResult, applyServiceCheck, checkTransitQuery, groupAddresses, isMultiPoint, normalizeService, priceTicketQuery, updateTransitBody, withAddress, type TransitService } from "./account-transit";

const tickets = [
  { code: "V1", name: "An", phone: "090", price: 30000, number: 1, pick_up: "A", pick_up_lat: 1, pick_up_lng: 2, drop_off: "Bến", check: true },
  { code: "V2", name: "Bình", phone: "091", price: 30000, number: 2, pick_up: "A", pick_up_lat: 1, pick_up_lng: 2, drop_off: "Bến", check: true },
  { code: "V3", name: "Chi", phone: "092", price: 30000, number: 3, pick_up: "B", pick_up_lat: 3, pick_up_lng: 4, drop_off: "Bến", check: false },
];
const raw = { dvbs_id: 7, dvbs_code: "TCDON", dvbs_order_id: 99, dvbs_is_active: true, dvbs_is_group: 1, dvbs_ticket_number: 3, dvbs_transit_number: 2, dvbs_tickets: tickets };
const service = (over: Record<string, unknown> = {}): TransitService => normalizeService({ ...raw, ...over });

describe("cập nhật dịch vụ đón/trả", () => {
  it("chuẩn hoá: gộp địa chỉ khi nhóm, tách từng vé khi nhiều điểm", () => {
    const grouped = service();
    expect(grouped).toMatchObject({ check: true, seat: 3, seatCheck: 2, address: [{ number: 2, address: "A" }] });
    const multi = service({ dvbs_is_group: 0 });
    expect(isMultiPoint(multi)).toBe(true);
    expect(multi.address).toEqual([{ number: 1, address: "A" }, { number: 1, address: "A" }]);
  });

  it("gộp số khách theo địa chỉ, giữ thứ tự", () => {
    expect(groupAddresses(service())).toEqual([{ number: 2, address: "A" }, { number: 1, address: "B" }]);
  });

  it("bật/tắt dịch vụ: is_group 0/1, mọi vé theo dịch vụ, số ghế", () => {
    const on = applyServiceCheck(service({ dvbs_is_active: false }), true);
    expect(on).toMatchObject({ check: true, dvbs_is_group: 0, seatCheck: 3 });
    expect(on.dvbs_tickets.every((t) => t.check)).toBe(true);
    expect(on.address).toEqual([{ number: 2, address: "A" }, { number: 1, address: "B" }]);
    const off = applyServiceCheck(on, false);
    expect(off).toMatchObject({ check: false, dvbs_is_group: 1, seatCheck: 0, address: [] });
    expect(off.dvbs_tickets.some((t) => t.check)).toBe(false);
  });

  it("query check-transit và get-price-ticket", () => {
    expect(checkTransitQuery(service(), tickets[0], "02")).toEqual({
      pick_up: "A", pick_up_lat: 1, pick_up_lng: 2, drop_off: "Bến", drop_off_lat: undefined, drop_off_lng: undefined, code: "V1", merchant_code: "02", type_transit: 1,
    });
    const picked = { address: "Nhà mới", lat: 10, lng: 106 };
    expect(priceTicketQuery(service(), { ...tickets[0], date: "2026-11-01" }, picked, "02")).toMatchObject({ pick_up: "Nhà mới", pick_up_lat: 10, pick_up_lng: 106, drop_off: "Bến", date: "2026-11-01", quantity: 1, code: "V1", type_transit: 1 });
    const drop = service({ dvbs_code: "TCTRA" });
    expect(priceTicketQuery(drop, tickets[0], picked, "02")).toMatchObject({ drop_off: "Nhà mới", pick_up: "A", type_transit: 2 });
    expect(withAddress(drop, tickets[0], picked, 55000)).toMatchObject({ price: 55000, drop_off: "Nhà mới", drop_off_lat: 10, pick_up: "A" });
  });

  it("kết quả modal: đếm vé chọn, nhiều điểm hiển thị từng vé", () => {
    const s = service();
    const multi = applyDialogResult(s, tickets, true);
    expect(multi).toMatchObject({ dvbs_is_group: 0, seatCheck: 2, check: true });
    expect(multi.address).toEqual([{ number: 1, address: "A" }, { number: 1, address: "A" }]);
    const none = applyDialogResult(s, tickets.map((t) => ({ ...t, check: false })), false);
    expect(none).toMatchObject({ dvbs_is_group: 1, seatCheck: 0, check: false });
  });

  it("body update-transit: chỉ vé đã chọn, kèm is_group + dvbs_id", () => {
    const body = updateTransitBody("B02X", "02", [service(), service({ dvbs_id: 8, dvbs_code: "TCTRA", dvbs_tickets: [{ code: "V9", check: false }] })]);
    expect(body.order_code).toBe("B02X");
    expect(body.merchant_code).toBe("02");
    expect(body.seats.map((s) => s.code)).toEqual(["V1", "V2"]);
    expect(body.seats[0]).toMatchObject({ is_group: 1, dvbs_id: 7, name: "An", pick_up: "A" });
  });
});
