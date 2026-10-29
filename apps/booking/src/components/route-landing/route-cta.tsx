import { translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";

/** Dải đặt vé cuối trang: nút vàng duy nhất cuộn về thẻ tìm vé (`#tim-ve`). */
export function RouteCta({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  return (
    <section aria-labelledby="route-cta" className="hv-section hv-ground">
      <div className="hv-container hv-cta">
        <div className="grid gap-2">
          <h2 id="route-cta">{t("route.cta_title")}</h2>
          <p className="hv-lead text-ink">{t("route.cta_text")}</p>
        </div>
        <a href="#tim-ve" className="hv-btn hv-btn-primary hv-btn-lg">
          {t("route.cta_button", { a: view.start, b: view.end })}
        </a>
      </div>
    </section>
  );
}
