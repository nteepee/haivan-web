/** `bookings/download-bill` → chuỗi base64 của PDF (body có thể bọc trong `data`). */
export function extractBase64Pdf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const { base64pdf, data } = body as { base64pdf?: unknown; data?: { base64pdf?: unknown } | null };
  const value = typeof base64pdf === "string" ? base64pdf : data && typeof data.base64pdf === "string" ? data.base64pdf : "";
  return value || null;
}

/** Giải base64 (có thể kèm tiền tố `data:application/pdf;base64,` hoặc xuống dòng) thành byte. */
export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const raw = atob(base64.replace(/^data:[^,]*,/, "").replace(/\s/g, ""));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export const pdfBlob = (base64: string) => new Blob([base64ToBytes(base64)], { type: "application/pdf" });

/** Tải file `<mã vé>.pdf` như web cũ (thẻ `<a download>`), dùng blob URL thay cho data URI. */
export function downloadPdf(ticketCode: string, base64: string): void {
  const url = URL.createObjectURL(pdfBlob(base64));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ticketCode}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
