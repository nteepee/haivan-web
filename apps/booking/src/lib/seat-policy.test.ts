import { describe, expect, it } from "vitest";
import type { SeatMapResponse } from "@/schemas/trip";
import { applySeatPolicy, blockedInHold, seatBlockReason } from "./seat-policy";

const seat = (id: number, name: string, price = 450_000, is_empty = true) => ({ id, name, price, is_empty });
const map = (seats: ReturnType<typeof seat>[]): SeatMapResponse => ({ data: [[seats]] });

describe("seat-policy: chỗ web không bán", () => {
  it("xe Điện Biên (merchant 01): khoá 4 giường đầu xe, giường khác vẫn bán", () => {
    const out = applySeatPolicy(map([seat(1, "A1-1"), seat(2, "A1-2"), seat(3, "11"), seat(4, "C2-1")]), "01");
    const row = out.data[0][0] as Array<Record<string, unknown>>;
    expect(row.map((s) => [s.name, s.is_empty, s.web_blocked ?? false])).toEqual([
      ["A1-1", false, true],
      ["A1-2", true, false],
      ["11", false, true],
      ["C2-1", false, true],
    ]);
  });

  it("limousine Vũng Tàu (merchant khác 01): ghế 1, 2, 11 vẫn bán", () => {
    const row = applySeatPolicy(map([seat(1, "1"), seat(2, "2"), seat(3, "11")]), "02").data[0][0];
    expect(row.every((s) => s?.is_empty)).toBe(true);
  });

  it("mọi xe: chỗ trung chuyển TC và chỗ giá tượng trưng bị khoá; chỗ đã đặt giữ nguyên", () => {
    expect(seatBlockReason({ name: "TC1", price: 350_000 }, "17")).toBe("transfer");
    expect(seatBlockReason({ name: "B3", price: 50_000 }, "17")).toBe("price");
    expect(seatBlockReason({ name: "B3", price: 320_000 }, "17")).toBeNull();
    const row = applySeatPolicy(map([seat(1, "TC2", 50_000), seat(2, "A1-1", 450_000, false)]), "01").data[0][0] as Array<Record<string, unknown>>;
    expect(row[0]).toMatchObject({ is_empty: false, web_blocked: true, transfer: true });
    expect(row[1]).toMatchObject({ is_empty: false });
    expect(row[1].web_blocked).toBeUndefined();
  });

  it("máy chủ: liệt kê chỗ bị cấm trong body giữ chỗ", () => {
    expect(blockedInHold({ merchant_code: "01", seats: [{ name: "A1-1", price: 450_000 }, { name: "A1-3", price: 450_000 }] })).toEqual(["A1-1"]);
    expect(blockedInHold({ merchant_code: "02", seats: [{ name: "1", price: 210_000 }] })).toEqual([]);
    expect(blockedInHold("rác")).toEqual([]);
  });
});
