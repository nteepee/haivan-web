import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Providers } from "@/components/providers";
import { Stepper } from "./stepper";

afterEach(cleanup);

describe("Stepper", () => {
  it("mỗi bước có nhãn đầy đủ (cho trình đọc màn hình) và nhãn ngắn ẩn khỏi cây truy cập (điện thoại)", () => {
    const { container } = render(
      <Providers locale="vi">
        <Stepper current={2} />
      </Providers>,
    );
    expect(screen.getByText("Thông tin của bạn")).toHaveClass("hv-step-full");
    const shorts = [...container.querySelectorAll(".hv-step-short")];
    expect(shorts.map((e) => e.textContent)).toEqual(["Chọn ghế", "Thông tin", "Thanh toán"]);
    for (const e of shorts) expect(e).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent("Thông tin");
  });
});
