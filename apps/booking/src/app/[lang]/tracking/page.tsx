import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackingPage } from "@/components/tracking/tracking-page";

export const metadata: Metadata = { title: "Theo dõi xe", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <TrackingPage />
    </Suspense>
  );
}
