"use client";

import { Check, CircleAlert, Lock } from "lucide-react";
import { useRef } from "react";
import { useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RANK_KEYS } from "@/lib/loyalty";
import type { Definition } from "@/schemas/account";
import { RankIcon } from "./rank-icon";

interface Props {
  rank: number;
  tab: number;
  onTab: (tab: number) => void;
  definition: { data?: Definition; isError: boolean; refetch: () => unknown };
}

/** Quyền lợi theo hạng (`customer/definition`): có trạng thái tải/lỗi riêng, hạng chưa đạt hiện mờ kèm "Cần đạt hạng X". */
export function LoyaltyBenefits({ rank, tab, onTab, definition }: Props) {
  const t = useT();
  const list = useRef<HTMLDivElement>(null);
  if (definition.isError) {
    return (
      <section className="hv-card grid gap-3 p-card">
        <p role="alert" className="hv-notice hv-notice-error">
          <CircleAlert className="size-icon shrink-0" aria-hidden />
          <span className="font-semibold">{t("msg.err_data")}</span>
        </p>
        <button type="button" onClick={() => void definition.refetch()} className="hv-btn hv-btn-outline hv-btn-sm w-fit">{t("account.retry")}</button>
      </section>
    );
  }
  if (!definition.data) return <Skeleton className="h-48" aria-busy="true" />;
  const evaluators = definition.data.rank_evaluators;

  // Chọn tab xong cuộn tab đó vào giữa dải (điện thoại hẹp); không chạy lúc mới vào trang để khỏi kéo trang.
  const select = (value: string) => {
    onTab(Number(value));
    requestAnimationFrame(() => list.current?.querySelector('[data-state="active"]')?.scrollIntoView?.({ inline: "center", block: "nearest" }));
  };

  return (
    <section className="hv-card overflow-hidden">
      <Tabs value={String(tab)} onValueChange={select} className="gap-0">
        <div ref={list}>
          <TabsList aria-label={t("account.benefits")} className="grid! grid-cols-4 pe-1! mask-none!">
            {RANK_KEYS.map((key, index) => (
              <TabsTrigger key={key} value={String(index)} className="min-w-0 px-1! text-14! leading-tight sm:text-16!">
                {t(key)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {RANK_KEYS.map((key, index) => {
          const locked = rank < index;
          const lines = evaluators[index]?.description ?? [];
          return (
            <TabsContent key={key} value={String(index)} className="grid gap-3 p-card">
              <p className="flex flex-wrap items-center gap-2 font-extrabold text-ink">
                <RankIcon rank={index} name="" muted={locked} />
                {t("account.benefits")}
                {locked ? (
                  <span className="hv-tag ml-auto">
                    <Lock className="size-4" aria-hidden />
                    {t("account.need_rank", { rank: t(key) })}
                  </span>
                ) : null}
              </p>
              {lines.length === 0 ? (
                <p className="text-muted">{t("account.benefits_empty")}</p>
              ) : (
                <ul className={`grid gap-2 ${locked ? "text-muted" : ""}`}>
                  {lines.map((line, lineIndex) => (
                    <li key={`${index}:${lineIndex}:${line}`} className="flex gap-3">
                      {locked ? <Lock className="mt-1 size-4 shrink-0" aria-hidden /> : <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />}
                      {locked ? <span className="sr-only">{t("account.locked")}: </span> : null}
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}
