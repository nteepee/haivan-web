"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "@/components/providers";

interface Props {
  /** Nhãn của danh sách cuộn (rail focus được, cuộn bằng phím mũi tên). */
  label?: string;
  /** Đầu section (thường là h2): có thì mũi tên tròn nằm cùng hàng, từ 60rem. */
  head?: ReactNode;
  /** Từ 60rem rail thành lưới 3 cột (mọi mục vừa khung), không còn mũi tên và mép mờ. */
  grid?: boolean;
  /** `<li>` của từng mục. */
  children: ReactNode;
}

/**
 * Rail v3: `ul` scroll-snap cuộn ngang được khi chưa có JS; JS chỉ thêm mũi tên trước/sau (ẩn tới khi chạy, vô hiệu ở hai đầu)
 * và gỡ mép mờ bên phải khi cuộn hết. Tôn trọng prefers-reduced-motion (cuộn tức thì).
 */
export function Rail({ label, head, grid = false, children }: Props) {
  const t = useT();
  const listRef = useRef<HTMLUListElement>(null);
  const [ready, setReady] = useState(false);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { start: el.scrollLeft <= 1, end: max <= 1 || el.scrollLeft >= max - 1 };
      setEdge((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    setReady(true);
    el.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 1), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      {head ? (
        <div className="hv-sec-head">
          {head}
          {grid ? null : (
            <div className="hv-rail-ctrls" hidden={!ready}>
              <button type="button" className="hv-rail-btn" aria-label={t("rail.prev")} disabled={edge.start} onClick={() => scroll(-1)}>
                <ChevronLeft className="size-icon" aria-hidden />
              </button>
              <button type="button" className="hv-rail-btn" aria-label={t("rail.next")} disabled={edge.end} onClick={() => scroll(1)}>
                <ChevronRight className="size-icon" aria-hidden />
              </button>
            </div>
          )}
        </div>
      ) : null}
      <div className="hv-rail-wrap" data-end={edge.end}>
        <ul ref={listRef} className={grid ? "hv-rail hv-rail-3" : "hv-rail"} tabIndex={0} aria-label={label}>
          {children}
        </ul>
      </div>
    </>
  );
}
