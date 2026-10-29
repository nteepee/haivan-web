import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import seatsFixture from "../../../test/fixtures/seats.json";
import tripsFixture from "../../../test/fixtures/trips.json";
import { server } from "../../../test/msw-server";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Providers } from "@/components/providers";
import { parseVnDateTime } from "@/lib/format";
import { buildHoldBody } from "@/lib/seats";
import type { SearchParamsData } from "@/lib/search-url";
import { seatMapResponseSchema, tripSchema, type Seat } from "@/schemas/trip";
import { useBookingDraft } from "@/stores/booking-draft";
import { SeatPanel } from "./seat-panel";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));
// LoginDialog thật cần reCAPTCHA + OTP qua apigw; ở đây chỉ kiểm hợp đồng của SeatPanel (open, onLoggedIn).
vi.mock("@/components/auth/login-dialog", () => ({ LoginDialog: vi.fn(() => null) }));

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;
const MERCHANT = "02";
const ORDER_CODE = "B02TESTSEAT1";

const trip = tripSchema.parse(tripsFixture.data[0]);
const seatMap = seatMapResponseSchema.parse(seatsFixture);
const SEATS: Seat[] = seatMap.data[0].flat().filter((s): s is Seat => s !== null);
const seat = (name: string): Seat => {
  const found = SEATS.find((s) => s.name === name && s.is_empty);
  if (!found) throw new Error(`Không có ghế trống ${name} trong fixture`);
  return found;
};
const SEARCH: SearchParamsData = {
  from: { name: "159 Điện Biên Phủ", lat: 10.7879376, lng: 106.6952939 },
  to: { name: "TP Vũng Tàu (Gành Hào)", lat: 10.3391989, lng: 107.0710401 },
  date: "2026-10-29",
  numberGuest: 1,
  type: 2,
};

/** "DD-MM-YYYY HH:mm:ss" theo giờ Việt Nam, như expire_time của hold. */
function expireIn(minutes: number): string {
  const s = new Date(Date.now() + minutes * 60_000 + 7 * 3600_000).toISOString();
  return `${s.slice(8, 10)}-${s.slice(5, 7)}-${s.slice(0, 4)} ${s.slice(11, 19)}`;
}

const lastLoginProps = () => vi.mocked(LoginDialog).mock.lastCall?.[0];

/** Lấy QueryClient của Providers để mô phỏng LoginDialog.done (làm mới session trước onLoggedIn). */
let queryClient: QueryClient | undefined;
function CaptureClient() {
  const client = useQueryClient();
  useEffect(() => {
    queryClient = client;
  }, [client]);
  return null;
}

let sessionCalls = 0;
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
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  push.mockClear();
  vi.mocked(LoginDialog).mockClear();
  sessionCalls = 0;
  useBookingDraft.setState({ draft: null });
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  toast.dismiss();
  vi.unstubAllGlobals();
  expect(transportFailures.splice(0), "request không có handler (lỗi transport)").toEqual([]);
});

function mockSession(loggedIn: boolean) {
  return http.get(`${ORIGIN}/api/hv/auth/session`, () => {
    sessionCalls++;
    return HttpResponse.json({ loggedIn, user: loggedIn ? { name: "Khach Test", phone: "0900000000" } : null });
  });
}

/** Hold thành công: tickets theo đúng ghế gửi lên, như backend. */
function holdOk(body: { seats: { id: number }[] }) {
  return { message: "Giữ chỗ thành công!", expire_time: expireIn(10), order_code: ORDER_CODE, tickets: body.seats.map((s) => ({ id: s.id, code: `V${s.id}` })) };
}

function renderPanel() {
  return render(
    <Providers locale="vi">
      <CaptureClient />
      <SeatPanel trip={trip} search={SEARCH} seatMap={seatMap} numberGuest={1} onGuestsChange={vi.fn()} />
    </Providers>,
  );
}

