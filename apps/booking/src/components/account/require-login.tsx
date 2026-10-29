"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { PageNote } from "@/components/layout/status-page";
import { useLocale, useT } from "@/components/providers";
import { useSession } from "@/hooks/use-session";
import { localePrefix } from "@/i18n/t";

const noopSubscribe = () => () => {};

/** false ở server và ở lượt render hydrate đầu tiên, true từ lượt render sau đó (React tự dựng lại sau khi hydrate xong). */
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Trang cần đăng nhập: chưa có phiên → chuyển tới /tai-khoan/dang-nhap?next=… (quay lại đúng trang sau khi đăng nhập).
 * Phiên có thể đã nằm trong cache (header tải trước khi vùng nội dung được hydrate), nên server và lượt render hydrate đầu
 * luôn hiện cùng một khung chờ; chỉ sau khi hydrate xong mới xét phiên và chuyển hướng (trong effect), tránh lỗi React #418.
 */
export function RequireLogin({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const p = localePrefix(useLocale());
  const { data: session, isPending } = useSession();
  const ready = useHydrated() && !isPending;
  const loginUrl = () => `${p}/tai-khoan/dang-nhap?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;

  useEffect(() => {
    if (ready && !session?.loggedIn) router.replace(loginUrl());
    // loginUrl đọc window.location tại thời điểm chuyển hướng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.loggedIn, router, p]);

  if (!ready) return <PageNote>{t("list_trip.msg.in_progress")}</PageNote>;
  if (!session?.loggedIn) {
    return (
      <div className="hv-container hv-app-main grid max-w-md justify-items-center gap-4 text-center">
        <p className="font-semibold">{t("msg.msg_login")}</p>
        <button type="button" onClick={() => router.push(loginUrl())} className="hv-btn hv-btn-primary">
          {t("login_form.login")}
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
