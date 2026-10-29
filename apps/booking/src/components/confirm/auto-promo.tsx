"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useBookingConfig } from "@/components/booking-config-provider";
import { useLocale, useT } from "@/components/providers";
import { autoTokenPromoId } from "@/lib/auto-promo-token";
import { ApiError } from "@/lib/http";
import { applyAutoPromo, clearPromo, hasServerDiscount } from "@/lib/promo-apply";
import { promoLabel } from "@/lib/promo-match";
import type { Promo } from "@/schemas/booking-config";
import { useBookingDraft, type BookingDraft, type DraftSeat } from "@/stores/booking-draft";

/** Khách đã bỏ ưu đãi tự áp của đơn này: tải lại trang không tự áp lại. */
const offKey = (order: string) => `hv_promo_off_${order}`;
export function autoPromoDismissed(order: string): boolean {
  try {
    return sessionStorage.getItem(offKey(order)) === "1";
  } catch {
    return false;
  }
}
const dismiss = (order: string) => {
  try {
    sessionStorage.setItem(offKey(order), "1");
  } catch {
    /* bỏ qua: chỉ mất việc nhớ lựa chọn */
  }
};

/** Dấu vân tay ghế (mã, giảm, đổi điểm): so sánh trước/sau khi gọi để biết khách đã đổi gì trong lúc chờ. */
const fingerprint = (seats: DraftSeat[]) => seats.map((s) => `${s.id}:${s.promotion ?? ""}:${s.discount ?? 0}:${s.is_reward ? 1 : 0}`).join("|");

interface Props {
  draft: BookingDraft;
  /** Chương trình sẽ tự áp (quyết định một lần lúc vào trang), null = không có. */
  promo: Promo | null;
  onApply: (seats: DraftSeat[]) => void;
  /** Đang kiểm mã với server: cha khoá "Tiếp tục" và hộp khuyến mãi để không chạy đua với khách. */
  onSettled: () => void;
}

/**
 * Tự áp mã chương trình giảm giá ở bước xác nhận (combo: luôn khi đủ điều kiện; khứ hồi: chỉ chặng về).
 * Gọi đúng đường áp mã sẵn có (`promotion/check-promotions`, mã + ghế đủ điều kiện); tiền giảm chỉ lấy từ phản hồi của server.
 * Server từ chối (hoặc không giảm đồng nào) → báo lý do bằng toast. Phản hồi bị bỏ nếu ghế đã đổi từ lúc gửi (khách đổi mã/điểm).
 * Nhãn "Đã áp …" suy từ mã đang nằm trên ghế (khớp chương trình trong cấu hình), nên còn sau khi tải lại/quay lại; khách gỡ được.
 */
export function AutoPromo({ draft, promo, onApply, onSettled }: Props) {
  const t = useT();
  const locale = useLocale();
  const config = useBookingConfig();
  const started = useRef(false);

  useEffect(() => {
    if (!promo || started.current) return;
    started.current = true;
    const label = promoLabel(promo, locale);
    const before = fingerprint(draft.seats);
    applyAutoPromo(draft, promo)
      .then((seats) => {
        const now = useBookingDraft.getState().draft;
        if (!now || now.order_code !== draft.order_code || fingerprint(now.seats) !== before) return; // ghế đã đổi: không ghi đè lựa chọn của khách
        if (!hasServerDiscount(seats, promo)) {
          toast.warning(t("corridor.rejected_generic", { label }));
          return;
        }
        onApply(seats);
      })
      .catch((error: unknown) => {
        toast.warning(error instanceof ApiError && error.message ? t("corridor.rejected", { label, reason: error.message }) : t("corridor.rejected_generic", { label }));
      })
      .finally(onSettled);
  }, [promo, draft, locale, onApply, onSettled, t]);

  // Nhãn suy từ token trên ghế (không có mã thật ở client).
  const shown = config.promos.find((p) => draft.seats.some((s) => autoTokenPromoId(s.promotion) === p.id));
  if (!shown) return null;
  return (
    <p role="status" className="hv-notice items-center">
      <Check className="size-icon shrink-0" strokeWidth={3} aria-hidden />
      <span className="flex-1 font-semibold">{t("corridor.applied", { label: promoLabel(shown, locale) })}</span>
      <button
        type="button"
        className="hv-link"
        onClick={() => {
          dismiss(draft.order_code);
          onApply(clearPromo(draft.seats));
        }}
      >
        {t("corridor.remove")}
      </button>
    </p>
  );
}
