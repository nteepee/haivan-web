import { PartnerRedirect } from "@/components/search/partner-redirect";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("partner_redirect", { robots: { index: false } }, true);

export default function Page() {
  return <PartnerRedirect />;
}
