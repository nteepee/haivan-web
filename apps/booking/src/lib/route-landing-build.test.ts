import { describe, expect, it } from "vitest";
import fixture from "../../test/fixtures/wp-route.json";
import { routeLandingSchema } from "@/schemas/route-landing";
import { buildRouteLanding, parsePrice, routeEndpoints } from "./route-landing-build";
import type { RouteListing } from "./route-listing";
import { DESCRIPTION_MAX, routeTemplate, TITLE_MAX } from "./route-landing-template";

const tpl = routeTemplate("vi");
const wp = routeLandingSchema.parse(fixture);

function cms(over: Partial<NonNullable<RouteListing["data"]["wayroad"]>> | null = {}, extra: Partial<RouteListing> = {}): RouteListing {
  const place = (name: string) => ({ name, lat: 1, lng: 2 });
  return {
    data: {
      slug: "my-dinh/dien-bien",
      start_place: place("Bến xe Mỹ Đình"),
      end_place: place("Bến xe Điện Biên"),
      wayroad: over === null ? null : { name: "Mỹ Đình - Điện Biên", price_avg: "Từ 485.000đ", run_time: 11, distance: 500, ...over },
    },
    ...extra,
  };
}

describe("buildRouteLanding", () => {
  it("WP thắng CMS và mẫu", () => {
    const v = buildRouteLanding(wp, cms({ meta_title: "CMS title", meta_desc: "CMS desc" }), tpl);
    expect(v.title).toBe(wp.seo_title);
    expect(v.description).toBe(wp.meta_description);
    expect(v.h1).toBe("Đặt vé xe Hà Nội đi Điện Biên");
    expect(v.faq).toHaveLength(2);
    expect(v.hasWp).toBe(true);
    expect(v.scheduleHtml).toContain("<p>");
    expect(v.contentHtml).toContain('rel="noopener"');
  });

  it("không có WP: CMS meta_title/meta_desc/faq/services thắng mẫu", () => {
    const v = buildRouteLanding(
      null,
      cms(
        { meta_title: "Xe Quận 1 Đi Vũng Tàu | Hải Vân", meta_desc: "Mô tả CMS" },
        { questions_wayroad: [{ question: "Q?", answer: "A." }], services: [{ name: "Wifi", image: "https://cms.haivan.com//a b.jpg" }, { name: "Nước", image: null }] },
      ),
      tpl,
    );
    expect(v.title).toBe("Xe Quận 1 Đi Vũng Tàu | Hải Vân");
    expect(v.description).toBe("Mô tả CMS");
    expect(v.faq).toEqual([{ q: "Q?", a: "A." }]);
    expect(v.amenities).toEqual([{ name: "Wifi", icon: "https://cms.haivan.com//a b.jpg" }, { name: "Nước", icon: null }]);
    expect(v.hasWp).toBe(false);
    expect(v.scheduleHtml).toBe("");
  });

  it("meta CMS chỉ lặp tên tuyến → dùng mẫu", () => {
    const v = buildRouteLanding(null, cms({ meta_title: "Mỹ Đình - Điện Biên", meta_desc: "Mỹ Đình - Điện Biên" }), tpl);
    expect(v.title).toBe("Xe Mỹ Đình đi Điện Biên – Vé từ 485.000đ | Hải Vân");
    expect(v.h1).toBe("Đặt vé xe Mỹ Đình đi Điện Biên");
    expect(v.description).toBe("Đặt vé xe Hải Vân Mỹ Đình đi Điện Biên: giá từ 485.000đ, 11 giờ. Giữ chỗ online, thanh toán VNPay.");
  });

  it("chuỗi rỗng từ WP coi như vắng; phụ đề + giá số", () => {
    const v = buildRouteLanding({ path: "a/b", seo_title: "  ", h1: "", faq: [] }, cms(), tpl);
    expect(v.title).toContain("Vé từ 485.000đ");
    expect(v.h1).toBe("Đặt vé xe Mỹ Đình đi Điện Biên");
    expect(v.subline).toBe("Từ 485.000đ · 11h · 500 km");
    expect(v.priceValue).toBe(485000);
  });

  it("bỏ phần thiếu: không giá, không giờ chạy", () => {
    const v = buildRouteLanding(null, cms({ price_avg: null, run_time: null, distance: null }), tpl);
    expect(v.title).toBe("Xe Mỹ Đình đi Điện Biên | Hải Vân");
    expect(v.description).toBe("Đặt vé xe Hải Vân Mỹ Đình đi Điện Biên. Giữ chỗ online, thanh toán VNPay.");
    expect(v.subline).toBeNull();
    expect(v.priceValue).toBeNull();
  });

  it("mô tả dùng điểm đón đầu tiên của WP; mẫu ≤ giới hạn ký tự", () => {
    const v = buildRouteLanding({ path: "a/b", pickup_points: [{ name: "Bến xe Mỹ Đình", address: "x" }] }, cms(), tpl);
    expect(v.description).toContain("đón tại Bến xe Mỹ Đình");
    const long = cms({ name: "Bến xe Giáp Bát Thành phố Hà Nội - Bến xe Trung tâm Điện Biên Phủ", price_avg: "Từ 1.485.000đ" });
    const t = buildRouteLanding({ path: "a/b", pickup_points: [{ name: "Văn phòng Hải Vân số 125 Hoàng Ngân Cầu Giấy Hà Nội", address: "x" }] }, long, tpl);
    expect(t.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("bản en bỏ qua meta CMS (tiếng Việt) và dùng mẫu en", () => {
    const v = buildRouteLanding(null, cms({ meta_title: "Xe Quận 1 Đi Vũng Tàu | Hải Vân", meta_desc: "Mô tả CMS" }), routeTemplate("en"));
    expect(v.title).toBe("Bus Mỹ Đình to Điện Biên – Tickets from 485.000đ | Hải Vân");
    expect(v.h1).toBe("Book bus tickets Mỹ Đình to Điện Biên");
    expect(v.description).toContain("Book Hải Vân bus tickets");
    expect(v.faq).toEqual([]);
  });

  it("HTML WP đi qua sanitizer", () => {
    const v = buildRouteLanding({ path: "a/b", content_html: '<p onclick="x()">a</p><script>x</script>', schedule_text: "<img src=x onerror=y>" }, cms(), tpl);
    expect(v.contentHtml).toBe("<p>a</p>");
    expect(v.scheduleHtml).toBe("");
  });
});

describe("tiện ích", () => {
  it("parsePrice", () => {
    expect(parsePrice("Từ 485.000đ")).toBe(485000);
    expect(parsePrice("Liên hệ")).toBeNull();
    expect(parsePrice(null)).toBeNull();
  });
  it("routeEndpoints rơi về tên bến khi tên tuyến không có dạng A - B", () => {
    expect(routeEndpoints(cms({ name: "Tuyến đặc biệt" }))).toEqual(["Bến xe Mỹ Đình", "Bến xe Điện Biên"]);
    expect(routeEndpoints(cms(null))).toEqual(["Bến xe Mỹ Đình", "Bến xe Điện Biên"]);
  });
});
