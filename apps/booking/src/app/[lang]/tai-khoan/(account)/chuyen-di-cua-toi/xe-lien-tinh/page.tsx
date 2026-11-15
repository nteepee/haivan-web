import { TripsPage } from "@/components/account/trips-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("my_trips", { robots: { index: false } });

export default function Page() {
  return <TripsPage />;
}
