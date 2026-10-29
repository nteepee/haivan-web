import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/components/providers";
import { ErrorView, NotFoundView, UrlNotFoundView } from "./status-page";

afterEach(cleanup);

describe("NotFoundView", () => {
  it("tiếng Việt: dùng chữ của WP, có về trang chủ (liên kết thường) và hotline", () => {
    render(
      <Providers locale="vi">
        <NotFoundView />
      </Providers>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Không tìm thấy trang" })).toBeInTheDocument();
    expect(screen.getByText("Trang bạn tìm không tồn tại hoặc đã được chuyển.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Hotline 1900 6763/ })).toHaveAttribute("href", "tel:19006763");
  });

  it("tiếng Anh: chữ và đường dẫn trang chủ có tiền tố /en", () => {
    render(
      <Providers locale="en">
        <NotFoundView />
      </Providers>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
  });

  it("không có Providers (404 gốc): locale suy từ URL", () => {
    window.history.pushState({}, "", "/en/xe-khach/x/y/z");
    render(<UrlNotFoundView />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    window.history.pushState({}, "", "/");
  });
});

describe("ErrorView", () => {
  it("Thử lại gọi retry; có về trang chủ và hotline; vùng báo lỗi là alert", () => {
    const retry = vi.fn();
    render(<ErrorView locale="vi" onRetry={retry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Hotline/ })).toHaveAttribute("href", "tel:19006763");
  });
});
