import type { Metadata } from "next";
import { ProfilePage } from "@/components/account/profile-page";

export const metadata: Metadata = { title: "Thông tin cá nhân", robots: { index: false } };

export default function Page() {
  return <ProfilePage />;
}
