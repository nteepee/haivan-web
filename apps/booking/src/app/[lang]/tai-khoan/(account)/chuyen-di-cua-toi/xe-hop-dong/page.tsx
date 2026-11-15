import { PlaceholderPage } from "@/components/account/placeholder-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("my_hire", { robots: { index: false } });

export default function Page() {
  return <PlaceholderPage title="header.rental_cars" />;
}
