import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import seatsFixture from "../../../test/fixtures/seats.json";
import tripsFixture from "../../../test/fixtures/trips.json";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { draftFromHold } from "@/lib/hold-draft";
import type { SearchParamsData } from "@/lib/search-url";
import { seatMapResponseSchema, tripSchema, type Seat } from "@/schemas/trip";
import { useBookingDraft, type BookingDraft } from "@/stores/booking-draft";
import { ConfirmPage } from "./confirm-page";

const push = vi.fn();
const replace = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back }),
  useSearchParams: () => new URLSearchParams(),
}));

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;
const ORDER_CODE = "B02TESTCONFIRM";
const CUSTOMER_NAME = "Khach Test";
const CUSTOMER_PHONE = "0900000000";

const trip = tripSchema.parse(tripsFixture.data[0]);
const SEATS: Seat[] = seatMapResponseSchema.parse(seatsFixture).data[0].flat().filter((s): s is Seat => s !== null);
const seat = (name: string): Seat => {
  const found = SEATS.find((s) => s.name === name && s.is_empty);
  if (!found) throw new Error(`Không có ghế trống ${name} trong fixture`);
  return found;
};
const SEARCH: SearchParamsData = {
  from: { name: "159 Điện Biên Phủ", lat: 10.7879376, lng: 106.6952939 },
  to: { name: "TP Vũng Tàu (Gành Hào)", lat: 10.3391989, lng: 107.0710401 },
  date: "2026-10-29",
  numberGuest: 2,
  type: 2,
};

/** "DD-MM-YYYY HH:mm:ss" theo giờ Việt Nam, như expire_time của hold. */
function expireIn(minutes: number): string {
  const s = new Date(Date.now() + minutes * 60_000 + 7 * 3600_000).toISOString();
  return `${s.slice(8, 10)}-${s.slice(5, 7)}-${s.slice(0, 4)} ${s.slice(11, 19)}`;
}

/** Nháp như sau hold thành công (hai ghế, chuyến có trung chuyển đón). */
function makeDraft(opts: { expiresAt?: number; reward?: boolean } = {}): BookingDraft {
  const picked = [seat("2"), seat("1")];
  const draft = draftFromHold({
    trip,
    search: SEARCH,
    seats: picked,
    hold: { message: "ok", expire_time: expireIn(10), order_code: ORDER_CODE, tickets: picked.map((s) => ({ id: s.id, code: `V${s.id}` })) },
    isCombo: false,
    user: null,
  });
  return {
    ...draft,
    expiresAt: opts.expiresAt ?? Date.now() + 10 * 60_000,
    seats: opts.reward ? draft.seats.map((s) => ({ ...s, is_reward: true })) : draft.seats,
  };
}

/** Nạp nháp vào sessionStorage (đúng khoá persist) rồi hydrate store như khi mở trang. */
async function hydrate(draft: BookingDraft | null) {
  sessionStorage.setItem("hv_booking_draft", JSON.stringify({ state: { draft }, version: 0 }));
  await useBookingDraft.persist.rehydrate();
}

const renderConfirm = () =>
  render(
    <Providers locale="vi">
      <ConfirmPage />
    </Providers>,
  );

let customerCalls = 0;
let customerInvoice: Record<string, unknown> | null = null;
const transportFailures: string[] = [];

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : String(input);
    try {
      return await real(url, init);
    } catch (error) {
      transportFailures.push(`${init?.method ?? "GET"} ${url}`);
      throw error;
    }
  });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  push.mockClear();
  replace.mockClear();
  back.mockClear();
  customerCalls = 0;
  customerInvoice = null;
  useBookingDraft.setState({ draft: null });
  sessionStorage.clear();
  server.use(
    http.get(`${BASE}/customer/customers`, () => {
      customerCalls++;
      return HttpResponse.json({ data: { name: CUSTOMER_NAME, phone: CUSTOMER_PHONE, email: null, invoice_info: customerInvoice, account: { balance: 0 } } });
    }),
    http.get(`${BASE}/promotion/get-promotions`, () => HttpResponse.json({ data: [] })),
    // Merchant 02 có dịch vụ tận nhà: danh sách rỗng để không phát sinh get-price-transit.
    http.get(`${BASE}/v4/get-bonus-service`, () => HttpResponse.json([])),
  );
});

afterEach(() => {
  cleanup();
  // Toast của sonner là state toàn cục: không dọn thì test sau thấy lại thông báo cũ.
  toast.dismiss();
  vi.unstubAllGlobals();
  expect(transportFailures.splice(0), "request không có handler (lỗi transport)").toEqual([]);
});

