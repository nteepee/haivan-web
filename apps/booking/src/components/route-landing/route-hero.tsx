import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { localePrefix, translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { artAlt, type Art } from "./route-art";

interface Fact {
  label: string;
  value: string;
}

/**
 * Số liệu có nhãn: giá "từ" (giá thấp nhất các chuyến hôm nay, chỉ khi lấy được), rồi số liệu WP nhập (tối đa 3);
 * không có thì giờ và km tách từ phụ đề "11h · 500 km". Khoản nào thiếu thì bỏ.
 */
function facts(view: RouteLandingView, t: (key: string, vars?: Record<string, string | number>) => string): Fact[] {
  const out: Fact[] = view.priceLabel ? [{ label: t("route.fact_price"), value: view.priceLabel }] : [];
  // Số liệu WP nhập (vd "15–30 phút · Một chuyến") thay cho giờ chạy + km của CMS.
  if (view.facts.length) return [...out, ...view.facts.slice(0, 3).map((f) => ({ label: f.label, value: f.value }))];
  for (const part of (view.subline ?? "").split(" · ")) {
    const hour = part.match(/^(\d+(?:[.,]\d+)?)h$/);
    if (hour) out.push({ label: t("route.fact_time"), value: t("route.hours_value", { n: hour[1] }) });
    else if (/km$/i.test(part)) out.push({ label: t("route.fact_distance"), value: part });
  }
  return out;
}

/** H1 hai vế (v2): vế điểm đến tô vàng đậm bằng <em>; chữ H1 giữ nguyên, nếu không thấy điểm đến thì in nguyên chuỗi. */
function splitH1(h1: string, end: string): ReactNode {
  const at = end ? h1.indexOf(end) : -1;
  if (at < 0) return h1;
  return (
    <>
      {h1.slice(0, at)}
      <em>{end}</em>
      {h1.slice(at + end.length)}
    </>
  );
}

/**
 * Đầu trang tuyến (v2, như banner trang chủ): ảnh nền tối dần sang trái, đường dẫn, nhãn, H1 (điểm đến tô vàng), đoạn dẫn,
 * số liệu ngăn bằng vạch mảnh, liên kết chiều ngược. Banner thấp hơn trang chủ để thẻ tìm vé (children, đè mép dưới)
 * lọt màn hình đầu. `#tim-ve` là đích của nút CTA cuối trang.
 */
export function RouteHero({ view, locale, photo, reverse, children }: { view: RouteLandingView; locale: Locale; photo: Art; reverse?: { href: string; text: string } | null; children: ReactNode }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const items = facts(view, t);
  const prefix = localePrefix(locale);
  return (
    <section aria-labelledby="route-h1" className="hv-rhero2-wrap">
      <div className="hv-rhero2">
        <Image src={photo.src} alt={artAlt(photo, locale)} width={photo.width} height={photo.height} priority unoptimized className="hv-rhero2-img" />
        <div className="hv-container hv-rhero2-copy">
          <nav className="hv-crumbs" aria-label={t("route.crumb_label")}>
            <Link href={prefix || "/"}>{t("route.crumb_home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`${prefix}/xe-khach`}>{t("route.crumb_coach")}</Link>
          </nav>
          <p className="hv-rhero2-eyebrow">{t("route.eyebrow")}</p>
          <h1 id="route-h1">{splitH1(view.h1, view.end)}</h1>
          {view.intro ? <p className="hv-rhero2-lead">{view.intro}</p> : null}
          {items.length ? (
            <dl className="hv-rhero2-facts">
              {items.map((f) => (
                <div key={f.label}>
                  <dd>{f.value}</dd>
                  <dt>{f.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
          {reverse ? (
            <p className="hv-rhero2-links">
              <Link href={reverse.href}>
                {reverse.text}
                <span aria-hidden="true">↗</span>
              </Link>
            </p>
          ) : null}
        </div>
      </div>
      <div className="hv-rplate-bleed">
        <div className="hv-container hv-rplate-wrap">
          <div id="tim-ve" className="hv-rplate">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
