import type { Metadata } from "next";
import popularRoutes from "@/content/popular-routes.json";
import { RouteLandingPage } from "@/components/route-landing/route-landing-page";
import { RouteSearchForm } from "@/components/trips/route-trips";
import { isLocale, LOCALES, localePrefix } from "@/i18n/t";
import { buildRouteLanding, isIndexableLocale } from "@/lib/route-landing-build";
import { publicOrigin } from "@/lib/public-origin";
import { routeTemplate } from "@/lib/route-landing-template";
import { getBookingConfig } from "@/lib/booking-config-source";
import { corridorLanding, corridorListing } from "@/lib/corridor-landing";
import { getRouteLanding } from "@/lib/route-landing";
import { getRouteListing } from "@/lib/route-listing";

export async function generateStaticParams() {
  // Tuyến phổ biến + trang tuyến của 4 tuyến chính trong cấu hình (kể cả chiều CMS không biết, vd my-dinh/moc-chau).
  const config = await getBookingConfig();
  const slugs = new Set(popularRoutes.map((r) => r.slug));
  for (const c of config.corridors) for (const slug of [c.landing.ab, c.landing.ba]) if (slug) slugs.add(slug);
  return [...slugs].map((slug) => {
    const [start, end] = slug.split("/");
    return { start, end };
  });
}

/** WP chỉ có nội dung tiếng Việt: bản khác vi dùng mẫu + CMS (xem `isIndexableLocale`). */
async function loadView(lang: string, start: string, end: string) {
  const locale = isLocale(lang) ? lang : "vi";
  // CMS trước: tuyến lạ không kéo thêm request WP (và không tạo cache rác); lỗi tạm của CMS ném lên để trả 500/giữ HTML ISR cũ.
  const cmsRoute = await getRouteListing(start, end);
  const config = await getBookingConfig();
  const slug = `${start}/${end}`;
  const corridor = corridorLanding(config, slug);
  let route = cmsRoute;
  let wp = null;
  if (route) {
    wp = isIndexableLocale(locale) ? await getRouteLanding(start, end) : null;
  } else if (corridor) {
    // CMS không biết tuyến nhưng đây là trang tuyến của một tuyến chính: dựng từ bài WP (hv_route) + toạ độ đầu tuyến;
    // chuyến lấy từ apigw như mọi trang tuyến. Bản vi cần có bài WP mới index; chưa có bài → giữ hành vi cũ (200 + noindex, chỉ form).
    wp = isIndexableLocale(locale) ? await getRouteLanding(start, end) : null;
    if (isIndexableLocale(locale) && !wp) return null;
    route = corridorListing(corridor, slug, locale);
  }
  if (!route) return null;
  const view = buildRouteLanding(wp, route, routeTemplate(locale));
  // Nút "Xem chiều ngược lại": trang chiều ngược của tuyến chính nếu đã có; không thì liên kết reverse_route của bài WP.
  const reversePath = corridor?.reverseSlug ?? view.reverseRoute?.path ?? null;
  return { route, locale, view, corridor, reversePath };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/xe-khach/[start]/[end]">): Promise<Metadata> {
  const { lang, start, end } = await params;
  const loaded = await loadView(lang, start, end);
  // Tuyến CMS không biết: như web cũ nhưng noindex; title tuyệt đối để không bị thêm hậu tố "| Hải Vân".
  if (!loaded) return { title: { absolute: "Xe khách Hải Vân" }, robots: { index: false } };
  const { locale, view } = loaded;
  const path = `/xe-khach/${start}/${end}`;
  // hreflang chỉ liệt kê bản có nội dung thật; x-default → vi.
  const languages: Record<string, string> = { vi: path, "x-default": path };
  for (const l of LOCALES) if (l !== "vi" && isIndexableLocale(l)) languages[l] = `${localePrefix(l)}${path}`;
  return {
    title: { absolute: view.title },
    description: view.description,
    alternates: { canonical: `${localePrefix(locale)}${path}`, languages },
    ...(isIndexableLocale(locale) ? {} : { robots: { index: false, follow: true } }),
  };
}

/** Trang tuyến: slug sai vẫn 200 như web cũ nhưng noindex và chỉ hiện form tìm. */
export default async function Page({ params }: PageProps<"/[lang]/xe-khach/[start]/[end]">) {
  const { lang, start, end } = await params;
  const loaded = await loadView(lang, start, end);
  if (!loaded) {
    return (
      <div className="hv-container hv-app-main">
        <RouteSearchForm />
      </div>
    );
  }
  const { route, locale, view, reversePath } = loaded;
  const { start_place: s, end_place: e } = route.data;
  return (
    <RouteLandingPage
      view={view}
      reversePath={reversePath}
      locale={locale}
      places={{ from: { name: s.name, lat: s.lat, lng: s.lng }, to: { name: e.name, lat: e.lat, lng: e.lng } }}
      origin={publicOrigin()}
      start={start}
      end={end}
    />
  );
}
