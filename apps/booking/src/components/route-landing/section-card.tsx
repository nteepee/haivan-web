import type { ReactNode } from "react";

/**
 * Khối trang tuyến: nền tự xoay trắng, vàng ấm, xám nhạt theo thứ tự các khối liền kề (`.hv-ground`, không bao giờ hai nền giống nhau
 * liền nhau dù khối tuỳ chọn vắng mặt) + container + tiêu đề h2; `id` dùng cho aria-labelledby và neo liên kết.
 */
export function SectionCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="hv-section hv-ground">
      <div className="hv-container">
        <div className="hv-head-block">
          <h2 id={id}>{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}
