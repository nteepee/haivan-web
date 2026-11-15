import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/trips/search-results";
import { isLocale, translate } from "@/i18n/t";

export async function generateMetadata({ params }: PageProps<"/[lang]/xe-khach/tim-chuyen">): Promise<Metadata> {
  const { lang } = await params;
  return { title: translate(isLocale(lang) ? lang : "vi", "xe_khach.search_title"), robots: { index: false, follow: true } };
}

export default function Page() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
