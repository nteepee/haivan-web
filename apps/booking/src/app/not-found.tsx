import type { Metadata } from "next";
import { UrlNotFoundView } from "@/components/layout/status-page";
import { statusFont } from "@/lib/status-font";
import "./globals.css";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * 404 cho URL không khớp route nào (kể cả locale lạ). Layout gốc là `[lang]/layout` nên ở đây không có `lang`:
 * khung này tự nạp CSS token, còn UrlNotFoundView suy locale từ URL phía client (/en/... = tiếng Anh, còn lại tiếng Việt).
 */
export default function RootNotFound() {
  return (
    <main id="main" className={statusFont.className}>
      <UrlNotFoundView />
    </main>
  );
}
