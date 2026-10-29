import type { ReactNode } from "react";
import { translate, type Locale } from "@/i18n/t";
import type { RouteLandingView } from "@/lib/route-landing-build";
import { HtmlBlock } from "./html-block";
import { SectionCard } from "./section-card";

/** "Giờ chạy & giá vé xe A đi B": đoạn mô tả của WP (nếu có) rồi danh sách chuyến (children, client). */
export function RouteSchedule({ view, locale, children }: { view: RouteLandingView; locale: Locale; children: ReactNode }) {
  return (
    <SectionCard id="route-schedule" title={translate(locale, "route.schedule_title", { a: view.start, b: view.end })}>
      <HtmlBlock html={view.scheduleHtml} className="mb-6" />
      {children}
    </SectionCard>
  );
}
