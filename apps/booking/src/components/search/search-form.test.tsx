import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import placesFixture from "../../../test/fixtures/places.json";
import { Providers } from "@/components/providers";
import { SearchForm, SHOW_SERVICE_TABS } from "./search-form";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }) }));
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

  it("số người tối đa 9: bấm + ở 9 hoặc gõ 15 thì giữ 9 và hiện số tổng đài cho đoàn", () => {
    renderForm();
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "9" } });
    expect(screen.queryByText(/Mỗi đơn đặt tối đa 9 vé/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tăng|increase/i }));
    expect(input).toHaveValue(9);
    expect(screen.getByRole("link", { name: /1900 6763/ })).toHaveAttribute("href", "tel:19006763");
    fireEvent.change(input, { target: { value: "15" } });
    expect(input).toHaveValue(9);
    fireEvent.blur(input);
    expect(screen.getByText(/Mỗi đơn đặt tối đa 9 vé/)).toBeInTheDocument();
  });

  it("đang hiện ghi chú đoàn (>9 vé) thì nút Tìm không chuyển trang; về 9 vé thì tìm bình thường", () => {
    nav.push.mockClear();
    render(
      <Providers locale="vi">
        <SearchForm initial={{ from: { name: "Quận 1", lat: 10.78, lng: 106.69 }, to: { name: "Vũng Tàu", lat: 10.34, lng: 107.07 }, date: "2026-10-29" }} />
      </Providers>,
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "15" } });
    fireEvent.submit(input.closest("form")!);
    expect(nav.push).not.toHaveBeenCalled();
    // Ô đang hiện 9 (đã chặn); bớt một vé rồi thêm lại = chọn đúng 9 vé, ghi chú ẩn và tìm được.
    fireEvent.click(screen.getByRole("button", { name: /giảm|fewer/i }));
    fireEvent.click(screen.getByRole("button", { name: /tăng|more/i }));
    expect(screen.queryByText(/Mỗi đơn đặt tối đa 9 vé/)).not.toBeInTheDocument();
    fireEvent.submit(input.closest("form")!);
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push.mock.calls[0][0]).toContain("numberGuest=9");
  });
});
