import type { Affiliate } from "./seats";

const LOG_QR_KEY = "hv_log_qr";

export interface LogQr {
  source: string | null;
  aff: string | null;
  /** epoch ms hết hạn (web cũ: now + 10h) */
  created: number;
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  let value: string | undefined;
  try {
    value = match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
  } catch {
    value = undefined; // cookie hỏng không được chặn giữ chỗ
  }
  return value && value !== "null" && value !== "undefined" ? value : undefined;
}

export function saveLogQr(log: LogQr): void {
  try {
    localStorage.setItem(LOG_QR_KEY, JSON.stringify(log));
  } catch {
    /* trình duyệt chặn storage: bỏ qua */
  }
}

/** Nguồn affiliate cho hold như web cũ: log_qr còn hạn → aff; hết hạn → "" (và xoá); không có → bỏ khoá. */
export function readAffiliate(now = Date.now()): Affiliate {
  let aff: string | undefined;
  try {
    const raw = localStorage.getItem(LOG_QR_KEY);
    if (raw) {
      const log = JSON.parse(raw) as LogQr;
      if (log.created < now) {
        localStorage.removeItem(LOG_QR_KEY);
        aff = "";
      } else aff = log.aff ?? "";
    }
  } catch {
    aff = undefined;
  }
  return { aff, utm_source: readCookie("utm_source"), aff_sid: readCookie("aff_sid") };
}

/** Ghi cookie affiliate từ URL hiện tại (30 ngày, path=/), chỉ giá trị thật — cùng ngữ nghĩa `_app` web cũ. */
export function captureAffiliateCookies(search: URLSearchParams): void {
  for (const name of ["utm_source", "aff_sid"]) {
    const value = search.get(name);
    if (value) document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
  }
}
