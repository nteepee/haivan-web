"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/providers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { localePrefix } from "@/i18n/t";

const HEADER_BTN = "hv-btn hv-btn-ghost hv-btn-sm hv-header-login";

/** Đăng nhập / menu tài khoản trên header (ẩn dưới 64rem; điện thoại dùng bảng menu). */
export function AccountMenu() {
  const t = useT();
  const locale = useLocale();
  const { data: session, logout } = useSession();
  const router = useRouter();
  const p = localePrefix(locale);

  if (!session?.loggedIn) {
    return (
      <a
        href={`${p}/tai-khoan/dang-nhap`}
        // Không nhét ?next= vào HTML (mỗi trang một URL đăng nhập = bẫy crawl); chỉ thêm khi bấm. nofollow cho bot.
        rel="nofollow"
        onClick={(e) => {
          e.preventDefault();
          router.push(`${p}/tai-khoan/dang-nhap?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }}
        className={HEADER_BTN}
      >
        {t("header.login")}
      </a>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={HEADER_BTN}>
        <User className="size-6" aria-hidden />
        {t("header.account")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem asChild>
          <a href={`${p}/tai-khoan/thong-tin-ca-nhan`}>{t("header.personal_infor")}</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${p}/tai-khoan/uu-dai`}>{t("header.my_offer")}</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${p}/tai-khoan/khach-hang-than-thiet`}>{t("footer.intro4")}</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${p}/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh`}>{t("header.my_trip")}</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout()}>{t("header.logout")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
