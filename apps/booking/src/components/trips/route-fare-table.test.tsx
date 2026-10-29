import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import tripsFixture from "../../../test/fixtures/trips.json";
import { Providers } from "@/components/providers";
import { tripSchema } from "@/schemas/trip";
import { RouteFareTable } from "./route-fare-table";

const BASE = tripSchema.parse(tripsFixture.data[0]);
const state = vi.hoisted(() => ({ value: { data: undefined, hasNextPage: false } as Record<string, unknown> }));
vi.mock("@/hooks/use-trips", () => ({ useTrips: () => state.value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const PLACES = { from: { name: "Mỹ Đình", lat: 21, lng: 105 }, to: { name: "Mộc Châu", lat: 20, lng: 104 } };
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T03:00:00Z"));
  state.value = { data: undefined, hasNextPage: false };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderTable = (classes: { name: string; price_from?: string }[], hours: string | null = "4") =>
  render(
    <Providers locale="vi">
      <RouteFareTable places={PLACES} classes={classes} hours={hours} title="Bảng giá vé" />
    </Providers>,
  );

describe("RouteFareTable", () => {
  it("không có hạng xe và chưa có chuyến → không vẽ bảng", () => {
    const { container } = renderTable([]);
    expect(container.querySelector("table")).toBeNull();
  });

  it("chỉ có dữ liệu WP: bảng 3 cột (hạng xe, thời gian, giá từ), không có cột giờ xuất bến", () => {
    renderTable([{ name: "Luxury", price_from: "350.000đ" }]);
    const table = screen.getByRole("table", { name: "Bảng giá vé" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Hạng xe", "Thời gian", "Giá từ"]);
    expect(within(table).getByRole("rowheader", { name: "Luxury" })).toBeInTheDocument();
    expect(within(table).getByText("350.000đ")).toBeInTheDocument();
    expect(within(table).getByText("4h")).toBeInTheDocument();
  });

  it("có chuyến hôm nay từ apigw: thêm cột giờ xuất bến (đủ trang → liệt kê giờ, giá thấp nhất)", () => {
    const trip = (time: string, min: number) => ({ ...BASE, time, from: { ...BASE.from, reached_at: `2026-10-29 ${time}:00` }, product: { ...BASE.product, name: "Luxury" }, price: { ...BASE.price, min, max: min, percent: 0, price_discount: undefined } });
    state.value = { data: { pages: [{ data: [trip("19:00", 300000), trip("07:00", 250000)] }] }, hasNextPage: false };
    renderTable([{ name: "Luxury" }]);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Hạng xe", "Giờ xuất bến", "Thời gian", "Giá từ"]);
    expect(within(table).getByText("07:00, 19:00")).toBeInTheDocument();
    expect(within(table).getByText("250.000đ")).toBeInTheDocument();
  });
});