/** Body `POST bookings` kỳ vọng cho nháp mặc định (khách có tên/SĐT, không hoá đơn, không mã KM). */
const expectedBookingBody = () => ({
  pick_up: { address: SEARCH.from.name, coordinates: { lat: SEARCH.from.lat, lng: SEARCH.from.lng } },
  drop_off: { address: SEARCH.to.name, coordinates: { lat: SEARCH.to.lat, lng: SEARCH.to.lng } },
  trip: { trip_id: trip.id, departure_id: trip.from.place_id, destination_id: trip.to.place_id },
  transit: { departure: true, destination: false },
  seats: [
    { id: seat("1").id, is_reward: false },
    { id: seat("2").id, is_reward: false },
  ],
  order_code: ORDER_CODE,
  merchant_code: trip.merchant.code,
  note: "",
  is_combo: 0,
  if_customer: { email: null, phone: CUSTOMER_PHONE, name: CUSTOMER_NAME },
});

function recordBookings(opts: { gate?: Promise<void> } = {}) {
  const bodies: Record<string, unknown>[] = [];
  const holdTransitBodies: Record<string, unknown>[] = [];
  server.use(
    http.post(`${BASE}/bookings`, async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      if (opts.gate) await opts.gate;
      return HttpResponse.json({ data: { code: ORDER_CODE } });
    }),
    http.post(`${BASE}/v4/hold-transit`, async ({ request }) => {
      holdTransitBodies.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({});
    }),
  );
  return { bodies, holdTransitBodies };
}

const submitButton = () => screen.findByRole("button", { name: /^Tiếp tục/ });

describe("ConfirmPage: nháp hợp lệ", () => {
  it("nháp đọc từ sessionStorage → gửi POST bookings đúng body của buildBookingBody rồi sang thanh toán", async () => {
    const { bodies, holdTransitBodies } = recordBookings();
    await hydrate(makeDraft());
    const user = userEvent.setup();
    renderConfirm();
    await screen.findByDisplayValue(CUSTOMER_NAME);
    await user.click(await submitButton());

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual(expectedBookingBody());
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/xe-khach/thanh-toan?booking_code=${ORDER_CODE}&merchant_code=${trip.merchant.code}&trip_id=${trip.id}`));
    // Sau booking thành công luôn gọi hold-transit (merchant 02) với services rỗng.
    await waitFor(() => expect(holdTransitBodies).toHaveLength(1));
    expect(holdTransitBodies[0]).toEqual({
      order_code: ORDER_CODE,
      merchant_code: trip.merchant.code,
      pick_up: SEARCH.from.name,
      pick_up_lat: SEARCH.from.lat,
      pick_up_lng: SEARCH.from.lng,
      drop_off: SEARCH.to.name,
      drop_off_lat: SEARCH.to.lat,
      drop_off_lng: SEARCH.to.lng,
      services: [],
    });
  });

  it("hiện thanh bước (bước 2 đang chọn), đồng hồ \"Còn mm:ss\" và nút phụ \"Dùng mã hoặc điểm\"", async () => {
    recordBookings();
    await hydrate(makeDraft());
    renderConfirm();
    await screen.findByDisplayValue(CUSTOMER_NAME);
    const steps = screen.getByRole("navigation", { name: "Các bước đặt vé" });
    expect(within(steps).getByText("Thông tin của bạn").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("timer")).toHaveTextContent(/Còn \d\d:\d\d/);
    expect(screen.getByRole("button", { name: "Sử dụng điểm hoặc mã giảm giá" })).toBeInTheDocument();
  });

  it("tổng tiền bằng 0 (toàn bộ ghế đổi điểm) → sang trang thành công, không qua thanh toán", async () => {
    const { bodies } = recordBookings();
    await hydrate(makeDraft({ reward: true }));
    const user = userEvent.setup();
    renderConfirm();
    await screen.findByDisplayValue(CUSTOMER_NAME);
    await user.click(await submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/xe-khach/thanh-toan/thanh-cong?booking_code=${ORDER_CODE}&merchant_code=${trip.merchant.code}`));
    expect(bodies[0].seats).toEqual([
      { id: seat("1").id, is_reward: true },
      { id: seat("2").id, is_reward: true },
    ]);
  });

  it("bấm Tiếp tục hai lần khi đang gửi chỉ tạo một booking", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { bodies } = recordBookings({ gate });
    await hydrate(makeDraft());
    const user = userEvent.setup();
    renderConfirm();
    await screen.findByDisplayValue(CUSTOMER_NAME);
    const submit = await submitButton();

    try {
      await user.dblClick(submit);
      await waitFor(() => expect(bodies).toHaveLength(1));
      await new Promise((r) => setTimeout(r, 100));
      expect(bodies).toHaveLength(1);
      expect(submit).toBeDisabled();
    } finally {
      release();
    }
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(bodies).toHaveLength(1);
  });
});

