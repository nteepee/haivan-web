import { Suspense } from "react";
import { localizedMetadata } from "@/lib/page-metadata";
import { PaymentPage } from "@/components/payment/payment-page";

export const generateMetadata = localizedMetadata("payment", { robots: { index: false } });

export default function Page() {
  return (
    <Suspense>
      <PaymentPage />
    </Suspense>
  );
}
