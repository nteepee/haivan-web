"use client";

import { useT } from "@/components/providers";

/**
 * /tracking/hv và /tracking/hshv là màn hình giám sát đội xe nội bộ (MQTT trực tiếp); chưa dựng lại.
 * Giữ URL sống và nói rõ thay vì trả 404.
 */
export function FleetNotice() {
  const t = useT();
  return (
    <section className="hv-container hv-app-main grid max-w-lg gap-2 text-center">
      <h1 className="text-h2">{t("account.fleet_title")}</h1>
      <p className="text-muted">{t("account.updating")}</p>
    </section>
  );
}
