import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bookingFixture from "../../../test/fixtures/booking.json";
import { server } from "../../../test/msw-server";
import { ROUNDTRIP_PROMO, withPromos } from "../../../test/booking-config";
import { BookingConfigProvider } from "@/components/booking-config-provider";
import { Providers } from "@/components/providers";
import { parseCorridorParams, parseSearch } from "@/lib/search-url";
import { saveReturnCarry } from "@/lib/roundtrip-carry";
import type { BookingConfig } from "@/schemas/booking-config";
import { useBookingDraft } from "@/stores/booking-draft";
import { SuccessPage } from "./success-page";

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => nav.params,
}));

const ORIGIN = "http://localhost:3000";
const ORDER = bookingFixture.data.code;
const BASE = `${ORIGIN}/api/hv/gw`;
const VERIFYING = /Đang xác minh thanh toán…/;
const DO_NOT_REPAY = "Vui lòng không thanh toán lại";
/** Cảnh báo = một vùng status chứa cả hai câu. */
const notice = () => screen.queryByText(DO_NOT_REPAY)?.closest('[role="status"]');

const bookingBody = (paymentType: number) => ({
  ...bookingFixture,
  data: { ...bookingFixture.data, payment: { type: paymentType, type_name: paymentType ? "Đã thanh toán" : "Chưa thanh toán" } },
});

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockBooking(paymentFor: (call: number) => number) {
  const state = { calls: 0 };
  server.use(http.get(`${BASE}/bookings/${ORDER}`, () => HttpResponse.json(bookingBody(paymentFor(++state.calls)))));
  return state;
}

const renderPage = (extra: Record<string, string> = {}) => {
  nav.params = new URLSearchParams({ booking_code: ORDER, merchant_code: "02", ...extra });
  return render(
    <Providers locale="vi">
      <SuccessPage />
    </Providers>,
  );
};

