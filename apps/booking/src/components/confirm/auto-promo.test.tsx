import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import seatsFixture from "../../../test/fixtures/seats.json";
import tripsFixture from "../../../test/fixtures/trips.json";
import { server } from "../../../test/msw-server";
import { makePromo, ROUNDTRIP_PROMO, withPromos } from "../../../test/booking-config";
import { BookingConfigProvider } from "@/components/booking-config-provider";
import { Providers } from "@/components/providers";
import { draftFromHold } from "@/lib/hold-draft";
import type { BookingConfig } from "@/schemas/booking-config";
import type { CorridorParams, SearchParamsData } from "@/lib/search-url";
import { seatMapResponseSchema, tripSchema, type Seat } from "@/schemas/trip";
import { useBookingDraft, type BookingDraft } from "@/stores/booking-draft";
import { ConfirmPage } from "./confirm-page";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;
const ORDER_CODE = "B02AUTOPROMO";
const trip = tripSchema.parse(tripsFixture.data[0]); // 2026-10-29 12:45, Luxury
const SEATS = seatMapResponseSchema.parse(seatsFixture).data[0].flat().filter((s): s is Seat => s !== null && s.is_empty);
const picked = [SEATS[0], SEATS[1]];
/** Chặng về của khứ hồi Hà Nội – Mộc Châu (chiều về ba), kèm đơn chiều đi. */
const RT: Partial<CorridorParams> = { tuyen: "hn-moc", chieu: "ba", chang: "ve", donDi: "B02OUT" };
const TOKEN = "@auto:10:B02OUT";
const LABEL = "Đã áp Giảm 20k/ghế chiều về";
const own = (patch: Partial<CorridorParams>): CorridorParams => ({ tuyen: "sg-vt", chieu: "ab", diemDi: null, diemDen: null, ngayVe: null, chang: null, donDi: null, gio: null, ...patch });

function makeDraft(corridor: CorridorParams | undefined, patch: Partial<BookingDraft> = {}): BookingDraft {
  const search: SearchParamsData = {
    from: { name: "Quận 1", lat: 10.7753882, lng: 106.702825 },
    to: { name: "Vũng Tàu", lat: 10.3391989, lng: 107.0710401 },
    date: "2026-10-29",
    numberGuest: 2,
    type: 2,
    ...(corridor ? { corridor } : {}),
  };
  const draft = draftFromHold({
    trip,
    search,
    seats: picked,
    hold: { message: "ok", expire_time: "29-10-2026 10:10:00", order_code: ORDER_CODE, tickets: picked.map((s) => ({ id: s.id, code: `V${s.id}` })) },
    isCombo: false,
    user: null,
  });
  return { ...draft, expiresAt: Date.now() + 10 * 60_000, ...patch };
}

async function hydrate(draft: BookingDraft) {
  sessionStorage.setItem("hv_booking_draft", JSON.stringify({ state: { draft }, version: 0 }));
  await useBookingDraft.persist.rehydrate();
}

const renderConfirm = (config: BookingConfig) =>
  render(
    <Providers locale="vi">
      <BookingConfigProvider config={config}>
        <ConfirmPage />
      </BookingConfigProvider>
    </Providers>,
  );

