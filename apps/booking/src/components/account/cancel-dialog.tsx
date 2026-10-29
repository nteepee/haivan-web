"use client";

import { Check, Info } from "lucide-react";
import { useState } from "react";
import { useLocale, useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { noteEnabled, reasonLabel, type CancelChoice } from "@/lib/account-cancel";

export interface CancelReason {
  id: number;
  reason_vi: string;
  reason_en?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: CancelReason[];
  /** Modal đóng ngay khi đồng ý; kết quả (thành công/lỗi) do bên gọi báo. */
  onConfirm: (choice: CancelChoice) => void;
}

function CancelForm({ reasons, onConfirm, onKeep }: Pick<Props, "reasons" | "onConfirm"> & { onKeep: () => void }) {
  const t = useT();
  const locale = useLocale();
  const [reasonId, setReasonId] = useState<number>();
  const [note, setNote] = useState("");
  return (
    <>
      <p className="hv-notice">
        <Info className="size-icon shrink-0" aria-hidden />
        <span className="font-semibold">{t("trip.cancel_consequence")} {t("trip.note_title_modal_cancel")}</span>
      </p>
      <RadioGroup value={reasonId === undefined ? "" : String(reasonId)} onValueChange={(v) => setReasonId(Number(v))} className="gap-2" aria-label={t("trip.note_title_modal_cancel")}>
        {reasons.map((r) => (
          <label key={r.id} className="flex min-h-control cursor-pointer items-center gap-3 rounded-1 bg-paper-2 px-3 hover:bg-accent-soft has-aria-checked:bg-select has-aria-checked:select-ring">
            <RadioGroupItem value={String(r.id)} />
            <span className="flex-1">{reasonLabel(r, locale)}</span>
            {reasonId === r.id ? <Check className="size-icon shrink-0" strokeWidth={3} aria-hidden /> : null}
          </label>
        ))}
      </RadioGroup>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={!noteEnabled(reasonId)} placeholder={t("trip.want_share")} aria-label={t("trip.want_share")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onKeep} className="hv-btn hv-btn-outline">{t("trip.keep_ticket")}</button>
        <button type="button" disabled={reasonId === undefined} onClick={() => reasonId !== undefined && onConfirm({ reasonId, note: note.trim() })} className="hv-btn hv-btn-primary">
          {t("trip.agree")}
        </button>
      </div>
    </>
  );
}

/** Hộp huỷ vé / huỷ đơn: nêu hậu quả một câu, chọn lý do từ `list-reason` (ghi chú chỉ bật cho "Lý do khác"), "Giữ vé" hoặc đồng ý huỷ. */
export function CancelDialog({ open, onOpenChange, reasons, onConfirm }: Props) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>{t("trip.title_modal_cancel")}</DialogTitle>
        <DialogDescription className="sr-only">{t("trip.note_title_modal_cancel")}</DialogDescription>
        <CancelForm reasons={reasons} onConfirm={onConfirm} onKeep={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
