"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/layout/status-page";

/** Lỗi runtime trong trang: "Thử lại" gọi retry() (tải lại dữ liệu và dựng lại phân đoạn), kèm về trang chủ và hotline. */
export default function SegmentError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorView onRetry={retry} />;
}
