import { LogoutPage } from "@/components/account/logout-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("logout", { robots: { index: false } });

export default function Page() {
  return <LogoutPage />;
}
