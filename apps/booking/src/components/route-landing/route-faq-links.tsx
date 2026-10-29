import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { translate, localePrefix, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { SectionCard } from "./section-card";

/** Số câu hỏi mở sẵn; phần còn lại gập trong "Xem thêm câu hỏi". */
const FAQ_OPEN = 5;

type Faq = RouteLandingView["faq"][number];

function FaqItem({ f, open }: { f: Faq; open?: boolean }) {
  return (
    <details className="hv-faq" open={open}>
      <summary>
        {f.q}
        <ChevronDown className="size-icon shrink-0" aria-hidden />
      </summary>
      <p className="hv-faq-body max-w-[68ch]">{f.a}</p>
    </details>
  );
}

/** FAQ (<details>, không cần JS; 5 câu đầu mở) và liên kết tuyến liên quan/chiều ngược lại. */
export function RouteFaqLinks({ view, locale }: { view: RouteLandingView; locale: Locale }) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const p = localePrefix(locale);
  // Chiều ngược lại đã có link trong khối khứ hồi khi có ghi chú; ngược lại gộp vào đây.
  const links = [
    ...(view.reverseRoute && !view.roundTripNote ? [{ label: t("route.reverse_link", { label: view.reverseRoute.label }), path: view.reverseRoute.path }] : []),
    ...view.relatedRoutes,
  ];
  const rest = view.faq.slice(FAQ_OPEN);
  return (
    <>
      {view.faq.length ? (
        <SectionCard id="route-faq" title={t("list_trip.FAQ")}>
          <div className="hv-ruled">
            {view.faq.slice(0, FAQ_OPEN).map((f) => (
              <FaqItem key={f.q} f={f} open />
            ))}
          </div>
          {rest.length ? (
            <details className="hv-faq-more">
              <summary className="hv-btn hv-btn-outline mt-4">{t("route.faq_more")}</summary>
              <div className="hv-ruled mt-4">
                {rest.map((f) => (
                  <FaqItem key={f.q} f={f} />
                ))}
              </div>
            </details>
          ) : null}
        </SectionCard>
      ) : null}
      {links.length ? (
        <SectionCard id="route-related" title={t("route.related_title")}>
          <ul className="flex flex-wrap gap-3">
            {links.map((l) => (
              <li key={l.path}>
                <Link href={`${p}/xe-khach/${l.path}`} className="hv-btn hv-btn-outline hv-btn-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </>
  );
}
