import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { AccountSidebar } from "./account-sidebar";

const ORIGIN = "http://localhost:3000";
let pathname = "/tai-khoan/khach-hang-than-thiet";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  server.use(http.get(`${ORIGIN}/api/hv/gw/customer/customers`, () => HttpResponse.json({ data: { name: "Khach Test", phone: "0900000000", subscribe_loyalty: 0 } })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const show = () =>
  render(
    <Providers locale="vi">
      <AccountSidebar />
    </Providers>,
  );

describe("AccountSidebar", () => {
  it("luôn có mục Khách hàng thân thiết (kể cả chưa tham gia) và chỉ một mục aria-current", async () => {
    show();
    await screen.findByText("Khach Test");
    const loyalty = screen.getByRole("link", { name: "Khách hàng thân thiết" });
    expect(loyalty).toHaveAttribute("href", "/tai-khoan/khach-hang-than-thiet");
    expect(loyalty).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("mục tiêu đề Chuyến đi của tôi không mang aria-current, mục con Xe liên tỉnh thì có", async () => {
    pathname = "/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh";
    show();
    await screen.findByText("Khach Test");
    expect(screen.getByRole("link", { name: "Chuyến đi của tôi" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Xe liên tỉnh" })).toHaveAttribute("aria-current", "page");
  });

  it("dải cuộn ngang được: đưa mục hiện tại vào giữa (inline center, block nearest)", async () => {
    pathname = "/tai-khoan/dang-xuat";
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    // jsdom không có layout: giả lập dải rộng hơn khung nhìn.
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(360);
    show();
    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ inline: "center", block: "nearest" }));
    vi.restoreAllMocks();
  });
});
