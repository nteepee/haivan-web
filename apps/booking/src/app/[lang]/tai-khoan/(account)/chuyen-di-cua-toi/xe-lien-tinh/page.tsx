import type { Metadata } from "next";
import { TripsPage } from "@/components/account/trips-page";

export const metadata: Metadata = { title: "Chuyến đi của tôi", robots: { index: false } };

export default function Page() {
  return <TripsPage />;
}
