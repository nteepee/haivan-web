"use client";

import { useQuery } from "@tanstack/react-query";
import { Bus } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusPage } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { localePrefix } from "@/i18n/t";
import { apigw } from "@/lib/http";
import { trackingSchema } from "@/schemas/account";

const TrackingMap = dynamic(() => import("./tracking-map").then((m) => m.TrackingMap), { ssr: false });

const toNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/**
 * /tracking?operator_id&ticket_code: tra xe theo mã vé (`trip/search-location-detail`, công khai).
 * Toàn màn hình như web cũ (mở từ app/QR): bản đồ điểm đón, tên + biển số xe, nút gọi lái xe.
 * Bảng thông tin là lớp kính r-3 nổi lên mép dưới bản đồ (chữ >= 16px).
 */
export function TrackingPage() {
  const t = useT();
  const locale = useLocale();
  const params = useSearchParams();
  const operatorId = params.get("operator_id");
  const ticketCode = params.get("ticket_code");
  const query = useQuery({
    queryKey: ["tracking", operatorId, ticketCode],
    enabled: !!operatorId && !!ticketCode,
    queryFn: () => apigw("trip/search-location-detail", { query: { operator_id: operatorId, ticket_code: ticketCode }, schema: trackingSchema }),
  });
  const car = query.data?.data;
  const lat = toNumber(car?.lat);
  const lng = toNumber(car?.long);
  const missing = !operatorId || !ticketCode;
  const message = query.isPending ? t("list_trip.msg.in_progress") : query.isError || !car ? t("account.tracking_not_found") : null;

  // Không có tham số: trang thường (giữ header/footer) với h1, một câu và nút về đặt vé; bản đồ toàn màn hình chỉ dành cho mã vé hợp lệ.
  if (missing) {
    return (
      <StatusPage title={t("account.tracking_title")} text={`${t("account.tracking_missing")} ${t("account.tracking_missing_hint")}`}>
        <Link href={`${localePrefix(locale)}/xe-khach`} className="hv-btn hv-btn-primary">
          {t("account.book_ticket_cta")}
        </Link>
      </StatusPage>
    );
  }

  return (
    <div className="fixed inset-0 z-(--z-sticky) flex flex-col bg-surface text-text">
      <div className="relative isolate flex-1">
        {car && lat !== null && lng !== null && car.duration !== -1 ? <TrackingMap lat={lat} lng={lng} label={car.place_start ?? undefined} /> : null}
        {message ? <p role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-muted">{message}</p> : null}
      </div>
      {car ? (
        <div className="glass relative z-10 -mt-6 grid justify-items-center rounded-t-3 px-4 pt-4">
          <p className="pb-2 text-center text-16">{t("account.tracking_live_note")}</p>
          <div className="flex flex-col items-center gap-2 py-4 font-semibold">
            <span>{car.name}</span>
            <span className="flex items-center gap-2">
              <Bus className="size-icon" aria-hidden />
              {car.xe_bks}
            </span>
          </div>
          {car.phone ? (
            <a href={`tel:${car.phone}`} className="hv-btn hv-btn-primary mb-4 w-full max-w-sm">
              {t("account.call_driver")}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
