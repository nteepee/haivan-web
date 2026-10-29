import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLastGood } from "./last-good";

describe("createLastGood", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it("thành công thì trả giá trị; lỗi sau đó trả bản tốt và chỉ cảnh báo một lần", async () => {
    const lg = createLastGood<string>("[t]", "null");
    expect(await lg.resolve("k", async () => "v1")).toBe("v1");
    const fail = async () => {
      throw new Error("503");
    };
    expect(await lg.resolve("k", fail)).toBe("v1");
    expect(await lg.resolve("k", fail)).toBe("v1");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("[t] k:");
  });

  it("hồi phục thì cảnh báo được bật lại cho đợt lỗi sau", async () => {
    const lg = createLastGood<string>("[t]", "null");
    const fail = async () => {
      throw new Error("x");
    };
    await lg.resolve("k", async () => "v1");
    await lg.resolve("k", fail);
    await lg.resolve("k", async () => "v2");
    expect(await lg.resolve("k", fail)).toBe("v2");
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("null (upstream xác nhận không có) xoá bản tốt: lỗi sau đó không còn bản cũ để trả", async () => {
    const lg = createLastGood<string>("[t]", "null");
    await lg.resolve("k", async () => "v1");
    expect(await lg.resolve("k", async () => null)).toBeNull();
    expect(await lg.resolve("k", async () => Promise.reject(new Error("x")))).toBeNull();
  });

  it("chưa có bản tốt: onMiss=null trả null, onMiss=throw ném lại lỗi gốc", async () => {
    const error = new Error("HTTP 503");
    expect(await createLastGood<string>("[t]", "null").resolve("k", () => Promise.reject(error))).toBeNull();
    await expect(createLastGood<string>("[t]", "throw").resolve("k", () => Promise.reject(error))).rejects.toBe(error);
  });

  it("khoá độc lập nhau", async () => {
    const lg = createLastGood<string>("[t]", "throw");
    await lg.resolve("a", async () => "A");
    await expect(lg.resolve("b", () => Promise.reject(new Error("x")))).rejects.toThrow("x");
    expect(await lg.resolve("a", () => Promise.reject(new Error("x")))).toBe("A");
  });

  it("tập khoá đã cảnh báo có giới hạn (khoá sinh từ URL không làm phình bộ nhớ)", async () => {
    const lg = createLastGood<string>("[t]", "null");
    for (let i = 0; i < 1_200; i++) lg.warnOnce(`k${i}`, "m");
    expect(warn).toHaveBeenCalledTimes(1_200);
  });
});
