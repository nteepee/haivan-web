import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import placesFixture from "../../../test/fixtures/places.json";
import { Providers } from "@/components/providers";
import { RouteSearchForm, type RoutePlaces } from "./route-trips";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/use-trips", () => ({
  usePlaces: () => ({ data: placesFixture }),
  useTrips: () => ({ isPending: true, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }),
}));

const PLACES: RoutePlaces = { from: { name: "Mỹ Đình", lat: 21.0284297, lng: 105.7782687 }, to: { name: "Sơn La", lat: 21.3014976, lng: 103.9435128 } };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T03:00:00Z"));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderForm = (landing?: string) =>
  render(
    <Providers locale="vi">
      <RouteSearchForm places={PLACES} landing={landing} />
    </Providers>,
  );

describe("RouteSearchForm: ô tìm vé của trang tuyến", () => {
  it("trang tuyến của một tuyến chính → ô theo tuyến, chọn sẵn tuyến và chiều của trang", () => {
    renderForm("my-dinh/son-la");
    expect(screen.getByRole("button", { name: "Hà Nội – Sơn La" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("my-dinh");
    expect(screen.getByText("Hà Nội đi Sơn La")).toBeInTheDocument();
  });

  it("landing chiều ngược của tuyến chính → chiều về b → a", () => {
    renderForm("vung-tau/quan-1-san-bay");
    expect(screen.getByRole("button", { name: "Sài Gòn – Vũng Tàu" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("vt");
  });

  it("trang tuyến khác (không phải tuyến chính) hoặc không có landing → hành vi cũ: chọn điểm tự do, điền sẵn đầu tuyến", () => {
    renderForm("yen-nghia/dien-bien");
    expect(screen.queryByRole("group", { name: "Tuyến chính" })).not.toBeInTheDocument();
    expect(screen.getByText("Điểm xuất phát")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mỹ Đình")).toBeInTheDocument();
    cleanup();
    renderForm();
    expect(screen.queryByRole("group", { name: "Tuyến chính" })).not.toBeInTheDocument();
  });
});
