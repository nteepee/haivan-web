import type { Metadata } from "next";
import { OffersPage } from "@/components/account/offers-page";

export const metadata: Metadata = { title: "Ưu đãi của tôi", robots: { index: false } };

export default function Page() {
  return <OffersPage />;
}
