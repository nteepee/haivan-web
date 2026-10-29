import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/components/providers";
import { HeaderNav } from "./header-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/xe-khach", useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const ITEMS = [
  { label: "Tuyến đường", href: "/xe-khach", children: [{ label: "Mỹ Đình - Mộc Châu", href: "/xe-khach/my-dinh/moc-chau" }] },
  { label: "Hỗ trợ", href: "/ho-tro" },
];

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const show = () =>
  render(
    <Providers locale="vi">
      <HeaderNav items={ITEMS} />
    </Providers>,
  );

describe("HeaderNav: tiêu đề nhóm là liên kết thật", () => {
  it("nhóm có con là <a href> (bot thấy được); bấm thường mở dropdown thay vì điều hướng", async () => {
    show();
    const trigger = screen.getByRole("link", { name: "Tuyến đường" });
    expect(trigger).toHaveAttribute("href", "/xe-khach");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(trigger);
    expect(await screen.findByRole("menuitem", { name: "Mỹ Đình - Mộc Châu" })).toHaveAttribute("href", "/xe-khach/my-dinh/moc-chau");
  });

  it("bàn phím mở được (Enter), mục không có con là liên kết thường", async () => {
    show();
    screen.getByRole("link", { name: "Tuyến đường" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Mỹ Đình - Mộc Châu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hỗ trợ" })).toHaveAttribute("href", "/ho-tro");
  });
});
