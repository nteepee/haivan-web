import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bookingFixture from "../../../test/fixtures/booking.json";
import infoPaymentsFixture from "../../../test/fixtures/info_payments.json";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { PaymentPage } from "./payment-page";

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));
const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn() }),
  useSearchParams: () => nav.params,
}));

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;
const ORDER = bookingFixture.data.code;
const MERCHANT = "02";
const TRIP_ID = "41409366";
const CTX = { booking_code: ORDER, merchant_code: MERCHANT, trip_id: TRIP_ID };
const PAGE_HREF = `${ORIGIN}/xe-khach/thanh-toan?booking_code=${ORDER}&merchant_code=${MERCHANT}&trip_id=${TRIP_ID}`;
const SUCCESS_URL = `/xe-khach/thanh-toan/thanh-cong?booking_code=${ORDER}&merchant_code=${MERCHANT}`;
const VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=" + ORDER;
const PAYOS_URL = "https://pay.payos.vn/web/abc123";

/** "DD-MM-YYYY HH:mm" theo giờ Việt Nam. */
function vnDateTime(ms: number): string {
  const s = new Date(ms + 7 * 3600_000).toISOString();
  return `${s.slice(8, 10)}-${s.slice(5, 7)}-${s.slice(0, 4)} ${s.slice(11, 16)}`;
}

/** Đơn vừa tạo (đồng hồ 10 phút còn chạy) với payment.type theo tham số. */
function bookingBody(paymentType: number) {
  return {
    ...bookingFixture,
    data: {
      ...bookingFixture.data,
      created_at: vnDateTime(Date.now()),
      payment: { type: paymentType, type_name: paymentType ? "Đã thanh toán" : "Chưa thanh toán" },
    },
  };
}

/** Query thô sau dấu "?" đầu tiên (giữ nguyên byte, không parse). */
const rawQueryOf = (url: string) => url.slice(url.indexOf("?") + 1);

const infoPayments = infoPaymentsFixture;
/** Mở thêm chuyển khoản (type 2) để có radio 3. */
const withTransferOpen = infoPayments.map((m) => (m.type === 2 ? { ...m, is_locked: false } : m));

let stub: { href: string; search: string; origin: string };
const realLocation = window.location;
const transportFailures: string[] = [];

beforeEach(() => {
  // Chỉ thay window.location để kiểm đích chuyển hướng; jsdom không điều hướng thật.
  stub = { href: PAGE_HREF, search: "", origin: ORIGIN };
  Object.defineProperty(window, "location", { configurable: true, value: stub });
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
  vi.stubGlobal("scrollTo", vi.fn());
  push.mockClear();
  replace.mockClear();
  nav.params = new URLSearchParams(CTX);
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  toast.dismiss();
  Object.defineProperty(window, "location", { configurable: true, value: realLocation });
  vi.unstubAllGlobals();
  expect(transportFailures.splice(0), "request không có handler (lỗi transport)").toEqual([]);
});

const renderPage = () =>
  render(
    <Providers locale="vi">
      <PaymentPage />
    </Providers>,
  );

/** Handler mặc định: info-payments (fixture), block không bật, booking theo `booking(call)`. */
function mockPaymentApi(opts: { methods?: unknown[]; booking?: (call: number) => Response } = {}) {
  const state = { bookingCalls: 0 };
  server.use(
    http.get(`${BASE}/info-payments`, () => HttpResponse.json(opts.methods ?? infoPayments)),
    http.get(`${BASE}/info-payment-block`, () => HttpResponse.json({ status: false, data: null })),
    http.get(`${BASE}/bookings/${ORDER}`, () => {
      state.bookingCalls++;
      return opts.booking ? opts.booking(state.bookingCalls) : HttpResponse.json(bookingBody(0));
    }),
  );
  return state;
}

