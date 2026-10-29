import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/account/placeholder-page";

export const metadata: Metadata = { title: "Xe sân bay", robots: { index: false } };

export default function Page() {
  return <PlaceholderPage title="search.airport_transfers_bus" />;
}
