import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/components/providers";

export const inputClass = "hv-field";

/** Nhãn + ô nhập + thông báo lỗi (khoá i18n). */
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const t = useT();
  return (
    <label className="grid min-w-0 gap-2">
      <span className="hv-label mb-0 text-16">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="hv-err mt-0 text-16">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {t(error)}
        </span>
      ) : null}
    </label>
  );
}
