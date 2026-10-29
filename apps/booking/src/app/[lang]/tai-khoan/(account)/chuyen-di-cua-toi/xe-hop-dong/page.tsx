import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/account/placeholder-page";

export const metadata: Metadata = { title: "Xe hợp đồng", robots: { index: false } };

export default function Page() {
  return <PlaceholderPage title="header.rental_cars" />;
}
