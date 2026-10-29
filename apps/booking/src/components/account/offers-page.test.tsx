import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { OffersPage } from "./offers-page";

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;

/** Mẫu thật của `promotion/promotional_code_list_all?source=1` (live 2026-10-29): số lượng là chữ, không có date_end. */
const LIVE = {
  code: "HAIVAN50K",
  name: "Giảm 50.000đ chuyến Hà Nội - Sơn La",
  available_quantity: "không giới hạn",
  mkp_total_one_user: "không giới hạn",
  min_price: "Không giới hạn",
  discount_route: 50000,
  route: ["MDI-SOL"],
  content: "<p>Áp dụng mọi chuyến</p>",
  mkp_time_start_travel: "2026-10-01 00:00:00",
  mkp_time_end_travel: "2026-12-31 23:59:59",
  mkp_unlimited: 1,
};

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OffersPage với dữ liệu thật của apigw", () => {
  it("không còn 'không lấy được dữ liệu': hiện mã, ô '∞' (nhãn đầy đủ) và hạn từ mkp_time_end_travel", async () => {
    server.use(http.get(`${BASE}/promotion/promotional_code_list_all`, () => HttpResponse.json({ data: [LIVE, { ...LIVE, code: "P2", name: "Còn 3 lượt", available_quantity: 3 }, { ...LIVE, code: "@auto:10", name: "Ưu đãi ẩn" }] })));
    render(
      <Providers locale="vi">
        <OffersPage />
      </Providers>,
    );
    expect(await screen.findByText("Giảm 50.000đ chuyến Hà Nội - Sơn La")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Ưu đãi ẩn")).not.toBeInTheDocument(); // mã đã bị che thành token
    expect(screen.getByLabelText("không giới hạn")).toHaveTextContent("∞");
    expect(screen.getByLabelText("3")).toHaveTextContent("3");
    expect(screen.getAllByText(/31 tháng 12, 2026|31 tháng 12 năm 2026|31\/12\/2026/).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByText("Giảm 50.000đ chuyến Hà Nội - Sơn La"));
    expect(screen.getByText("HAIVAN50K")).toBeInTheDocument();
  });
});
