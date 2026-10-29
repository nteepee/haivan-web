import { describe, expect, it } from "vitest";
import fixture from "../../test/fixtures/wp-layout.json";
import fallback from "@/content/layout-fallback.json";
import { layoutSchema } from "./layout";

describe("hợp đồng layout WP ↔ Next", () => {
  it("bản dự phòng khớp hợp đồng", () => {
    const parsed = layoutSchema.parse(fallback);
    expect(parsed.vi.primary.length).toBeGreaterThan(0);
    expect(parsed.en.primary[0].href.startsWith("/en/")).toBe(true);
  });

  it("fixture WP khớp hợp đồng và trùng bản dự phòng", () => {
    expect(layoutSchema.parse(fixture)).toEqual(layoutSchema.parse(fallback));
  });

  it("bản dự phòng có đủ khối footer (đối tác, thành viên, thanh toán, chứng nhận, mạng xã hội, app)", () => {
    const l = layoutSchema.parse(fallback);
    expect(l.partners).toHaveLength(6);
    expect(l.members?.[0].href).toBe("https://gpn.travel/vietnam/");
    expect(l.payments).toHaveLength(2);
    expect(l.certificate?.href).toBe("http://online.gov.vn/Home/WebDetails/70573");
    expect(l.social?.facebook).toContain("facebook.com");
    expect(l.badges?.appstore).toBe("/assets/images/appstore.png");
    expect(l.qr).toBe("/assets/images/qrcode_haivan.png");
    expect(l.copyright).toEqual({ vi: "Bản quyền © {year} Hải Vân", en: "Copyright © {year} Hai Van" });
    expect(l.en.company.lines[0]).toContain("Hai Phong City");
  });

  it("trường mới tuỳ chọn: layout v1 cũ vẫn hợp lệ", () => {
    const { partners, members, payments, social, certificate, qr, badges, copyright, logo_white, ...legacy } = fallback as Record<string, unknown>;
    void [partners, members, payments, social, certificate, qr, badges, copyright, logo_white];
    expect(layoutSchema.safeParse(legacy).success).toBe(true);
  });

  it("từ chối ảnh/liên kết nguy hiểm trong trường mới", () => {
    const bad = (patch: Record<string, unknown>) => layoutSchema.safeParse({ ...fallback, ...patch }).success;
    expect(bad({ partners: [{ img: "javascript:alert(1)", alt: "x" }] })).toBe(false);
    expect(bad({ partners: [{ img: "//evil.com/a.png", alt: "x" }] })).toBe(false);
    expect(bad({ members: [{ img: "/assets/a.png", href: "javascript:alert(1)", alt: "x" }] })).toBe(false);
    expect(bad({ social: { facebook: "javascript:alert(1)" } })).toBe(false);
  });

  it("imageSrc từ chối /\\host (trình duyệt coi \\ như /)", () => {
    const bad = (img: string) => layoutSchema.safeParse({ ...fallback, partners: [{ img, alt: "x" }] }).success;
    expect(bad("/\\evil.com/a.png")).toBe(false);
    expect(bad("/\\\\evil.com")).toBe(false);
    expect(bad("/assets/images/ok.png")).toBe(true);
  });

  it("href menu, ios, android, messenger: chỉ http(s) hoặc đường dẫn nội bộ; hotline giữ nguyên chuỗi", () => {
    const withMenu = (href: string) => ({ ...fallback, vi: { ...fallback.vi, primary: [{ label: "x", href }] } });
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com", "/\\evil.com", "mailto:a@b.c", "diem-den", ""]) {
      expect(layoutSchema.safeParse(withMenu(bad)).success, bad).toBe(false);
    }
    for (const ok of ["/diem-den", "/en/xe-khach", "https://haivan.com/x", "http://localhost:8180/"]) {
      expect(layoutSchema.safeParse(withMenu(ok)).success, ok).toBe(true);
    }
    const apps = (ios: string, android: string) => layoutSchema.safeParse({ ...fallback, apps: { ios, android } }).success;
    expect(apps("javascript:alert(1)", fallback.apps.android)).toBe(false);
    expect(apps(fallback.apps.ios, "data:x")).toBe(false);
    expect(apps(fallback.apps.ios, fallback.apps.android)).toBe(true);
    expect(layoutSchema.safeParse({ ...fallback, messenger: "javascript:1" }).success).toBe(false);
    expect(layoutSchema.safeParse({ ...fallback, hotline: "1900 E2E0" }).success).toBe(true);
  });

  it("từ chối dữ liệu sai hợp đồng", () => {
    expect(layoutSchema.safeParse({ version: 2 }).success).toBe(false);
  });
});

describe("withFallbackDefaults", () => {
  it("WP vắng trường footer → lấy bản dự phòng; mảng rỗng của WP được giữ (ẩn hàng)", async () => {
    const { withFallbackDefaults } = await import("@/lib/layout-source");
    const base = layoutSchema.parse(fallback);
    const { partners, members, ...legacy } = base;
    void [partners, members];
    const merged = withFallbackDefaults({ ...legacy, payments: [] }, base);
    expect(merged.partners).toHaveLength(6);
    expect(merged.members).toHaveLength(1);
    expect(merged.payments).toEqual([]);
  });
});

describe("bản dự phòng: menu tuyến", () => {
  const labels = (lang: "vi" | "en") => layoutSchema.parse(fallback)[lang].primary[0].children!.map((c) => c.label);
  it("có Mỹ Đình – Mộc Châu và tên chiều về Vũng Tàu 'Quận 1 / Sân bay'", () => {
    expect(labels("vi")).toContain("Hà Nội – Mộc Châu");
    expect(labels("vi")).toContain("Sân bay Tân Sơn Nhất – Vũng Tàu");
  });
  it("bản en dùng tên tiếng Anh, không còn tiếng Việt có dấu trong menu tuyến", () => {
    expect(labels("en")).toContain("Hanoi – Moc Chau");
    expect(labels("en").join(" ")).not.toMatch(/[ạảãàáâấầẩẫậăắằẳẵặđêếềểễệôốồổỗộơớờởỡợưứừửữựỹ]/i);
  });
});
