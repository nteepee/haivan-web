"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { localePrefix } from "@/i18n/t";
import { saveLogQr } from "@/lib/affiliate";
import { apigw } from "@/lib/http";

const pad = (n: number) => String(n).padStart(2, "0");
/** "YYYY-MM-DD HH:mm" theo giờ máy (web cũ dùng moment().add(10,"hour")). */
const formatLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Đọc query thô như web cũ (`split("&")`, `split("=")`, không decode trừ tên điểm). */
export function parsePartnerQuery(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of search.replace(/^\?/, "").split("&")) {
    const [k, v] = part.split("=");
    if (k) out[k] = v ?? "";
  }
  return out;
}

/** "Quận%201,10.77,106.70" → "Quận 1,10.77,106.70" */
const point = (raw: string) => {
  const [name = "", lat = "", lng = ""] = raw.split(",");
  return `${decodeURIComponent(name)},${lat},${lng}`;
};

/**
 * /partner/booking?ref&source&date(YYYY-MM-DD)&origin&destination&passengers (QR đại lý):
 * lưu log_qr (hạn 10 giờ), ghi log quét `api/qrcode/agency-qr-code-scan-logs`, chuyển sang tìm chuyến (giao diện tiếng Anh như web cũ).
 */
export function PartnerRedirect() {
  const t = useT();
  const locale = useLocale();
  useEffect(() => {
    const asPath = window.location.pathname + window.location.search;
    const q = parsePartnerQuery(window.location.search);
    if (!q.ref || !q.source || !q.origin || !q.destination) return;
    const expires = new Date(Date.now() + 10 * 3600_000);
    const log = { url: asPath, aff: q.ref, source: q.source, created: formatLocal(expires) };
    saveLogQr({ source: q.source, aff: q.ref, created: expires.getTime() });
    void apigw("qrcode/agency-qr-code-scan-logs", { method: "POST", body: log, keepalive: true }).catch(() => undefined);
    const date = (q.date ?? "").split("-").reverse().join("-");
    const url = `/en/xe-khach/tim-chuyen?from=${encodeURIComponent(point(q.origin))}&to=${encodeURIComponent(point(q.destination))}&date=${date}&numberGuest=${q.passengers || 1}&type=2`;
    window.location.replace(url);
  }, []);
  // Trong lúc chuyển (hoặc thiếu tham số nên không chuyển): có h1, một câu và liên kết tìm vé thủ công.
  return (
    <StatusPage title={t("account.partner_redirecting")} text={t("account.partner_fallback")}>
      <Link href={`${localePrefix(locale)}/xe-khach`} className="hv-btn hv-btn-primary">
        {t("account.book_ticket_cta")}
      </Link>
    </StatusPage>
  );
}
