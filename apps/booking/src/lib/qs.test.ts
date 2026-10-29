import { describe, expect, it } from "vitest";
import { stringifyQuery } from "./qs";

describe("stringifyQuery (tương thích qs của web cũ)", () => {
  it("khớp query el/trips live", () => {
    expect(
      stringifyQuery({
        from_location: "10.7753882,106.702825",
        to_location: "10.3391989,107.0710401",
        numberGuest: 1,
        date: "2026-11-01",
        sort_by: "time",
        sort_mode: "asc",
        type: 0,
      }),
    ).toBe(
      "from_location=10.7753882%2C106.702825&to_location=10.3391989%2C107.0710401&numberGuest=1&date=2026-11-01&sort_by=time&sort_mode=asc&type=0",
    );
  });

  it("mảng dạng indices, ngoặc mã hoá (booking-status, codes)", () => {
    expect(stringifyQuery({ "booking-status": [1] })).toBe("booking-status%5B0%5D=1");
    expect(stringifyQuery({ codes: [{ promotion: "KM1", ticketCode: "V1", ticketPrice: 250000 }] })).toBe(
      "codes%5B0%5D%5Bpromotion%5D=KM1&codes%5B0%5D%5BticketCode%5D=V1&codes%5B0%5D%5BticketPrice%5D=250000",
    );
    expect(stringifyQuery({ trip: { trip_id: 41389806 }, seats: [{ id: 5 }] })).toBe(
      "trip%5Btrip_id%5D=41389806&seats%5B0%5D%5Bid%5D=5",
    );
  });

  it("khoảng trắng là %20, giữ 0/false, bỏ undefined/null/rỗng", () => {
    expect(stringifyQuery({ departure_time: "2026-11-01 05:30:00", adm_id: 0, is_reward: false, a: undefined, b: null, c: "" })).toBe(
      "departure_time=2026-11-01%2005%3A30%3A00&adm_id=0&is_reward=false",
    );
  });
});
