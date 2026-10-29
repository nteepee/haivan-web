"use client";

import { useEffect, useRef } from "react";
import { PageNote } from "@/components/layout/status-page";
import { useT } from "@/components/providers";
import { useSession } from "@/hooks/use-session";

/** /tai-khoan/dang-xuat: xoá phiên rồi về trang chủ (điều hướng do `useSession().logout`). */
export function LogoutPage() {
  const t = useT();
  const { logout } = useSession();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    logout();
    // logout mới ở mỗi lần render; chỉ gọi một lần khi vào trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <PageNote>{t("list_trip.msg.in_progress")}</PageNote>;
}
