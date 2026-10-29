"use client";

import { Check } from "lucide-react";
import { useT } from "@/components/providers";

export type BookingStep = 1 | 2 | 3;

const STEP_KEYS = ["steps.seat", "steps.info", "steps.pay"] as const;

/** Thanh bước đặt vé: Chọn ghế, Thông tin của bạn, Thanh toán. Bước xong có dấu tick, bước hiện tại số vàng.
 *  Điện thoại (dưới 40rem) hiện nhãn ngắn (`*_short`) dưới số để không xuống 3 dòng; nhãn đầy đủ vẫn ở DOM cho trình đọc màn hình và máy tính. */
export function Stepper({ current, className }: { current: BookingStep; className?: string }) {
  const t = useT();
  return (
    <nav aria-label={t("steps.label")} className={className}>
      <ol className="hv-steps">
        {STEP_KEYS.map((key, i) => {
          const n = (i + 1) as BookingStep;
          const done = n < current;
          return (
            <li key={key} className="hv-step" data-done={done} aria-current={n === current ? "step" : undefined}>
              <span className="hv-step-mark">{done ? <Check className="size-4" strokeWidth={3} aria-label={t("steps.done")} /> : n}</span>
              <span className="hv-step-label">
                <span className="hv-step-full">{t(key)}</span>
                <span className="hv-step-short" aria-hidden>
                  {t(`${key}_short`)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
