import { describe, expect, it } from "vitest";
import { keepPlaceNames } from "./route-hero";

describe("keepPlaceNames", () => {
  it("nối các chữ của tên địa danh bằng dấu cách không ngắt", () => {
    expect(keepPlaceNames("Xe sân bay Tân Sơn Nhất đi Vũng Tàu", ["Tân Sơn Nhất", "Vũng Tàu"])).toBe(
      "Xe sân bay Tân Sơn Nhất đi Vũng Tàu",
    );
  });

  it("tên dài chỉ nối 3 chữ cuối; tên một chữ giữ nguyên", () => {
    expect(keepPlaceNames("Xe Sân bay Tân Sơn Nhất đi Huế", ["Sân bay Tân Sơn Nhất", "Huế"])).toBe("Xe Sân bay Tân Sơn Nhất đi Huế");
  });
});
