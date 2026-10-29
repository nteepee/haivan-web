import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeaderShell } from "./header-shell";

const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
};

afterEach(() => {
  cleanup();
  scrollTo(0);
  vi.restoreAllMocks();
});

describe("HeaderShell", () => {
  it("nghỉ = vàng đặc, cuộn quá 8px = kính vàng, về đầu trang = vàng đặc", () => {
    const { container } = render(<HeaderShell>nội dung</HeaderShell>);
    const header = container.querySelector("header")!;
    expect(header.className).toBe("hv-header");
    scrollTo(8);
    expect(header.className).toBe("hv-header");
    scrollTo(9);
    expect(header.className).toBe("hv-header glass-yellow");
    expect(header.dataset.scrolled).toBe("true");
    scrollTo(0);
    expect(header.className).toBe("hv-header");
  });

  it("đã cuộn sẵn khi mount (khôi phục vị trí) thì vào thẳng kính vàng", () => {
    Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
    const { container } = render(<HeaderShell>x</HeaderShell>);
    expect(container.querySelector("header")!.className).toContain("glass-yellow");
  });

  it("listener scroll là passive và được gỡ khi unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<HeaderShell>x</HeaderShell>);
    expect(add).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
