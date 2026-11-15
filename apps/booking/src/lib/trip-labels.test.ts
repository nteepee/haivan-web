import { describe, expect, it } from "vitest";
import { placeLineLabel, tripClassLabel } from "./trip-labels";

describe("nhãn chuyến theo locale", () => {
  it("vi giữ nguyên tên ERP", () => {
    expect(tripClassLabel("Cao cấp", "vi")).toBe("Cao cấp");
    expect(placeLineLabel("Mỹ Đình - Điện Biên", "vi")).toBe("Mỹ Đình - Điện Biên");
  });
  it("en: hạng tiếng Việt đổi sang tên hạng quốc tế, tên khác bỏ dấu", () => {
    expect(tripClassLabel("Cao cấp", "en")).toBe("Royal Cabin");
    expect(tripClassLabel("Tiết kiệm", "en")).toBe("Luxury");
    expect(tripClassLabel("Siêu rẻ", "en")).toBe("Eco");
    expect(tripClassLabel("Luxury", "en")).toBe("Luxury");
  });
  it("en: từng địa danh trong chặng đổi tên tiếng Anh / bỏ dấu", () => {
    expect(placeLineLabel("Mỹ Đình - Điện Biên", "en")).toBe("My Dinh - Dien Bien");
    expect(placeLineLabel("Hà Nội - Sài Gòn", "en")).toBe("Hanoi - Saigon");
    expect(placeLineLabel("Bến xe Mỹ Đình", "en")).toBe("Ben xe My Dinh");
  });
});
