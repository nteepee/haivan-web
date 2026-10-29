"use client";

import { Crown } from "lucide-react";
import { useLocale, useT } from "@/components/providers";
import { clampRank, formatCount, nextRankInfo, RANK_KEYS } from "@/lib/loyalty";
import type { CustomerData } from "@/schemas/account";
import { RankIcon } from "./rank-icon";

/** Dòng "còn bao nhiêu để lên hạng" (API `next_rank` nếu có, không thì ngưỡng tĩnh) hoặc lời chúc ở hạng cao nhất. */
function NextRankNote({ rank, customer }: { rank: number; customer: CustomerData }) {
  const t = useT();
  const locale = useLocale();
  const next = nextRankInfo(rank, customer.rank, customer.rank?.period_transaction ?? 0);
  if (!next) {
    return (
      <p className="flex items-center gap-2 font-semibold text-ink">
        <Crown className="size-icon shrink-0" aria-hidden />
        {t("account.top_rank")}
      </p>
    );
  }
  const parts: string[] = [];
  if (next.ticketsLeft !== null && next.ticketsLeft > 0) parts.push(t("account.need_tickets", { n: formatCount(next.ticketsLeft, locale) }));
  if (next.pointsLeft !== null) parts.push(t("account.need_points_left", { n: formatCount(next.pointsLeft, locale) }));
  else if (next.pointsTotal !== null) parts.push(t("account.need_points_total", { n: formatCount(next.pointsTotal, locale) }));
  if (parts.length === 0) return null;
  return <p className="font-semibold text-ink">{t("account.next_rank", { rank: t(RANK_KEYS[next.rank]), need: parts.join(t("account.need_or")) })}</p>;
}

/** Thẻ tóm tắt: hạng (icon + tên), điểm, vé hoàn thành (12 tháng), thanh 4 hạng, câu lên hạng, nút lịch sử. */
export function LoyaltySummary({ customer, onHistory }: { customer: CustomerData; onHistory: () => void }) {
  const t = useT();
  const locale = useLocale();
  const rank = clampRank(customer.rank?.rank);
  const name = t(RANK_KEYS[rank]);
  return (
    <section className="hv-card grid gap-4 p-card" aria-label={t("account.your_rank")}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <p className="grid content-start justify-items-center gap-1">
          <span className="text-14 text-muted">{t("account.your_rank")}</span>
          <RankIcon rank={rank} name={name} size={40} />
          <b className="text-18 font-extrabold text-ink">{name}</b>
        </p>
        <p className="grid content-start justify-items-center gap-1">
          <span className="text-14 text-muted">{t("account.points_balance")}</span>
          <b className="text-24 font-extrabold text-ink tabular-nums">{formatCount(customer.account?.balance ?? 0, locale)}</b>
          <span className="text-14 text-muted">{t("account.points_unit")}</span>
        </p>
        <p className="grid content-start justify-items-center gap-1">
          <span className="text-14 text-muted">{t("account.completed_tickets")}</span>
          <b className="text-24 font-extrabold text-ink tabular-nums">{formatCount(customer.rank?.period_transaction ?? 0, locale)}</b>
          <span className="text-14 text-muted">{t("account.tickets_period_note")}</span>
        </p>
      </div>
      <ol className="grid grid-cols-4 gap-2" aria-label={t("account.rank_ladder")}>
        {RANK_KEYS.map((key, index) => {
          const reached = rank >= index;
          return (
            <li key={key} aria-current={rank === index ? "step" : undefined} className="grid content-start justify-items-center gap-1 text-center">
              <span aria-hidden className={`h-2 w-full rounded-(--r-1) ${reached ? "bg-accent" : "bg-paper-3"}`} />
              <RankIcon rank={index} name={t(key)} muted={!reached} />
              <span className={`text-14 leading-tight break-words ${rank === index ? "font-extrabold text-ink" : "text-muted"}`}>{t(key)}</span>
              <span className="sr-only">{rank === index ? t("account.rank_current") : reached ? t("account.rank_reached") : t("account.locked")}</span>
            </li>
          );
        })}
      </ol>
      <NextRankNote rank={rank} customer={customer} />
      <button type="button" onClick={onHistory} aria-haspopup="dialog" className="hv-btn hv-btn-outline hv-btn-sm w-fit">
        {t("account.points_history")}
      </button>
    </section>
  );
}
