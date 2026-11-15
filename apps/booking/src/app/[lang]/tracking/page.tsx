import { Suspense } from "react";
import { localizedMetadata } from "@/lib/page-metadata";
import { TrackingPage } from "@/components/tracking/tracking-page";

export const generateMetadata = localizedMetadata("tracking", { robots: { index: false } });

export default function Page() {
  return (
    <Suspense>
      <TrackingPage />
    </Suspense>
  );
}
