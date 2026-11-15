import { PlaceholderPage } from "@/components/account/placeholder-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("my_parcels", { robots: { index: false } });

export default function Page() {
  return <PlaceholderPage title="account.cargo" />;
}
