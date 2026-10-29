import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import tripsFixture from "../../../test/fixtures/trips.json";
import { Providers } from "@/components/providers";
import type { SearchParamsData } from "@/lib/search-url";
import { tripSchema, type Trip } from "@/schemas/trip";
import { TripList } from "./trip-list";

const BASE = tripSchema.parse(tripsFixture.data[0]);
const SEARCH: SearchParamsData = { from: { name: "Quận 1", lat: 10.78, lng: 106.69 }, to: { name: "Vũng Tàu", lat: 10.34, lng: 107.07 }, date: "2026-10-29", numberGuest: 1, type: 2 };

const mk = (id: number, time: string, product: string, min: number, seats = 11): Trip => ({
  ...BASE,
  id,
  time,
  from: { ...BASE.from, reached_at: `2026-10-29 ${time}:00` },
  to: { ...BASE.to, reached_at: `2026-10-29 ${time}:00` },
  product: { ...BASE.product, name: product },
  available_seats: seats,
  price: { ...BASE.price, min, max: min, percent: 0, price_discount: undefined },
});
// Giờ đi (đúng thứ tự API): 05:30 Economy, 07:00 Luxury, 12:15 Luxury, 19:00 Royal.
const TRIPS = [mk(1, "05:30", "Economy", 150000, 2), mk(2, "07:00", "Luxury", 250000), mk(3, "12:15", "Luxury", 200000, 5), mk(4, "19:00", "Royal", 400000)];

const state = { hasNextPage: false };
vi.mock("@/hooks/use-trips", () => ({
  useTrips: () => ({ isPending: false, data: { pages: [{ data: TRIPS }] }, hasNextPage: state.hasNextPage, isFetchingNextPage: false, fetchNextPage: vi.fn() }),
  useTripDetail: () => ({ isPending: true }),
}));

beforeEach(() => {
  state.hasNextPage = false;
});
afterEach(cleanup);

const renderList = (search: SearchParamsData = SEARCH) =>
  render(
    <Providers locale="vi">
      <TripList search={search} />
    </Providers>,
  );
/** Giờ đi của các thẻ đang hiện, theo thứ tự trên màn hình. */
const shownTimes = () => screen.getAllByRole("article").map((a) => a.getAttribute("aria-label")!.split(" ").pop());

describe("TripList: khung giờ từ chip 'Chuyến hôm nay'", () => {
  it("query riêng gio=morning → bộ lọc giờ ban đầu: chỉ còn chuyến 6–11h, có 'Bỏ lọc'", () => {
    renderList({ ...SEARCH, corridor: { tuyen: "sg-vt", chieu: "ab", diemDi: null, diemDen: null, ngayVe: null, chang: null, donDi: null, gio: "morning" } });
    expect(shownTimes()).toEqual(["07:00"]);
    expect(screen.getByText("Đang lọc 1/4 chuyến")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ lọc" })).toBeInTheDocument();
  });
});

describe("TripList: lọc và sắp xếp phía client", () => {
  it("chưa lọc: đủ 4 chuyến theo thứ tự API, không có dòng trạng thái", () => {
    renderList();
    expect(shownTimes()).toEqual(["05:30", "07:00", "12:15", "19:00"]);
    expect(screen.queryByText(/Đang lọc/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bỏ lọc" })).not.toBeInTheDocument();
  });

  it("Hạng xe liệt kê hạng khác nhau; chọn Luxury còn 2/4 và có 'Bỏ lọc'", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { name: /Hạng xe/ }));
    expect(screen.getAllByRole("menuitemcheckbox").map((i) => i.textContent)).toEqual(["Economy", "Luxury", "Royal"]);
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Luxury" }));
    await user.keyboard("{Escape}");
    expect(shownTimes()).toEqual(["07:00", "12:15"]);
    expect(screen.getByText("Đang lọc 2/4 chuyến")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bỏ lọc" }));
    expect(shownTimes()).toHaveLength(4);
    expect(screen.queryByText(/Đang lọc/)).not.toBeInTheDocument();
  });

  it("Giờ đi theo khung: Sáng sớm + Trưa giữ 05:30 và 12:15", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { name: /Giờ đi/ }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Sáng sớm (0–6h)" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Trưa (11–14h)" }));
    await user.keyboard("{Escape}");
    expect(shownTimes()).toEqual(["05:30", "12:15"]);
    expect(screen.getByRole("button", { name: /Giờ đi \(2\)/ })).toBeInTheDocument();
  });

  it("Giá giảm dần và Sắp xếp 'Còn nhiều chỗ' đổi thứ tự, không làm mất chuyến", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { name: /^Giá/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Giá cao đến thấp" }));
    expect(shownTimes()).toEqual(["19:00", "07:00", "12:15", "05:30"]);
    expect(screen.getByText("Đang sắp xếp: Giá cao nhất")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Giá cao nhất/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Còn nhiều chỗ" }));
    expect(shownTimes()).toEqual(["07:00", "19:00", "12:15", "05:30"]);
  });

  it("không có chuyến khớp: câu báo + nút Bỏ lọc khôi phục danh sách", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { name: /Hạng xe/ }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Royal" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /Giờ đi/ }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Sáng (6–11h)" }));
    await user.keyboard("{Escape}");
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    const empty = screen.getByText("Không có chuyến nào phù hợp bộ lọc.").closest("[role=status]") as HTMLElement;
    await user.click(within(empty).getByRole("button", { name: "Bỏ lọc" }));
    expect(shownTimes()).toHaveLength(4);
  });

  it("còn trang chưa tải: ghi chú lọc chỉ áp dụng cho phần đã tải; 'Xem thêm' vẫn có", async () => {
    state.hasNextPage = true;
    const user = userEvent.setup();
    renderList();
    expect(screen.getByRole("button", { name: "Xem thêm" })).toBeInTheDocument();
    expect(screen.queryByText(/chỉ áp dụng cho/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Hạng xe/ }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Luxury" }));
    await user.keyboard("{Escape}");
    expect(screen.getByText(/Bộ lọc chỉ áp dụng cho 4 chuyến đã tải/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem thêm" })).toBeInTheDocument();
  });
});
