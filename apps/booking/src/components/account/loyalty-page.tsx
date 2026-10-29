"use client";

import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { clampRank } from "@/lib/loyalty";
import { LoyaltyBenefits } from "./loyalty-benefits";
import { LoyaltyHistory } from "./loyalty-history";
import { LoyaltyInvite } from "./loyalty-invite";
import { LoyaltySummary } from "./loyalty-summary";
import { useCustomer, useDefinition } from "./use-customer";

/**
 * /tai-khoan/khach-hang-than-thiet: hạng, điểm, vé hoàn thành, quyền lợi từng hạng, lịch sử điểm.
 * Hai call như web cũ nhưng độc lập: hạng/điểm hiện ngay khi có hồ sơ, quyền lợi có trạng thái tải/lỗi riêng.
 * Chưa tham gia → thẻ mời đăng ký (không tải `definition`; ProfileDialog tự tải khi mở).
 */
export function LoyaltyPage() {
  const t = useT();
  const customerQuery = useCustomer();
  const customer = customerQuery.data?.data;
  const member = !!customer?.subscribe_loyalty;
  const definition = useDefinition(member);
  const [picked, setPicked] = useState<number>();
  const [history, setHistory] = useState(false);

  if (customerQuery.isPending) return <Skeleton className="h-72" aria-busy="true" />;
  if (!customer) {
    return (
      <div className="hv-card grid gap-3 p-card">
        <p role="alert" className="hv-notice hv-notice-error">
          <CircleAlert className="size-icon shrink-0" aria-hidden />
          <span className="font-semibold">{t("msg.err_data")}</span>
        </p>
        <button type="button" onClick={() => void customerQuery.refetch()} className="hv-btn hv-btn-outline hv-btn-sm w-fit">{t("account.retry")}</button>
      </div>
    );
  }
  if (!member) return <LoyaltyInvite customer={customer} />;

  const rank = clampRank(customer.rank?.rank);
  return (
    <div className="grid gap-6">
      <h1 className="text-h1">{t("footer.intro4")}</h1>
      <LoyaltySummary customer={customer} onHistory={() => setHistory(true)} />
      <LoyaltyBenefits rank={rank} tab={picked ?? rank} onTab={setPicked} definition={definition} />
      <LoyaltyHistory open={history} onOpenChange={setHistory} transactions={customer.account?.transactions ?? []} />
    </div>
  );
}
