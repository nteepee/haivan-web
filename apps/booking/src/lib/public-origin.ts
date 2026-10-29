/** Gốc công khai của site (canonical, JSON-LD, sitemap): `PUBLIC_ORIGIN` bỏ dấu "/" cuối để nối path không sinh "//xe-khach". */
export function publicOrigin(env: Record<string, string | undefined> = process.env): string {
  return (env.PUBLIC_ORIGIN?.trim() || "https://haivan.com").replace(/\/+$/, "");
}
