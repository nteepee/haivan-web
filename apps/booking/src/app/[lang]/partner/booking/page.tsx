import type { Metadata } from "next";
import { PartnerRedirect } from "@/components/search/partner-redirect";

export const metadata: Metadata = { title: { absolute: "Page redirect | Nhà Xe Hải Vân" }, robots: { index: false } };

export default function Page() {
  return <PartnerRedirect />;
}
