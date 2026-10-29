"use client";

import { useT } from "@/components/providers";

/** Mục ngoài phạm vi đợt này (xe sân bay, hợp đồng, trung chuyển, hàng hoá): giữ URL, báo đang cập nhật. */
export function PlaceholderPage({ title }: { title: string }) {
  const t = useT();
  return (
    <section className="hv-card grid gap-2 p-card text-center">
      <h1 className="text-h2">{t(title)}</h1>
      <p className="text-muted">{t("account.updating")}</p>
    </section>
  );
}