describe("PaymentPage: chuyển sang cổng VNPay và PayOS", () => {
  it("ATM: chọn ngân hàng rồi Thanh toán → query vnpay thô đúng byte, trình duyệt sang url của backend", async () => {
    mockPaymentApi();
    const vnpayCalls: string[] = [];
    server.use(
      http.get(`${BASE}/payment/vnpay`, ({ request }) => {
        vnpayCalls.push(request.url);
        return HttpResponse.json({ url: VNPAY_URL });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /thẻ ATM/ }));
    await user.click(screen.getByRole("button", { name: "VIETCOMBANK" }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    await waitFor(() => expect(stub.href).toBe(VNPAY_URL));
    expect(vnpayCalls).toHaveLength(1);
    expect(rawQueryOf(vnpayCalls[0])).toBe(
      `return_url=${ORIGIN}/xe-khach/thanh-toan?booking_code=${ORDER}&order_code=${ORDER}&bank_code=VIETCOMBANK&merchant_code=${MERCHANT}&trip_id=${TRIP_ID}`,
    );
  });

  it("QR VNPay (radio 5) gửi bank_code=VNPAYQR, không cần chọn ngân hàng", async () => {
    mockPaymentApi();
    const vnpayCalls: string[] = [];
    server.use(
      http.get(`${BASE}/payment/vnpay`, ({ request }) => {
        vnpayCalls.push(request.url);
        return HttpResponse.json({ url: VNPAY_URL });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /mã QR qua VNPAY-QR/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    await waitFor(() => expect(stub.href).toBe(VNPAY_URL));
    expect(rawQueryOf(vnpayCalls[0])).toContain("&bank_code=VNPAYQR&merchant_code=02&trip_id=41409366");
  });

  it("ATM chưa chọn ngân hàng → cảnh báo, không gọi vnpay", async () => {
    mockPaymentApi();
    const vnpayCalls: string[] = [];
    server.use(http.get(`${BASE}/payment/vnpay`, ({ request }) => (vnpayCalls.push(request.url), HttpResponse.json({ url: VNPAY_URL }))));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /thẻ ATM/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    expect(await screen.findByText("Bạn chưa chọn ngân hàng thanh toán!")).toBeInTheDocument();
    expect(vnpayCalls).toHaveLength(0);
    expect(stub.href).toBe(PAGE_HREF);
  });

  it("url cổng không phải https bị từ chối: không chuyển trang, báo lỗi", async () => {
    mockPaymentApi();
    server.use(http.get(`${BASE}/payment/vnpay`, () => HttpResponse.json({ url: "http://sandbox.vnpayment.vn/paymentv2/vpcpay.html" })));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /mã QR qua VNPAY-QR/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    expect(await screen.findByText("Có lỗi xảy ra!")).toBeInTheDocument();
    expect(stub.href).toBe(PAGE_HREF);
  });

  it("PayOS (radio 6): gọi payos theo mã đơn rồi sang checkoutUrl https", async () => {
    mockPaymentApi();
    const payosCalls: string[] = [];
    server.use(
      http.get(`${BASE}/payment/payos`, ({ request }) => {
        payosCalls.push(request.url);
        return HttpResponse.json({ data: { checkoutUrl: PAYOS_URL } });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /PayOS/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    await waitFor(() => expect(stub.href).toBe(PAYOS_URL));
    expect(rawQueryOf(payosCalls[0])).toBe(`merchant_code=${MERCHANT}&order_code=${ORDER}`);
  });

  it("PayOS: checkoutUrl không phải https bị từ chối: không chuyển trang, báo lỗi", async () => {
    mockPaymentApi();
    server.use(http.get(`${BASE}/payment/payos`, () => HttpResponse.json({ data: { checkoutUrl: "http://pay.payos.vn/web/abc123" } })));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /PayOS/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    expect(await screen.findByText("Có lỗi xảy ra!")).toBeInTheDocument();
    expect(stub.href).toBe(PAGE_HREF);
  });
});

describe("PaymentPage: gợi ý cạnh nút Thanh toán và chọn ngân hàng", () => {
  const NEED_METHOD = "Chưa chọn hình thức thanh toán. Hãy chọn một hình thức trong danh sách.";
  const NEED_BANK = "Chưa chọn ngân hàng. Hãy chạm vào logo một ngân hàng.";

  it("vùng gợi ý luôn có trong cây (rỗng khi chưa lỗi) và gắn vào nút bằng aria-describedby", async () => {
    mockPaymentApi();
    renderPage();
    const pay = await screen.findByRole("button", { name: /^Thanh toán/ });
    const hint = document.getElementById("pay-hint");
    expect(hint).not.toBeNull();
    expect(hint).toBeEmptyDOMElement();
    expect(pay).toHaveAttribute("aria-describedby", "pay-hint");
    expect(pay).toHaveAccessibleDescription("");
  });

  it("chưa chọn hình thức: hiện ux.need_method (kèm toast), chọn một hình thức thì gợi ý biến mất", async () => {
    mockPaymentApi();
    const user = userEvent.setup();
    renderPage();
    const pay = await screen.findByRole("button", { name: /^Thanh toán/ });
    await user.click(pay);
    expect(await screen.findByText(NEED_METHOD)).toBeInTheDocument();
    expect(pay).toHaveAccessibleDescription(NEED_METHOD);
    expect(await screen.findByText("Vui lòng chọn hình thức thanh toán!")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /thẻ ATM/ }));
    expect(screen.queryByText(NEED_METHOD)).not.toBeInTheDocument();
  });

  it("ATM chưa chọn ngân hàng: hiện ux.need_bank; chọn ngân hàng thì gợi ý biến mất", async () => {
    mockPaymentApi();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /thẻ ATM/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));
    expect(await screen.findByText(NEED_BANK)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "VIETCOMBANK" }));
    expect(screen.queryByText(NEED_BANK)).not.toBeInTheDocument();
  });

  it("một lần bấm logo ngân hàng chỉ chọn, không gọi vnpay và không chuyển trang; nhấp đúp mới thanh toán một lần", async () => {
    mockPaymentApi();
    const vnpayCalls: string[] = [];
    server.use(http.get(`${BASE}/payment/vnpay`, ({ request }) => (vnpayCalls.push(request.url), HttpResponse.json({ url: VNPAY_URL }))));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /thẻ ATM/ }));
    await user.click(screen.getByRole("button", { name: "VIETCOMBANK" }));

    expect(screen.getByRole("button", { name: "VIETCOMBANK" })).toHaveAttribute("aria-pressed", "true");
    await new Promise((resolve) => setTimeout(resolve, 150)); // chờ để một lời gọi nền (nếu có) kịp phát sinh
    expect(vnpayCalls).toHaveLength(0);
    expect(stub.href).toBe(PAGE_HREF);

    await user.dblClick(screen.getByRole("button", { name: "TECHCOMBANK" }));
    await waitFor(() => expect(stub.href).toBe(VNPAY_URL));
    expect(vnpayCalls).toHaveLength(1);
    expect(rawQueryOf(vnpayCalls[0])).toContain("bank_code=TECHCOMBANK");
  });
});

