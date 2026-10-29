// Định dạng theo hiển thị web cũ. Giờ Việt Nam cố định UTC+7 (không có giờ mùa hè).
const VN_OFFSET = "+07:00";

/** 250000 → "250.000đ" */
export const formatMoney = (value: number) => `${Math.round(value).toLocaleString("vi-VN")}đ`;

/** 250000 → "250.000 VNĐ" (ô ghế) */
export const formatVnd = (value: number) => `${Math.round(value).toLocaleString("vi-VN")} VNĐ`;

/** "01-11-2026" → "2026-11-01" */
export function dmyToIso(dmy: string): string {
  const [d, m, y] = dmy.split("-");
  if (!d || !m || !y) throw new Error(`Ngày không hợp lệ: ${dmy}`);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** "2026-11-01" → "01-11-2026" */
export function isoToDmy(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

/** "28-10-2026 14:38:29" (expire_time của hold) → epoch ms */
export function parseHvDateTime(value: string): number {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Thời điểm không hợp lệ: ${value}`);
  const [, d, m, y, hh, mm, ss] = match;
  return Date.parse(`${y}-${m}-${d}T${hh}:${mm}:${ss}${VN_OFFSET}`);
}

/** "2026-11-01 05:30:00" (node_time, created_at) → epoch ms */
export function parseIsoLocal(value: string): number {
  return Date.parse(`${value.replace(" ", "T")}${VN_OFFSET}`);
}

/** Ngày hôm nay theo giờ Việt Nam, dạng ISO "YYYY-MM-DD". */
export function todayIsoVn(now = Date.now()): string {
  return new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
}

/** Cộng `days` ngày vào ngày ISO "YYYY-MM-DD" (âm = lùi); chuỗi rỗng (prerender chưa biết ngày) giữ nguyên rỗng. */
export function addDaysIso(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** mm:ss còn lại tới `deadline` (epoch ms), không âm. */
export function countdown(deadline: number, now = Date.now()): string {
  const left = Math.max(0, Math.floor((deadline - now) / 1000));
  return `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
}

/** "DD-MM-YYYY HH:mm[:ss]" hoặc "YYYY-MM-DD HH:mm[:ss]" (giờ VN) → epoch ms; không nhận ra → NaN. */
export function parseVnDateTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const dmy = value.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dmy) return Date.parse(`${dmy[3]}-${dmy[2]}-${dmy[1]}T${dmy[4]}:${dmy[5]}:${dmy[6] ?? "00"}${VN_OFFSET}`);
  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (ymd) return Date.parse(`${ymd[1]}-${ymd[2]}-${ymd[3]}T${ymd[4]}:${ymd[5]}:${ymd[6] ?? "00"}${VN_OFFSET}`);
  return Number.NaN;
}

const WEEKDAY_VI = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Nhãn ngày hiển thị trên ô ngày: vi "Thứ năm, 29/10/2026", en "Thu, 29 Oct 2026"; chuỗi rỗng/không hợp lệ → "". */
export function formatDateLabel(iso: string, locale: "vi" | "en"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  const [y, m, d] = iso.split("-");
  const wd = date.getUTCDay();
  return locale === "en" ? `${WEEKDAY_EN[wd]}, ${Number(d)} ${MONTH_EN[Number(m) - 1]} ${y}` : `${WEEKDAY_VI[wd]}, ${d}/${m}/${y}`;
}
