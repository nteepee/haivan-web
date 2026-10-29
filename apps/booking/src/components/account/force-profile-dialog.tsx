"use client";

import { useState } from "react";
import { useT } from "@/components/providers";
import { useSession } from "@/hooks/use-session";
import { needsForceUpdate } from "@/lib/account-profile";
import { ProfileDialog } from "./profile-dialog";
import { useCustomer } from "./use-customer";

/**
 * Modal bắt cập nhật hồ sơ khi `data_source === 1` (như web cũ). Gắn một lần ở layout toàn trang;
 * không hiện khi chưa đăng nhập, tự đóng sau khi lưu thành công.
 */
export function ForceProfileDialog() {
  const t = useT();
  const { data: session } = useSession();
  const customer = useCustomer(!!session?.loggedIn);
  const [doneFor, setDoneFor] = useState<number | null | undefined>();
  const data = customer.data?.data;
  if (!session?.loggedIn || !data || !needsForceUpdate(data) || doneFor === (data.id ?? null)) return null;
  return <ProfileDialog open onOpenChange={() => undefined} customer={data} title={t("booking_infor.update_personal")} locked onDone={() => setDoneFor(data.id ?? null)} />;
}
