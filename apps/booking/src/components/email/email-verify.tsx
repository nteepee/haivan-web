"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { apigw } from "@/lib/http";

const MESSAGES = { ok: "Xác minh email thành công!", done: "Email đã được xác minh!", expired: "Xác minh đã quá hạn!" } as const;

/**
 * `/email/verify?expires&hash&id&signature`: gọi thẳng `api/customer/email/verify` (công khai, không token)
 * với query ghép thô như web cũ; 200 + status "OK" → thành công, 200 khác → đã xác minh, lỗi → quá hạn.
 */
export function EmailVerify() {
  const params = useSearchParams();
  const raw = ["expires", "hash", "id", "signature"].map((k) => `${k}=${params.get(k) ?? ""}`).join("&");
  const verify = useQuery({
    queryKey: ["email-verify", raw],
    queryFn: async () => {
      const res = (await apigw("customer/email/verify", { rawQuery: raw })) as { status?: string } | null;
      return res?.status === "OK" ? MESSAGES.ok : MESSAGES.done;
    },
    retry: false,
    staleTime: Infinity,
  });
  return (
    <div className="hv-container hv-app-main flex justify-center">
      {verify.isPending ? (
        <Loader2 className="size-12 animate-spin" role="status" aria-label="Đang xác minh" />
      ) : (
        <p role="status" className={`hv-card flex items-center gap-3 p-card text-18 font-semibold ${verify.isError ? "text-error" : "text-ink"}`}>
          {verify.isError ? <CircleAlert className="size-icon shrink-0" aria-hidden /> : <CircleCheck className="size-icon shrink-0 text-success" aria-hidden />}
          {verify.isError ? MESSAGES.expired : verify.data}
        </p>
      )}
    </div>
  );
}
