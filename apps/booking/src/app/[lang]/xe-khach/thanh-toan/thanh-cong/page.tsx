import { Suspense } from "react";
import { localizedMetadata } from "@/lib/page-metadata";
import { SuccessPage } from "@/components/payment/success-page";

export const generateMetadata = localizedMetadata("payment_success", { robots: { index: false } });

export default function Page() {
  return (
    <Suspense>
      <SuccessPage />
    </Suspense>
  );
}
