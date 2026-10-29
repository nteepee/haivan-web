import type { Metadata } from "next";
import { EmailVerify } from "@/components/email/email-verify";

export const metadata: Metadata = { title: "Xác minh email", robots: { index: false } };

/** Đích của link trong thư xác minh email do backend gửi (web cũ có route này). */
export default function Page() {
  return <EmailVerify />;
}
