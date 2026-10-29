import { describe, expect, it } from "vitest";
import { translate } from "../i18n/t";
import { addDaysIso, countdown, dmyToIso, formatMoney, formatVnd, isoToDmy, parseHvDateTime, todayIsoVn } from "./format";

describe("format", () => {
  it("tiền như web cũ", () => {
    expect(formatMoney(250000)).toBe("250.000đ");
    expect(formatVnd(250000)).toBe("250.000 VNĐ");
  });

  it("ngày", () => {
    expect(dmyToIso("01-11-2026")).toBe("2026-11-01");
    expect(isoToDmy("2026-11-01")).toBe("01-11-2026");
  });

  it("expire_time theo giờ Việt Nam", () => {
    expect(new Date(parseHvDateTime("28-10-2026 14:38:29")).toISOString()).toBe("2026-10-28T07:38:29.000Z");
  });

  it("hôm nay theo giờ VN và đồng hồ đếm ngược", () => {
    expect(todayIsoVn(Date.parse("2026-10-28T18:00:00Z"))).toBe("2026-10-29");
    expect(countdown(10 * 60_000 - 11_000, 0)).toBe("09:49");
    expect(countdown(0, 5000)).toBe("00:00");
  });
});

describe("addDaysIso", () => {
  it("lùi/tiến ngày, qua ranh giới tháng và năm, rỗng giữ rỗng", () => {
    expect(addDaysIso("2026-11-01", -1)).toBe("2026-10-31");
    expect(addDaysIso("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDaysIso("2026-10-29", 3)).toBe("2026-11-01");
    expect(addDaysIso("", -1)).toBe("");
  });
});

describe("i18n", () => {
  it("tra khoá vi/en và rơi về vi", () => {
    expect(translate("vi", "login_form.login")).toBe("Đăng nhập");
    expect(translate("en", "login_form.msg.error_input")).toMatch(/valid/);
    expect(translate("en", "khong.ton.tai")).toBe("khong.ton.tai");
  });
});

describe("formatDateLabel", () => {
  it("vi: thứ, dd/mm/yyyy; en: Thu, 29 Oct 2026", async () => {
    const { formatDateLabel } = await import("./format");
    expect(formatDateLabel("2026-10-29", "vi")).toBe("Thứ năm, 29/10/2026");
    expect(formatDateLabel("2026-11-01", "vi")).toBe("Chủ nhật, 01/11/2026");
    expect(formatDateLabel("2026-10-29", "en")).toBe("Thu, 29 Oct 2026");
    expect(formatDateLabel("", "vi")).toBe("");
    expect(formatDateLabel("2026-13-40", "vi")).toBe("");
  });
});
