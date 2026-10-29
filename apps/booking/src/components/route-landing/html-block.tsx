import { cn } from "@/lib/utils";

/** Kiểu cho HTML đã qua `sanitizeHtml` (chỉ h2/h3/p/ul/ol/li/a/img/blockquote…): cột đọc 18/28, tiêu đề đậm, liên kết xanh gạch chân. */
const PROSE =
  "max-w-[68ch] text-18 text-text [&_a]:font-semibold [&_a]:text-link [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:rounded-2 [&_blockquote]:bg-accent-soft [&_blockquote]:p-4 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-24 [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-20 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 first:[&>*]:mt-0 last:[&>*]:mb-0";

export function HtmlBlock({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={cn(PROSE, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
