"use client";

import { useLocale, useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatCount, formatTxDate } from "@/lib/loyalty";
import type { CustomerData } from "@/schemas/account";

type Transaction = NonNullable<NonNullable<CustomerData["account"]>["transactions"]>[number];

/** Lịch sử tích điểm: mô tả hiện dạng chữ thuần (React tự escape), ngày theo giờ Việt Nam, số điểm kèm đơn vị. */
export function LoyaltyHistory({ open, onOpenChange, transactions }: { open: boolean; onOpenChange: (open: boolean) => void; transactions: Transaction[] }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogTitle>{t("account.points_history")}</DialogTitle>
        <DialogDescription className="sr-only">{t("account.points_history")}</DialogDescription>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-muted">{t("account.history_empty")}</p>
        ) : (
          <ul className="divide-y divide-rule">
            {transactions.map((tx, index) => {
              const plus = tx.type === "give" || tx.type === "refund";
              return (
                <li key={`${tx.updated_at ?? ""}|${tx.description ?? ""}|${tx.amount}|${index}`} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <b className="block break-words">{tx.description}</b>
                    <span className="text-16 text-muted tabular-nums">{formatTxDate(tx.updated_at)}</span>
                  </span>
                  <b className={`shrink-0 tabular-nums ${plus ? "text-success" : "text-error"}`}>
                    {plus ? "+" : "-"} {formatCount(Math.abs(tx.amount), locale)} <span className="font-semibold">{t("account.points_unit")}</span>
                  </b>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
