import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Providers } from "@/components/providers";
import { TicketCard, type TicketView } from "./ticket-card";

afterEach(cleanup);
const ticket = (patch: Partial<TicketView>): TicketView => ({ id: 1, code: "V1", name: "5", price: 0, trip: { product: { name: "Luxury" } }, ...patch });
const show = (t: TicketView) =>
  render(
    <Providers locale="vi">
      <TicketCard ticket={t} />
    </Providers>,
  );

describe("TicketCard: giá", () => {
  it("giá chính là giá thực trả; có khuyến mãi thì thêm 'Giá vé' niêm yết + dòng 'Khuyến mãi -x'; không hiện mã", () => {
    show(ticket({ price: 0, price_discount: 200000 }));
    expect(screen.getByText("0đ")).toBeInTheDocument();
    expect(screen.getByText("Giá vé").parentElement).toHaveTextContent("200.000đ");
    expect(screen.getByText("Khuyến mãi").parentElement).toHaveTextContent("-200.000đ");
    expect(document.body.textContent).not.toMatch(/KHUHOI|MADEMO01|@auto/);
  });

  it("không khuyến mãi: chỉ một giá, không có dòng thêm", () => {
    show(ticket({ price: 240000 }));
    expect(screen.getByText("240.000đ")).toBeInTheDocument();
    expect(screen.queryByText("Khuyến mãi")).not.toBeInTheDocument();
    expect(screen.queryByText("Giá vé")).not.toBeInTheDocument();
  });
});
