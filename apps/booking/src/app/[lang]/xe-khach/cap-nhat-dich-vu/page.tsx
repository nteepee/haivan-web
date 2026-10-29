import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiceUpdatePage } from "@/components/account/service-update-page";

export const metadata: Metadata = { title: "Thông tin dịch vụ bổ sung", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ServiceUpdatePage />
    </Suspense>
  );
}
