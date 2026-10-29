import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmPage } from "@/components/confirm/confirm-page";

export const metadata: Metadata = { title: "Xác nhận thông tin đặt vé", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ConfirmPage />
    </Suspense>
  );
}
