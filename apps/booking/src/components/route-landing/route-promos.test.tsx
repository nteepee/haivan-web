import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COMBO_PROMO, makePromo, ROUNDTRIP_PROMO, withPromos } from "../../../test/booking-config";
import { routePromos } from "@/lib/promo-match";
import { promoSchema } from "@/schemas/booking-config";
import { RoutePromos } from "./route-promos";

afterEach(cleanup);

describe("routePromos: chương trình của đúng tuyến/chiều, WP cho hiện", () => {
  const config = withPromos([COMBO_PROMO, makePromo({ ...COMBO_PROMO, id: 12, direction: "ba" }), makePromo({ ...COMBO_PROMO, id: 13, show_on_route: false }), ROUNDTRIP_PROMO]);
  it("combo theo chiều trang; khứ hồi của tuyến luôn hiện; bài tắt 'hiện trên trang tuyến' bị bỏ", () => {
    expect(routePromos(config, "sg-vt", "ab").map((p) => p.id)).toEqual([11]);
    expect(routePromos(config, "sg-vt", "ba").map((p) => p.id)).toEqual([12]);
    expect(routePromos(config, "hn-moc", "ab").map((p) => p.id)).toEqual([10]);
  });
});

describe("RoutePromos", () => {
  it("không có chương trình → không render", () => {
    const { container } = render(<RoutePromos promos={[]} locale="vi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("combo: tiêu đề WP, bậc giá kèm giá gạch, điều kiện (2 dòng mở, còn lại gập), nút về thẻ tìm vé", () => {
    const promo = makePromo({
      ...COMBO_PROMO,
      headline: { vi: "Đi nhóm, đặt trước từ 1 tiếng?", en: "Group?" },
      terms: { vi: ["Đặt trước 1 tiếng", "Thanh toán QR", "Không cộng dồn"], en: [] },
    });
    render(<RoutePromos promos={[promo]} locale="vi" />);
    const card = screen.getByRole("heading", { level: 3, name: "Đi nhóm, đặt trước từ 1 tiếng?" }).closest("li")!;
    expect(within(card).getByText("419.000đ")).toBeInTheDocument();
    expect(within(card).getByText("520.000đ").tagName).toBe("S");
    expect(within(card).getByText("2 vé Luxury")).toBeInTheDocument();
    expect(within(card).getByText("Xem điều kiện áp dụng")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /từ 2 vé/ })).toHaveAttribute("href", "#tim-ve");
  });

  it("khứ hồi: không có tiêu đề thì dùng nhãn, hiện mức giảm mỗi ghế chiều về", () => {
    render(<RoutePromos promos={[ROUNDTRIP_PROMO]} locale="vi" />);
    expect(screen.getByRole("heading", { level: 3, name: "Giảm 20k/ghế chiều về" })).toBeInTheDocument();
    expect(screen.getByText("-20.000đ")).toBeInTheDocument();
  });
});

describe("promoSchema: WP cũ chưa gửi trường hiển thị", () => {
  it("mặc định hiện trên trang tuyến, không điều kiện, không tiêu đề", () => {
    const { headline, terms, show_on_route, ...raw } = makePromo({ ...ROUNDTRIP_PROMO });
    void headline; void terms; void show_on_route;
    const p = promoSchema.parse(raw);
    expect(p.show_on_route).toBe(true);
    expect(p.terms).toEqual({ vi: [], en: [] });
  });
});
