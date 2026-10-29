import { Phone } from "lucide-react";
import Image from "next/image";
import { translate, type Locale } from "@/i18n/t";
import type { SiteLayout } from "@/schemas/layout";
import { FooterBottom } from "./footer-bottom";
import { FooterTrust } from "./footer-brands";

/**
 * Footer gọn, cùng cấu trúc và lớp với WP (`footer.php`): mast (logo + hotline), cột liên kết, một hàng tin cậy
 * (Đối tác, Thành viên, Thanh toán, Chứng nhận), đáy (pháp lý | theo dõi + ứng dụng), bản quyền dòng cuối. Dữ liệu từ `layoutSchema`.
 */
export function SiteFooter({ locale, site }: { locale: Locale; site: SiteLayout }) {
  const layout = site[locale];
  const t = (key: string) => translate(locale, key);
  return (
    <footer className="hv-footer">
      <div className="hv-container">
        <div className="hv-footer-tier hv-footer-mast">
          {site.logo_white ? <Image src={site.logo_white} alt={t("footer.logo_alt")} width={130} height={24} unoptimized className="hv-footer-logo" /> : <span />}
          <span />
          <a href={`tel:${site.hotline.replace(/[^0-9+]/g, "")}`} className="hv-footer-call">
            <Phone className="size-6" aria-hidden />
            <span>{site.hotline}</span>
          </a>
        </div>
        <div className="hv-footer-tier hv-footer-cols">
          {layout.footer_columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="hv-footer-head">{col.title}</p>
              <ul>
                {col.items.map((item) => (
                  <li key={`${item.label}-${item.href}`}>
                    <a href={item.href} className="hv-footer-link">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <FooterTrust locale={locale} site={site} />
        <FooterBottom locale={locale} site={site} />
      </div>
    </footer>
  );
}
