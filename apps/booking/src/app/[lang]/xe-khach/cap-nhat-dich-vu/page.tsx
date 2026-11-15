import { Suspense } from "react";
import { localizedMetadata } from "@/lib/page-metadata";
import { ServiceUpdatePage } from "@/components/account/service-update-page";

export const generateMetadata = localizedMetadata("extras", { robots: { index: false } });

export default function Page() {
  return (
    <Suspense>
      <ServiceUpdatePage />
    </Suspense>
  );
}
