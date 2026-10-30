import type { ReactNode } from "react";

/**
 * Khối trang tuyến (v2 như trang chủ): nhãn nhỏ phía trên, H2 hai vế (vế sau tô vàng đậm), đoạn dẫn bên phải trên màn rộng.
 * Nền tự xoay trắng, vàng ấm, xám nhạt theo thứ tự các khối liền kề (`.hv-ground`, không bao giờ hai nền giống nhau liền nhau dù
 * khối tuỳ chọn vắng mặt); `tone="dark"` là khối nền than. `id` dùng cho aria-labelledby và neo liên kết.
 */
export function SectionCard({
  id,
  title,
  titleB,
  eyebrow,
  intro,
  tone,
  children,
}: {
  id: string;
  title: string;
  titleB?: string | null;
  eyebrow?: string | null;
  intro?: ReactNode;
  tone?: "dark";
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={tone === "dark" ? "hv-section hv-ground hv2r-dark" : "hv-section hv-ground"}>
      <div className="hv-container">
        <div className="hv-head-block hv2r-head">
          <div>
            {eyebrow ? <p className="hv2r-eyebrow">{eyebrow}</p> : null}
            <h2 id={id}>
              {title}
              {titleB ? <em> {titleB}</em> : null}
            </h2>
          </div>
          {intro ? <div className="hv2r-intro">{intro}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
