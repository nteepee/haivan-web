"use client";

import { useState } from "react";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function ReasonForm({ onConfirm, onKeep }: { onConfirm: (reason: string) => void; onKeep: () => void }) {
  const t = useT();
  const [reason, setReason] = useState("");
  return (
    <>
      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("account.transit_reason_placeholder")} aria-label={t("account.transit_reason_title")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onKeep} className="hv-btn hv-btn-outline">{t("trip.keep_ticket")}</button>
        <button type="button" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())} className="hv-btn hv-btn-primary">
          {t("trip.agree")}
        </button>
      </div>
    </>
  );
}

/** Huỷ dịch vụ phòng chờ / trung chuyển: lý do bắt buộc. */
export function TransitCancelDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (reason: string) => void }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("account.transit_reason_title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("account.transit_reason_title")}</DialogDescription>
        <ReasonForm onConfirm={onConfirm} onKeep={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
