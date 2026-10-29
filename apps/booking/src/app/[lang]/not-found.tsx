import type { Metadata } from "next";
import { NotFoundView } from "@/components/layout/status-page";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/** Next trả 404 khi notFound() chạy trước khi bắt đầu stream; nội dung lấy locale từ Providers của layout. */
export default function NotFound() {
  return <NotFoundView />;
}
