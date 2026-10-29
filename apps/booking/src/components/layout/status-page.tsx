"use client";

import { Phone } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { useLocale } from "@/components/providers";
import { localePrefix, translate, type Locale } from "@/i18n/t";

/** Cùng số với layout WP (`layout-fallback.json`); trang lỗi không đọc được layout nên giữ hằng ở đây. */
export const HOTLINE = "1900 6763";

interface StatusPageProps {
  /** Mã trạng thái hiển thị nhỏ phía trên tiêu đề (vd. 404); không có thì ẩn. */
  code?: string;
  title: string;
  text: string;
  /** Trang lỗi: báo ngay cho trình đọc màn hình. */
  alert?: boolean;
  children?: ReactNode;
}

/** Khung chung cho trang 404 / lỗi: một thẻ giữa trang, tiêu đề h1, đoạn mô tả, hàng nút. Chỉ dùng lớp v4 có sẵn. */
export function StatusPage({ code, title, text, alert, children }: StatusPageProps) {
  return (
    <div className="hv-container hv-app-main">
      <section className="hv-card mx-auto grid max-w-lg justify-items-center gap-4 px-6 py-12 text-center" role={alert ? "alert" : undefined}>
        {code ? <p className="hv-tag hv-tag-on tabular-nums">{code}</p> : null}
        <h1 className="text-h2 font-extrabold text-ink">{title}</h1>
        <p>{text}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>
      </section>
    </div>
  );
}

/** Dòng trạng thái ngắn (đang tải, đang chuyển trang) trong thân trang: nhịp do `hv-app-main` (một lớp đệm section), không thêm py riêng. */
export function PageNote({ children, role }: { children: ReactNode; role?: "status" | "alert" }) {
  return (
    <div className="hv-container hv-app-main">
      <p role={role} className="text-center text-muted">
        {children}
      </p>
    </div>
  );
}

/** Dùng cả trong cây có Providers (locale từ context) lẫn global-error (ngoài layout → truyền `locale`). */
function useViewLocale(locale?: Locale): Locale {
  const fromContext = useLocale();
  return locale ?? fromContext;
}

const noopSubscribe = () => () => {};
const urlLocale = (): Locale => (window.location.pathname === "/en" || window.location.pathname.startsWith("/en/") ? "en" : "vi");

/**
 * Locale suy từ URL cho trang lỗi nằm ngoài `[lang]/layout` (không có Providers): server và lượt hydrate đầu luôn "vi",
 * rồi React dựng lại với locale thật nên không lệch hydrate.
 */
export function useUrlLocale(): Locale {
  return useSyncExternalStore(noopSubscribe, urlLocale, () => "vi");
}

/** 404 gốc (không khớp route / locale lạ): chưa có Providers nên lấy locale từ URL. */
export function UrlNotFoundView() {
  return <NotFoundView locale={useUrlLocale()} />;
}

/** "/" thuộc WordPress (nginx) nên là liên kết thường, không phải next/link. */
function HomeLink({ locale, className }: { locale: Locale; className: string }) {
  return (
    <a href={localePrefix(locale) || "/"} className={className}>
      {translate(locale, "error_page.back_home")}
    </a>
  );
}

function HotlineLink({ locale }: { locale: Locale }) {
  return (
    <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="hv-btn hv-btn-outline">
      <Phone className="size-5" aria-hidden />
      {translate(locale, "error_page.hotline", { hotline: HOTLINE })}
    </a>
  );
}

export function NotFoundView({ locale }: { locale?: Locale }) {
  const l = useViewLocale(locale);
  return (
    <StatusPage code="404" title={translate(l, "not_found.title")} text={translate(l, "not_found.text")}>
      <HomeLink locale={l} className="hv-btn hv-btn-primary" />
      <HotlineLink locale={l} />
    </StatusPage>
  );
}

export function ErrorView({ locale, onRetry }: { locale?: Locale; onRetry: () => void }) {
  const l = useViewLocale(locale);
  return (
    <StatusPage alert title={translate(l, "error_page.title")} text={translate(l, "error_page.text")}>
      <button type="button" onClick={onRetry} className="hv-btn hv-btn-primary">
        {translate(l, "error_page.retry")}
      </button>
      <HomeLink locale={l} className="hv-btn hv-btn-outline" />
      <HotlineLink locale={l} />
    </StatusPage>
  );
}
