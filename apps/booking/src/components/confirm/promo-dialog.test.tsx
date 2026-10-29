import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import seatsFixture from "../../../test/fixtures/seats.json";
import tripsFixture from "../../../test/fixtures/trips.json";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { draftFromHold } from "@/lib/hold-draft";
import { parsePromotions } from "@/schemas/promotion";
import { seatMapResponseSchema, tripSchema, type Seat } from "@/schemas/trip";
import type { BookingDraft, DraftSeat } from "@/stores/booking-draft";
import { PromoBox } from "./promo-dialog";

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;
const trip = tripSchema.parse(tripsFixture.data[0]);
const SEATS = seatMapResponseSchema.parse(seatsFixture).data[0].flat().filter((s): s is Seat => s !== null && s.is_empty);

const draft = (): BookingDraft =>
  draftFromHold({
    trip,
    search: { from: { name: "A", lat: 1, lng: 2 }, to: { name: "B", lat: 3, lng: 4 }, date: "2026-10-29", numberGuest: 1, type: 2 },
    seats: [SEATS[0]],
    hold: { message: "ok", expire_time: "29-10-2026 10:10:00", order_code: "B02PROMO", tickets: [{ id: SEATS[0].id, code: "V02DEMOTICKET01" }] },
    isCombo: false,
    user: null,
  });

/** Mẫu thật (live 2026-10-29) của `promotion/get-promotions`. */
const PROMOS = parsePromotions({
  data: [{ code: "MADEMO01", name: "Mã thử nghiệm", available_quantity: "không giới hạn", mkp_time_end_travel: "2026-12-31 23:59:59", discount_route: 200000, route: ["X"], mkp_unlimited: 1 }],
});

function Harness({ onApply }: { onApply: (seats: DraftSeat[]) => void }) {
  const [d] = useState(draft);
  return (
    <Providers locale="vi">
      <PromoBox draft={d} promotions={PROMOS} points={0} onApply={onApply} />
    </Providers>
  );
}

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  toast.dismiss();
  vi.unstubAllGlobals();
});

const chooseAndApply = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Sử dụng điểm hoặc mã giảm giá" }));
  await user.click(await screen.findByRole("button", { name: /Dùng mã/ }));
  await user.click(screen.getByRole("button", { name: /Ghế/ }));
  await user.click(screen.getByRole("button", { name: "Áp dụng" }));
};

describe("PromoBox: áp mã (phản hồi thật của check-promotions)", () => {
  it("200 {message, codes:[{code, ticketCode, ticketPrice:'200000', priceDiscount:200000}]}: cập nhật giảm theo ticketCode, báo thành công, đóng hộp, nút hết bận", async () => {
    const success = vi.spyOn(toast, "success");
    const onApply = vi.fn();
    server.use(
      http.post(`${BASE}/promotion/check-promotions`, () =>
        HttpResponse.json({ message: "Mã khuyến mại khả dụng", codes: [{ code: "MADEMO01", ticketCode: "V02DEMOTICKET01", ticketPrice: "200000", priceDiscount: 200000 }] }),
      ),
    );
    render(<Harness onApply={onApply} />);
    await chooseAndApply();
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    const seats = onApply.mock.calls[0][0] as DraftSeat[];
    expect(seats.map((s) => [s.promotion, s.discount])).toEqual([["MADEMO01", 200000]]);
    expect(success).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("phản hồi sai hình dạng: hiện thông báo của server (hoặc câu chung), hộp vẫn mở và nút 'Áp dụng' dùng lại được", async () => {
    const warn = vi.spyOn(toast, "warning");
    server.use(http.post(`${BASE}/promotion/check-promotions`, () => HttpResponse.json({ message: "Mã không dùng được cho chuyến này", codes: "x" })));
    render(<Harness onApply={vi.fn()} />);
    await chooseAndApply();
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Áp dụng" })).toBeEnabled();
  });
});
