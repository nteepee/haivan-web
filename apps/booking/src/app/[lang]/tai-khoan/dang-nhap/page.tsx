import { LoginPage } from "@/components/auth/login-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("login", { robots: { index: false, follow: false } });

export default function Page() {
  return <LoginPage />;
}
