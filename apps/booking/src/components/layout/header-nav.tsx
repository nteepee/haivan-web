"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/providers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { localePrefix } from "@/i18n/t";
import type { MenuItem } from "@/schemas/layout";
import { switchLocalePath } from "./language-switch";

const barePath = (path: string) => path.replace(/^\/(en|vi)(?=\/|$)/, "").replace(/\/+$/, "") || "/";

/** Liên kết menu (đường dẫn tương đối hoặc URL đầy đủ của WordPress) có trỏ tới trang đang xem không; bỏ qua tiền tố ngôn ngữ. */
function isCurrent(pathname: string, href: string): boolean {
  try {
    return barePath(new URL(href, "https://menu.invalid").pathname) === barePath(pathname);
  } catch {
    return false;
  }
}

/** Menu desktop: mục có con là NÚT mở dropdown (Radix), không dẫn sang trang nào; chỉ mục con là liên kết (review 2026-11-13).
 * Mục không có con vẫn là liên kết; trang hiện tại có vạch dưới. */
export function HeaderNav({ items }: { items: MenuItem[] }) {
  const t = useT();
  const pathname = usePathname();
  return (
    <nav aria-label={t("header.main_menu")} className="hv-nav">
      {items.map((item) =>
        item.children?.length ? (
          <DropdownMenu key={item.label} modal={false}>
            {/* Tiêu đề nhóm chỉ mở dropdown (chuột, Enter/Space/↓); không có href nên không đi tới trang nhóm. */}
            <DropdownMenuTrigger asChild>
              <button type="button" className="hv-nav-link" aria-current={item.children.some((c) => isCurrent(pathname, c.href)) ? "true" : undefined}>
                {item.label}
                <ChevronDown className="size-icon" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="hv-nav-dropdown min-w-56">
              {item.children.map((child) => (
                <DropdownMenuItem key={child.href + child.label} asChild>
                  <a href={child.href} aria-current={isCurrent(pathname, child.href) ? "page" : undefined}>{child.label}</a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <a key={item.label} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined} className="hv-nav-link">
            {item.label}
          </a>
        ),
      )}
    </nav>
  );
}

/** Menu điện thoại: nút "Menu" mở bảng dưới header; Esc hoặc bấm ra ngoài đóng lại, tiêu điểm về nút. */
export function MobileNav({ items }: { items: MenuItem[] }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const p = localePrefix(locale);
  const target = locale === "vi" ? "en" : "vi";
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="hv-menu-toggle">
      <button
        ref={button}
        type="button"
        className="hv-menu-btn"
        aria-expanded={open}
        aria-controls="main-menu"
        aria-label={t(open ? "header.close_menu" : "header.open_menu")}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-icon" aria-hidden /> : <Menu className="size-icon" aria-hidden />}
        <span>{t("header.menu")}</span>
      </button>
      {open ? (
        <nav id="main-menu" aria-label={t("header.main_menu")} className="hv-menu-panel">
          <ul>
            {items.map((item) => (
              <li key={item.label}>
                {item.children?.length ? (
                  // Nhóm có mục con: chỉ là nhãn nhóm, không bấm được; khách chọn mục con bên dưới.
                  <span className="hv-menu-link hv-menu-group">{item.label}</span>
                ) : (
                  <a href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined} className="hv-menu-link" onClick={() => setOpen(false)}>
                    {item.label}
                  </a>
                )}
                {item.children?.map((child) => (
                  <a key={child.href + child.label} href={child.href} aria-current={isCurrent(pathname, child.href) ? "page" : undefined} className="hv-menu-link hv-menu-sub" onClick={() => setOpen(false)}>
                    {child.label}
                  </a>
                ))}
              </li>
            ))}
            <li>
              <a
                href={session?.loggedIn ? `${p}/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh` : `${p}/tai-khoan/dang-nhap`}
                rel={session?.loggedIn ? undefined : "nofollow"}
                className="hv-menu-link"
                onClick={(e) => {
                  setOpen(false);
                  if (session?.loggedIn) return;
                  // ?next= chỉ thêm khi bấm (không nằm trong HTML).
                  e.preventDefault();
                  router.push(`${p}/tai-khoan/dang-nhap?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                }}
              >
                {t(session?.loggedIn ? "header.account" : "header.login")}
              </a>
              {session?.loggedIn ? (
                <a href={`${p}/tai-khoan/khach-hang-than-thiet`} className="hv-menu-link hv-menu-sub" onClick={() => setOpen(false)}>
                  {t("footer.intro4")}
                </a>
              ) : null}
            </li>
            <li>
              <a href={switchLocalePath(pathname, target)} lang={target} className="hv-menu-link" onClick={() => setOpen(false)}>
                {t(target === "en" ? "header.english" : "header.vietnamese")}
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
