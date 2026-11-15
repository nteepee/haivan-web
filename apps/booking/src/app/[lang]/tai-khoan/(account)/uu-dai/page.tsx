import { OffersPage } from "@/components/account/offers-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("my_offers", { robots: { index: false } });

export default function Page() {
  return <OffersPage />;
}
