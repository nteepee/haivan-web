const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/**
 * Nội dung mã khuyến mãi là HTML từ backend; web cũ chèn thẳng (dangerouslySetInnerHTML).
 * Cùng origin với BFF nên chỉ hiển thị dạng văn bản: bỏ thẻ, giữ xuống dòng cho <br>/<p>/<li>.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** "2026-10-28 00:00:00" → "28 tháng 10, 2026" theo ngôn ngữ; không đọc được → "". */
export function formatLongDate(value: string | null | undefined, locale: string): string {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "vi-VN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
