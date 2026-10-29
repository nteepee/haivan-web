"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import { downloadPdf, extractBase64Pdf } from "@/lib/account-bill";
import { ApiError, gw } from "@/lib/http";
import { billSchema } from "@/schemas/account";

/** Tải hoá đơn của vé (tab "Hoàn thành"): `bookings/download-bill` → base64 PDF → file `<mã vé>.pdf`. */
export function BillDownload({ ticketCode, merchantCode }: { ticketCode: string; merchantCode: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const body = await gw("bookings/download-bill", { query: { ticket_code: ticketCode, merchant_code: merchantCode }, schema: billSchema });
      const pdf = extractBase64Pdf(body);
      if (!pdf) throw new Error("empty bill");
      downloadPdf(ticketCode, pdf);
    } catch (error) {
      toast.warning(error instanceof ApiError ? error.message : t("booking_infor.msg.msg_error_occurred"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={() => void download()} disabled={busy} title={t("booking.get_bill")} aria-label={t("booking.get_bill")} className="grid size-tap place-items-center rounded-1 text-ink hover:bg-accent-soft disabled:opacity-55">
      <FileText className="size-icon" aria-hidden />
    </button>
  );
}
