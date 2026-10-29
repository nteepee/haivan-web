import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/account/placeholder-page";

export const metadata: Metadata = { title: "Hàng hoá", robots: { index: false } };

export default function Page() {
  return <PlaceholderPage title="account.cargo" />;
}
