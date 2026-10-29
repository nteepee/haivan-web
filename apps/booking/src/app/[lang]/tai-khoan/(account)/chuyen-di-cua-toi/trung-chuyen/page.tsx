import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/account/placeholder-page";

export const metadata: Metadata = { title: "Trung chuyển", robots: { index: false } };

export default function Page() {
  return <PlaceholderPage title="booking_infor.transit_vehicle" />;
}
