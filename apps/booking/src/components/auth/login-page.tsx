"use client";

import { UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/components/providers";
import { useSession } from "@/hooks/use-session";
import { LoginDialog } from "./login-dialog";
import { safeNext } from "./login-flow";

/** /tai-khoan/dang-nhap?next=… — dùng cho nút "Đăng nhập" ở header WordPress. */
export function LoginPage() {
  const t = useT();
  const next = safeNext(useSearchParams().get("next"));
  const { data: session } = useSession();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (session?.loggedIn) window.location.replace(next);
  }, [session?.loggedIn, next]);

  return (
    <div className="hv-section-warm">
      <div className="hv-container hv-app-main grid justify-items-center">
        <div className="hv-card grid w-full max-w-md justify-items-center gap-6 p-card text-center">
          <span className="hv-ico">
            <UserRound className="size-icon" aria-hidden />
          </span>
          <h1 className="text-h1">{t("login_form.login")}</h1>
          <button type="button" onClick={() => setOpen(true)} className="hv-btn hv-btn-primary hv-btn-lg">
            {t("login_form.login")}
          </button>
        </div>
        <LoginDialog open={open} onOpenChange={setOpen} onLoggedIn={() => window.location.replace(next)} />
      </div>
    </div>
  );
}
