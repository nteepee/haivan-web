import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import { translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { v2Image } from "./route-art";
import { SectionCard } from "./section-card";

type T = (key: string, vars?: Record<string, string | number>) => string;
const tr = (locale: Locale): T => (key, vars) => translate(locale, key, vars);

/** Ảnh v2 do WP chỉ định (tỉ lệ 4:3 cắt bằng CSS); alt là tiêu đề thẻ. */
function V2Photo({ src, alt }: { src: string; alt: string }) {
  return <Image src={v2Image(src)} alt={alt} width={800} height={600} unoptimized loading="lazy" />;
}

/** "Vì sao chọn": thẻ trắng có ảnh, vạch vàng, số thứ tự (như khối dịch vụ trang chủ). */
export function RouteReasons({ view }: { view: RouteLandingView }) {
  const r = view.reasons;
  if (!r) return null;
  return (
    <SectionCard id="route-reasons" eyebrow={r.eyebrow} title={r.title_a} titleB={r.title_b} intro={r.intro ? <p>{r.intro}</p> : null}>
      <ul className="hv2r-cards">
        {r.items.map((it, i) => (
          <li key={it.title} className="hv2r-card">
            {it.image ? (
              <div className="hv2r-card-img">
                <V2Photo src={it.image} alt={it.title} />
              </div>
            ) : null}
            <div className="hv2r-card-body">
              <span className="hv2r-no">{String(i + 1).padStart(2, "0")}</span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/** Phòng chờ và quầy vé (văn phòng WP có ảnh/nhãn): thẻ ảnh + địa chỉ + giờ + chỉ đường. */
export function RouteLounges({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t = tr(locale);
  if (!view.offices.length) return null;
  return (
    <SectionCard
      id="route-offices"
      eyebrow={t("route.offices_eyebrow")}
      title={t("route.offices_title_a")}
      titleB={t("route.offices_title_b")}
      intro={view.stopsIntro && !view.stops.length ? <p>{view.stopsIntro}</p> : null}
    >
      <ul className="hv2r-lounges">
        {view.offices.map((o) => (
          <li key={`${o.name}-${o.address}`} className="hv2r-lounge">
            {o.image ? (
              <div className="hv2r-lounge-img">
                <V2Photo src={o.image} alt={`${o.name}, ${o.address}`} />
              </div>
            ) : view.offices.some((x) => x.image) ? (
              // Giữ các thẻ cùng chiều cao khi có thẻ khác có ảnh; không dùng ảnh nơi khác thay cho địa điểm này.
              <div className="hv2r-lounge-img hv2r-lounge-img--empty" aria-hidden="true">
                <MapPin className="size-10" />
              </div>
            ) : null}
            <div className="hv2r-lounge-body">
              {o.tag ? <p className="hv2r-tag">{o.tag}</p> : null}
              <h3>{o.name}</h3>
              <p className="hv2r-muted">{o.address}</p>
              {o.hours ? (
                <p>
                  <strong>{t("route.hours")}:</strong> {o.hours}
                </p>
              ) : null}
              {o.note ? <p className="hv2r-muted">{o.note}</p> : null}
              {o.map_url ? (
                <a href={o.map_url} target="_blank" rel="noopener" className="hv2r-more">
                  {t("route.map_link")}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/** Danh bạ trạm đón trả theo khu vực (giữ thứ tự WP nhập). */
export function RouteStops({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t = tr(locale);
  if (!view.stops.length) return null;
  const areas = new Map<string, RouteLandingView["stops"]>();
  for (const s of view.stops) areas.set(s.area, [...(areas.get(s.area) ?? []), s]);
  return (
    <SectionCard
      id="route-stops"
      eyebrow={t("route.stops_eyebrow")}
      title={t("route.stops_title_a", { a: view.start, b: view.end })}
      intro={
        <>
          <p className="hv2r-count">
            <strong>{view.stops.length}</strong> {t("route.stops_count")}
          </p>
          {view.stopsIntro ? <p>{view.stopsIntro}</p> : null}
        </>
      }
    >
      <div className="hv2r-areas">
        {[...areas].map(([area, list]) => (
          <section key={area} aria-label={area} className="hv2r-area">
            <h3>
              {area} <span>{t("route.stops_n", { n: list.length })}</span>
            </h3>
            <ul>
              {list.map((s) => (
                <li key={`${s.name}-${s.address ?? ""}`}>
                  <MapPin className="size-5 shrink-0" aria-hidden />
                  <div>
                    <strong>{s.name}</strong>
                    {s.address && s.address !== s.name ? <span>{s.address}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SectionCard>
  );
}

/** Bằng chứng (nền than): điểm Google + lời khách, số liệu doanh nghiệp, một câu chuyện có thật. */
export function RouteProof({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t = tr(locale);
  const { rating, reviews, stats, story } = view;
  if (!rating && !reviews.length && !stats.length && !story) return null;
  return (
    <SectionCard id="route-proof" tone="dark" eyebrow={t("route.proof_eyebrow")} title={t("route.proof_title_a")} titleB={t("route.proof_title_b")}>
      {stats.length ? (
        <dl className="hv2r-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <dd>{s.value}</dd>
              <dt>{s.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="hv2r-proof">
        {rating ? (
          <div className="hv2r-rating">
            <p className="hv2r-score">
              {rating.score}
              <span className="hv2r-stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-5" fill="currentColor" />
                ))}
              </span>
            </p>
            <p>{rating.count ? t("route.rating_line", { score: rating.score, n: rating.count }) : t("route.rating_line_nocount", { score: rating.score })}</p>
            {rating.url ? (
              <a href={rating.url} target="_blank" rel="noopener" className="hv2r-more">
                {t("route.rating_link")}
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        ) : null}
        {reviews.length ? (
          <ul className="hv2r-quotes">
            {reviews.slice(0, 3).map((r) => (
              <li key={r.quote}>
                <blockquote>“{r.quote}”</blockquote>
                {r.author ? <p>{r.author}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {story ? (
        <figure className="hv2r-story">
          <figcaption>{t("route.story_label")}</figcaption>
          <blockquote>{story}</blockquote>
        </figure>
      ) : null}
    </SectionCard>
  );
}