describe("ConfirmPage: kiểm tra form chặn gửi", () => {
  it.each([
    ["họ tên", /Họ và tên/, CUSTOMER_NAME],
    ["số điện thoại", /Số điện thoại/, CUSTOMER_PHONE],
  ])("thiếu %s → cảnh báo, không gửi booking", async (_label, field, prefilled) => {
    const { bodies } = recordBookings();
    await hydrate(makeDraft());
    const user = userEvent.setup();
    renderConfirm();
    const input = await screen.findByLabelText(field);
    expect(input).toHaveValue(prefilled);
    await user.clear(input);
    await user.click(await submitButton());

    expect(await screen.findByText("Bạn cần nhập đủ thông tin người đi")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it("xoá cả họ tên và số điện thoại → vẫn cảnh báo, không gửi booking thiếu if_customer", async () => {
    const { bodies } = recordBookings();
    await hydrate(makeDraft());
    const user = userEvent.setup();
    renderConfirm();
    await user.clear(await screen.findByLabelText(/Họ và tên/));
    await user.clear(screen.getByLabelText(/Số điện thoại/));
    await user.click(await submitButton());

    expect(await screen.findByText("Bạn cần nhập đủ thông tin người đi")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it("hoá đơn doanh nghiệp thiếu mã số thuế → cảnh báo, không gửi; điền mã xong mới gửi và body không có loại hoá đơn", async () => {
    customerInvoice = { company_name: "Cong ty ABC", company_address: "1 Lê Lợi", tax_code: null, email: "kt@abc.vn" };
    const { bodies } = recordBookings();
    await hydrate(makeDraft());
    const user = userEvent.setup();
    renderConfirm();
    await screen.findByDisplayValue(CUSTOMER_NAME);

    await user.click(screen.getByRole("checkbox", { name: /Tôi muốn xuất hóa đơn/ }));
    await user.click(screen.getByRole("radio", { name: "Khách hàng doanh nghiệp" }));
    await user.click(await submitButton());

    expect(await screen.findByText("Bạn cần nhập đủ thông tin xuất hoá đơn")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    await user.type(screen.getByLabelText(/Mã số thuế/), "0312345678");
    await user.click(await submitButton());

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      ...expectedBookingBody(),
      invoice: { name: "Cong ty ABC", address: "1 Lê Lợi", code: "0312345678", email: "kt@abc.vn" },
    });
    expect(bodies[0]).not.toHaveProperty("valueCheckbox");
    expect(bodies[0]).not.toHaveProperty("kind");
  });

  it("hoá đơn cá nhân không bắt buộc mã số thuế, mã rỗng vẫn được gửi", async () => {
    customerInvoice = { company_name: "Nguyen Van A", company_address: "2 Hai Bà Trưng", tax_code: null, email: "a@b.vn" };
    const { bodies } = recordBookings();
    await hydrate(makeDraft());
    const user = userEvent.setup();
    renderConfirm();
    await screen.findByDisplayValue(CUSTOMER_NAME);

    await user.click(screen.getByRole("checkbox", { name: /Tôi muốn xuất hóa đơn/ }));
    await user.click(await submitButton());

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].invoice).toEqual({ name: "Nguyen Van A", address: "2 Hai Bà Trưng", code: "", email: "a@b.vn" });
  });
});

describe("ConfirmPage: hết hạn giữ chỗ", () => {
  it("nháp đã hết hạn khi mở trang → hiện thông báo, xoá nháp, không gọi API khách hàng; OK quay lại", async () => {
    await hydrate(makeDraft({ expiresAt: Date.now() - 1000 }));
    const user = userEvent.setup();
    renderConfirm();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Đã hết thời gian đặt vé, mời bạn chọn lại chỗ")).toBeInTheDocument();
    await waitFor(() => expect(useBookingDraft.getState().draft).toBeNull());
    expect(customerCalls).toBe(0);
    expect(replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("hết hạn trong lúc đang ở trang (đồng hồ về 0) → hiện thông báo và xoá nháp", async () => {
    const { bodies } = recordBookings();
    await hydrate(makeDraft({ expiresAt: Date.now() + 2000 }));
    renderConfirm();
    await submitButton();

    expect(await screen.findByRole("dialog", {}, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByText("Đã hết thời gian đặt vé, mời bạn chọn lại chỗ")).toBeInTheDocument();
    await waitFor(() => expect(useBookingDraft.getState().draft).toBeNull());
    expect(bodies).toHaveLength(0);
  });

  it("không có nháp → chuyển về trang tìm chuyến", async () => {
    await hydrate(null);
    renderConfirm();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/xe-khach"));
    expect(customerCalls).toBe(0);
  });
});
