import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessPage } from "@/components/payment/success-page";

export const metadata: Metadata = { title: "Đặt chỗ thành công", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <SuccessPage />
    </Suspense>
  );
}
