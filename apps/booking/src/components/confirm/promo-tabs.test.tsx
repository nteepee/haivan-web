import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/components/providers";
import { parsePromotions } from "@/schemas/promotion";
import { PromoCodeTab } from "./promo-tabs";

afterEach(cleanup);

/** Mẫu thật của `promotion/get-promotions` (cùng dạng với promotional_code_list_all). */
const RAW = {
  data: [
    { code: "UNLIM", name: "Không giới hạn lượt", available_quantity: "không giới hạn", mkp_time_end_travel: "2026-12-31 23:59:59", discount_route: 50000, route: ["X"], mkp_unlimited: 1 },
    { code: "THREE", name: "Còn 3 lượt", available_quantity: 3, date_end: "2026-11-30" },
    { code: "GONE", name: "Hết lượt", available_quantity: 0 },
    { code: "NOQTY", name: "Không có số lượng" },
    { code: "@auto:10", name: "Mã ẩn bị che" }, // mã khứ hồi ẩn bị BFF che thành token: không liệt kê để chọn tay
  ],
};

describe("PromoCodeTab: danh sách mã từ apigw", () => {
  it("giữ mã 'không giới hạn' và mã thiếu số lượng, chỉ ẩn mã đúng bằng 0; hạn lấy từ date_end hoặc mkp_time_end_travel", () => {
    render(
      <Providers locale="vi">
        <PromoCodeTab seats={[]} promotions={parsePromotions(RAW)} busy={false} onApply={vi.fn()} />
      </Providers>,
    );
    expect(screen.getByText("Không giới hạn lượt")).toBeInTheDocument();
    expect(screen.getByText("Còn 3 lượt")).toBeInTheDocument();
    expect(screen.getByText("Không có số lượng")).toBeInTheDocument();
    expect(screen.queryByText("Hết lượt")).not.toBeInTheDocument();
    // Mỗi mã một thẻ rộng hết hàng: dòng 1 tên, dòng 2 "HSD … · số lượt"; nút gọn "Dùng mã" (không còn "không giới hạn Sử dụng")
    expect(screen.getAllByRole("button", { name: "Dùng mã" })).toHaveLength(3);
    expect(screen.getByText("HSD 31/12/2026 · Không giới hạn lượt")).toBeInTheDocument();
    expect(screen.getByText("HSD 30/11/2026 · Còn 3 lượt")).toBeInTheDocument();
  });
});

describe("PromoCodeTab: chọn mã và áp dụng", () => {
  const seats = [{ id: 1, name: "5", code: "V1", price: 200000 }, { id: 2, name: "6", code: "V2", price: 200000 }] as never;

  it("chọn mã → nút 'Đã chọn' (tick); chưa chọn ghế thì 'Áp dụng' khoá kèm câu nhắc; chọn ghế xong gọi onApply(mã, ghế)", async () => {
    const onApply = vi.fn();
    render(
      <Providers locale="vi">
        <PromoCodeTab seats={seats} promotions={parsePromotions(RAW)} busy={false} onApply={onApply} />
      </Providers>,
    );
    const apply = screen.getByRole("button", { name: "Áp dụng" });
    expect(apply).toBeEnabled(); // chưa chọn mã: bấm = gỡ mã đang áp
    await userEvent.click(screen.getAllByRole("button", { name: "Dùng mã" })[1]);
    expect(screen.getByRole("button", { name: "Đã chọn" })).toHaveAttribute("aria-pressed", "true");
    expect(apply).toBeDisabled();
    expect(screen.getByText("Chọn ít nhất một ghế để áp dụng mã.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Ghế 6/ }));
    expect(apply).toBeEnabled();
    await userEvent.click(apply);
    expect(onApply).toHaveBeenCalledWith("THREE", [2]);
  });

  it("đang kiểm tra: nút giữ màu đậm, có vòng quay + 'Đang kiểm tra mã ...', aria-busy, bấm lại bị bỏ qua", async () => {
    const onApply = vi.fn();
    render(
      <Providers locale="vi">
        <PromoCodeTab seats={seats} promotions={parsePromotions(RAW)} busy onApply={onApply} />
      </Providers>,
    );
    const busy = screen.getByRole("button", { name: "Đang kiểm tra mã ..." });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy).toBeEnabled();
    await userEvent.click(busy);
    expect(onApply).not.toHaveBeenCalled();
  });
});
