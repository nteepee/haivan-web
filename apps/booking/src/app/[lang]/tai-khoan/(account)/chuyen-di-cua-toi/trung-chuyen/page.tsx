import { PlaceholderPage } from "@/components/account/placeholder-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("my_transfer", { robots: { index: false } });

export default function Page() {
  return <PlaceholderPage title="booking_infor.transit_vehicle" />;
}
