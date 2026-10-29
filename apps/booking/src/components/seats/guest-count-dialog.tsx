"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: number;
  max: number;
  onUpdate: (n: number) => void;
}

/** Modal đổi số khách (combo): "Bạn chưa chọn đủ số lượng vé!", stepper 1..available_seats. */
export function GuestCountDialog({ open, onOpenChange, value, max, onUpdate }: Props) {
  const t = useT();
  const [n, setN] = useState(value);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setN(value);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>{t("list_trip.noti")}</DialogTitle>
        <DialogDescription>
          {t("list_trip.msg.msg_select_ticket")} {t("list_trip.msg.msg_change_num_ticket")}
        </DialogDescription>
        <div className="flex items-center justify-center gap-4 py-2">
          <button type="button" aria-label="Giảm" onClick={() => setN((v) => Math.max(1, v - 1))} className="hv-btn hv-btn-outline size-12 rounded-round px-0">
            <Minus className="size-6" aria-hidden />
          </button>
          <span className="w-12 text-center text-2xl font-bold tabular-nums" aria-live="polite">{n}</span>
          <button type="button" aria-label="Tăng" onClick={() => setN((v) => Math.min(Math.max(1, max), v + 1))} className="hv-btn hv-btn-outline size-12 rounded-round px-0">
            <Plus className="size-6" aria-hidden />
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="hv-btn hv-btn-outline flex-1">
            {t("list_trip.close")}
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdate(n);
              onOpenChange(false);
            }}
            className="hv-btn hv-btn-primary flex-1"
          >
            {t("list_trip.update")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
