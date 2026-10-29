"use client";

import { Phone } from "lucide-react";
import { useEffect, useRef } from "react";
import { translate, type Locale } from "@/i18n/t";

/** Ô nhập mà nút nổi không được che (icon lịch của ô ngày, ô chọn...). */
const FIELDS = "main input:not([type=hidden]), main select, main textarea";

const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * Nút gọi hotline nổi góc phải dưới: luôn cách một chạm (tel:), vòng ink, bóng float. Trên điện thoại nằm trên thanh dính.
 * Khi một ô nhập đang nằm dưới nút (cuộn qua form tìm vé) nút mờ đi và nhường chỗ (`data-dodge`) để không che icon lịch; ô đi qua là nút hiện lại.
 * Cuối trang footer có đệm dưới nên nút không đè liên kết cuối.
 */
export function HotlineButton({ locale, hotline }: { locale: Locale; hotline: string }) {
  const label = translate(locale, "footer.call_hotline", { hotline });
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const fab = ref.current;
    if (!fab) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      if (document.activeElement === fab) return fab.removeAttribute("data-dodge");
      const box = fab.getBoundingClientRect();
      const hit = [...document.querySelectorAll<HTMLElement>(FIELDS)].some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && overlaps(box, r);
      });
      if (hit) fab.setAttribute("data-dodge", "true");
      else fab.removeAttribute("data-dodge");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Form tìm vé hiện sau khi hydrate/tải dữ liệu nên kiểm lại khi DOM đổi.
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <a ref={ref} href={`tel:${hotline.replace(/\s/g, "")}`} aria-label={label} className="hv-call-fab">
      <Phone className="size-6" aria-hidden />
    </a>
  );
}
