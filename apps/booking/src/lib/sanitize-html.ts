/**
 * Lọc HTML do MKT nhập trong WordPress (không thêm thư viện). Dựng lại HTML từ allowlist thay vì xoá phần xấu:
 * thẻ ngoài danh sách bị bỏ (giữ chữ bên trong, trừ script/style/iframe… bỏ cả nội dung), mọi thuộc tính ngoài
 * danh sách bị bỏ (on*, style, class…), thẻ đóng luôn cân bằng. Chạy phía server nên không cần DOM.
 * Bộ quét thẻ chạy một lượt từ trái sang phải (không regex lồng nhau) và có ngân sách công việc, nên đầu vào xấu cũng tuyến tính.
 */
const ALLOWED_TAGS = new Set(["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "br", "img", "blockquote"]);
const VOID_TAGS = new Set(["br", "img"]);
/** Thẻ phải bỏ cả nội dung (nội dung là mã hoặc không phải văn bản người đọc). */
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "textarea", "xmp", "noembed", "noframes", "title"]);
const MAX_INPUT = 200_000;
/** Thuộc tính dài hơn mức này bị bỏ (href/src hợp lệ không bao giờ dài thế). */
const MAX_ATTR_VALUE = 2_000;
/** Tổng số ký tự được phép quét lại khi gặp "<" không đóng, tính theo bội số độ dài đầu vào. */
const WORK_FACTOR = 4;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", colon: ":", tab: "\t", newline: "\n", nbsp: " ", sol: "/", lpar: "(", rpar: ")" };

/** Giải mã entity trước khi kiểm tra URL (chặn "jav&#x61;script:"). */
function decodeEntities(value: string): string {
  return value.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));?/gi, (whole, hex: string | undefined, dec: string | undefined, name: string | undefined) => {
    if (name) return NAMED[name.toLowerCase()] ?? whole;
    const code = hex ? parseInt(hex, 16) : parseInt(dec ?? "", 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeText = (v: string) => v.replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Bỏ ký tự điều khiển/khoảng trắng đầu-giữa mà trình duyệt bỏ qua khi đọc scheme. */
const isIgnoredChar = (c: number) => c <= 0x20 || (c >= 0x7f && c <= 0x9f) || (c >= 0x200b && c <= 0x200f) || c === 0x2028 || c === 0x2029 || c === 0xfeff;
const clean = (v: string) => Array.from(decodeEntities(v)).filter((ch) => !isIgnoredChar(ch.codePointAt(0) ?? 0)).join("");

function safeHref(raw: string): { href: string; external: boolean } | null {
  const v = clean(raw);
  if (!v || v.includes("\\")) return null;
  if (/^https?:\/\/[^/?#]+/i.test(v)) return { href: v, external: true };
  // Hotline/email do MKT nhập: chỉ ký tự an toàn, không có "<>\"'".
  if (/^tel:[+0-9().,;#*-]+$/i.test(v) || /^mailto:[^\s"'<>\\]+$/i.test(v)) return { href: v, external: false };
  // Tương đối: không có scheme (":" trước "/?#") và không phải "//host".
  if (v.startsWith("//") || /^[^/?#]*:/.test(v)) return null;
  return { href: v, external: false };
}

function safeImgSrc(raw: string): string | null {
  const v = clean(raw);
  if (/^https:\/\/[^/?#]+/i.test(v)) return v;
  if (v.startsWith("/assets/") && !v.includes("..") && !v.includes("\\")) return v;
  return null;
}

function parseAttrs(source: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const m of source.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (!attrs.has(name)) attrs.set(name, value.length > MAX_ATTR_VALUE ? "" : value);
  }
  return attrs;
}

function openTag(tag: string, attrSource: string): string | null {
  const attrs = parseAttrs(attrSource);
  if (tag === "a") {
    const link = safeHref(attrs.get("href") ?? "");
    if (!link) return "<a>";
    return `<a href="${escapeAttr(link.href)}"${link.external ? ' rel="noopener"' : ""}>`;
  }
  if (tag === "img") {
    const src = safeImgSrc(attrs.get("src") ?? "");
    if (!src) return null;
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(decodeEntities(attrs.get("alt") ?? ""))}" loading="lazy">`;
  }
  return `<${tag}>`;
}

interface ParsedTag {
  closing: boolean;
  name: string;
  attrs: string;
  /** Vị trí ngay sau dấu ">". */
  end: number;
}

const isAlpha = (c: number) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const isNameChar = (c: number) => isAlpha(c) || (c >= 48 && c <= 57) || c === 45;

/** Đọc thẻ bắt đầu tại `from` ("<"): tên rồi tìm ">" đầu tiên ngoài dấu nháy. Không đóng được → null (và tính công việc vào `work`). */
function readTag(html: string, from: number, work: { used: number }): ParsedTag | null {
  let i = from + 1;
  const closing = html.charCodeAt(i) === 47;
  if (closing) i++;
  if (!isAlpha(html.charCodeAt(i))) return null;
  const nameStart = i;
  while (i < html.length && isNameChar(html.charCodeAt(i))) i++;
  const name = html.slice(nameStart, i).toLowerCase();
  const attrStart = i;
  let quote = 0;
  for (; i < html.length; i++) {
    const c = html.charCodeAt(i);
    if (quote) {
      if (c === quote) quote = 0;
    } else if (c === 34 || c === 39) quote = c;
    else if (c === 62) return { closing, name, attrs: html.slice(attrStart, i), end: i + 1 };
  }
  work.used += html.length - from;
  return null;
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  const html = input.length > MAX_INPUT ? input.slice(0, MAX_INPUT) : input;
  const out: string[] = [];
  const stack: string[] = [];
  const work = { used: 0 };
  const limit = html.length * WORK_FACTOR;
  let text = 0; // đầu đoạn văn bản chưa phát ra
  let from = 0;
  while (work.used <= limit) {
    const lt = html.indexOf("<", from);
    if (lt === -1) break;
    const next = html.charCodeAt(lt + 1);
    if (next === 33 || next === 63) {
      // Chú thích, doctype, <?xml>: bỏ; không có điểm kết thì trình duyệt cũng nuốt tới hết đầu vào.
      out.push(escapeText(html.slice(text, lt)));
      const comment = html.startsWith("<!--", lt);
      const at = comment ? html.indexOf("-->", lt + 2) : html.indexOf(">", lt + 2);
      text = from = at === -1 ? html.length : at + (comment ? 3 : 1);
      continue;
    }
    const tag = readTag(html, lt, work);
    if (!tag) {
      from = lt + 1; // "<" lẻ: giữ như văn bản (sẽ được escape)
      continue;
    }
    out.push(escapeText(html.slice(text, lt)));
    text = from = tag.end;
    const { closing, name, attrs } = tag;
    if (DROP_WITH_CONTENT.has(name)) {
      if (closing) continue;
      const end = new RegExp(`</${name}\\s*>`, "ig");
      end.lastIndex = from;
      const close = end.exec(html);
      text = from = close ? close.index + close[0].length : html.length;
      continue;
    }
    if (!ALLOWED_TAGS.has(name)) continue;
    if (closing) {
      const at = stack.lastIndexOf(name);
      if (at === -1) continue;
      while (stack.length > at) out.push(`</${stack.pop()}>`);
      continue;
    }
    const open = openTag(name, attrs);
    if (!open) continue;
    out.push(open);
    if (!VOID_TAGS.has(name)) stack.push(name);
  }
  out.push(escapeText(html.slice(text)));
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join("").trim();
}
