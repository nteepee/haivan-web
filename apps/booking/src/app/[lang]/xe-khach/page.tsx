import type { Metadata } from "next";
import { Clock, Headphones, MapPin, ShieldCheck } from "lucide-react";
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
  const isVi = locale === "vi";
  const homeCopy = isVi
    ? {
        eyebrow: "Hành trình tử tế",
        title: "Tử tế từ tâm, an tâm từng chuyến",
        lead: "Đặt vé Hải Vân nhanh chóng, minh bạch và luôn có người đồng hành khi bạn cần.",
        search: "Tìm chuyến phù hợp",
        searchHint: "Chọn hành trình của bạn, chúng tôi lo phần còn lại.",
        routesHint: "Những hành trình được khách hàng lựa chọn nhiều nhất.",
        trust: [
          ["An toàn là ưu tiên", "Đội ngũ chuyên nghiệp, phương tiện được kiểm tra định kỳ."],
          ["Đón trả thuận tiện", "Điểm đón rõ ràng và hỗ trợ trung chuyển theo từng tuyến."],
          ["Hỗ trợ tận tâm", "Luôn có người đồng hành trước, trong và sau chuyến đi."],
        ],
      }
    : {
        eyebrow: "A journey with heart",
        title: "Kind at heart, calm on every journey",
        lead: "Book Hải Vân quickly and transparently, with real support whenever you need it.",
        search: "Find your trip",
        searchHint: "Choose your journey. We will take care of the rest.",
        routesHint: "The journeys our passengers choose most often.",
        trust: [
          ["Safety first", "Professional teams and regularly inspected vehicles."],
          ["Convenient pickup", "Clear pickup points and route-specific transfers."],
          ["Care that stays", "Real support before, during, and after your journey."],
        ],
      };
  const trustIcons = [ShieldCheck, MapPin, Headphones];
  return (
    <>
      <section aria-labelledby="xe-khach-h1" className="hv-home-hero">
        <div className="hv-container hv-home-hero-grid">
          <div className="hv-home-hero-copy">
            <p className="hv-home-eyebrow">{homeCopy.eyebrow}</p>
            <h1 id="xe-khach-h1">{homeCopy.title}</h1>
            <p className="hv-home-lead">{homeCopy.lead}</p>
          </div>
          <div className="hv-home-hero-media">
            <Image src="/assets/design/home-hero.jpg" alt={isVi ? "Xe khách Hải Vân trên hành trình" : "Hải Vân coach on the road"} fill priority sizes="(min-width: 960px) 55vw, 100vw" />
            <span className="hv-home-slash" aria-hidden />
          </div>
        </div>
        <div className="hv-container hv-home-search-wrap">
          <div className="hv-home-search-head">
            <div>
              <p className="hv-home-eyebrow">{homeCopy.search}</p>
              <p>{homeCopy.searchHint}</p>
            </div>
          </div>
          <div id="tim-ve" className="hv-rplate">
            <SearchForm mode="corridor" todayChips />
          </div>
        </div>
      </section>
      <section aria-label={isVi ? "Cam kết dịch vụ" : "Service commitments"} className="hv-home-trust">
        <div className="hv-container hv-home-trust-grid">
          {homeCopy.trust.map(([title, description], index) => {
            const Icon = trustIcons[index];
            return (
              <article key={title} className="hv-home-trust-item">
                <Icon aria-hidden />
                <div>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="popular-routes" className="hv-section hv-section-white">
        <div className="hv-container">
          <Rail
            label={t("popular_routes.popular_routes")}
            head={
              <div className="hv-head-block">
                <p className="hv-home-eyebrow">{isVi ? "Đi cùng Hải Vân" : "Travel with Hải Vân"}</p>
                <h2 id="popular-routes">{t("popular_routes.popular_routes")}</h2>
                <p className="hv-lead">{homeCopy.routesHint}</p>
              </div>
            }
          >
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
