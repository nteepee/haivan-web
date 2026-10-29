"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { localePrefix } from "@/i18n/t";
import { useBookingDraft } from "@/stores/booking-draft";

/** Hết 10 phút kể từ khi tạo đơn (chưa chọn phương thức): xoá nháp, báo hết giờ, quay lại. */
export function TimeoutDialog({ deadline, partner }: { deadline: number; partner: boolean }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const clear = useBookingDraft((s) => s.clear);
  const [expired, setExpired] = useState(() => Date.now() >= deadline);

  useEffect(() => {
    const left = deadline - Date.now();
    if (left <= 0) return;
    const timer = setTimeout(() => setExpired(true), left);
    return () => clearTimeout(timer);
  }, [deadline]);
  useEffect(() => {
    if (expired) clear();
  }, [expired, clear]);

  const leave = () => {
    // "/" thuộc WordPress → điều hướng toàn trang.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (partner) window.location.assign("/");
    else router.replace(`${localePrefix(locale)}/xe-khach`); // back() có thể quay vào trang cổng thanh toán; giữ tiền tố /en
  };

  return (
    <Dialog open={expired} onOpenChange={(o) => !o && leave()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{t("payment.msg.notifications")}</DialogTitle>
        <DialogDescription>{t("payment.msg.noti_sold_out")}</DialogDescription>
        <button type="button" onClick={leave} className="hv-btn hv-btn-primary">OK</button>
      </DialogContent>
    </Dialog>
  );
}
