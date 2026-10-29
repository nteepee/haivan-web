import { describe, expect, it } from "vitest";
import { clampRank, formatCount, formatTxDate, nextRankInfo, rankIcon } from "./loyalty";

describe("formatTxDate", () => {
  it("dạng Y-m-d H:i:s không offset = giờ Việt Nam, giữ nguyên", () => {
    expect(formatTxDate("2026-10-28 14:30:00")).toBe("14:30 28/10/2026");
    expect(formatTxDate("2026-10-28T14:30:00")).toBe("14:30 28/10/2026");
  });
  it("có Z hoặc offset → đổi sang giờ Việt Nam (UTC+7)", () => {
    expect(formatTxDate("2026-10-28T07:30:00.000000Z")).toBe("14:30 28/10/2026");
    expect(formatTxDate("2026-10-28T20:15:00Z")).toBe("03:15 29/10/2026"); // qua nửa đêm
    expect(formatTxDate("2026-10-28T14:30:00+07:00")).toBe("14:30 28/10/2026");
    expect(formatTxDate("2026-10-28 00:30:00+00:00")).toBe("07:30 28/10/2026");
  });
  it("rỗng hoặc không đọc được → chuỗi rỗng", () => {
    expect(formatTxDate(null)).toBe("");
    expect(formatTxDate("hôm qua")).toBe("");
  });
});

describe("nextRankInfo", () => {
  it("hạng cao nhất → null", () => {
    expect(nextRankInfo(3, {}, 80)).toBeNull();
  });
  it("không có next_rank → ngưỡng tĩnh trừ vé đã hoàn thành", () => {
    expect(nextRankInfo(0, {}, 0)).toEqual({ rank: 1, ticketsLeft: 1, pointsLeft: null, pointsTotal: null });
    expect(nextRankInfo(1, { rank: 1 }, 12)).toEqual({ rank: 2, ticketsLeft: 18, pointsLeft: null, pointsTotal: 150_000 });
    expect(nextRankInfo(2, undefined, 60)).toEqual({ rank: 3, ticketsLeft: 0, pointsLeft: null, pointsTotal: 250_000 });
  });
  it("đọc next_rank của API khi có (khoá còn thiếu thắng mốc cần đạt)", () => {
    expect(nextRankInfo(1, { next_rank: { rank: 2, remain_transaction: 7, remain_point: 4000 } }, 23)).toEqual({ rank: 2, ticketsLeft: 7, pointsLeft: 4000, pointsTotal: null });
    expect(nextRankInfo(1, { next_rank: { transaction: 30, point: 150000 } }, 25)).toEqual({ rank: 2, ticketsLeft: 5, pointsLeft: null, pointsTotal: 150_000 });
  });
  it("next_rank lạ hình → rơi về ngưỡng tĩnh", () => {
    expect(nextRankInfo(0, { next_rank: "Bạc" }, 0)?.ticketsLeft).toBe(1);
    expect(nextRankInfo(0, { next_rank: { foo: "x" } }, 0)?.ticketsLeft).toBe(1);
  });
});

describe("helpers", () => {
  it("clampRank, rankIcon, formatCount", () => {
    expect(clampRank(9)).toBe(3);
    expect(clampRank(-1)).toBe(0);
    expect(clampRank(undefined)).toBe(0);
    expect(rankIcon(2)).toBe("/assets/icons/icon_gold_.png");
    expect(formatCount(150000, "en")).toBe("150,000");
    expect(formatCount(150000, "vi").replace(/\s/g, "")).toMatch(/^150[. ]?000$/);
  });
});
