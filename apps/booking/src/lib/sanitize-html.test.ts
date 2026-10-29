import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize-html";

describe("sanitizeHtml", () => {
  it("giữ thẻ trong allowlist", () => {
    const html = "<h2>Tiêu đề</h2><p>Chữ <strong>đậm</strong>, <em>nghiêng</em><br>dòng mới</p><ul><li>a</li></ul><blockquote>q</blockquote>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("bỏ script/style/iframe cùng nội dung", () => {
    expect(sanitizeHtml("<p>a</p><script>alert(1)</script><style>p{x:y}</style><iframe src=//evil></iframe><p>b</p>")).toBe("<p>a</p><p>b</p>");
    expect(sanitizeHtml("x<script>alert(1)")).toBe("x");
    expect(sanitizeHtml("<svg><script>alert(1)</script></svg>ok")).toBe("ok");
  });

  it("bỏ thuộc tính nguy hiểm: on*, style, class, id", () => {
    expect(sanitizeHtml('<p onclick="x()" style="color:red" class="c" id="i">t</p>')).toBe("<p>t</p>");
    expect(sanitizeHtml('<a href="/x" onmouseover="x()">t</a>')).toBe('<a href="/x">t</a>');
  });

  it("chặn scheme nguy hiểm trong href (kể cả mã hoá entity/khoảng trắng)", () => {
    for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "jav&#x61;script:alert(1)", "java\tscript:alert(1)", "java&Tab;script:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "//evil.com", "\\\\evil.com", "&#106;avascript&colon;alert(1)"]) {
      expect(sanitizeHtml(`<a href="${bad}">t</a>`), bad).toBe("<a>t</a>");
    }
  });

  it("href http(s) thêm rel=noopener, tương đối giữ nguyên", () => {
    expect(sanitizeHtml('<a href="https://haivan.com/x?a=1&b=2">t</a>')).toBe('<a href="https://haivan.com/x?a=1&amp;b=2" rel="noopener">t</a>');
    expect(sanitizeHtml('<a href="/diem-den">t</a>')).toBe('<a href="/diem-den">t</a>');
    expect(sanitizeHtml('<a href="#faq">t</a>')).toBe('<a href="#faq">t</a>');
  });

  it("img: chỉ https hoặc /assets/, luôn lazy, bỏ onerror", () => {
    expect(sanitizeHtml('<img src="https://cms.haivan.com/a.jpg" alt="Xe" onerror="x()">')).toBe('<img src="https://cms.haivan.com/a.jpg" alt="Xe" loading="lazy">');
    expect(sanitizeHtml('<img src="/assets/images/a.png">')).toBe('<img src="/assets/images/a.png" alt="" loading="lazy">');
    expect(sanitizeHtml('<img src="http://x/a.jpg">')).toBe("");
    expect(sanitizeHtml('<img src="javascript:alert(1)">')).toBe("");
    expect(sanitizeHtml('<img src="/assets/../etc/passwd">')).toBe("");
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe("");
  });

  it("vector thẻ lồng/lệch không sinh thuộc tính hay thẻ nguy hiểm", () => {
    expect(sanitizeHtml('<a href="x" <img src=x onerror=alert(1)>t</a>')).not.toMatch(/onerror|<img/);
    expect(sanitizeHtml("<scr<script>ipt>alert(1)</scr</script>ipt>")).not.toMatch(/<script/i);
    expect(sanitizeHtml('<p/onclick=alert(1)>t</p>')).toBe("<p>t</p>");
    expect(sanitizeHtml('<b title="><script>alert(1)</script>">t</b>')).toBe("<b>t</b>");
    expect(sanitizeHtml("<!--<script>alert(1)</script>-->ok")).toBe("ok");
    expect(sanitizeHtml("<math><mi xlink:href=javascript:alert(1)>x</mi></math>y")).toBe("y");
  });

  it("escape ký tự < > lẻ trong văn bản", () => {
    expect(sanitizeHtml("1 < 2 và 3 > 2")).toBe("1 &lt; 2 và 3 &gt; 2");
    expect(sanitizeHtml("&lt;script&gt;")).toBe("&lt;script&gt;");
  });

  it("cân bằng thẻ đóng và bỏ thẻ đóng thừa", () => {
    expect(sanitizeHtml("<p><strong>a")).toBe("<p><strong>a</strong></p>");
    expect(sanitizeHtml("a</p></ul>b")).toBe("ab");
    expect(sanitizeHtml("<ul><li>a</ul>")).toBe("<ul><li>a</li></ul>");
  });

  it("rỗng/null → chuỗi rỗng; bỏ thẻ ngoài allowlist nhưng giữ chữ", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml("<div><span>chữ</span><table><tr><td>ô</td></tr></table></div>")).toBe("chữô");
  });

  it("tel: và mailto: được giữ (hotline/email của MKT), không rel; ký tự lạ bị chặn", () => {
    expect(sanitizeHtml('<a href="tel:1900 6763">gọi</a>')).toBe('<a href="tel:19006763">gọi</a>');
    expect(sanitizeHtml('<a href="TEL:+84.19006763">gọi</a>')).toBe('<a href="TEL:+84.19006763">gọi</a>');
    expect(sanitizeHtml('<a href="mailto:ve@haivan.com?subject=Dat%20ve&amp;x=1">mail</a>')).toBe('<a href="mailto:ve@haivan.com?subject=Dat%20ve&amp;x=1">mail</a>');
    for (const bad of ['tel:1900&quot;onclick=x', "tel:abc", "mailto:a@b.c&lt;script&gt;", "sms:123", "tel:"]) {
      expect(sanitizeHtml(`<a href="${bad}">t</a>`), bad).toBe("<a>t</a>");
    }
  });

  it("thuộc tính quá dài bị bỏ (href/src), nội dung vẫn giữ", () => {
    const long = "a".repeat(2_001);
    expect(sanitizeHtml(`<a href="https://haivan.com/${long}">t</a>`)).toBe("<a>t</a>");
    expect(sanitizeHtml(`<img src="https://haivan.com/${long}.png" alt="x">`)).toBe("");
    const ok = "a".repeat(1_900);
    expect(sanitizeHtml(`<a href="/${ok}">t</a>`)).toBe(`<a href="/${ok}">t</a>`);
  });

  it("chú thích/doctype không đóng nuốt phần còn lại, không ném lỗi", () => {
    expect(sanitizeHtml("a<!-- chưa đóng <script>alert(1)</script> b")).toBe("a");
    expect(sanitizeHtml("a<!DOCTYPE html b")).toBe("a");
    expect(sanitizeHtml("a<!-->b")).toBe("ab");
    expect(sanitizeHtml("a<?xml version='1.0'?>b")).toBe("ab");
  });
});

