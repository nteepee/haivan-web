import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/components/providers";
import { Rail } from "./rail";

/** jsdom không có layout: giả lập bề rộng khung và nội dung để kiểm đầu/cuối cuộn. */
function stubMetrics(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => scrollWidth });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => clientWidth });
}

const scrollBy = vi.fn();
beforeEach(() => {
  scrollBy.mockReset();
  HTMLElement.prototype.scrollBy = scrollBy as unknown as typeof HTMLElement.prototype.scrollBy;
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  // @ts-expect-error gỡ giả lập
  delete HTMLElement.prototype.scrollWidth;
  // @ts-expect-error gỡ giả lập
  delete HTMLElement.prototype.clientWidth;
});

const renderRail = (props: { grid?: boolean } = {}) =>
  render(
    <Providers locale="vi">
      <Rail label="Tuyến" head={<h2>Các tuyến</h2>} {...props}>
        <li>A</li>
        <li>B</li>
      </Rail>
    </Providers>,
  );

describe("Rail", () => {
  it("danh sách focus được, có nhãn; mũi tên hiện sau khi chạy JS, đầu cuộn thì 'Mục trước' bị vô hiệu", () => {
    stubMetrics(1000, 400);
    renderRail();
    expect(screen.getByRole("list", { name: "Tuyến" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Mục trước" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mục sau" })).toBeEnabled();
  });

  it("'Mục sau' cuộn 80% bề rộng khung (mượt khi không giảm chuyển động); cuối cuộn thì gỡ mép mờ và vô hiệu nút sau", () => {
    stubMetrics(1000, 400);
    const { container } = renderRail();
    fireEvent.click(screen.getByRole("button", { name: "Mục sau" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 320, behavior: "smooth" });
    const list = screen.getByRole("list");
    expect(container.querySelector(".hv-rail-wrap")).toHaveAttribute("data-end", "false");
    list.scrollLeft = 600;
    act(() => {
      fireEvent.scroll(list);
    });
    expect(screen.getByRole("button", { name: "Mục sau" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mục trước" })).toBeEnabled();
    expect(container.querySelector(".hv-rail-wrap")).toHaveAttribute("data-end", "true");
  });

  it("giảm chuyển động: cuộn tức thì", () => {
    stubMetrics(1000, 400);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    renderRail();
    fireEvent.click(screen.getByRole("button", { name: "Mục sau" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 320, behavior: "auto" });
  });

  it("mọi mục vừa khung: không cần cuộn nên cả hai nút bị vô hiệu; chế độ lưới không có nút", () => {
    stubMetrics(300, 400);
    renderRail();
    expect(screen.getByRole("button", { name: "Mục sau" })).toBeDisabled();
    cleanup();
    renderRail({ grid: true });
    expect(screen.queryByRole("button", { name: "Mục sau" })).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveClass("hv-rail-3");
  });
});
