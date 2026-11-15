import { PlaceholderPage } from "@/components/account/placeholder-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("my_airport", { robots: { index: false } });

export default function Page() {
  return <PlaceholderPage title="search.airport_transfers_bus" />;
}
