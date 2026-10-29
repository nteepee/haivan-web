import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import booking from "../../../test/fixtures/booking.json";
import reasons from "../../../test/fixtures/cancel_reasons.json";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { TripsPage } from "./trips-page";

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;
const CODE = booking.data.code;
const TICKET = booking.data.tickets[0].code;

const listRow = {
  merchant: { code: "02", name: "Hải Vân Vũng Tàu" },
  booking: {
    booking_info: { code: CODE, status: 1, created_at: "2026-10-28 14:30:00", total_money: 200000, status_payment: 0, is_cancel: true },
    booking_ticket: [{ trip_id: 41389806, code: TICKET, is_cancel: true, route: { code: "VTA-TSN" } }],
  },
};

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TripsPage", () => {
  it("liệt kê đơn, nút Thanh toán đúng URL, mở đơn và huỷ vé với đúng body", async () => {
    const lists: string[] = [];
    const cancelBodies: unknown[] = [];
    server.use(
      http.get(`${BASE}/bookings`, ({ request }) => {
        lists.push(new URL(request.url).search);
        return HttpResponse.json({ data: [listRow], meta: { current_page: 1, last_page: 2 } });
      }),
      http.get(`${BASE}/list-reason`, () => HttpResponse.json(reasons)),
      http.get(`${BASE}/bookings/${CODE}`, () => HttpResponse.json(booking)),
      http.post(`${BASE}/cancel-seat`, async ({ request }) => {
        cancelBodies.push(await request.json());
        return HttpResponse.json(booking);
      }),
    );
    const user = userEvent.setup();
    render(
      <Providers locale="vi">
        <TripsPage />
      </Providers>,
    );

    await screen.findByText(CODE);
    expect(lists[0]).toBe("?booking-status%5B0%5D=1");
    const pay = screen.getByRole("link", { name: /Thanh toán/ });
    expect(pay.getAttribute("href")).toBe(`/xe-khach/thanh-toan?booking_code=${CODE}&merchant_code=02&trip_id=41389806`);
    expect(screen.getByRole("button", { name: "Xem thêm" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: new RegExp(CODE) }));
    expect(await screen.findByText(TICKET)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Huỷ đơn hàng" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Huỷ vé" }));
    const dialog = await screen.findByRole("dialog");
    const agree = within(dialog).getByRole("button", { name: "Đồng ý" });
    expect(agree).toBeDisabled();
    expect(within(dialog).getByPlaceholderText("Bạn có điều muốn chia sẻ với chúng tôi?")).toBeDisabled();
    await user.click(within(dialog).getByRole("radio", { name: "Tôi đặt nhầm chỗ" }));
    expect(agree).toBeEnabled();
    await user.click(agree);

    await waitFor(() => expect(cancelBodies).toHaveLength(1));
    expect(cancelBodies[0]).toEqual({ order_code: CODE, seat_code: TICKET, merchant_code: "02", reason_cancel_id: 3, reason_cancel_note: "" });
    await waitFor(() => expect(lists.length).toBeGreaterThan(1));
  });

  it("hộp huỷ vé có \"Giữ vé\": đóng hộp và không gửi lệnh huỷ", async () => {
    let cancels = 0;
    server.use(
      http.get(`${BASE}/bookings`, () => HttpResponse.json({ data: [listRow], meta: { current_page: 1, last_page: 1 } })),
      http.get(`${BASE}/list-reason`, () => HttpResponse.json(reasons)),
      http.get(`${BASE}/bookings/${CODE}`, () => HttpResponse.json(booking)),
      http.post(`${BASE}/cancel-seat`, () => {
        cancels += 1;
        return HttpResponse.json(booking);
      }),
    );
    const user = userEvent.setup();
    render(
      <Providers locale="vi">
        <TripsPage />
      </Providers>,
    );
    await user.click(await screen.findByRole("button", { name: new RegExp(CODE) }));
    await user.click(await screen.findByRole("button", { name: "Huỷ vé" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Vé sẽ bị huỷ và chỗ ngồi được nhả/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Giữ vé" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(cancels).toBe(0);
  });

  it("chuyển tab Hoàn thành gọi booking-status[0]=2 và rỗng thì báo chưa có chuyến", async () => {
    const lists: string[] = [];
    server.use(
      http.get(`${BASE}/bookings`, ({ request }) => {
        lists.push(new URL(request.url).search);
        return HttpResponse.json({ data: [], meta: { current_page: 1, last_page: 1 } });
      }),
      http.get(`${BASE}/list-reason`, () => HttpResponse.json(reasons)),
    );
    const user = userEvent.setup();
    render(
      <Providers locale="vi">
        <TripsPage />
      </Providers>,
    );
    expect(await screen.findByText("Bạn chưa có chuyến đi nào!")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Hoàn thành" }));
    await waitFor(() => expect(lists).toContain("?booking-status%5B0%5D=2"));
  });
});
