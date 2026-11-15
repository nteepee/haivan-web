import type { MouseEvent } from "react";

/** Bấm vào bất kỳ đâu trên ô ngày (không chỉ biểu tượng lịch) là mở bộ chọn ngày. Trình duyệt cũ không có showPicker: giữ hành vi gốc. */
export function openDatePicker(event: MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  if (typeof input.showPicker !== "function") return;
  try {
    input.showPicker();
  } catch {
    // Đang mở sẵn, ô bị khoá, hoặc không có cử chỉ người dùng: bỏ qua.
  }
}
