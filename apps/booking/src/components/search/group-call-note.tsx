"use client";

import { Phone } from "lucide-react";
import { useT } from "@/components/providers";
import { HOTLINE } from "@/components/layout/status-page";
import { MAX_SEATS } from "@/lib/seats";

/** Mỗi đơn ERP tối đa MAX_SEATS ghế: khách cần nhiều hơn được mời gọi tổng đài để giữ chỗ cho cả đoàn. */
export function GroupCallNote({ id }: { id?: string }) {
  const t = useT();
  return (
    <p id={id} role="status" className="hv-group-note">
      {t("search.group_note", { max: MAX_SEATS })}{" "}
      <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="hv-group-note-call">
        <Phone className="size-4" aria-hidden />
        {HOTLINE}
      </a>
    </p>
  );
}
