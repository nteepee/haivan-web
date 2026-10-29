import type { Metadata } from "next";
import { FleetNotice } from "@/components/tracking/fleet-notice";

export const metadata: Metadata = { title: "Theo dõi đội xe", robots: { index: false } };

export default function Page() {
  return <FleetNotice />;
}
