import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { LoyaltyPage } from "./loyalty-page";

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;

const customer = (over: Record<string, unknown> = {}) => ({
  data: {
    id: 7,
    name: "Khach Test",
    phone: "0900000000",
    subscribe_loyalty: 1,
    data_source: 0,
    account: { balance: 12345, transactions: [] },
    rank: { rank: 1, rank_code: "Bạc", period_transaction: 12 },
    ...over,
  },
});
const definition = {
  titles: [],
  jobs: [],
  travel_purposes: [],
  provinces: [],
  districts: [],
  rank_evaluators: [{ description: ["Tích điểm mọi chuyến"] }, { description: ["Ưu tiên giữ chỗ", "Giảm giá sinh nhật"] }, { description: ["Phòng chờ miễn phí"] }, { description: [] }],
};

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const show = () =>
  render(
    <Providers locale="vi">
      <LoyaltyPage />
    </Providers>,
  );

/** Đếm số lần gọi hai API của trang. */
function mock(body: ReturnType<typeof customer>, def: Record<string, unknown> = definition) {
  const calls = { customers: 0, definition: 0 };
  server.use(
    http.get(`${BASE}/customer/customers`, () => (calls.customers++, HttpResponse.json(body))),
    http.get(`${BASE}/customer/definition`, () => (calls.definition++, HttpResponse.json(def))),
  );
  return calls;
}

describe("LoyaltyPage", () => {
  it("thành viên: đúng 2 call, hạng + điểm + còn bao nhiêu để lên hạng, hạng chưa đạt bị khoá", async () => {
    const calls = mock(customer());
    const user = userEvent.setup();
    show();
    expect(await screen.findByRole("heading", { name: "Khách hàng thân thiết" })).toBeInTheDocument();
    expect(await screen.findByText("Ưu tiên giữ chỗ")).toBeInTheDocument();
    expect(calls).toEqual({ customers: 1, definition: 1 });
    expect(screen.getByText("12.345")).toBeInTheDocument();
    expect(screen.getByText("Tính trong 12 tháng gần nhất")).toBeInTheDocument();
    // Ngưỡng tĩnh: Vàng 30 vé hoặc 150.000 điểm; đã có 12 vé → còn 18.
    expect(screen.getByText(/Để lên hạng Vàng: còn 18 vé nữa hoặc đạt 150\.000 điểm/)).toBeInTheDocument();
    const ladder = screen.getByRole("list", { name: "Các hạng thành viên" });
    const items = within(ladder).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items.map((li) => li.getAttribute("aria-current"))).toEqual([null, "step", null, null]);
    expect(within(ladder).getByAltText("Kim cương")).toHaveAttribute("src", "/assets/icons/icon_diamond_.png");

    await user.click(screen.getByRole("tab", { name: "Kim cương" }));
    expect(screen.getByText("Cần đạt hạng Kim cương")).toBeInTheDocument();
    expect(screen.getByText("Chưa có thông tin quyền lợi cho hạng này.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Vàng" }));
    expect(screen.getByText("Cần đạt hạng Vàng")).toBeInTheDocument();
    expect(screen.getByText("Phòng chờ miễn phí").closest("li")).toHaveTextContent("Chưa đạt hạng này");
  });

  it("customer/customers lỗi → thông báo + Thử lại, bấm lại thì tải được", async () => {
    let fail = true;
    server.use(
      http.get(`${BASE}/customer/customers`, () => (fail ? HttpResponse.json({ message: "boom" }, { status: 500 }) : HttpResponse.json(customer()))),
      http.get(`${BASE}/customer/definition`, () => HttpResponse.json(definition)),
    );
    const user = userEvent.setup();
    show();
    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("12.345")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  }, 20_000);

  it("customer/definition lỗi → hạng và điểm vẫn hiện, quyền lợi có lỗi + Thử lại riêng", async () => {
    let fail = true;
    server.use(
      http.get(`${BASE}/customer/customers`, () => HttpResponse.json(customer())),
      http.get(`${BASE}/customer/definition`, () => (fail ? HttpResponse.json({ message: "boom" }, { status: 500 }) : HttpResponse.json(definition))),
    );
    const user = userEvent.setup();
    show();
    expect(await screen.findByText("12.345")).toBeInTheDocument();
    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Ưu tiên giữ chỗ")).toBeInTheDocument();
  }, 20_000);

  it("chưa tham gia → thẻ mời, không gọi definition khi vào trang, nút Đăng ký mở form đăng ký", async () => {
    const calls = mock(customer({ subscribe_loyalty: 0, rank: { rank: 0, period_transaction: 0 } }));
    const user = userEvent.setup();
    show();
    expect(await screen.findByText("Bạn chưa tham gia chương trình Khách hàng thân thiết")).toBeInTheDocument();
    expect(screen.queryByText("Điểm hiện có")).not.toBeInTheDocument();
    expect(calls.definition).toBe(0);
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Đăng ký khách hàng thân thiết" })).toBeInTheDocument();
    // Cùng ProfileDialog với trang Thông tin cá nhân: chưa là thành viên nên tên sửa được; POST đã có test ở profile-dialog.test.
    expect(await within(dialog).findByDisplayValue("Khach Test")).toBeEnabled();
    expect(calls.definition).toBe(1); // ProfileDialog tự tải danh mục khi mở
  });

  it("hạng cao nhất → lời chúc, không còn câu lên hạng", async () => {
    mock(customer({ rank: { rank: 3, period_transaction: 80 } }));
    show();
    expect(await screen.findByText(/hạng cao nhất/)).toBeInTheDocument();
    expect(screen.queryByText(/Để lên hạng/)).not.toBeInTheDocument();
  });

  it("lịch sử: luôn có nút, trạng thái rỗng, chuỗi mô tả được escape, đơn vị điểm, hai dạng ngày", async () => {
    const transactions = [
      { description: '<img src=x onerror="alert(1)">Tích điểm', updated_at: "2026-10-28 14:30:00", type: "give", amount: 500 },
      { description: "Đổi vé", updated_at: "2026-10-28T07:30:00.000000Z", type: "use", amount: 300 },
    ];
    mock(customer({ account: { balance: 200, transactions } }));
    const user = userEvent.setup();
    show();
    await user.click(await screen.findByRole("button", { name: "Lịch sử tích điểm" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("img[src='x']")).toBeNull();
    expect(within(dialog).getByText('<img src=x onerror="alert(1)">Tích điểm')).toBeInTheDocument();
    expect(within(dialog).getAllByText("14:30 28/10/2026")).toHaveLength(2); // plain = giờ VN; Z đổi sang +7
    expect(within(dialog).getByText(/\+ 500/)).toHaveTextContent("điểm");
    expect(within(dialog).getByText(/- 300/)).toHaveTextContent("điểm");
  });

  it("lịch sử rỗng vẫn mở được và báo chưa có giao dịch", async () => {
    mock(customer());
    const user = userEvent.setup();
    show();
    await user.click(await screen.findByRole("button", { name: "Lịch sử tích điểm" }));
    expect(await screen.findByText("Chưa có giao dịch điểm nào.")).toBeInTheDocument();
  });
});
