import { describe, expect, it } from "vitest";
import { formatLongDate, htmlToText } from "./account-text";

describe("nội dung khuyến mãi", () => {
  it("bỏ thẻ/script, giữ xuống dòng và giải mã ký tự", () => {
    expect(htmlToText('<p>Giảm <b>10%</b> &amp; tặng nước</p><script>alert(1)</script><ul><li>Vé 1</li><li>Vé 2</li></ul>')).toBe("Giảm 10% & tặng nước\n• Vé 1\n• Vé 2");
    expect(htmlToText('<img src=x onerror="alert(1)">Xin chào')).toBe("Xin chào");
    expect(htmlToText(null)).toBe("");
  });

  it("ngày dài theo ngôn ngữ, không đọc được → rỗng", () => {
    expect(formatLongDate("2026-10-28 00:00:00", "vi")).toContain("2026");
    expect(formatLongDate("2026-10-28", "en")).toContain("October");
    expect(formatLongDate("abc", "vi")).toBe("");
    expect(formatLongDate(null, "vi")).toBe("");
  });
});
