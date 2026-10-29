"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocale, useT } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDate, htmlToText } from "@/lib/account-text";
import { autoTokenPromoId } from "@/lib/auto-promo-token";
import { gw } from "@/lib/http";
import { promotionListSchema } from "@/schemas/account";
import { expiryOf, quantityShort, startOf } from "@/schemas/promotion";

/** /tai-khoan/uu-dai: danh sách mã khuyến mãi của khách (`promotion/promotional_code_list_all?source=1`). */
export function OffersPage() {
  const t = useT();
  const locale = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const query = useQuery({ queryKey: ["account", "offers"], queryFn: () => gw("promotion/promotional_code_list_all", { query: { source: 1 }, schema: promotionListSchema }) });

  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p role="alert" className="hv-notice hv-notice-error font-semibold">{t("msg.err_data")}</p>;
  // Mã đã bị che thành token là mã ẩn của chương trình tự áp: không hiện trong danh sách ưu đãi.
  const list = query.data.data.filter((p) => autoTokenPromoId(p.code) === null);
  if (list.length === 0) return <p className="hv-card p-card text-center">{t("msg.empty_promo")}</p>;

  return (
    <div className="grid gap-6">
      <h1 className="text-h1">{t("account.promo_list")}</h1>
      <ul className="grid gap-cards">
        {list.map((promo, index) => {
          const open = openIndex === index;
          return (
            <li key={`${promo.code}-${index}`} className="hv-card flex gap-4 p-card">
              <span className="grid size-16 shrink-0 place-items-center rounded-1 bg-ink text-24 font-extrabold text-surface tabular-nums" aria-label={String(promo.available_quantity ?? "")}>
                {quantityShort(promo.available_quantity)}
              </span>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => setOpenIndex(open ? null : index)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-2 text-left">
                  <span className="flex-1">
                    <b className="block text-18 font-extrabold text-ink">{promo.name}</b>
                    <span className="text-14 text-muted">{t("account.valid_range", { from: formatLongDate(startOf(promo), locale), to: formatLongDate(expiryOf(promo), locale) })}</span>
                  </span>
                  <ChevronRight className={`size-icon shrink-0 ${open ? "rotate-90" : ""}`} aria-hidden />
                </button>
                {open ? (
                  <div className="mt-2 grid gap-3">
                    <p className="w-fit rounded-1 bg-accent-soft px-4 py-2 text-18 font-extrabold tabular-nums">{promo.code}</p>
                    <p className="whitespace-pre-line">{htmlToText(promo.content)}</p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
