"use client";

import { useEffect } from "react";
import { ErrorView, useUrlLocale } from "@/components/layout/status-page";
import { statusFont } from "@/lib/status-font";
import "./globals.css";

/** Lỗi ở chính layout gốc: thay cả <html>, nên tự nạp CSS token và tự suy locale từ URL (/en/... = tiếng Anh). */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = useUrlLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang={locale}>
      <body>
        <main className={statusFont.className}>
          <ErrorView locale={locale} onRetry={retry} />
        </main>
      </body>
    </html>
  );
}
