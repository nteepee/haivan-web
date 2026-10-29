import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { ServiceUpdatePage } from "./service-update-page";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("code=B02X&merchant_code=02"),
}));

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  vi.stubGlobal("scrollTo", vi.fn());
  push.mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ServiceUpdatePage", () => {
  it("bật dịch vụ → check-transit, Tiếp tục → update-transit đúng body rồi về chuyến đi của tôi", async () => {
    let checkSearch = "";
    let updateBody: unknown;
    server.use(
      http.get(`${ORIGIN}/api/hv/auth/session`, () => HttpResponse.json({ loggedIn: true, user: null })),
      http.get(`${BASE}/v4/detail-transit/B02X`, ({ request }) => {
        expect(new URL(request.url).search).toBe("?merchant_code=02");
        return HttpResponse.json([
          { dvbs_id: 7, dvbs_code: "TCDON", dvbs_order_id: 99, dvbs_is_active: false, dvbs_is_group: 1, dvbs_ticket_number: 1, dvbs_transit_number: 0, dvbs_tickets: [{ code: "V1", name: "An", pick_up: "Nhà A", pick_up_lat: 1, pick_up_lng: 2, drop_off: "Bến" }] },
        ]);
      }),
      http.get(`${BASE}/v4/check-transit`, ({ request }) => {
        checkSearch = new URL(request.url).search;
        return HttpResponse.json({});
      }),
      http.post(`${BASE}/v4/update-transit`, async ({ request }) => {
        updateBody = await request.json();
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    render(
      <Providers locale="vi">
        <ServiceUpdatePage />
      </Providers>,
    );

    const toggle = await screen.findByRole("checkbox");
    expect(screen.getByText(/Đón tận nhà - 0\/1 khách/)).toBeInTheDocument();
    await user.click(toggle);
    await waitFor(() => expect(screen.getByText(/Đón tận nhà - 1\/1 khách/)).toBeInTheDocument());
    expect(checkSearch).toBe("?pick_up=Nh%C3%A0%20A&pick_up_lat=1&pick_up_lng=2&drop_off=B%E1%BA%BFn&code=V1&merchant_code=02&type_transit=1");

    await user.click(screen.getByRole("button", { name: /Tiếp tục/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh"));
    expect(updateBody).toEqual({
      order_code: "B02X",
      merchant_code: "02",
      seats: [{ code: "V1", name: "An", pick_up: "Nhà A", pick_up_lat: 1, pick_up_lng: 2, drop_off: "Bến", check: true, is_group: 0, dvbs_id: 7 }],
    });
  });

  it("check-transit lỗi 400 → hiện message backend và không bật dịch vụ", async () => {
    server.use(
      http.get(`${ORIGIN}/api/hv/auth/session`, () => HttpResponse.json({ loggedIn: true, user: null })),
      http.get(`${BASE}/v4/detail-transit/B02X`, () => HttpResponse.json([{ dvbs_id: 7, dvbs_code: "TCTRA", dvbs_is_active: false, dvbs_is_group: 1, dvbs_ticket_number: 1, dvbs_transit_number: 0, dvbs_tickets: [{ code: "V1", drop_off: "Xa" }] }])),
      http.get(`${BASE}/v4/check-transit`, () => HttpResponse.json({ message: "Điểm bạn chọn chưa hỗ trợ trung chuyển" }, { status: 400 })),
    );
    const user = userEvent.setup();
    render(
      <Providers locale="vi">
        <ServiceUpdatePage />
      </Providers>,
    );
    await user.click(await screen.findByRole("checkbox"));
    expect(await screen.findByText("Điểm bạn chọn chưa hỗ trợ trung chuyển")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
});
