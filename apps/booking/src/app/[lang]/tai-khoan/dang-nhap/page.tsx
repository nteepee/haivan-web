import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/login-page";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false, follow: false } };

export default function Page() {
  return <LoginPage />;
}
