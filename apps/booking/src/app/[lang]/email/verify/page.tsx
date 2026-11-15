import { EmailVerify } from "@/components/email/email-verify";
import { localizedMetadata } from "@/lib/page-metadata";

export const generateMetadata = localizedMetadata("email_verify", { robots: { index: false } });

/** Đích của link trong thư xác minh email do backend gửi (web cũ có route này). */
export default function Page() {
  return <EmailVerify />;
}
