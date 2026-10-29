import { describe, expect, it } from "vitest";
import { base64ToBytes, extractBase64Pdf, pdfBlob } from "./account-bill";

const PDF_HEAD = "%PDF-1.4\n";
const b64 = Buffer.from(PDF_HEAD).toString("base64");

describe("hoá đơn PDF", () => {
  it("lấy base64pdf ở body hoặc bọc trong data", () => {
    expect(extractBase64Pdf({ base64pdf: b64 })).toBe(b64);
    expect(extractBase64Pdf({ data: { base64pdf: b64 } })).toBe(b64);
    expect(extractBase64Pdf({ base64pdf: "" })).toBeNull();
    expect(extractBase64Pdf(null)).toBeNull();
    expect(extractBase64Pdf("html")).toBeNull();
  });

  it("giải base64 ra đúng byte, chịu được tiền tố data URI và xuống dòng", () => {
    expect(new TextDecoder().decode(base64ToBytes(b64))).toBe(PDF_HEAD);
    expect(new TextDecoder().decode(base64ToBytes(`data:application/pdf;base64,${b64.slice(0, 4)}\n${b64.slice(4)}`))).toBe(PDF_HEAD);
  });

  it("blob có type application/pdf và đúng kích thước", async () => {
    const blob = pdfBlob(b64);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBe(PDF_HEAD.length);
    expect(await blob.text()).toBe(PDF_HEAD);
  });

  it("base64 hỏng → lỗi rõ ràng", () => {
    expect(() => base64ToBytes("***")).toThrow();
  });
});
