import { describe, expect, it, vi } from "vitest";
import { promotionListSchema } from "./account";
import { expiryOf, isExhausted, parsePromotions, quantityBadge, quantityShort, startOf } from "./promotion";

/** Mẫu thật của `promotion/promotional_code_list_all?source=1` / `get-promotions` (live 2026-10-29). */
const LIVE_ITEM = {
  id: 1234,
  code: "HAIVAN50K",
  name: "Giảm 50.000đ chuyến Hà Nội - Sơn La",
  available_quantity: "không giới hạn",
  mkp_total_one_user: "không giới hạn",
  min_price: "Không giới hạn",
  discount_route: 50000,
  route: ["MDI-SOL", "SOL-MDI"],
  content: "<p>Áp dụng mọi chuyến</p>",
  mkp_time_start_travel: "2026-10-01 00:00:00",
  mkp_time_end_travel: "2026-12-31 23:59:59",
  mkp_unlimited: 1,
};

describe("parsePromotions: mẫu thật của apigw", () => {
  it("chữ 'không giới hạn' ở số lượng không làm trống danh sách; trường lạ giữ nguyên", () => {
    const list = parsePromotions({ data: [LIVE_ITEM, { ...LIVE_ITEM, code: "P100", discount_route: 100, available_quantity: 7 }] });
    expect(list.map((p) => p.code)).toEqual(["HAIVAN50K", "P100"]);
    expect(list[0]).toMatchObject({ route: ["MDI-SOL", "SOL-MDI"], mkp_unlimited: 1, min_price: "Không giới hạn" });
  });

  it("nhận cả dạng mảng trần; thân lạ → rỗng, không ném lỗi", () => {
    expect(parsePromotions([LIVE_ITEM])).toHaveLength(1);
    expect(parsePromotions(null)).toEqual([]);
    expect(parsePromotions({ status: "ok" })).toEqual([]);
  });

  it("phần tử sai hợp đồng nhưng có code vẫn được giữ (kèm cảnh báo); không có code thì bỏ", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const list = parsePromotions({ data: [{ code: "ODD", name: 123, available_quantity: { x: 1 } }, { name: "không mã" }, LIVE_ITEM] });
    expect(list.map((p) => p.code)).toEqual(["ODD", "HAIVAN50K"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("số lượng và hạn", () => {
  it("chỉ ẩn khi đúng bằng 0 (như web cũ); chữ, rỗng, thiếu vẫn hiện", () => {
    expect(isExhausted(0)).toBe(true);
    expect(isExhausted("0")).toBe(true);
    expect(isExhausted("không giới hạn")).toBe(false);
    expect(isExhausted("")).toBe(false);
    expect(isExhausted(5)).toBe(false);
    expect(isExhausted(undefined)).toBe(false);
    expect(isExhausted(null)).toBe(false);
  });

  it("huy hiệu: số → xN; chữ → giữ nguyên chữ; ô ngắn của trang ưu đãi: chữ → ∞", () => {
    expect(quantityBadge(5)).toBe("x5");
    expect(quantityBadge("12")).toBe("x12");
    expect(quantityBadge("không giới hạn")).toBe("không giới hạn");
    expect(quantityBadge(null)).toBe("");
    expect(quantityShort(5)).toBe("5");
    expect(quantityShort("không giới hạn")).toBe("∞");
    expect(quantityShort(undefined)).toBe("");
  });

  it("hạn hiển thị: date_end, thiếu thì mkp_time_end_travel (và ngày bắt đầu tương tự)", () => {
    expect(expiryOf({ date_end: "2026-11-30" })).toBe("2026-11-30");
    expect(expiryOf({ mkp_time_end_travel: "2026-12-31 23:59:59" })).toBe("2026-12-31 23:59:59");
    expect(expiryOf({})).toBeNull();
    expect(startOf({ mkp_time_start_travel: "2026-10-01 00:00:00" })).toBe("2026-10-01 00:00:00");
  });
});

describe("promotionListSchema (tài khoản)", () => {
  it("parse mẫu thật không lỗi và giữ các mã", () => {
    const parsed = promotionListSchema.parse({ data: [LIVE_ITEM] });
    expect(parsed.data[0].code).toBe("HAIVAN50K");
    expect(parsed.data[0].available_quantity).toBe("không giới hạn");
  });
});