describe("SuccessPage: cổng báo 00 nhưng backend chưa ghi nhận thanh toán", () => {
  it("00 nhưng backend chưa có payment.type: không hiện như đã trả, có cảnh báo không thanh toán lại", async () => {
    mockBooking(() => 0);
    renderPage({ from: "gateway" });

    expect(await screen.findByText(DO_NOT_REPAY, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(notice()).toHaveTextContent(VERIFYING);
    expect(screen.getByText("Chưa thanh toán")).toBeInTheDocument();
    expect(screen.queryByText("Đã thanh toán")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Làm mới" })).toBeInTheDocument();
  });

  it("thăm dò mỗi 2 s: lần sau backend có payment.type thì cảnh báo biến mất và hiện đã thanh toán", async () => {
    const state = mockBooking((call) => (call === 1 ? 0 : 1));
    renderPage({ from: "gateway" });

    expect(await screen.findByText(DO_NOT_REPAY, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(notice()).toHaveTextContent(VERIFYING);
    await waitFor(() => expect(screen.getByText("Đã thanh toán")).toBeInTheDocument(), { timeout: 9000 });
    expect(screen.queryByText(DO_NOT_REPAY)).not.toBeInTheDocument();
    expect(state.calls).toBeGreaterThanOrEqual(2);
  }, 15_000);

  it("vào thẳng trang (không từ cổng) thì không có cảnh báo và không thăm dò", async () => {
    const state = mockBooking(() => 0);
    renderPage();

    expect(await screen.findByText("Chưa thanh toán", {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByText(DO_NOT_REPAY)).not.toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 2500));
    expect(state.calls).toBe(1);
  }, 10_000);
});


const SLOW = { timeout: 5000 }; // trang chờ 1,5 s cho backend trước khi đọc đơn

describe("SuccessPage: nút 'Đặt chiều về' của khứ hồi", () => {
  const OWN = { tuyen: "hn-moc", chieu: "ab" as const, diemDi: "nguyen-tuan", diemDen: "ben-xe-mc", ngayVe: "2026-11-02", chang: null, donDi: null, gio: null };
  const renderWith = (config?: BookingConfig, extra: Record<string, string> = {}) => {
    nav.params = new URLSearchParams({ booking_code: ORDER, merchant_code: "02", ...extra });
    const page = <SuccessPage />;
    return render(<Providers locale="vi">{config ? <BookingConfigProvider config={config}>{page}</BookingConfigProvider> : page}</Providers>);
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-29T03:00:00Z"));
    localStorage.clear();
    useBookingDraft.setState({ draft: null });
    mockBooking(() => 1);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("đơn chiều đi có ngày về: thẻ nổi + liên kết tới tìm chuyến chiều ngược (ngày về, trạm đổi vai, chang=ve, don_di)", { timeout: 15_000 }, async () => {
    saveReturnCarry(ORDER, OWN, 2);
    renderWith(withPromos([ROUNDTRIP_PROMO]));
    const link = await screen.findByRole("link", { name: "Đặt chiều về 02/11/2026" }, SLOW);
    expect(screen.getByRole("heading", { name: "Đặt chiều về 02/11/2026" })).toBeInTheDocument();
    expect(screen.getByText("Mộc Châu → Hà Nội · 02/11/2026 · 1 vé")).toBeInTheDocument();
    expect(screen.getByText("Giảm 20k/ghế chiều về")).toBeInTheDocument();

    const url = new URL(link.getAttribute("href")!, "https://haivan.com");
    expect(url.pathname).toBe("/xe-khach/tim-chuyen");
    const search = parseSearch(url.searchParams)!;
    expect(search).toMatchObject({ date: "2026-11-02", numberGuest: 1, type: 2 }) // số vé = số vé của đơn chiều đi (fixture có 1 vé);
    expect(search.from).toMatchObject({ name: "Mộc Châu", lat: 20.8461723, lng: 104.6415738 });
    expect(search.to).toMatchObject({ name: "Bến xe Mỹ Đình", lat: 21.0284297, lng: 105.7782687 });
    expect(parseCorridorParams(url.searchParams)).toEqual({
      tuyen: "hn-moc",
      chieu: "ba",
      diemDi: "ben-xe-mc",
      diemDen: "nguyen-tuan",
      ngayVe: null,
      chang: "ve",
      donDi: ORDER,
      gio: null,
    });
  });

  it("đơn chiều đi chưa thanh toán → chưa mời đặt chiều về", { timeout: 15_000 }, async () => {
    mockBooking(() => 0);
    saveReturnCarry(ORDER, OWN, 1);
    renderWith();
    await screen.findByText("Chưa thanh toán", {}, SLOW);
    expect(screen.queryByRole("link", { name: /Đặt chiều về/ })).not.toBeInTheDocument();
  });

  it("còn nháp của đơn này (chưa bị xoá): lấy ý định từ nháp; không có chương trình khứ hồi thì không có nhãn giảm", { timeout: 15_000 }, async () => {
    useBookingDraft.setState({ draft: { order_code: ORDER, search: { corridor: OWN }, seats: [{}, {}, {}] } as never });
    renderWith();
    expect(await screen.findByText("Mộc Châu → Hà Nội · 02/11/2026 · 1 vé", {}, SLOW)).toBeInTheDocument();
    expect(screen.queryByText(/Giảm 20k/)).not.toBeInTheDocument();
  });

  it("không có ngày về, đang ở chặng về, ngày về đã qua hoặc tuyến không còn → không hiện thẻ", { timeout: 20_000 }, async () => {
    for (const own of [{ ...OWN, ngayVe: null }, { ...OWN, chang: "ve" as const }, { ...OWN, ngayVe: "2026-10-28" }, { ...OWN, tuyen: "khong-co" }]) {
      localStorage.clear();
      localStorage.setItem("hv_return_carry", JSON.stringify([{ order: ORDER, own, guests: 1, at: Date.now() }]));
      renderWith();
      await screen.findByText("Đặt chỗ thành công", {}, SLOW);
      expect(screen.queryByRole("link", { name: /Đặt chiều về/ })).not.toBeInTheDocument();
      cleanup();
    }
  });
});

describe("SuccessPage: đơn 0đ từ link không có merchant_code", () => {
  it("thiếu merchant_code trên URL → lấy từ nháp của đơn rồi gọi bookings/{code}?merchant_code=…; có trên URL thì dùng URL", { timeout: 15_000 }, async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get(`${BASE}/bookings/${ORDER}`, ({ request }) => {
        const merchant = new URL(request.url).searchParams.get("merchant_code");
        seen.push(merchant);
        return merchant ? HttpResponse.json(bookingBody(1)) : HttpResponse.json({ message: "The merchant code field is required." }, { status: 422 });
      }),
    );
    useBookingDraft.setState({ draft: { order_code: ORDER, trip_info: { merchant: { code: "02" } }, search: {}, seats: [] } as never });
    nav.params = new URLSearchParams({ booking_code: ORDER });
    render(
      <Providers locale="vi">
        <SuccessPage />
      </Providers>,
    );
    expect(await screen.findByText("Đặt chỗ thành công", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(seen).toEqual(["02"]);
    expect(screen.queryByText("The merchant code field is required.")).not.toBeInTheDocument();
  });
});
