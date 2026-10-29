import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/trips/search-results";

export const metadata: Metadata = { title: "Tìm chuyến xe khách", robots: { index: false, follow: true } };

export default function Page() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
