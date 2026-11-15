import { Suspense } from "react";
import { localizedMetadata } from "@/lib/page-metadata";
import { ConfirmPage } from "@/components/confirm/confirm-page";

export const generateMetadata = localizedMetadata("confirm", { robots: { index: false } });

export default function Page() {
  return (
    <Suspense>
      <ConfirmPage />
    </Suspense>
  );
}
