import type { ReactNode } from "react";
import { BookingConfigProvider } from "@/components/booking-config-provider";
import { getBookingConfig } from "@/lib/booking-config-source";

/** Mọi trang đặt vé (tìm chuyến, xác nhận, thanh toán, thành công, trang tuyến) cùng dùng một cấu hình tuyến chính + chương trình giảm giá. */
export default async function Layout({ children }: { children: ReactNode }) {
  const config = await getBookingConfig();
  return <BookingConfigProvider config={config}>{children}</BookingConfigProvider>;
}