describe("PaymentPage: thanh toán tại nhà xe và chuyển khoản", () => {
  // update-booking: method_payment = type info-payments (chuyển khoản 2, tiền mặt 3), không phải số radio.
  function mockUpdate() {
    const updates: { url: string; body: unknown }[] = [];
    server.use(
      http.post(`${BASE}/update-booking/${ORDER}`, async ({ request }) => {
        updates.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({});
      }),
    );
    return updates;
  }

  it("chuyển khoản (radio 3) gửi method_payment=2 rồi sang trang thành công", async () => {
    mockPaymentApi({ methods: withTransferOpen });
    const updates = mockUpdate();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /chuyển khoản/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(SUCCESS_URL));
    expect(updates).toHaveLength(1);
    expect(updates[0].body).toEqual({ method_payment: 2 });
    expect(new URL(updates[0].url).search).toBe(`?merchant_code=${MERCHANT}`);
  });

  it("tiền mặt (radio 4) gửi method_payment=3 rồi sang trang thành công", async () => {
    mockPaymentApi();
    const updates = mockUpdate();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: /tại nhà xe/ }));
    await user.click(screen.getByRole("button", { name: /^Thanh toán/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(SUCCESS_URL));
    expect(updates[0].body).toEqual({ method_payment: 3 });
  });

  it("chưa chọn hình thức nào → cảnh báo, không gửi gì", async () => {
    mockPaymentApi();
    const updates = mockUpdate();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /^Thanh toán/ }));

    expect(await screen.findByText("Vui lòng chọn hình thức thanh toán!")).toBeInTheDocument();
    expect(updates).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("PaymentPage: trạng thái thanh toán từ backend", () => {
  it("backend đã ghi nhận payment.type khi mở trang → chuyển thẳng sang trang thành công", async () => {
    mockPaymentApi({ booking: () => HttpResponse.json(bookingBody(1)) });
    renderPage();
    await waitFor(() => expect(replace).toHaveBeenCalledWith(SUCCESS_URL));
  });

  it("vnp_ResponseCode=07 (verifying): chưa ghi nhận thì ở lại trang xác minh; khi có payment.type mới chuyển", async () => {
    const booking = mockPaymentApi({ booking: (call) => HttpResponse.json(bookingBody(call === 1 ? 0 : 1)) });
    nav.params = new URLSearchParams({ ...CTX, vnp_ResponseCode: "07" });
    renderPage();

    expect(await screen.findByRole("button", { name: "Làm mới" })).toBeInTheDocument();
    expect(screen.getByText("Đang xác minh thanh toán…")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();

    // Poll mỗi 2 s: lần 2 backend đã có payment.type.
    await waitFor(() => expect(replace).toHaveBeenCalledWith(SUCCESS_URL), { timeout: 6000 });
    expect(booking.bookingCalls).toBeGreaterThanOrEqual(2);
  });

  it("vnp_ResponseCode=00 → sang trang thành công ngay như web cũ, kèm cờ from=gateway (trang đó tự đọc payment.type)", async () => {
    mockPaymentApi({ booking: () => HttpResponse.json(bookingBody(0)) });
    nav.params = new URLSearchParams({ ...CTX, vnp_ResponseCode: "00" });
    renderPage();

    await waitFor(() => expect(replace).toHaveBeenCalledWith(`${SUCCESS_URL}&from=gateway`));
    expect(push).not.toHaveBeenCalled();
  });

  it("PayOS status=PAID cũng sang trang thành công kèm from=gateway", async () => {
    mockPaymentApi({ booking: () => HttpResponse.json(bookingBody(0)) });
    nav.params = new URLSearchParams({ ...CTX, status: "PAID" });
    renderPage();

    await waitFor(() => expect(replace).toHaveBeenCalledWith(`${SUCCESS_URL}&from=gateway`));
  });

  it("tải booking lỗi: hiện thông báo và nút Thử lại; bấm lại khi backend ổn thì hiện trang thanh toán", async () => {
    let failing = true;
    mockPaymentApi({ booking: () => (failing ? HttpResponse.json({ message: "Hệ thống đang bận" }, { status: 500 }) : HttpResponse.json(bookingBody(0))) });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Hệ thống đang bận", {}, { timeout: 4000 })).toBeInTheDocument();
    failing = false;
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("heading", { name: "Lựa chọn thanh toán" }, { timeout: 4000 })).toBeInTheDocument();
  });

  it("mã đơn có ký tự chèn tham số (không phải chữ-số) → không gọi API, báo không tìm thấy đơn", async () => {
    const booking = mockPaymentApi();
    nav.params = new URLSearchParams({ ...CTX, booking_code: "B1&return_url=https://evil.example" });
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Không tìm thấy đơn hàng" })).toBeInTheDocument();
    expect(booking.bookingCalls).toBe(0);
  });
});
