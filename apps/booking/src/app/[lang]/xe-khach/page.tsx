import type { Metadata } from "next";
import { ArrowRight, Clock, Headphones, MapPin, ShieldCheck } from "lucide-react";
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
            <h1 id="xe-khach-h1" aria-label={homeCopy.title}>
              <span>{isVi ? "Tử tế" : "Kindness"}</span>
              <span>{isVi ? "Từ tâm" : "From the heart"}</span>
            </h1>
            <div className="hv-home-statement">
              <span aria-hidden />
              <p className="hv-home-lead">{homeCopy.lead}</p>
            </div>
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

      <section aria-labelledby="home-offers" className="hv-section hv-section-tint hv-home-offers">
        <div className="hv-container">
          <div className="hv-sec-head">
            <div className="hv-head-block">
              <p className="hv-home-eyebrow">{isVi ? "Đặc quyền hành khách" : "Passenger benefits"}</p>
              <h2 id="home-offers">{isVi ? "Ưu đãi hôm nay" : "Today’s offers"}</h2>
              <p className="hv-lead">{isVi ? "Đặt vé thuận tiện hơn với những ưu đãi thiết thực cho mỗi hành trình." : "Make every journey easier with practical booking benefits."}</p>
            </div>
          </div>
          <div className="hv-home-offer-grid">
            <article className="hv-home-offer hv-home-offer-main">
              <Image src="/assets/design/banner-app50.jpg" alt={isVi ? "Ưu đãi đặt vé trên ứng dụng Hải Vân" : "Hải Vân app booking offer"} fill sizes="(min-width: 960px) 58vw, 100vw" />
              <div className="hv-home-offer-copy">
                <p>{isVi ? "Ưu đãi trên ứng dụng" : "App exclusive"}</p>
                <h3>{isVi ? "Giảm đến 50% khi đặt vé lần đầu" : "Save up to 50% on your first booking"}</h3>
                <a href="#app-band-title" className="hv-btn hv-btn-primary hv-btn-sm">
                  {isVi ? "Tải ứng dụng" : "Get the app"}
                  <ArrowRight aria-hidden />
                </a>
              </div>
            </article>
            <article className="hv-home-offer hv-home-offer-side">
              <Image src="/assets/design/xe-luxury.webp" alt={isVi ? "Không gian xe limousine Hải Vân" : "Hải Vân limousine interior"} fill sizes="(min-width: 960px) 34vw, 100vw" />
              <div className="hv-home-offer-copy">
                <p>{isVi ? "Nâng tầm trải nghiệm" : "Elevated comfort"}</p>
                <h3>{isVi ? "Limousine tiện nghi, riêng tư" : "Private, comfortable limousine travel"}</h3>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="home-destinations" className="hv-section hv-section-white">
        <div className="hv-container">
          <Rail
            label={isVi ? "Danh sách điểm đến" : "Destination list"}
            head={
              <div className="hv-head-block">
                <p className="hv-home-eyebrow">{isVi ? "Gợi ý hành trình" : "Journey inspiration"}</p>
                <h2 id="home-destinations">{isVi ? "Điểm đến đáng nhớ" : "Memorable destinations"}</h2>
                <p className="hv-lead">{isVi ? "Khám phá những miền đất Hải Vân kết nối mỗi ngày." : "Discover the places Hải Vân connects every day."}</p>
              </div>
            }
          >
            {[
              ["dest-vungtau.jpg", "Vũng Tàu", isVi ? "Biển xanh gần thành phố" : "A seaside escape"],
              ["dest-dienbien.jpg", "Điện Biên", isVi ? "Dấu ấn lịch sử Tây Bắc" : "History in the Northwest"],
              ["dest-sapa.jpg", "Sa Pa", isVi ? "Sương núi và bản làng" : "Mountain mist and villages"],
              ["dest-hagiang.jpg", "Hà Giang", isVi ? "Cung đường của đá và hoa" : "Roads of stone and flowers"],
            ].map(([image, title, description]) => (
              <li key={title} className="hv-home-destination">
                <div className="hv-home-destination-media">
                  <Image src={`/assets/design/${image}`} alt={title} fill sizes="(min-width: 640px) 280px, 82vw" />
                </div>
                <div className="hv-home-destination-copy">
                  <p>{description}</p>
                  <h3>{title}</h3>
                </div>
              </li>
            ))}
          </Rail>
        </div>
      </section>

      <section aria-labelledby="home-lounges" className="hv-section hv-home-lounges">
        <div className="hv-container hv-home-lounge-grid">
          <div className="hv-home-lounge-copy">
            <p className="hv-home-eyebrow">{isVi ? "Chờ chuyến cũng là trải nghiệm" : "Comfort before departure"}</p>
            <h2 id="home-lounges">{isVi ? "Phòng chờ tử tế, hành trình an tâm" : "Thoughtful lounges, calmer journeys"}</h2>
            <p className="hv-lead">{isVi ? "Không gian sạch sẽ, thuận tiện và luôn có nhân viên hỗ trợ để hành khách bắt đầu chuyến đi thật nhẹ nhàng." : "Clean, convenient spaces with real support help every journey begin with ease."}</p>
            <div className="hv-home-lounge-points">
              <span><ShieldCheck aria-hidden /> {isVi ? "An toàn, sạch sẽ" : "Safe and clean"}</span>
              <span><Headphones aria-hidden /> {isVi ? "Hỗ trợ tận tâm" : "Real support"}</span>
            </div>
          </div>
          <div className="hv-home-lounge-collage">
            <div className="hv-home-lounge-main"><Image src="/assets/design/phong_cho_1.jpg" alt={isVi ? "Phòng chờ Hải Vân" : "Hải Vân passenger lounge"} fill sizes="(min-width: 960px) 45vw, 100vw" /></div>
            <div><Image src="/assets/design/phong_cho_2.jpg" alt={isVi ? "Khu vực ghế ngồi phòng chờ" : "Lounge seating area"} fill sizes="(min-width: 960px) 22vw, 50vw" /></div>
            <div><Image src="/assets/design/phong_cho_3.jpg" alt={isVi ? "Quầy hỗ trợ hành khách" : "Passenger support desk"} fill sizes="(min-width: 960px) 22vw, 50vw" /></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="home-news" className="hv-section hv-section-white">
        <div className="hv-container">
          <Rail
            label={isVi ? "Tin tức Hải Vân" : "Hải Vân news"}
            head={
              <div className="hv-head-block">
                <p className="hv-home-eyebrow">{isVi ? "Câu chuyện trên đường" : "Stories from the road"}</p>
                <h2 id="home-news">{isVi ? "Tin mới từ Hải Vân" : "Latest from Hải Vân"}</h2>
              </div>
            }
          >
            {[
              ["news-1.jpg", isVi ? "Kinh nghiệm chuẩn bị cho một chuyến đi đường dài" : "How to prepare for a long-distance journey"],
              ["news-2.jpg", isVi ? "Những điều cần biết khi đặt vé xe trực tuyến" : "What to know when booking coach tickets online"],
              ["news-3.jpg", isVi ? "Hải Vân nâng chuẩn trải nghiệm hành khách" : "Hải Vân raises the passenger experience standard"],
            ].map(([image, title]) => (
              <li key={title} className="hv-home-news-card">
                <div className="hv-home-news-media"><Image src={`/assets/design/${image}`} alt="" fill sizes="(min-width: 640px) 280px, 82vw" /></div>
                <div className="hv-home-news-copy">
                  <p>{isVi ? "Cẩm nang hành trình" : "Travel guide"}</p>
                  <h3>{title}</h3>
                  <span>{isVi ? "Đọc thêm" : "Read more"} <ArrowRight aria-hidden /></span>
                </div>
              </li>
            ))}
          </Rail>
        </div>
      </section>
    </>
  );
}
