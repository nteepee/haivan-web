import type { Metadata } from "next";
import { LogoutPage } from "@/components/account/logout-page";

export const metadata: Metadata = { title: "Đăng xuất", robots: { index: false } };

export default function Page() {
  return <LogoutPage />;
}
