import { displayPrice } from "@/lib/trip-filters";
import type { Trip } from "@/schemas/trip";

const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/**
 * `renderTextPrice` web cũ: chỉ khi show_price !== 0. Có giảm giá → giá niêm yết gạch + giá lớn; min===max → một giá;
 * khác → "Từ" + giá thấp nhất. Giá nổi chữ ink đậm 32/40 (cùng quy tắc chọn giá với bộ lọc: lib/trip-filters), ghi chú VAT 14px.
 */
export function PriceBox({ trip, t }: { trip: Trip; t: (key: string, vars?: Record<string, string | number>) => string }) {
  if (trip.route.show_price === 0) return null;
  const { price } = trip;
  const percent = price.percent ?? 0;
  const listPrice = (price as { price_temp?: number }).price_temp;
  const hasRange = percent <= 0 && price.min !== (price.max ?? price.min);
  const main = displayPrice(trip) ?? price.min;
  return (
    <div className="hv-trip-price">
      {percent > 0 && listPrice ? <s>{money(listPrice)}</s> : null}
      <strong>
        {hasRange ? <small>{t("booking_infor.from")} </small> : null}
        {money(main)}
      </strong>
      <small>{t("list_trip.vat")}</small>
    </div>
  );
}
