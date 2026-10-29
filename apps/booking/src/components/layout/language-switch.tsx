"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useT } from "@/components/providers";

/** Đổi vi ↔ en giữ nguyên trang hiện tại (/xe-khach/... ↔ /en/xe-khach/...). */
export function switchLocalePath(pathname: string, target: "vi" | "en"): string {
  const bare = pathname.replace(/^\/(en|vi)(?=\/|$)/, "") || "/";
  return target === "en" ? `/en${bare === "/" ? "" : bare}` : bare;
}

/**
 * Query giữ lại khi đổi ngôn ngữ: bỏ tham số tên `en`/`vi`/`lang` (dấu vết của bộ chuyển ngôn ngữ cũ, vd `?en` hay `?en=`) và tham số
 * rỗng không tên, để canonical của bản kia không dính query lạ. Trả chuỗi rỗng hoặc bắt đầu bằng "?".
 */
export function switchLocaleQuery(search: string): string {
  const kept = [...new URLSearchParams(search)].filter(([key]) => key !== "" && !["en", "vi", "lang"].includes(key));
  return kept.length ? `?${new URLSearchParams(kept).toString()}` : "";
}

export function LanguageSwitch() {
  const locale = useLocale();
  const t = useT();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const target = locale === "vi" ? "en" : "vi";
  const href = switchLocalePath(pathname, target) + switchLocaleQuery(search);
  const text = target === "en" ? "EN" : "VI";
  return (
    <a
      href={href}
      lang={target}
      onClick={() => {
        document.cookie = `pll_language=${target}; path=/; max-age=31536000; SameSite=Lax`;
      }}
      className="hv-lang"
      // Tên truy cập bắt đầu bằng đúng chữ đang thấy ("EN"/"VI") để lệnh giọng nói và trình đọc khớp nhau.
      aria-label={`${text}, ${t("header.change_language")}`}
    >
      {text}
    </a>
  );
}
