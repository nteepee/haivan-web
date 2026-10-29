"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageNote } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useConfirmData } from "@/hooks/use-confirm-data";
import { localePrefix } from "@/i18n/t";
import { isDraftExpired, useBookingDraft } from "@/stores/booking-draft";
import { ConfirmForm } from "./confirm-form";

/**
 * /xe-khach/xac-nhan: không có nháp → về trang tìm (web cũ quay vòng mãi);
 * hết giờ giữ chỗ → xoá nháp, modal "Đã hết thời gian đặt vé…", OK → quay lại (hoặc "/" nếu partner=1).
 */
export function ConfirmPage() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const draft = useBookingDraft((s) => s.draft);
  const clear = useBookingDraft((s) => s.clear);
  const [hydrated, setHydrated] = useState(() => useBookingDraft.persist.hasHydrated());
  const [expired, setExpired] = useState(() => {
    const current = useBookingDraft.getState().draft;
    return useBookingDraft.persist.hasHydrated() && !!current && isDraftExpired(current);
  });
  const data = useConfirmData(expired ? null : draft);

  useEffect(
    () =>
      useBookingDraft.persist.onFinishHydration((state) => {
        setHydrated(true);
        if (state.draft && isDraftExpired(state.draft)) setExpired(true);
      }),
    [],
  );
  useEffect(() => {
    if (expired) clear();
  }, [expired, clear]);
  useEffect(() => {
    if (hydrated && !draft && !expired) router.replace(`${localePrefix(locale)}/xe-khach`);
  }, [hydrated, draft, expired, router, locale]);

  const onExpire = useCallback(() => setExpired(true), []);

  const leave = () => {
    // "/" thuộc WordPress → điều hướng toàn trang.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (params.get("partner") === "1") window.location.assign("/");
    else router.back();
  };

  if (expired) {
    return (
      <Dialog open onOpenChange={(o) => !o && leave()}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{t("booking_infor.msg.notifications")}</DialogTitle>
          <DialogDescription>{t("booking_infor.msg.noti_sold_out")}</DialogDescription>
          <button type="button" onClick={leave} className="hv-btn hv-btn-primary">OK</button>
        </DialogContent>
      </Dialog>
    );
  }

  // Chờ cả dịch vụ tận nhà (02/16/17) để form khởi tạo đúng — isLoading = đang tải lần đầu (query bị tắt thì false).
  if (!draft || data.customer.isPending || data.services.isLoading) return <PageNote role="status">{t("list_trip.msg.in_progress")}</PageNote>;

  return (
    <ConfirmForm
      key={draft.order_code}
      draft={draft}
      customerData={data.customer.data?.data ?? null}
      promotions={data.promotions.data?.data ?? []}
      services={data.services.data ?? []}
      onExpire={onExpire}
    />
  );
}
