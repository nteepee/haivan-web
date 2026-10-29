import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentPage } from "@/components/payment/payment-page";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <PaymentPage />
    </Suspense>
  );
}
