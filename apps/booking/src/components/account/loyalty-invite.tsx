"use client";

import { useState } from "react";
import { useT } from "@/components/providers";
import type { CustomerData } from "@/schemas/account";
import { ProfileDialog } from "./profile-dialog";
import { RankIcon } from "./rank-icon";

/**
 * Khách chưa tham gia (`subscribe_loyalty` rỗng) vào thẳng URL: mời đăng ký thay vì hiện "Thành viên, 0 điểm".
 * Nút "Đăng ký" mở đúng ProfileDialog của trang Thông tin cá nhân (POST customer/customers).
 */
export function LoyaltyInvite({ customer }: { customer: CustomerData }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-6">
      <h1 className="text-h1">{t("footer.intro4")}</h1>
      <section className="hv-card flex flex-wrap items-center gap-4 p-card" aria-labelledby="loyalty-invite-title">
        <RankIcon rank={0} name={t("account.rank_0")} size={40} />
        <div className="min-w-0 flex-1 basis-64">
          <h2 id="loyalty-invite-title" className="text-18 font-extrabold">{t("account.not_member_title")}</h2>
          <p className="text-muted">{t("account.join_body")}</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="hv-btn hv-btn-primary shrink-0">
          {t("account.join")}
        </button>
      </section>
      <ProfileDialog open={open} onOpenChange={setOpen} customer={customer} title={t("booking_infor.register_loyalty")} />
    </div>
  );
}