/** Nút "Tiếp tục" bị khoá cho tới khi session tải xong; trả về nút sau khi sẵn sàng. */
async function readyButton() {
  const button = await screen.findByRole("button", { name: "Tiếp tục" });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

describe("SeatPanel: chưa đăng nhập", () => {
  it("bấm Tiếp tục mở LoginDialog và không giữ chỗ; sau onLoggedIn POST hold đúng một lần với body của buildHoldBody", async () => {
    const holdBodies: Record<string, unknown>[] = [];
    server.use(
      mockSession(false),
      http.post(`${BASE}/hold-booking`, async ({ request }) => {
        const body = (await request.json()) as { seats: { id: number }[] };
        holdBodies.push(body as Record<string, unknown>);
        return HttpResponse.json(holdOk(body));
      }),
    );
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();

    // Chọn ghế 2 trước ghế 1: body phải được sắp theo id tăng dần.
    await user.click(screen.getByRole("button", { name: /^Ghế 2(,|$)/ }));
    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    await user.click(cta);

    await waitFor(() => expect(lastLoginProps()?.open).toBe(true));
    expect(holdBodies).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();

    act(() => lastLoginProps()?.onLoggedIn?.());

    await waitFor(() => expect(holdBodies).toHaveLength(1));
    expect(holdBodies[0]).toEqual(buildHoldBody(trip, [seat("2"), seat("1")], false, {}));
    expect(holdBodies[0]).toMatchObject({ trip_id: trip.id, merchant_code: MERCHANT, channel: 1 });
    const sent = holdBodies[0].seats as { id: number; is_select?: boolean }[];
    expect(sent.map((s) => s.id)).toEqual([seat("1").id, seat("2").id]);
    expect(sent.every((s) => s.is_select === true)).toBe(true);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/xe-khach/xac-nhan"));
  });

  it("đăng nhập xong: nháp trung chuyển mang tên và SĐT của tài khoản vừa đăng nhập", async () => {
    let loggedIn = false;
    server.use(
      http.get(`${ORIGIN}/api/hv/auth/session`, () => {
        sessionCalls++;
        return HttpResponse.json(loggedIn ? { loggedIn: true, user: { name: "Khach Test", phone: "0900000000" } } : { loggedIn: false, user: null });
      }),
      http.post(`${BASE}/hold-booking`, async ({ request }) => HttpResponse.json(holdOk((await request.json()) as { seats: { id: number }[] }))),
    );
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();
    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    await user.click(cta);
    await waitFor(() => expect(lastLoginProps()?.open).toBe(true));

    // Đăng nhập thành công: LoginDialog làm mới session rồi mới gọi onLoggedIn.
    loggedIn = true;
    await act(async () => {
      await queryClient!.invalidateQueries({ queryKey: ["session"] });
    });
    act(() => lastLoginProps()?.onLoggedIn?.());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/xe-khach/xac-nhan"));
    expect(useBookingDraft.getState().draft?.newParams?.seats[0]).toMatchObject({ name: "Khach Test", phone: "0900000000", ticket_code: `V${seat("1").id}` });
  });

  it("chưa chọn ghế thì bấm Tiếp tục không mở đăng nhập và không POST", async () => {
    const holdBodies: unknown[] = [];
    server.use(
      mockSession(false),
      http.post(`${BASE}/hold-booking`, async ({ request }) => {
        holdBodies.push(await request.json());
        return HttpResponse.json(holdOk({ seats: [] }));
      }),
    );
    const user = userEvent.setup();
    renderPanel();
    await user.click(await readyButton());
    expect(lastLoginProps()?.open).toBeFalsy();
    expect(holdBodies).toHaveLength(0);
  });
});

describe("SeatPanel: gợi ý chọn ghế và aria-disabled", () => {
  const HINT = "Chọn ít nhất 1 ghế để tiếp tục";

  it("chưa chọn ghế: dòng gợi ý luôn có (vùng aria-live), nút Tiếp tục aria-disabled; chọn ghế thì thay bằng ghế đã chọn và bỏ aria-disabled", async () => {
    server.use(mockSession(false));
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();

    const hint = screen.getByText(HINT);
    expect(hint).toHaveAttribute("aria-live", "polite");
    expect(hint).not.toHaveClass("hv-err");
    expect(cta).toHaveAttribute("aria-disabled", "true");
    expect(cta).toBeEnabled(); // aria-disabled chứ không disabled: vẫn nhận được click để nhấn mạnh gợi ý

    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    expect(cta).not.toHaveAttribute("aria-disabled");
    // Cùng một vùng live (không bị gỡ khỏi cây rồi dựng lại) nên trình đọc màn hình đọc được thay đổi.
    expect(document.querySelectorAll("p[aria-live='polite']")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(cta).toHaveAttribute("aria-disabled", "true");
  });

  it("bấm Tiếp tục khi chưa chọn ghế: gợi ý chuyển sang kiểu lỗi (icon + chữ), không toast, không POST", async () => {
    const holds: unknown[] = [];
    server.use(mockSession(false), http.post(`${BASE}/hold-booking`, async ({ request }) => (holds.push(await request.json()), HttpResponse.json({}))));
    const user = userEvent.setup();
    renderPanel();
    await user.click(await readyButton());
    const hint = screen.getByText(HINT);
    expect(hint).toHaveClass("hv-err");
    expect(hint.querySelector("svg")).not.toBeNull();
    expect(holds).toHaveLength(0);
    expect(document.querySelector("[data-sonner-toast]")).toBeNull();
  });
});

describe("SeatPanel: đã đăng nhập", () => {
  it("giữ chỗ xong lưu nháp đúng (hạn từ expire_time, ghế có mã vé) rồi sang xác nhận", async () => {
    server.use(
      mockSession(true),
      http.post(`${BASE}/hold-booking`, async ({ request }) => HttpResponse.json(holdOk((await request.json()) as { seats: { id: number }[] }))),
    );
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();
    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    await user.click(cta);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/xe-khach/xac-nhan"));
    expect(lastLoginProps()?.open).toBeFalsy();
    const draft = useBookingDraft.getState().draft;
    expect(draft).not.toBeNull();
    expect(draft).toMatchObject({ order_code: ORDER_CODE, expire_time: expect.any(String), is_combo: 0, show_price: 1 });
    expect(draft?.expiresAt).toBe(parseVnDateTime(draft!.expire_time));
    expect(draft?.seats.map((s) => [s.id, s.code])).toEqual([[seat("1").id, `V${seat("1").id}`]]);
    // Chuyến có trung chuyển: nháp phải có newParams cho bước xác nhận.
    expect(draft?.newParams).toMatchObject({ order_code: ORDER_CODE, merchant_code: MERCHANT, seats: [{ id: seat("1").id, ticket_code: `V${seat("1").id}`, quantity: 1 }] });
  });

  it("nhấn đúp Tiếp tục chỉ gửi một POST hold (nút khoá trong lúc đang giữ chỗ)", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const holdBodies: unknown[] = [];
    server.use(
      mockSession(true),
      http.post(`${BASE}/hold-booking`, async ({ request }) => {
        const body = (await request.json()) as { seats: { id: number }[] };
        holdBodies.push(body);
        await gate;
        return HttpResponse.json(holdOk(body));
      }),
    );
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();
    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));

    try {
      await user.dblClick(cta);
      await waitFor(() => expect(holdBodies).toHaveLength(1));
      await new Promise((r) => setTimeout(r, 100));
      expect(holdBodies).toHaveLength(1);
      expect(cta).toBeDisabled();
      expect(cta).toHaveTextContent("Đang xử lý ...");
    } finally {
      release();
    }
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(holdBodies).toHaveLength(1);
  });

  it("hold trả 401: làm mới session, mở đăng nhập (không sang xác nhận); sau đăng nhập tự giữ chỗ lại đúng 1 lần", async () => {
    let holds = 0;
    server.use(
      mockSession(true),
      http.post(`${BASE}/hold-booking`, async ({ request }) => {
        holds++;
        const body = (await request.json()) as { seats: { id: number }[] };
        if (holds === 1) return HttpResponse.json({ message: "Unauthenticated." }, { status: 401 });
        return HttpResponse.json(holdOk(body));
      }),
    );
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();
    const sessionBefore = sessionCalls;
    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    await user.click(cta);

    await waitFor(() => expect(lastLoginProps()?.open).toBe(true));
    await waitFor(() => expect(sessionCalls).toBeGreaterThan(sessionBefore));
    expect(holds).toBe(1);
    expect(push).not.toHaveBeenCalled();

    act(() => lastLoginProps()?.onLoggedIn?.());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/xe-khach/xac-nhan"));
    expect(holds).toBe(2);
  });

  it("hold lỗi khác 401 (409): hiện message của backend, không mở đăng nhập, không chuyển trang", async () => {
    server.use(
      mockSession(true),
      http.post(`${BASE}/hold-booking`, () => HttpResponse.json({ message: "Ghế đã có người giữ" }, { status: 409 })),
    );
    const user = userEvent.setup();
    renderPanel();
    const cta = await readyButton();
    await user.click(screen.getByRole("button", { name: /^Ghế 1(,|$)/ }));
    await user.click(cta);

    expect(await screen.findByText("Ghế đã có người giữ")).toBeInTheDocument();
    expect(lastLoginProps()?.open).toBeFalsy();
    expect(push).not.toHaveBeenCalled();
    expect(useBookingDraft.getState().draft).toBeNull();
  });
});
