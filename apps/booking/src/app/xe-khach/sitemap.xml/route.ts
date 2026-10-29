import popularRoutes from "@/content/popular-routes.json";
import { LOCALES, localePrefix } from "@/i18n/t";
import { publicOrigin } from "@/lib/public-origin";
import { isIndexableLocale } from "@/lib/route-landing-build";
import { getBookingConfig } from "@/lib/booking-config-source";
import { getRouteLanding } from "@/lib/route-landing";

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * `/xe-khach/sitemap.xml`: /xe-khach + các tuyến phổ biến (vi) và bản locale khác chỉ khi có nội dung thật
 * (hiện chỉ vi). `lastmod` từ `updated_at` của WP khi có. Nằm ngoài [lang]; proxy.ts bỏ qua đường dẫn có dấu chấm
 * nên request tới thẳng handler này. Cache 1 giờ qua `Cache-Control` (WP sập → tuyến đó không có lastmod).
 */
export async function GET() {
  const origin = publicOrigin();
  const locales = LOCALES.filter(isIndexableLocale);
  const entries: Array<{ loc: string; lastmod?: string }> = locales.map((l) => ({ loc: `${origin}${localePrefix(l)}/xe-khach` }));
  const popular = new Set(popularRoutes.map((r) => r.slug));
  // Trang tuyến của 4 tuyến chính mà CMS không biết (vd my-dinh/moc-chau): chỉ vào sitemap khi WP đã có bài (trang mới index được).
  const config = await getBookingConfig();
  const extra = [...new Set(config.corridors.flatMap((c) => [c.landing.ab, c.landing.ba]).filter((s): s is string => !!s && !popular.has(s)))];
  const routes = (
    await Promise.all(
      [...popular, ...extra].map(async (slug) => {
        const [start, end] = slug.split("/");
        const wp = await getRouteLanding(start, end);
        return popular.has(slug) || wp ? { slug, lastmod: wp?.updated_at ?? undefined } : null;
      }),
    )
  ).filter((r): r is { slug: string; lastmod: string | undefined } => r !== null);
  for (const l of locales) for (const r of routes) entries.push({ loc: `${origin}${localePrefix(l)}/xe-khach/${r.slug}`, lastmod: r.lastmod });

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${esc(e.lastmod)}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
