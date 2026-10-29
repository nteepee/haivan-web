"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useBookingConfig } from "@/components/booking-config-provider";
import { useLocale, useT } from "@/components/providers";
import { useToday } from "@/hooks/use-today";
import { corridorSearchPoints, findCorridor, localized, reverseChieu, stopsFromParams, stopsToParams, endsFor } from "@/lib/corridors";
import { isoToDmy } from "@/lib/format";
import { promoLabel, roundtripPromoForOutbound } from "@/lib/promo-match";
import { readReturnCarry, saveReturnCarry } from "@/lib/roundtrip-carry";
import { appendCorridorParams, buildSearchUrl, type CorridorParams } from "@/lib/search-url";
import { localePrefix } from "@/i18n/t";
import { useBookingDraft } from "@/stores/booking-draft";

/** Ý định chiều về của đơn `order`: nháp (nếu còn) trước, rồi bản đã ghi lúc đặt xong chiều đi. */
function useReturnIntent(order: string, tickets: number | undefined): { own: CorridorParams; guests: number } | null {
  const draft = useBookingDraft((s) => s.draft);
  const fromDraft = draft?.order_code === order ? draft.search.corridor : undefined;
  // Chỉ chiều đi có ngày về mới mời đặt chiều về (chặng về thì không mời tiếp).
  const usable = (own: CorridorParams | undefined): own is CorridorParams => !!own?.ngayVe && own.chang !== "ve";
  if (usable(fromDraft)) return { own: fromDraft, guests: tickets || draft?.seats.length || 1 };
  const carry = readReturnCarry(order);
  return carry && usable(carry.own) ? { own: carry.own, guests: tickets || carry.guests } : null;
}

/**
 * Trang thành công của chiều đi: thẻ "Đặt chiều về <ngày>" dẫn tới tìm chuyến chiều ngược (ngày về, trạm đổi vai, `chang=ve`, `don_di`).
 * Nhãn khứ hồi chỉ hiện khi chương trình đang chạy cho chiều về; chiều về vẫn là một đơn riêng.
 */
export function ReturnCta({ order, tickets, paid }: { order: string; tickets?: number; paid: boolean }) {
  const t = useT();
  const locale = useLocale();
  const config = useBookingConfig();
  const today = useToday();
  const intent = useReturnIntent(order, tickets);
  // Trang thành công xoá nháp ngay khi đơn tải xong: ghi lại ý định để thẻ còn khi nháp biến mất (và khi mở lại trang).
  const { own: intentOwn, guests: intentGuests } = intent ?? {};
  useEffect(() => {
    if (intentOwn) saveReturnCarry(order, intentOwn, intentGuests ?? 1);
  }, [order, intentOwn, intentGuests]);
  const corridor = findCorridor(config, intent?.own.tuyen);
  const ngayVe = intent?.own.ngayVe;
  // Ngày về đã qua (mở lại trang muộn) thì không mời đặt nữa.
  // Chỉ mời đặt chiều về khi đơn chiều đi đã thanh toán.
  if (!paid || !intent || !corridor || !ngayVe || !today || ngayVe < today) return null;

  const chieu = reverseChieu(intent.own.chieu);
  const picks = stopsFromParams(corridor, intent.own.chieu, intent.own.diemDi, intent.own.diemDen);
  const points = corridorSearchPoints(corridor, chieu, picks);
  const ids = stopsToParams(chieu, picks);
  const url = appendCorridorParams(
    buildSearchUrl({ ...points, date: ngayVe, numberGuest: intent.guests, type: 2 }, localePrefix(locale)),
    { tuyen: corridor.id, chieu, diemDi: ids.diemDi, diemDen: ids.diemDen, ngayVe: null, chang: "ve", donDi: order, gio: null },
  );
  const date = isoToDmy(ngayVe).replaceAll("-", "/");
  const ends = endsFor(corridor, chieu);
  const promo = roundtripPromoForOutbound(config, corridor.id, intent.own.chieu, { returnDate: ngayVe, seatCount: intent.guests });
  return (
    <section className="hv-card hv-return-cta grid gap-3 p-card" aria-labelledby="return-cta-title">
      <h2 id="return-cta-title" className="text-h3">
        {t("corridor.return_title", { date })}
      </h2>
      {promo ? <span className="hv-badge hv-badge-sale w-fit">{promoLabel(promo, locale)}</span> : null}
      <p className="font-semibold">{t("corridor.return_route", { from: localized(ends.from, locale), to: localized(ends.to, locale), date, n: intent.guests })}</p>
      <p className="text-muted">{t("corridor.return_text")}</p>
      <Link href={url} className="hv-btn hv-btn-primary hv-btn-lg w-fit">
        {t("corridor.return_button", { date })}
      </Link>
    </section>
  );
}
