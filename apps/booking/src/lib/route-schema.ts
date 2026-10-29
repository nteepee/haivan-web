import type { Locale } from "@/i18n/t";
import { localePrefix } from "@/i18n/t";
import type { RouteLandingView } from "./route-landing-build";

/** Các đối tượng JSON-LD của trang tuyến (hàm thuần để test). `origin` lấy từ `publicOrigin()` (không có dấu "/" cuối). */
export function routeJsonLd(view: RouteLandingView, opts: { origin: string; locale: Locale; start: string; end: string }): object[] {
  const { origin, locale, start, end } = opts;
  const p = localePrefix(locale);
  const url = `${origin}${p}/xe-khach/${start}/${end}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hải Vân", item: `${origin}${p || "/"}` },
      { "@type": "ListItem", position: 2, name: locale === "en" ? "Bus tickets" : "Xe khách", item: `${origin}${p}/xe-khach` },
      { "@type": "ListItem", position: 3, name: `${view.start} - ${view.end}`, item: url },
    ],
  };
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: view.h1,
    url,
    serviceType: locale === "en" ? "Intercity bus" : "Xe khách liên tỉnh",
    // Inline: Rank Math không phát @id /#organization nên tham chiếu @id sẽ treo.
    provider: { "@type": "Organization", name: "Hải Vân", url: origin },
    areaServed: [view.start, view.end],
    ...(view.priceValue ? { offers: { "@type": "Offer", price: view.priceValue, priceCurrency: "VND", url } } : {}),
  };
  const out: object[] = [breadcrumb, service];
  if (view.faq.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: view.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return out;
}
