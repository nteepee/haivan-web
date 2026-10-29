import type { Metadata } from "next";
import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import popularRoutes from "@/content/popular-routes.json";
import { FALLBACK_ROUTE_ART, ROUTE_CARD_ART, artAlt, type Art } from "@/components/route-landing/route-art";
import { SearchForm } from "@/components/search/search-form";
import { Rail } from "@/components/ui/rail";
import { isLocale, localePrefix, translate } from "@/i18n/t";
import { getBookingConfig } from "@/lib/booking-config-source";
import { corridorSearchHref, localized } from "@/lib/corridors";
import { isIndexableLocale } from "@/lib/route-landing-build";

export async function generateMetadata({ params }: PageProps<"/[lang]/xe-khach">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "vi";
  return {
    title: { absolute: translate(locale, "xe_khach.title") },
    description: translate(locale, "xe_khach.description"),
    alternates: { canonical: `${localePrefix(locale)}/xe-khach`, languages: { vi: "/xe-khach", "x-default": "/xe-khach" } },
    // en chưa có nội dung riêng: noindex và không khai báo hreflang.
    ...(isIndexableLocale(locale) ? {} : { robots: { index: false, follow: true } }),
  };
}

interface Card {
  key: string;
  name: string;
  art: Art;
  runTime?: string | number;
  price?: string;
  href: string;
}

/** /xe-khach: banner + thẻ tìm vé, rồi các tuyến phổ biến (rail thẻ ảnh 16:9 cuộn snap + mũi tên, giờ, "Từ giá", nút Đặt vé; cả thẻ là vùng bấm). */
export default async function Page({ params }: PageProps<"/[lang]/xe-khach">) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "vi";
  const p = localePrefix(locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const config = await getBookingConfig();
  // Thẻ tuyến = 4 tuyến chính từ cấu hình (như trang chủ WP): thẻ → trang tuyến chiều a → b, chưa có trang thì tìm chuyến sẵn theo tuyến.
  // Giờ chạy/giá lấy từ danh sách tuyến phổ biến khi có trang tuyến tương ứng. Không có tuyến chính nào → danh sách tuyến phổ biến cũ.
  const cards: Card[] = config.corridors.length
    ? config.corridors.map((c) => {
        const slug = c.landing.ab;
        const known = slug ? popularRoutes.find((r) => r.slug === slug) : undefined;
        return {
          key: c.id,
          name: localized(c.label, locale),
          art: (slug && ROUTE_CARD_ART[slug]) || FALLBACK_ROUTE_ART,
          runTime: known?.run_time,
          price: known?.price_avg,
          href: slug ? `${p}/xe-khach/${slug}` : corridorSearchHref(c, p),
        };
      })
    : popularRoutes.map((r) => ({
        key: r.slug,
        name: r.name.replace(" - ", ` ${t("route.to")} `),
        art: ROUTE_CARD_ART[r.slug] ?? FALLBACK_ROUTE_ART,
        runTime: r.run_time,
        price: r.price_avg,
        href: `${p}/xe-khach/${r.slug}`,
      }));
  return (
    <>
      <section aria-labelledby="xe-khach-h1">
        <div className="hv-section-yellow">
          <div className="hv-container hv-rhero">
            <div className="hv-rhero-text">
              <h1 id="xe-khach-h1">{t("xe_khach.h1")}</h1>
            </div>
          </div>
        </div>
        <div className="hv-rplate-bleed">
          <div className="hv-container hv-rplate-wrap">
            <div id="tim-ve" className="hv-rplate">
              <SearchForm mode="corridor" todayChips />
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="popular-routes" className="hv-section hv-section-white">
        <div className="hv-container">
          <Rail label={t("popular_routes.popular_routes")} head={<h2 id="popular-routes">{t("popular_routes.popular_routes")}</h2>}>
            {cards.map((c, i) => (
              <li key={c.key} className="hv-rcard">
                <div className="hv-rcard-img">
                  <Image src={c.art.src} alt={artAlt(c.art, locale)} width={c.art.width} height={c.art.height} unoptimized {...(i === 0 ? { priority: true } : { loading: i < 3 ? "eager" : "lazy" })} />
                </div>
                <div className="hv-rcard-body">
                  <h3>{c.name}</h3>
                  {c.runTime ? (
                    <p className="hv-rcard-time">
                      <Clock className="size-6" aria-hidden />
                      <span className="hv-tabular">{t("route.hours_value", { n: String(c.runTime).replace(/h$/i, "") })}</span>
                    </p>
                  ) : null}
                  {c.price ? (
                    <p className="hv-rcard-price">
                      <small>{t("route.from")}</small> <strong>{c.price.replace(/^\s*từ\s+/i, "")}</strong>
                    </p>
                  ) : null}
                  <Link href={c.href} className="hv-btn hv-btn-primary hv-btn-sm hv-rcard-go" aria-label={`${t("route.book_ticket")} ${c.name}`}>
                    {t("route.book_ticket")}
                  </Link>
                </div>
              </li>
            ))}
          </Rail>
        </div>
      </section>
    </>
  );
}
