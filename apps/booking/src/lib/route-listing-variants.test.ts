import { describe, expect, it } from "vitest";
import type { RouteListing } from "./route-listing";
import { isReturnOnlyRoute, RETURN_ONLY_ROUTES, reversedListing, withWayroadName } from "./route-listing-variants";

const outbound: RouteListing = {
  status: "OK",
  data: {
    slug: "my-dinh/ban-phu",
    start_place: { name: "Bến xe Mỹ Đình", lat: 21.0284297, lng: 105.7782687, slug: "my-dinh" },
    end_place: { name: "Bản Phủ", lat: 21.3174085589382, lng: 103.010549797354, slug: "" },
    wayroad: { name: "Mỹ Đình - Bản Phủ", price_avg: "Từ 485.000đ", run_time: 11, distance: 510, img_path: "/x.jpg", meta_title: "Đặt Vé Xe", meta_desc: "cũ" },
  },
  questions_wayroad: [{ question: "Có hoàn tiền không?", answer: "Cam kết hoàn tiền." }],
  services: [{ name: "Ghế massage", image: null }],
};

describe("RETURN_ONLY_ROUTES", () => {
  it("chỉ có hai chiều về đã xác nhận, không có Điện Biên → Yên Nghĩa", () => {
    expect([...RETURN_ONLY_ROUTES].sort()).toEqual(["ban-phu/my-dinh", "muong-cha/my-dinh"]);
    expect(isReturnOnlyRoute("ban-phu/my-dinh")).toBe(true);
    expect(isReturnOnlyRoute("dien-bien/yen-nghia")).toBe(false);
    expect(isReturnOnlyRoute("my-dinh/ban-phu")).toBe(false);
  });
});

describe("reversedListing", () => {
  it("đảo hai đầu và tên tuyến, giữ toạ độ để tìm chuyến chiều về", () => {
    const back = reversedListing(outbound, "ban-phu/my-dinh");
    expect(back.data.slug).toBe("ban-phu/my-dinh");
    expect(back.data.start_place).toEqual(outbound.data.end_place);
    expect(back.data.end_place).toEqual(outbound.data.start_place);
    expect(back.data.wayroad?.name).toBe("Bản Phủ - Mỹ Đình");
    expect(back.data.wayroad?.distance).toBe(510);
  });

  it("không mang giá, giờ chạy, meta, hỏi đáp, tiện ích của chiều đi sang chiều về", () => {
    const back = reversedListing(outbound, "ban-phu/my-dinh");
    expect(back.data.wayroad).toMatchObject({ price_avg: null, run_time: null, meta_title: null, meta_desc: null });
    expect(back.questions_wayroad).toBeUndefined();
    expect(back.services).toBeUndefined();
  });

  it("tên tuyến không tách được thì ghép từ tên bến, không có wayroad vẫn dựng được", () => {
    const odd = reversedListing({ data: { ...outbound.data, wayroad: { ...outbound.data.wayroad!, name: "Tuyến lạ" } } }, "ban-phu/my-dinh");
    expect(odd.data.wayroad?.name).toBe("Bản Phủ - Bến xe Mỹ Đình");
    const none = reversedListing({ data: { ...outbound.data, wayroad: null } }, "ban-phu/my-dinh");
    expect(none.data.wayroad).toMatchObject({ name: "Bản Phủ - Bến xe Mỹ Đình", distance: null, img_path: null });
  });

  it("không sửa listing gốc", () => {
    const before = structuredClone(outbound);
    reversedListing(outbound, "ban-phu/my-dinh");
    expect(outbound).toEqual(before);
  });
});

describe("withWayroadName", () => {
  it("đổi tên tuyến theo tỉnh/thành, giữ các trường khác", () => {
    const named = withWayroadName(outbound, "Hà Nội - Bản Phủ");
    expect(named.data.wayroad?.name).toBe("Hà Nội - Bản Phủ");
    expect(named.data.wayroad?.price_avg).toBe("Từ 485.000đ");
    expect(named.questions_wayroad).toBe(outbound.questions_wayroad);
    expect(outbound.data.wayroad?.name).toBe("Mỹ Đình - Bản Phủ");
  });

  it("tên rỗng, trùng hoặc listing không có wayroad thì trả nguyên listing", () => {
    expect(withWayroadName(outbound, null)).toBe(outbound);
    expect(withWayroadName(outbound, "  ")).toBe(outbound);
    expect(withWayroadName(outbound, "Mỹ Đình - Bản Phủ")).toBe(outbound);
    const bare: RouteListing = { data: { ...outbound.data, wayroad: null } };
    expect(withWayroadName(bare, "Hà Nội - Bản Phủ")).toBe(bare);
  });
});
