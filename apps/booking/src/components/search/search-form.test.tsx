import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import placesFixture from "../../../test/fixtures/places.json";
import { Providers } from "@/components/providers";
import { SearchForm, SHOW_SERVICE_TABS } from "./search-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/use-trips", () => ({ usePlaces: () => ({ data: placesFixture }) }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T03:00:00Z")); // 10:00 giờ VN, hôm nay = 2026-10-29
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderForm = (date?: string, locale: "vi" | "en" = "vi", glass?: boolean) =>
  render(
    <Providers locale={locale}>
      <SearchForm initial={date ? { date } : undefined} glass={glass} />
    </Providers>,
  );

describe("SearchForm", () => {
  it("nền đặc khi thẻ nằm trên nền phẳng; chỉ có kính khi bật prop glass", () => {
    const { container, unmount } = renderForm();
    expect(container.querySelector("section")).toHaveClass("hv-plate-solid");
    expect(container.querySelector("section")).not.toHaveClass("glass");
    unmount();
    const glassy = renderForm(undefined, "vi", true);
    expect(glassy.container.querySelector("section")).toHaveClass("glass");
  });

  it("bản EN: nhãn tab ngắn, nút gửi 'Search', nhãn số người 'Guests'", () => {
    renderForm(undefined, "en");
    if (SHOW_SERVICE_TABS) {
      expect(screen.getByRole("navigation", { name: /./ })).toHaveTextContent("Bus");
      for (const name of ["Airport bus", "Airport taxi", "Car hire"]) expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByText("Guests")).toBeInTheDocument();
  });

  it("dải loại hình đang ẩn theo cờ SHOW_SERVICE_TABS: không có nav, không có liên kết sân bay/hợp đồng/du lịch", () => {
    renderForm();
    expect(screen.queryByRole("navigation", { name: "Loại hình" }) !== null).toBe(SHOW_SERVICE_TABS);
    if (!SHOW_SERVICE_TABS) {
      for (const name of ["Xe sân bay", "Xe hợp đồng", "Xe du lịch", "Xe liên tỉnh"]) expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
  });

  it.runIf(SHOW_SERVICE_TABS)("loại hình là liên kết thường trong <nav>, không có role=tab; mục hiện tại aria-current", () => {
    renderForm();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Loại hình" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xe sân bay" })).toHaveAttribute("href", "/xe-san-bay");
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent("Xe liên tỉnh");
  });

  it("ô ngày đi cho chọn từ hôm qua (now−1) và mặc định hôm nay; nhãn như web cũ", () => {
    renderForm();
    const input = screen.getByLabelText("Ngày đi");
    expect(input).toHaveAttribute("min", "2026-10-28");
    expect(input).toHaveValue("2026-10-29");
    expect(screen.getByText("Điểm xuất phát")).toBeInTheDocument();
    expect(screen.getByText("Điểm đến")).toBeInTheDocument();
  });

  it("ngày hôm qua được giữ nguyên, sớm hơn nữa thì về hôm nay", () => {
    renderForm("2026-10-28");
    expect(screen.getByLabelText("Ngày đi")).toHaveValue("2026-10-28");
    cleanup();
    renderForm("2026-10-27");
    expect(screen.getByLabelText("Ngày đi")).toHaveValue("2026-10-29");
  });
});
