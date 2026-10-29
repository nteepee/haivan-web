import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { artAlt, type Art } from "./route-art";

interface Fact {
  label: string;
  value: string;
}

/** Tách phụ đề "Từ 485.000đ · 11h · 500 km" thành ba số liệu có nhãn (giá, giờ, km); khoản nào thiếu thì bỏ. */
function facts(view: RouteLandingView, t: (key: string, vars?: Record<string, string | number>) => string): Fact[] {
  const out: Fact[] = [];
  for (const part of (view.subline ?? "").split(" · ")) {
    const hour = part.match(/^(\d+(?:[.,]\d+)?)h$/);
    if (hour) out.push({ label: t("route.fact_time"), value: t("route.hours_value", { n: hour[1] }) });
    else if (/km$/i.test(part)) out.push({ label: t("route.fact_distance"), value: part });
    else if (part) out.push({ label: t("route.fact_price"), value: part.replace(/^\s*từ\s+/i, "") });
  }
  return out;
}

/**
 * Banner trang tuyến (v3): dải vàng thương hiệu có H1, ba số liệu, ảnh xe riêng của tuyến (nếu có); thẻ tìm vé (children) nằm đè mép dưới.
 * `#tim-ve` là đích của nút CTA cuối trang.
 */
export function RouteHero({ view, locale, art, reverse, children }: { view: RouteLandingView; locale: Locale; art?: Art; reverse?: { href: string; text: string } | null; children: ReactNode }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const items = facts(view, t);
  return (
    <section aria-labelledby="route-h1">
      <div className="hv-section-yellow">
        <div className="hv-container hv-rhero">
          <div className="hv-rhero-text">
            <h1 id="route-h1">{view.h1}</h1>
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
