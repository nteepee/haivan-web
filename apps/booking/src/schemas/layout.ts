import { z } from "zod";

/**
 * Hợp đồng `GET /wp-json/haivan-web/v1/layout` (WordPress child theme sinh ra).
 * Next dùng cho header/footer; fixture `test/fixtures/wp-layout.json` vừa là
 * bản dự phòng khi WP lỗi vừa là mẫu WP phải trả đúng.
 */
/** Liên kết ngoài: chỉ http(s) (chặn `javascript:`/`data:` do WP gửi sai hay bị chèn). */
const linkHref = z.url({ protocol: /^https?$/ });
/** Liên kết menu: http(s) hoặc đường dẫn nội bộ bắt đầu bằng "/" (không `//host`, không `/\host`). */
const menuHref = z.union([linkHref, z.string().regex(/^\/(?![/\\])/, "href phải là http(s) hoặc đường dẫn bắt đầu bằng /")]);

export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({ label: z.string(), href: menuHref, children: z.array(menuItemSchema).optional() }),
);
export interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

const localizedLayout = z.object({
  primary: z.array(menuItemSchema),
  footer_columns: z.array(z.object({ title: z.string(), items: z.array(menuItemSchema) })),
  company: z.object({ name: z.string(), lines: z.array(z.string()) }),
});

/** Ảnh tĩnh: đường dẫn bắt đầu bằng "/" (vd `/assets/images/..`, không `//host`, không `/\host`) hoặc URL https. */
const imageSrc = z.string().regex(/^(\/(?![/\\])|https:\/\/)/, "img phải bắt đầu bằng / hoặc https://");
const logoSchema = z.object({ img: imageSrc, href: linkHref.optional(), alt: z.string() });

export const layoutSchema = z.object({
  version: z.literal(1),
  /** Chuỗi hiển thị ("1900 6763"); chỉ được ghép sau tiền tố `tel:` nên không cần dạng URL. */
  hotline: z.string(),
  messenger: linkHref.optional(),
  apps: z.object({ ios: linkHref, android: linkHref }).optional(),
  // Các trường tuỳ chọn cho footer/dải tải app (v1 mở rộng, WP chưa trả thì Next dùng bản dự phòng).
  partners: z.array(logoSchema).optional(),
  members: z.array(logoSchema).optional(),
  payments: z.array(logoSchema).optional(),
  social: z.object({ facebook: linkHref.optional(), youtube: linkHref.optional() }).optional(),
  certificate: z.object({ href: linkHref, img: imageSrc, alt: z.string().optional() }).optional(),
  /** Ảnh mã QR tải ứng dụng. */
  qr: imageSrc.optional(),
  /** Huy hiệu cửa hàng: `appstore`/`playstore` ở dải tải app; `*_icon` ở thanh tối cuối trang. */
  badges: z
    .object({ appstore: imageSrc, playstore: imageSrc, appstore_icon: imageSrc.optional(), playstore_icon: imageSrc.optional() })
    .optional(),
  /** Chuỗi chung (WP cũ) hoặc theo ngôn ngữ `{ vi, en }`. */
  copyright: z.union([z.string(), z.object({ vi: z.string(), en: z.string() })]).optional(),
  logo_white: imageSrc.optional(),
  vi: localizedLayout,
  en: localizedLayout,
});
export type SiteLayout = z.infer<typeof layoutSchema>;
export type LocalizedLayout = z.infer<typeof localizedLayout>;
