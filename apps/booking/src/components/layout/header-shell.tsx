"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Cuộn quá ngưỡng này (px) thì header chuyển sang kính vàng. */
const SCROLL_THRESHOLD = 8;

/**
 * Vỏ header dính: nghỉ = vàng đặc; cuộn quá 8px = `.glass-yellow` (blur + vàng 85%, nền đặc khi trình duyệt không hỗ trợ).
 * Chỉ đổi nền và bóng nên không xô layout; listener `passive`, state chỉ đổi khi vượt ngưỡng nên không render lại mỗi lần cuộn.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={scrolled ? "hv-header glass-yellow" : "hv-header"} data-scrolled={scrolled}>
      {children}
    </header>
  );
}
