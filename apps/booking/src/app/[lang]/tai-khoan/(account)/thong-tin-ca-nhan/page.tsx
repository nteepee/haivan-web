import { ProfilePage } from "@/components/account/profile-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("profile", { robots: { index: false } });

export default function Page() {
  return <ProfilePage />;
}
