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
 * Số liệu có nhãn: giá "từ" (giá thấp nhất các chuyến hôm nay, chỉ khi lấy được), rồi giờ và km tách từ phụ đề "11h · 500 km";
 * khoản nào thiếu thì bỏ.
 */
function facts(view: RouteLandingView, t: (key: string, vars?: Record<string, string | number>) => string): Fact[] {
  const out: Fact[] = view.priceLabel ? [{ label: t("route.fact_price"), value: view.priceLabel }] : [];
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
 * Đầu trang tuyến (v2): đường dẫn, dòng "01 · Nhãn", H1 hai vế, đoạn dẫn, ba số liệu ngăn bằng vạch mảnh, ảnh xe riêng của tuyến (nếu có);
 * thẻ tìm vé (children) nằm đè mép dưới. `#tim-ve` là đích của nút CTA cuối trang.
 */
export function RouteHero({ view, locale, art, reverse, children }: { view: RouteLandingView; locale: Locale; art?: Art; reverse?: { href: string; text: string } | null; children: ReactNode }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const items = facts(view, t);
  const prefix = localePrefix(locale);
  return (
    <section aria-labelledby="route-h1">
      <div className="hv-section-yellow hv-rhead">
        <div className="hv-container">
          <nav className="hv-crumbs" aria-label={t("route.crumb_label")}>
            <Link href={prefix || "/"}>{t("route.crumb_home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`${prefix}/xe-khach`}>{t("route.crumb_coach")}</Link>
          </nav>
        </div>
        <div className="hv-container hv-rhero">
          <div className="hv-rhero-text">
            <p className="hv-eyebrow">
              {t("route.eyebrow")}
            </p>
            <h1 id="route-h1">{splitH1(view.h1, view.end)}</h1>
            {reverse ? (
              <p>
                <Link href={reverse.href} className="hv-link">
                  {reverse.text}
                </Link>
              </p>
            ) : null}
            {view.intro ? <p className="hv-lead text-ink">{view.intro}</p> : null}
            {items.length ? (
              <dl className="hv-facts">
                {items.map((f) => (
                  <div key={f.label}>
                    <dd>{f.value}</dd>
                    <dt>{f.label}</dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          {art ? <Image src={art.src} alt={artAlt(art, locale)} width={art.width} height={art.height} priority unoptimized className="hv-rhero-art" /> : null}
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
