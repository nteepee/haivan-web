import { describe, expect, it } from "vitest";
import { tripPhotos } from "./trip-photos";

const trip = (route: string, product: string, car_imgs: string[] = ["https://erp/x.jpg"]) => ({ route: { name: route }, product: { name: product }, car_imgs }) as Parameters<typeof tripPhotos>[0];

describe("tripPhotos", () => {
  it("tuyến Điện Biên dùng bộ ảnh xe vàng theo hạng, không dùng ảnh ERP", () => {
    expect(tripPhotos(trip("Mỹ Đình - Điện Biên", "Siêu rẻ"))[1]).toBe("/assets/design/v2/db-eco-aisle.webp");
    expect(tripPhotos(trip("Mỹ Đình - Bản Phủ", "Tiết kiệm"))[1]).toBe("/assets/design/v2/db-luxury-berth.webp");
    expect(tripPhotos(trip("Mỹ Đình - Mường Chà", "Cao cấp"))[1]).toBe("/assets/design/v2/dien-bien-hero-royal-bed.webp");
    expect(tripPhotos(trip("Điện Biên - Mỹ Đình", "Tiết kiệm"))[0]).toBe("/assets/design/v2/dien-bien-hero-bus.webp");
  });

  it("tuyến khác giữ ảnh ERP", () => {
    expect(tripPhotos(trip("Mỹ Đình - Sơn La", "Tiết kiệm"))).toEqual(["https://erp/x.jpg"]);
    expect(tripPhotos(trip("Quận 1 - Vũng Tàu", "Royal", []))).toEqual([]);
  });
});
