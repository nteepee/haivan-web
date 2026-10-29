import type { Page } from "@playwright/test";
import wpRoute from "../test/fixtures/wp-route.json" with { type: "json" };
import { expect, test } from "./fixtures";

const ORIGIN = "http://127.0.0.1:3100";

async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((r) => JSON.parse(r) as Record<string, unknown>);
}

/** Nội dung thẻ meta; null khi không có thẻ (getAttribute một mình sẽ chờ thẻ xuất hiện). */
async function meta(page: Page, name: string): Promise<string | null> {
  const el = page.locator(`meta[name="${name}"]`);
  return (await el.count()) ? el.first().getAttribute("content") : null;
}

test("tuyến có bài WP: title/H1/meta của WP, đủ khối, JSON-LD Service + FAQPage + BreadcrumbList", async ({ page }) => {
  await page.goto("/xe-khach/my-dinh/dien-bien");
  await expect(page).toHaveTitle(wpRoute.seo_title);
  expect(await meta(page, "description")).toBe(wpRoute.meta_description);
  expect(await meta(page, "robots")).toBeNull(); // index mặc định
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(wpRoute.h1);
  await expect(page.getByRole("heading", { level: 2, name: "Giờ chạy & giá vé xe Mỹ Đình đi Điện Biên" })).toBeVisible();
  for (const name of ["Loại xe", "Điểm đón trả", "Văn phòng & giờ làm việc", "Đặt vé khứ hồi", "Câu hỏi thường gặp", "Tuyến liên quan"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  // HTML của WP đã qua sanitizer: link ngoài có rel=noopener, không còn script.
  await expect(page.locator('a[href="https://haivan.com/ho-tro"]')).toHaveAttribute("rel", "noopener");

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBe(`${ORIGIN}/xe-khach/my-dinh/dien-bien`);
  const hreflang = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
  expect(hreflang.sort()).toEqual(["vi", "x-default"]);

  const ld = await jsonLd(page);
  expect(ld.map((x) => x["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "Service"]);
  expect(ld.find((x) => x["@type"] === "Service")).toMatchObject({
    provider: { "@type": "Organization", name: "Hải Vân", url: ORIGIN },
    offers: { "@type": "Offer", price: 485000, priceCurrency: "VND" },
  });

  // Nút cuối trang cuộn về form tìm vé.
  await page.getByRole("link", { name: "Đặt vé Mỹ Đình đi Điện Biên" }).click();
  await expect(page).toHaveURL(/#tim-ve$/);
  await expect(page.locator("#tim-ve")).toBeInViewport();
});

test("tuyến chưa có bài WP: dùng CMS rồi mẫu, vẫn index", async ({ page }) => {
  await page.goto("/xe-khach/quan-1/vung-tau");
  await expect(page).toHaveTitle("Xe Quận 1 TP.HCM Đi Vũng Tàu | VP Bến Thành - Hải Vân");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đặt vé xe Quận 1 đi Vũng Tàu");
  expect(await meta(page, "robots")).toBeNull();

  await page.goto("/xe-khach/vung-tau/quan-1-san-bay");
  await expect(page).toHaveTitle("Xe Vũng Tàu đi Quận 1 Sân Bay – Vé từ 140.000đ | Hải Vân");
  expect(await meta(page, "description")).toBe("Đặt vé xe Hải Vân Vũng Tàu đi Quận 1 Sân Bay: giá từ 140.000đ, 2 giờ. Giữ chỗ online, thanh toán VNPay.");
});

test("bản /en: noindex,follow và không khai báo hreflang en", async ({ page }) => {
  await page.goto("/en/xe-khach/my-dinh/dien-bien");
  expect(await meta(page, "robots")).toBe("noindex, follow");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Book bus tickets Mỹ Đình to Điện Biên");
  const hreflang = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
  expect(hreflang).not.toContain("en");
});

test("tuyến CMS không biết: noindex, chỉ có form tìm", async ({ page }) => {
  await page.goto("/xe-khach/khong-co/tuyen-nay");
  expect(await meta(page, "robots")).toBe("noindex");
  await expect(page.getByRole("button", { name: "Tìm vé" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
});

test("sitemap tuyến: /xe-khach + tuyến phổ biến, lastmod từ WP, không có en", async ({ request }) => {
  const res = await request.get("/xe-khach/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("xml");
  const xml = await res.text();
  expect(xml).toContain(`<loc>${ORIGIN}/xe-khach</loc>`);
  expect(xml).toContain(`<loc>${ORIGIN}/xe-khach/my-dinh/dien-bien</loc><lastmod>${wpRoute.updated_at}</lastmod>`);
  expect(xml).toContain(`<loc>${ORIGIN}/xe-khach/quan-1/vung-tau</loc></url>`);
  expect(xml).not.toContain("/en/");
});

test("footer: logo đối tác tải được, nút gọi hotline nổi, không còn markup Flatsome", async ({ page }) => {
  await page.goto("/xe-khach");
  await expect(page.getByRole("heading", { level: 1, name: "Đặt vé xe khách Hải Vân" })).toBeVisible();
  await expect(page).toHaveTitle("Đặt vé xe khách Hải Vân online – Lịch chạy & giá vé");
  const partner = page.locator('footer img[src*="partner1"]').first();
  await partner.scrollIntoViewIfNeeded();
  await expect.poll(() => partner.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  // Hotline lấy từ layout WP (mock đổi hotline để chứng minh nguồn).
  await expect(page.getByRole("link", { name: "Gọi hotline 1900 E2E0" })).toHaveAttribute("href", "tel:1900E2E0");
  await expect(page.locator("footer").getByRole("link", { name: "Facebook" })).toHaveAttribute("rel", "noopener");
  await expect(page.locator("#main-menu")).toHaveCount(0);
});
