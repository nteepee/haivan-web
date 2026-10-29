import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import tripsFixture from "../../../test/fixtures/trips.json";
import { COMBO_PROMO, withPromos } from "../../../test/booking-config";
import { BookingConfigProvider } from "@/components/booking-config-provider";
import { Providers } from "@/components/providers";
import type { BookingConfig } from "@/schemas/booking-config";
import type { SearchParamsData } from "@/lib/search-url";
import { tripSchema, type Trip } from "@/schemas/trip";
import { classBadgeTone, TripCard } from "./trip-card";

const TRIP = tripSchema.parse(tripsFixture.data[0]);
const SEARCH: SearchParamsData = {
  from: { name: "Quận 1", lat: 10.78, lng: 106.69 },
  to: { name: "Vũng Tàu", lat: 10.34, lng: 107.07 },
  date: "2026-10-29",
  numberGuest: 1,
  type: 2,
};

// Combo đang tắt theo cờ (lib/promo-flags): các test nhãn combo bật cờ để kiểm tra đường mã còn giữ.
vi.mock("@/lib/promo-flags", () => ({ AUTO_COMBO_ENABLED: true }));

afterEach(cleanup);

const renderCard = (trip: Trip, props: { open?: boolean; priority?: boolean } = {}) =>
  render(
    <Providers locale="vi">
      <TripCard trip={trip} search={SEARCH} open={props.open ?? false} priority={props.priority} onToggle={() => undefined} />
    </Providers>,
  );

describe("TripCard: nhãn nghiệp vụ như web cũ", () => {
  it("tên tuyến là h3 (chiều B đảo), dòng giữa 'Xe liên tỉnh' đi kèm thời lượng 02h40", () => {
    renderCard(TRIP);
    expect(screen.getByRole("heading", { level: 3, name: "Tân Sơn Nhất - Vũng Tàu" })).toBeInTheDocument();
    const middle = screen.getByText("Xe liên tỉnh");
    expect(middle).toHaveTextContent("02h40");
    expect(screen.queryByText(/02 giờ/)).not.toBeInTheDocument();
  });

  it("số chỗ hiện 'N Chỗ trống'; hết chỗ hiện 'Hết chỗ' và nút không còn là nút vàng", () => {
    renderCard(TRIP);
    expect(screen.getByText("11 Chỗ trống")).toBeInTheDocument();
    cleanup();
    renderCard({ ...TRIP, available_seats: 0 });
    const button = screen.getByRole("button", { name: "Hết chỗ" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveClass("hv-btn-primary");
  });

  it("giờ đón khác giờ xuất bến: dòng '*Khởi hành: HH:mm Ngày DD/MM/YYYY' hiện ngay cả khi hàng đang đóng", () => {
    renderCard(TRIP, { open: false });
    expect(screen.getByText("*Khởi hành: 12:30 Ngày 29/10/2026")).toBeInTheDocument();
  });

  it("giờ trùng thì không có dòng khởi hành", () => {
    renderCard({ ...TRIP, from: { ...TRIP.from, reached_at: "2026-10-29 12:30:00" } });
    expect(screen.queryByText(/Khởi hành/)).not.toBeInTheDocument();
  });

  it("ảnh hàng đầu tải ngay với ưu tiên cao, hàng khác lazy", () => {
    renderCard(TRIP, { priority: true });
    const first = within(document.body).getAllByRole("img")[0];
    expect(first).toHaveAttribute("loading", "eager");
    expect(first).toHaveAttribute("fetchpriority", "high");
    cleanup();
    renderCard(TRIP);
    expect(within(document.body).getAllByRole("img")[0]).toHaveAttribute("loading", "lazy");
  });

  it("còn 1 đến 3 chỗ: huy hiệu cảnh báo 'Còn ít chỗ' (đồng hồ + chữ) kèm số chỗ; từ 4 chỗ: huy hiệu thường", () => {
    renderCard({ ...TRIP, available_seats: 3 });
    const few = screen.getByText(/Còn ít chỗ/);
    expect(few).toHaveClass("hv-badge-few");
    expect(few).toHaveTextContent("Còn ít chỗ, 3 Chỗ trống");
    cleanup();
    renderCard({ ...TRIP, available_seats: 4 });
    expect(screen.queryByText(/Còn ít chỗ/)).not.toBeInTheDocument();
    expect(screen.getByText("4 Chỗ trống")).toHaveClass("hv-tag-in");
  });

  it("giờ đi và giờ đến cùng cỡ lớn; huy hiệu hạng nằm trên ảnh với màu theo hạng", () => {
    renderCard(TRIP);
    expect(document.querySelectorAll(".hv-time")).toHaveLength(2);
    expect(document.querySelector(".hv-trip-thumb .hv-badge-photo")).toHaveTextContent("Luxury");
    expect(classBadgeTone("Royal Cabin")).toBe("hv-badge-orange");
    expect(classBadgeTone("Luxury")).toBe("hv-badge-blue");
    expect(classBadgeTone("Economy")).toBe("hv-badge-leaf");
    expect(classBadgeTone("Khác")).toBe("");
  });
});


describe("TripCard: nhãn combo từ chương trình giảm giá", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-29T03:00:00Z")); // 10:00 giờ VN; chuyến xuất bến 12:45
  });
  afterEach(() => vi.useRealTimers());

  const corridor = { tuyen: "sg-vt", chieu: "ab" as const, diemDi: null, diemDen: null, ngayVe: null, chang: null, donDi: null, gio: null };
  const renderPromo = (config: BookingConfig, search: SearchParamsData) =>
    render(
      <Providers locale="vi">
        <BookingConfigProvider config={config}>
          <TripCard trip={TRIP} search={search} open={false} onToggle={() => undefined} />
        </BookingConfigProvider>
      </Providers>,
    );

  it("chuyến khớp tuyến, chiều, giờ, đặt trước và số ghế → huy hiệu combo + 'N vé từ <giá>'", () => {
    renderPromo(withPromos([COMBO_PROMO]), { ...SEARCH, numberGuest: 2, corridor });
    expect(screen.getByText("Combo")).toHaveClass("hv-badge");
    expect(screen.getByText("2 vé từ 419.000đ (giá tham khảo)")).toBeInTheDocument();
  });

  it("không có chương trình, tìm tự do (không tuyến chính), sai chiều hoặc số ghế ngoài khoảng → không hiện gì", () => {
    renderPromo(withPromos([]), { ...SEARCH, numberGuest: 2, corridor });
    expect(screen.queryByText("Combo")).not.toBeInTheDocument();
    cleanup();
    renderPromo(withPromos([COMBO_PROMO]), { ...SEARCH, numberGuest: 2 });
    expect(screen.queryByText("Combo")).not.toBeInTheDocument();
    cleanup();
    renderPromo(withPromos([COMBO_PROMO]), { ...SEARCH, numberGuest: 2, corridor: { ...corridor, chieu: "ba" } });
    expect(screen.queryByText("Combo")).not.toBeInTheDocument();
    cleanup();
    renderPromo(withPromos([COMBO_PROMO]), { ...SEARCH, numberGuest: 1, corridor });
    expect(screen.queryByText("Combo")).not.toBeInTheDocument();
  });
});
