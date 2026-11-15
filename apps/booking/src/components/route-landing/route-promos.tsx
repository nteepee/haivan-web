import { translate, type Locale } from "@/i18n/t";
import { formatMoney } from "@/lib/format";
import type { Promo } from "@/schemas/booking-config";
import { SectionCard } from "./section-card";

/** Số điều kiện hiện sẵn; phần còn lại gập trong "Xem điều kiện áp dụng". */
const TERMS_OPEN = 2;

const pick = (v: { vi: string; en: string } | null | undefined, locale: Locale) => (v ? (locale === "en" ? v.en : v.vi) : "");

function PromoCard({ promo, locale }: { promo: Promo; locale: Locale }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const terms = locale === "en" ? promo.terms.en : promo.terms.vi;
  const headline = pick(promo.headline, locale) || pick(promo.label, locale);
  return (
    <li className="hv2r-promo">
      <p className="hv2r-promo-tag">{pick(promo.badge, locale)}</p>
      <h3>{headline}</h3>
      {promo.type === "combo" ? (
        <ul className="hv2r-promo-tiers">
          {promo.tiers.map((tier) => (
            <li key={`${tier.seats}-${tier.class}-${tier.price_vnd}`}>
              <strong>{formatMoney(tier.price_vnd, locale)}</strong>
              {tier.was_vnd ? <s>{formatMoney(tier.was_vnd, locale)}</s> : null}
              <span>{t("route.promo_tier", { seats: tier.seats, cls: tier.class || t("route.promo_any_class") })}</span>
            </li>
          ))}
        </ul>
      ) : promo.per_seat_vnd ? (
        <p className="hv2r-promo-price">
          <strong>-{formatMoney(promo.per_seat_vnd, locale)}</strong> <span>{t("route.promo_per_return_seat")}</span>
        </p>
      ) : null}
      {terms.length ? (
        <>
          <ul className="hv2r-promo-terms">
            {terms.slice(0, TERMS_OPEN).map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
          {terms.length > TERMS_OPEN ? (
            <details className="hv2r-promo-more">
              <summary>{t("route.promo_terms_more")}</summary>
              <ul className="hv2r-promo-terms">
                {terms.slice(TERMS_OPEN).map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : null}
      <a href="#tim-ve" className="hv2r-promo-go">
        {promo.type === "combo" ? t("route.promo_cta_combo", { n: promo.seats.min }) : t("route.promo_cta_roundtrip")}
        <span aria-hidden="true">→</span>
      </a>
    </li>
  );
}

/**
 * "Ưu đãi đang diễn ra" của trang tuyến (như booking.haivan.com): mỗi chương trình WP đang bật cho tuyến/chiều này một thẻ nền than —
 * huy hiệu, tiêu đề, bậc giá combo (giá gạch nếu có) hoặc mức giảm khứ hồi, điều kiện, nút cuộn về thẻ tìm vé. Không có chương trình thì không render.
 * Giá ở đây là giá tham khảo do MKT nhập; giá thật do hệ thống vé tính khi tự gắn mã ở bước xác nhận.
 */
export function RoutePromos({ promos, locale }: { promos: Promo[]; locale: Locale }) {
  if (!promos.length) return null;
  const t = (key: string) => translate(locale, key);
  return (
    <SectionCard id="route-promos" tone="dark" eyebrow={t("route.promo_eyebrow")} title={t("route.promo_title_a")} titleB={t("route.promo_title_b")} intro={<p>{t("route.promo_intro")}</p>}>
      <ul className="hv2r-promos">
        {promos.map((p) => (
          <PromoCard key={p.id} promo={p} locale={locale} />
        ))}
      </ul>
    </SectionCard>
  );
}
