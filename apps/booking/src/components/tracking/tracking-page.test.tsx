import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/components/providers";
import { PartnerRedirect } from "@/components/search/partner-redirect";
import { TrackingPage } from "./tracking-page";

const search = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }));

afterEach(() => {
  cleanup();
  search.value = "";
});

describe("trang trạng thái không tham số", () => {
  it("/tracking thiếu tham số: thẻ có h1, một câu giải thích và nút chính về /xe-khach (không phủ toàn màn hình)", () => {
    render(
      <Providers locale="vi">
        <TrackingPage />
      </Providers>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Theo dõi xe" })).toBeInTheDocument();
    expect(screen.getByText(/Thiếu thông tin chuyến cần theo dõi/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt vé xe khách" })).toHaveAttribute("href", "/xe-khach");
  });

  it("/partner/booking: h1 'Đang chuyển trang…' và liên kết dự phòng về /xe-khach", () => {
    render(
      <Providers locale="vi">
        <PartnerRedirect />
      </Providers>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Đang chuyển trang…" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt vé xe khách" })).toHaveAttribute("href", "/xe-khach");
  });
});
