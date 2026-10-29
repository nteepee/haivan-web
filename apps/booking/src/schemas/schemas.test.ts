import { describe, expect, it } from "vitest";
import booking from "../../test/fixtures/booking.json";
import cancel from "../../test/fixtures/cancel.json";
import cancelReasons from "../../test/fixtures/cancel_reasons.json";
import hold from "../../test/fixtures/hold.json";
import infoPayments from "../../test/fixtures/info_payments.json";
import myBookings from "../../test/fixtures/my_bookings.json";
import places from "../../test/fixtures/places.json";
import seats from "../../test/fixtures/seats.json";
import trips from "../../test/fixtures/trips.json";
import { bookingDetailSchema, cancelReasonsSchema, holdResponseSchema, infoPaymentsSchema, myBookingsSchema } from "./booking";
import { placesResponseSchema, seatMapResponseSchema, tripsResponseSchema } from "./trip";

describe("schemas parse dữ liệu thật (fixtures ẩn danh)", () => {
  it.each([
    ["places", placesResponseSchema, places],
    ["trips", tripsResponseSchema, trips],
    ["seats", seatMapResponseSchema, seats],
    ["hold", holdResponseSchema, hold],
    ["booking", bookingDetailSchema, booking],
    ["cancel", bookingDetailSchema, cancel],
    ["info_payments", infoPaymentsSchema, infoPayments],
    ["cancel_reasons", cancelReasonsSchema, cancelReasons],
    ["my_bookings", myBookingsSchema, myBookings],
  ] as const)("%s", (_name, schema, data) => {
    const result = schema.safeParse(data);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it("giữ trường lạ (looseObject)", () => {
    const parsed = holdResponseSchema.parse({ ...hold, extra: 1 }) as Record<string, unknown>;
    expect(parsed.extra).toBe(1);
  });
});
