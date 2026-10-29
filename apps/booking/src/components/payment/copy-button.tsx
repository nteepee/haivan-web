"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/providers";

/** Nút "Sao chép": đổi chữ thành "Đã sao chép" 2,5 giây (không toast); clipboard bị chặn thì giữ nguyên nút. */
export function CopyButton({ value }: { value: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 2500);
  };

  return (
    <button type="button" onClick={() => void copy()} className="hv-btn hv-btn-outline hv-btn-sm">
      {done ? <Check className="size-icon" aria-hidden /> : <Copy className="size-icon" aria-hidden />}
      <span aria-live="polite">{t(done ? "ux.copied" : "ux.copy")}</span>
    </button>
  );
}