/** Ghi lại các lần POST promotion/check-promotions (query thô) và trả theo `reply`. */
function mockCheck(reply: (url: URL) => Response | Promise<Response>) {
  const calls: URL[] = [];
  server.use(
    http.post(`${BASE}/promotion/check-promotions`, ({ request }) => {
      const url = new URL(request.url);
      calls.push(url);
      return reply(url);
    }),
  );
  return calls;
}
const discountAll = (amount: number) => () => HttpResponse.json({ codes: picked.map((s) => ({ ticketCode: `V${s.id}`, priceDiscount: amount })) });

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T03:00:00Z")); // 10:00 giờ VN
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  push.mockClear();
  useBookingDraft.setState({ draft: null });
  sessionStorage.clear();
  warn = vi.spyOn(toast, "warning");
  server.use(
    http.get(`${BASE}/customer/customers`, () => HttpResponse.json({ data: { name: "Khach Test", phone: "0900000000", email: null, invoice_info: null, account: { balance: 0 } } })),
    http.get(`${BASE}/promotion/get-promotions`, () => HttpResponse.json({ data: [] })),
    http.get(`${BASE}/v4/get-bonus-service`, () => HttpResponse.json([])),
  );
});
afterEach(() => {
  cleanup();
  toast.dismiss();
  warn.mockRestore();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Tự áp mã chương trình ở bước xác nhận", () => {
  it("khứ hồi chặng về: gọi check-promotions với TOKEN ẩn (không phải mã thật) cho cả hai ghế, hiện 'Đã áp …' và giảm giá lấy từ server", async () => {
    const calls = mockCheck(discountAll(50000));
    await hydrate(makeDraft(own(RT)));
    renderConfirm(withPromos([ROUNDTRIP_PROMO]));

    expect(await screen.findByText(LABEL)).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    const q = decodeURIComponent(calls[0].search);
    expect(q).toContain("codes[0][promotion]=@auto:10:B02OUT");
    expect(q).toContain("codes[1][promotion]=@auto:10:B02OUT");
    expect(q).toContain(`bookingCode=${ORDER_CODE}`);
    expect(q).toContain("channel_code=WEBHAIVAN");
    const seats = useBookingDraft.getState().draft!.seats;
    expect(seats.map((s) => [s.promotion, s.discount])).toEqual([[TOKEN, 50000], [TOKEN, 50000]]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("server từ chối (400): không hiện nhãn, báo lý do bằng toast, ghế không mang mã", async () => {
    mockCheck(() => HttpResponse.json({ message: "Mã đã hết lượt sử dụng" }, { status: 400 }));
    await hydrate(makeDraft(own(RT)));
    renderConfirm(withPromos([ROUNDTRIP_PROMO]));

    await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining("Mã đã hết lượt sử dụng")));
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
    expect(useBookingDraft.getState().draft!.seats.every((s) => !s.promotion)).toBe(true);
  });

  it("server trả về nhưng không giảm đồng nào → coi là từ chối, không hiện nhãn", async () => {
    mockCheck(() => HttpResponse.json({ codes: [] }));
    await hydrate(makeDraft(own(RT)));
    renderConfirm(withPromos([ROUNDTRIP_PROMO]));
    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
    expect(useBookingDraft.getState().draft!.seats.every((s) => !s.promotion)).toBe(true);
  });

  describe("chạy đua với khách trong lúc đang kiểm mã", () => {
    const gated = () => {
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const calls = mockCheck(async () => {
        await gate;
        return discountAll(50000)();
      });
      return { calls, release };
    };
    const recordBookings = () => {
      const bodies: Record<string, unknown>[] = [];
      server.use(
        http.post(`${BASE}/bookings`, async ({ request }) => {
          bodies.push((await request.json()) as Record<string, unknown>);
          return HttpResponse.json({ data: { code: ORDER_CODE } });
        }),
        http.post(`${BASE}/v4/hold-transit`, () => HttpResponse.json({})),
      );
      return bodies;
    };

    it("bấm 'Tiếp tục' trước khi có phản hồi: nút và hộp khuyến mãi bị khoá, không đặt vé giá thường; có phản hồi thì mở lại và đơn mang mã", async () => {
      const { calls, release } = gated();
      const bookings = recordBookings();
      await hydrate(makeDraft(own(RT)));
      renderConfirm(withPromos([ROUNDTRIP_PROMO]));
      const next = await screen.findByRole("button", { name: /^Tiếp tục/ });
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(next).toBeDisabled();
      expect(screen.getByRole("button", { name: "Sử dụng điểm hoặc mã giảm giá" })).toBeDisabled();
      await userEvent.click(next);
      expect(bookings).toHaveLength(0);

      release();
      expect(await screen.findByText(LABEL)).toBeInTheDocument();
      await waitFor(() => expect(next).toBeEnabled());
      expect(screen.getByRole("button", { name: "Sử dụng điểm hoặc mã giảm giá" })).toBeEnabled();
      await userEvent.click(next);
      await waitFor(() => expect(bookings).toHaveLength(1));
      expect((bookings[0].seats as { code?: string }[]).map((x) => x.code)).toEqual([TOKEN, TOKEN]);
    });

    it("ghế đã đổi (mã khác) trước khi phản hồi tới: bỏ phản hồi, giữ mã của khách, không nhãn, không toast", async () => {
      const { calls, release } = gated();
      await hydrate(makeDraft(own(RT)));
      renderConfirm(withPromos([ROUNDTRIP_PROMO]));
      const next = await screen.findByRole("button", { name: /^Tiếp tục/ });
      await waitFor(() => expect(calls).toHaveLength(1));
      act(() => {
        const draft = useBookingDraft.getState().draft!;
        useBookingDraft.getState().updateSeats(draft.seats.map((x) => ({ ...x, promotion: "MANUAL", discount: 1000 })));
      });
      release();
      await waitFor(() => expect(next).toBeEnabled());
      expect(useBookingDraft.getState().draft!.seats.map((x) => [x.promotion, x.discount])).toEqual([["MANUAL", 1000], ["MANUAL", 1000]]);
      expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it("nhãn suy từ mã trên ghế: tải lại/quay lại vẫn có 'Đã áp' (không gọi lại); gỡ rồi tải lại thì không tự áp lại", async () => {
    const calls = mockCheck(discountAll(50000));
    const applied = makeDraft(own(RT));
    await hydrate({ ...applied, seats: applied.seats.map((x) => ({ ...x, promotion: TOKEN, discount: 50000 })) });
    const config = withPromos([ROUNDTRIP_PROMO]);
    const first = renderConfirm(config);
    expect(await screen.findByText(LABEL)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bỏ ưu đãi" }));
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
    first.unmount();

    // tải lại: ghế đã sạch mã nhưng khách đã gỡ → không tự áp lại
    renderConfirm(config);
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
  });

  it("gỡ ưu đãi: bỏ nhãn và mã khỏi ghế, không tự áp lại", async () => {
    const calls = mockCheck(discountAll(50000));
    await hydrate(makeDraft(own(RT)));
    renderConfirm(withPromos([ROUNDTRIP_PROMO]));
    await screen.findByText(LABEL);
    await userEvent.click(screen.getByRole("button", { name: "Bỏ ưu đãi" }));
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
    expect(useBookingDraft.getState().draft!.seats.every((s) => !s.promotion && !s.discount)).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it("khứ hồi chỉ áp ở chặng về (chang=ve kèm đơn chiều đi); chiều đi hoặc thiếu don_di không gọi gì", async () => {
    const calls = mockCheck(discountAll(20000));
    const config = withPromos([ROUNDTRIP_PROMO]);
    await hydrate(makeDraft(own({ tuyen: "hn-moc", chieu: "ba" })));
    const first = renderConfirm(config);
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
    first.unmount();

    await hydrate(makeDraft(own({ tuyen: "hn-moc", chieu: "ba", chang: "ve" }))); // thiếu don_di
    renderConfirm(config);
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
    cleanup();

    await hydrate(makeDraft(own(RT)));
    renderConfirm(config);
    expect(await screen.findByText(LABEL)).toBeInTheDocument();
    expect(calls).toHaveLength(1);
  });

  it("combo tạm tắt: dù cấu hình có combo khớp tuyến, không tự áp và không gọi gì", async () => {
    const calls = mockCheck(discountAll(50000));
    const combo = makePromo({ type: "combo", corridor: "hn-moc", direction: "both", id: 30 });
    await hydrate(makeDraft(own({ tuyen: "hn-moc", chieu: "ba" })));
    renderConfirm(withPromos([combo]));
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
    expect(screen.queryByText(/Đã áp/)).not.toBeInTheDocument();
  });

  it("chặng về nhưng sai chiều so với chương trình → không áp", async () => {
    const calls = mockCheck(discountAll(20000));
    await hydrate(makeDraft(own({ tuyen: "hn-moc", chieu: "ab", chang: "ve", donDi: "B02OUT" })));
    renderConfirm(withPromos([ROUNDTRIP_PROMO]));
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
  });

  it("số ghế ngoài khoảng của chương trình, hoặc không có chương trình → không gọi check-promotions", async () => {
    const calls = mockCheck(discountAll(50000));
    await hydrate(makeDraft(own(RT)));
    renderConfirm(withPromos([makePromo({ ...ROUNDTRIP_PROMO, seats: { min: 3, max: 4 } })]));
    await screen.findByDisplayValue("Khach Test");
    cleanup();
    renderConfirm(withPromos([]));
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
  });

  it("đơn đang ở giá combo của hệ thống (is_combo) → không tự áp (gắn mã sẽ làm mất giá combo đó)", async () => {
    const calls = mockCheck(discountAll(50000));
    await hydrate(makeDraft(own(RT), { is_combo: 1 }));
    renderConfirm(withPromos([ROUNDTRIP_PROMO]));
    await screen.findByDisplayValue("Khach Test");
    expect(calls).toHaveLength(0);
  });

  it("tìm chuyến theo tuyến chính: ghi chú điền sẵn 'Đón: …; Trả: …', khách sửa được", async () => {
    await hydrate(makeDraft(own({ tuyen: "hn-moc", diemDi: "nguyen-tuan", diemDen: "ben-xe-mc" })));
    renderConfirm(withPromos([]));
    const note = await screen.findByDisplayValue("Đón: 35 Nguyễn Tuân; Trả: Bến xe Mộc Châu");
    await userEvent.type(note, " - cổng B");
    expect(note).toHaveValue("Đón: 35 Nguyễn Tuân; Trả: Bến xe Mộc Châu - cổng B");
  });

  it("v4/get-price-transit lỗi (500): toast như web cũ, trang xác nhận vẫn dùng được", async () => {
    server.use(
      http.get(`${BASE}/v4/get-bonus-service`, () => HttpResponse.json([{ dvbs_id: 1, dvbs_code: "TCDON", dvbs_name: "Trung chuyển đón" }])),
      http.post(`${BASE}/v4/get-price-transit`, () => HttpResponse.json({ message: "Dịch vụ trung chuyển tạm ngưng" }, { status: 500 })),
    );
    await hydrate(makeDraft(undefined));
    renderConfirm(withPromos([]));
    await screen.findByDisplayValue("Khach Test");
    await waitFor(() => expect(warn).toHaveBeenCalledWith("Dịch vụ trung chuyển tạm ngưng"));
    expect(screen.getByRole("button", { name: /^Tiếp tục/ })).toBeEnabled();
  });

  it("áp mã tay trên trang xác nhận với phản hồi thật (ticketPrice chuỗi, không status/data): giá giảm theo server, báo thành công, hộp đóng", async () => {
    const success = vi.spyOn(toast, "success");
    server.use(
      http.get(`${BASE}/promotion/get-promotions`, () =>
        HttpResponse.json({ data: [{ code: "MADEMO01", name: "Mã thử nghiệm", available_quantity: "không giới hạn", mkp_total_one_user: "không giới hạn", min_price: "Không giới hạn", discount_route: 50000, route: ["X"], mkp_time_end_travel: "2026-12-31 23:59:59", mkp_unlimited: 1 }] }),
      ),
      http.post(`${BASE}/promotion/check-promotions`, () =>
        HttpResponse.json({ message: "Mã khuyến mại khả dụng", codes: picked.map((s) => ({ code: "MADEMO01", ticketCode: `V${s.id}`, ticketPrice: "200000", priceDiscount: 50000 })) }),
      ),
    );
    await hydrate(makeDraft(undefined));
    renderConfirm(withPromos([]));
    await screen.findByDisplayValue("Khach Test");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Sử dụng điểm hoặc mã giảm giá" }));
    await user.click(await screen.findByRole("button", { name: "Dùng mã" }));
    for (const seat of picked) await user.click(screen.getByRole("button", { name: new RegExp(`Ghế ${seat.name}$`) }));
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));
    await waitFor(() => expect(useBookingDraft.getState().draft!.seats.map((x) => [x.promotion, x.discount])).toEqual([["MADEMO01", 50000], ["MADEMO01", 50000]]));
    expect(success).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("tìm tự do (không tuyến chính) → ghi chú trống", async () => {
    await hydrate(makeDraft(undefined));
    renderConfirm(withPromos([]));
    await screen.findByDisplayValue("Khach Test");
    expect(document.querySelector("textarea")).toHaveValue("");
  });
});