describe("sanitizeHtml: hiệu năng với đầu vào độc hại (200 KB)", () => {
  const MAX = 200_000;
  const payloads: Record<string, string> = {
    "<a  lặp không đóng": "<a ".repeat(MAX / 3),
    '<a " lặp (nháy lệch)': '<a "'.repeat(MAX / 4),
    "<a ' lặp rồi > cuối": "<a '".repeat(MAX / 4 - 1) + ">",
    "< lẻ": "<".repeat(MAX),
    "<! lặp": "<!".repeat(MAX / 2),
    "<script lặp không đóng": "<script ".repeat(MAX / 8),
    "</script lặp": "</script ".repeat(MAX / 9),
    "thẻ lồng sâu": "<ul><li>".repeat(MAX / 8),
    "thuộc tính dài": `<a href="${"x".repeat(MAX - 20)}">t</a>`,
    "nhiều thuộc tính": `<a ${"a=b ".repeat(MAX / 4 - 3)}>t</a>`,
  };
  for (const [name, payload] of Object.entries(payloads)) {
    it(`${name} xử lý < 600 ms`, () => {
      const started = performance.now();
      const out = sanitizeHtml(payload);
      expect(performance.now() - started).toBeLessThan(600);
      expect(out).not.toMatch(/<script|onerror|javascript:/i);
    });
  }

  it("đầu vào vượt 200 KB bị cắt, không ném lỗi", () => {
    expect(sanitizeHtml(`<p>${"a".repeat(MAX * 2)}</p>`).length).toBeLessThanOrEqual(MAX + 20);
  });
});
