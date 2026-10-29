"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLocale, useT } from "@/components/providers";
import { localePrefix } from "@/i18n/t";
import { useCustomer } from "./use-customer";

const TRIP = "/tai-khoan/chuyen-di-cua-toi";

/**
 * Mục tài khoản: tên + SĐT (customer/customers) và các mục như web cũ.
 * Điện thoại: hàng tab cuộn ngang, mục hiện tại được cuộn vào giữa; từ 48rem: thẻ dọc r-3 bóng 1.
 * Mục hiện tại = nền select + vòng chọn + tick + chữ đậm (không viền ink). Mục tiêu đề "Chuyến đi của tôi" không mang aria-current
 * vì trùng URL với mục con "Xe liên tỉnh".
 */
export function AccountSidebar() {
  const t = useT();
  const p = localePrefix(useLocale());
  const pathname = usePathname().replace(/^\/(en|vi)(?=\/)/, "");
  const customer = useCustomer().data?.data;
  const strip = useRef<HTMLDivElement>(null);

  // Điện thoại: mục đang chọn có thể nằm ngoài khung nhìn của dải cuộn ngang → đưa vào giữa. Chỉ khi dải thật sự cuộn được (không kéo trang).
  useEffect(() => {
    const el = strip.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [pathname, customer]);

  const item = (href: string, label: string, opts: { sub?: boolean; heading?: boolean } = {}) => {
    const active = pathname === href && !opts.heading;
    return (
      <Link
        key={`${href}:${label}`}
        href={`${p}${href}`}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-control shrink-0 items-center gap-2 rounded-1 px-4 whitespace-nowrap hover:bg-accent-soft aria-[current=page]:bg-select aria-[current=page]:select-ring aria-[current=page]:font-extrabold md:whitespace-normal ${opts.sub ? "md:pl-8" : ""} ${opts.heading ? "font-semibold" : ""}`}
      >
        <span className="min-w-0 md:flex-1">{label}</span>
        {active ? <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden /> : null}
      </Link>
    );
  };

  return (
    <nav aria-label={t("header.account")} className="rounded-3 bg-surface shadow-1 md:overflow-hidden">
      <div className="hidden border-b border-rule p-card md:block">
        <p className="text-18 font-extrabold break-words">{customer?.name}</p>
        <p className="tabular-nums text-muted">{customer?.phone}</p>
      </div>
      <div ref={strip} className="hv-scroll-fade flex gap-1 p-1 md:flex-col md:overflow-visible md:p-2 md:mask-none md:pe-2">
        {item("/tai-khoan/thong-tin-ca-nhan", t("header.personal_infor"))}
        {item("/tai-khoan/uu-dai", t("header.my_offer"))}
        {item("/tai-khoan/khach-hang-than-thiet", t("footer.intro4"))}
        {item(`${TRIP}/xe-lien-tinh`, t("header.my_trip"), { heading: true })}
        {item(`${TRIP}/xe-lien-tinh`, t("header.intercity_bus"), { sub: true })}
        {item(`${TRIP}/xe-san-bay`, t("search.airport_transfers_bus"), { sub: true })}
        {item(`${TRIP}/xe-hop-dong`, t("header.rental_cars"), { sub: true })}
        {item("/tai-khoan/dang-xuat", t("header.logout"))}
      </div>
    </nav>
  );
}
