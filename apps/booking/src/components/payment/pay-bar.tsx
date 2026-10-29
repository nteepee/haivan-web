"use client";

import { ChevronRight, CircleAlert, Loader2 } from "lucide-react";
import { useT } from "@/components/providers";
import { StickyBar } from "@/components/ui/sticky-bar";
import { formatMoney } from "@/lib/format";

export type PayHint = "method" | "bank" | null;

/**
 * Thanh tổng + "Thanh toán": điện thoại cố định ở đáy, từ 60rem thành thẻ dính cột phải (cùng một markup).
 * Tên nút là "Thanh toán" (mũi tên chỉ là icon, ẩn với trình đọc màn hình).
 */
export function PayBar({ hint, busy, total, onPay }: { hint: PayHint; busy: boolean; total: number | null; onPay: () => void }) {
  const t = useT();
  return (
    <StickyBar>
      <div className="hv-sticky-inner">
        {total !== null ? (
          <p className="hv-sticky-sum">
            <span className="hv-sticky-label">{t("payment.total_price")}</span>
            <span className="hv-total">{formatMoney(total)}</span>
          </p>
        ) : null}
        <button type="button" onClick={onPay} disabled={busy} aria-busy={busy} aria-describedby="pay-hint" className="hv-btn hv-btn-primary hv-btn-lg">
          {busy ? <Loader2 className="size-icon animate-spin" aria-hidden /> : null}
          {busy ? t("payment.msg.in_progress") : <>{t("payment.payment")}{" "}</>}
          {busy ? null : <ChevronRight className="size-icon" aria-hidden />}
        </button>
        {/* Luôn có trong cây (rỗng thì ẩn). Không aria-live: toast sonner đã là vùng đọc cho cảnh báo này; nút gắn aria-describedby. */}
        <p id="pay-hint" className="hv-err hv-sticky-msg empty:sr-only">
          {hint ? (
            <>
              <CircleAlert className="size-icon shrink-0" aria-hidden />
              {t(hint === "bank" ? "ux.need_bank" : "ux.need_method")}
            </>
          ) : null}
        </p>
      </div>
    </StickyBar>
  );
}
