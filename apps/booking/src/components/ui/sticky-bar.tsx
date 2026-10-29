"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Thanh tổng dính đáy (điện thoại) / thẻ dính cột phải (từ 60rem). Đo chiều cao thật bằng ResizeObserver rồi đặt
 * `--bar-h` trên <html>: chỗ đệm cuối trang và nút gọi nổi đọc biến này nên không bao giờ bị thanh che.
 * Từ 60rem thanh không còn `position: fixed` nên biến về 0; khi thanh gỡ khỏi cây thì xoá biến.
 */
export function StickyBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      const fixed = getComputedStyle(el).position === "fixed";
      root.style.setProperty("--bar-h", fixed ? `${el.getBoundingClientRect().height}px` : "0px");
    };
    apply();
    // Môi trường không có ResizeObserver vẫn đo lại khi đổi cỡ cửa sổ.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(apply);
    observer?.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--bar-h");
    };
  }, []);

  return (
    <div ref={ref} className="hv-sticky-bar glass" data-sticky-bar>
      {children}
    </div>
  );
}
