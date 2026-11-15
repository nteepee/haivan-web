import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import placesFixture from "../../../test/fixtures/places.json";
import { Providers } from "@/components/providers";
import { RouteSearchForm, type RoutePlaces } from "./route-trips";

const push = vi.fn();
const query = { value: "" };
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(query.value) }));
vi.mock("@/hooks/use-trips", () => ({
  usePlaces: () => ({ data: placesFixture }),
  useTrips: () => ({ isPending: true, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }),
}));

const PLACES: RoutePlaces = { from: { name: "Mỹ Đình", lat: 21.0284297, lng: 105.7782687 }, to: { name: "Sơn La", lat: 21.3014976, lng: 103.9435128 } };

beforeEach(() => {
  push.mockClear();
  query.value = "";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T03:00:00Z"));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderForm = (landing?: string, swapHref?: string) =>
  render(
    <Providers locale="vi">
      <RouteSearchForm places={PLACES} landing={landing} swapHref={swapHref} />
    </Providers>,
  );

describe("RouteSearchForm: ô tìm vé của trang tuyến", () => {
  it("trang tuyến của một tuyến chính → ô theo tuyến, khoá đúng tuyến và chiều của trang (không có nút đổi sang tuyến khác)", () => {
    renderForm("my-dinh/son-la");
    expect(screen.queryByRole("group", { name: "Tuyến chính" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sài Gòn – Vũng Tàu" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("my-dinh");
    expect(screen.getByText("Hà Nội đi Sơn La")).toBeInTheDocument();
  });

  it("landing chiều ngược của tuyến chính → chiều về b → a", () => {
    renderForm("vung-tau/quan-1-san-bay");
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("vt");
  });

  it("trang sân bay → khoá theo tuyến Sài Gòn – Vũng Tàu, chọn sẵn trạm sân bay T1 theo chiều", () => {
    renderForm("tan-son-nhat/vung-tau");
    expect(screen.queryByRole("group", { name: "Tuyến chính" })).not.toBeInTheDocument();
    expect(screen.queryByText("Điểm xuất phát")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("tsn-t1");
    expect(screen.getByRole("combobox", { name: "Điểm đến" })).toHaveValue("vt");
    cleanup();
    renderForm("vung-tau/tan-son-nhat");
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("vt");
    expect(screen.getByRole("combobox", { name: "Điểm đến" })).toHaveValue("tsn-t1");
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

  it("bấm Đổi chiều trên trang tuyến → sang trang chiều ngược lại, mang ngày đi, số vé, ngày về và trạm (đổi vai)", async () => {
    renderForm("tan-son-nhat/vung-tau", "/xe-khach/vung-tau/tan-son-nhat");
    fireEvent.change(screen.getByLabelText("Ngày đi"), { target: { value: "2026-11-02" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Số vé" }), { target: { value: "3" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Điểm đến" }), { target: { value: "vt" } });
    await userEvent.click(screen.getByRole("button", { name: "Đổi chiều" }));
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(`https://haivan.com${push.mock.calls[0][0] as string}`);
    expect(url.pathname).toBe("/xe-khach/vung-tau/tan-son-nhat");
    expect(url.hash).toBe("#tim-ve");
    expect(Object.fromEntries(url.searchParams)).toEqual({ ngay: "2026-11-02", khach: "3", diem_di: "vt", diem_den: "tsn-t1" });
  });

  it("không có trang chiều ngược lại → Đổi chiều chỉ đảo hai ô tại chỗ", async () => {
    renderForm("tan-son-nhat/vung-tau");
    await userEvent.click(screen.getByRole("button", { name: "Đổi chiều" }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("vt");
  });

  it("mở từ nút Đổi chiều của trang trước → điền lại ngày đi, số vé, trạm từ query; giá trị sai bị bỏ", () => {
    query.value = "ngay=2026-11-02&khach=3&diem_di=vt&diem_den=tsn-t1";
    renderForm("vung-tau/tan-son-nhat");
    expect(screen.getByLabelText("Ngày đi")).toHaveValue("2026-11-02");
    expect(screen.getByRole("spinbutton", { name: "Số vé" })).toHaveValue(3);
    expect(screen.getByRole("combobox", { name: "Điểm đến" })).toHaveValue("tsn-t1");
    cleanup();
    query.value = "ngay=02-11-2026&khach=abc&diem_di=khong-co";
    renderForm("vung-tau/tan-son-nhat");
    expect(screen.getByLabelText("Ngày đi")).toHaveValue("2026-10-29");
    expect(screen.getByRole("spinbutton", { name: "Số vé" })).toHaveValue(1);
    expect(screen.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("vt");
  });
});
