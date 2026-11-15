import { FleetNotice } from "@/components/tracking/fleet-notice";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("fleet", { robots: { index: false } });

export default function Page() {
  return <FleetNotice />;
}
