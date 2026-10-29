import { describe, expect, it } from "vitest";
import fixture from "../../test/fixtures/wp-route.json";
import { routeLandingSchema } from "@/schemas/route-landing";
import { buildRouteLanding } from "./route-landing-build";
import type { RouteListing } from "./route-listing";
import { routeTemplate } from "./route-landing-template";
import { publicOrigin } from "./public-origin";
import { routeJsonLd } from "./route-schema";

const place = (name: string) => ({ name, lat: 1, lng: 2 });
const cms: RouteListing = {
  data: { slug: "my-dinh/dien-bien", start_place: place("Bến xe Mỹ Đình"), end_place: place("Bến xe Điện Biên"), wayroad: { name: "Mỹ Đình - Điện Biên", price_avg: "Từ 485.000đ", run_time: 11, distance: 500 } },
};
const opts = { origin: "https://haivan.com", locale: "vi" as const, start: "my-dinh", end: "dien-bien" };

describe("routeJsonLd", () => {
  it("không bao giờ phát AggregateRating/Review (đánh giá không có dữ liệu thật bị coi là tự dựng)", () => {
    const view = buildRouteLanding(routeLandingSchema.parse(fixture), cms, routeTemplate("vi"));
    expect(JSON.stringify(routeJsonLd(view, opts))).not.toMatch(/AggregateRating|aggregateRating|reviewCount|"Review"/);
  });

  it("BreadcrumbList + Service + FAQPage khi có FAQ", () => {
    const view = buildRouteLanding(routeLandingSchema.parse(fixture), cms, routeTemplate("vi"));
    const [breadcrumb, service, faq] = routeJsonLd(view, opts) as Array<Record<string, unknown>>;
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(service).toMatchObject({
      "@type": "Service",
      provider: { "@type": "Organization", name: "Hải Vân", url: "https://haivan.com" },
      areaServed: ["Mỹ Đình", "Điện Biên"],
      offers: { "@type": "Offer", price: 485000, priceCurrency: "VND" },
    });
    expect(faq["@type"]).toBe("FAQPage");
    expect((faq.mainEntity as unknown[]).length).toBe(2);
  });

  it("không FAQ → không FAQPage; không giá → không offers; en có tiền tố /en", () => {
    const view = buildRouteLanding(null, { ...cms, data: { ...cms.data, wayroad: { name: "Mỹ Đình - Điện Biên" } } }, routeTemplate("en"));
    const ld = routeJsonLd(view, { ...opts, locale: "en" }) as Array<Record<string, unknown>>;
    expect(ld.map((x) => x["@type"])).toEqual(["BreadcrumbList", "Service"]);
    expect(ld[1]).not.toHaveProperty("offers");
    expect(ld[1].url).toBe("https://haivan.com/en/xe-khach/my-dinh/dien-bien");
  });

  it("PUBLIC_ORIGIN có dấu / cuối không sinh // trong url/breadcrumb; không còn tham chiếu @id treo", () => {
    const view = buildRouteLanding(routeLandingSchema.parse(fixture), cms, routeTemplate("vi"));
    const origin = publicOrigin({ PUBLIC_ORIGIN: "https://haivan.com/" });
    const json = JSON.stringify(routeJsonLd(view, { ...opts, origin }));
    expect(json).not.toContain("//xe-khach");
    expect(json).not.toContain("#organization");
    expect(json).toContain("https://haivan.com/xe-khach/my-dinh/dien-bien");
  });
});
