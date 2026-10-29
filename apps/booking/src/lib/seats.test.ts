import { describe, expect, it } from "vitest";
import seatsFixture from "../../test/fixtures/seats.json";
import { seatMapResponseSchema, type Seat } from "@/schemas/trip";
import { buildHoldBody, mergeFloors, toggleSeat } from "./seats";

const map = seatMapResponseSchema.parse(seatsFixture);
const seat = (id: number, price = 250000, is_empty = true) => ({ id, name: String(id), price, priceNy: 230000, is_empty, ticket_code: null }) as Seat;

describe("sơ đồ ghế", () => {
  it("gộp tầng như web cũ", () => {
    const [f1, f2] = mergeFloors(map.data);
    expect(f1.length).toBeGreaterThan(0);
    expect(Array.isArray(f2)).toBe(true);
    const extra = mergeFloors([[[seat(1)]], [], [[seat(2), null]]]);
    expect(extra[0]).toHaveLength(2);
    expect(extra[1]).toEqual([[null, null]]);
  });

  it("thường: tối đa 9, không xét numberGuest, bỏ chọn khi bấm lại", () => {
    let sel: Seat[] = [];
    for (let i = 1; i <= 9; i++) sel = toggleSeat(sel, seat(i), { isCombo: false, numberGuest: 1 }).seats;
    expect(sel).toHaveLength(9);
    expect(toggleSeat(sel, seat(10), { isCombo: false, numberGuest: 1 }).error).toBe("max");
    expect(toggleSeat(sel, seat(3), { isCombo: false, numberGuest: 1 }).seats).toHaveLength(8);
    expect(toggleSeat([], seat(5, 1, false), { isCombo: false, numberGuest: 1 }).seats).toHaveLength(0);
  });

  it("combo: đúng bằng numberGuest, mọi ghế lấy giá ghế vừa bấm", () => {
    let sel = toggleSeat([], seat(1, 200000), { isCombo: true, numberGuest: 2 }).seats;
    sel = toggleSeat(sel, seat(2, 260000), { isCombo: true, numberGuest: 2 }).seats;
    expect(sel.map((s) => s.price)).toEqual([260000, 260000]);
    expect(toggleSeat(sel, seat(3), { isCombo: true, numberGuest: 2 }).error).toBe("guest");
  });

  it("body hold khớp live: ghế nguyên bản + is_select, id tăng dần, channel 1, bỏ aff khi không có", () => {
    const original = map.data.flat(2).find((s): s is Seat => !!s && s.is_empty)!;
    const body = buildHoldBody({ id: 41389806, merchant: { code: "02" } }, [seat(9), original], false, {});
    expect(JSON.parse(JSON.stringify(body))).toEqual({
      trip_id: 41389806,
      seats: [...[seat(9), original].sort((a, b) => a.id - b.id).map((s) => ({ ...s, is_select: true }))],
      merchant_code: "02",
      channel: 1,
    });
    expect(Object.keys(body)).toEqual(["trip_id", "seats", "merchant_code", "channel", "aff"]);
  });

  it("affiliate: aff rỗng vẫn gửi, utm/aff_sid chỉ khi có", () => {
    const body = buildHoldBody({ id: 1, merchant: { code: "02" } }, [seat(1)], false, { aff: "", utm_source: "fb" });
    expect(JSON.parse(JSON.stringify(body))).toMatchObject({ aff: "", utm_source: "fb" });
    expect("aff_sid" in body).toBe(false);
  });
});
