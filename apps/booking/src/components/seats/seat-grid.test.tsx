import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Providers } from "@/components/providers";
import type { Seat } from "@/schemas/trip";
import { SeatFloor } from "./seat-grid";

const seat = (over: Partial<Seat>): Seat => ({ id: 1, name: "A01", price: 190000, is_empty: true, ...over }) as Seat;

afterEach(cleanup);

const renderFloor = (seats: Seat[], showPrice = true, label?: string) =>
  render(
    <Providers locale="vi">
      <SeatFloor grid={[seats]} selected={[]} showPrice={showPrice} onToggle={() => undefined} label={label} />
    </Providers>,
  );

describe("SeatFloor", () => {
  it("giá ghế kèm đơn vị VNĐ; tên truy cập gồm số ghế và đúng giá đang thấy", () => {
    renderFloor([seat({})]);
    const button = screen.getByRole("button", { name: "Ghế A01, 190.000 VNĐ" });
    expect(button).toHaveTextContent("190.000");
    expect(button).toHaveTextContent("VNĐ");
  });

  it("ghế đã đặt: 'đã đặt', không lộ giá; ẩn giá thì tên chỉ còn số ghế", () => {
    renderFloor([seat({ id: 2, name: "A02", is_empty: false })]);
    expect(screen.getByRole("button", { name: "Ghế A02, đã đặt" })).toBeDisabled();
    cleanup();
    renderFloor([seat({})], false);
    expect(screen.getByRole("button", { name: "Ghế A01" })).toBeInTheDocument();
  });

  it("tiêu đề tầng nối bằng dấu phẩy, không dùng dấu chấm giữa", () => {
    renderFloor([seat({})], true, "Tầng 1");
    expect(screen.getByText("Tầng 1, Đầu xe")).toBeInTheDocument();
  });
});
