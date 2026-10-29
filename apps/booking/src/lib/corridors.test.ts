import { describe, expect, it } from "vitest";
import { FALLBACK_BOOKING_CONFIG as CONFIG } from "./booking-config-fallback";
import { parseCorridorParams, parseSearch } from "./search-url";
import {
  clampDate,
  corridorForLanding,
  corridorSearchHref,
  corridorSearchPoints,
  defaultReturnDate,
  defaultStops,
  findCorridor,
  maxTravelDate,
  pickupNote,
  returnBounds,
  reverseChieu,
  stopsFromParams,
  stopsToParams,
} from "./corridors";

const corridor = (id: string) => findCorridor(CONFIG, id)!;

describe("trạm theo chiều", () => {
  it("diem_di/diem_den ↔ trạm theo đầu: đổi chiều thì đổi vai, không đổi trạm", () => {
    const moc = corridor("hn-moc");
    const picks = stopsFromParams(moc, "ab", "nguyen-tuan", "muong-thanh");
    expect(picks).toEqual({ a: "nguyen-tuan", b: "muong-thanh" });
    expect(stopsToParams("ab", picks)).toEqual({ diemDi: "nguyen-tuan", diemDen: "muong-thanh" });
    expect(stopsToParams("ba", picks)).toEqual({ diemDi: "muong-thanh", diemDen: "nguyen-tuan" });
    // chiều ngược: diem_di thuộc đầu b
    expect(stopsFromParams(moc, "ba", "muong-thanh", "nguyen-tuan")).toEqual(picks);
  });

  it("id lạ hoặc thiếu → trạm mặc định; id của đầu kia không được nhận", () => {
    const moc = corridor("hn-moc");
    expect(stopsFromParams(moc, "ab", "khong-co", null)).toEqual(defaultStops(moc));
    expect(stopsFromParams(moc, "ab", "muong-thanh", "my-dinh")).toEqual(defaultStops(moc));
  });

  it("landing khớp tuyến + chiều", () => {
    expect(corridorForLanding(CONFIG, "my-dinh/son-la")).toMatchObject({ chieu: "ab", corridor: { id: "hn-sl" } });
    expect(corridorForLanding(CONFIG, "vung-tau/quan-1-san-bay")).toMatchObject({ chieu: "ba", corridor: { id: "sg-vt" } });
    expect(corridorForLanding(CONFIG, "yen-nghia/dien-bien")).toBeNull();
  });
});

describe("điểm tìm chuyến", () => {
  it("trạm không có point → toạ độ đầu tuyến; trạm có point → toạ độ trạm", () => {
    const sg = corridor("sg-vt");
    const q1 = corridorSearchPoints(sg, "ab", { a: "q1", b: "vt" });
    expect(q1.from).toEqual({ name: "Quận 1", lat: 10.7753882, lng: 106.702825 });
    expect(q1.to).toEqual({ name: "TP Vũng Tàu (Gành Hào)", lat: 10.3391989, lng: 107.0710401 });
    const tsn = corridorSearchPoints(sg, "ab", { a: "tsn-t1", b: "vt" });
    expect(tsn.from).toEqual({ name: "Sân bay Tân Sơn Nhất", lat: 10.8184631, lng: 106.6588245 });
    // chiều về: đầu Sài Gòn là điểm đến và vẫn theo toạ độ trạm đã chọn
    const back = corridorSearchPoints(sg, "ba", { a: "tsn-t1", b: "vt" });
    expect(back.from.name).toBe("TP Vũng Tàu (Gành Hào)");
    expect(back.to.lat).toBe(10.8184631);
  });
});

describe("giới hạn ngày", () => {
  it("ngày đi tối đa = hôm nay + max_days; chưa biết hôm nay → rỗng", () => {
    expect(maxTravelDate("2026-10-29", corridor("hn-moc"))).toBe("2026-11-27");
    expect(maxTravelDate("", corridor("hn-moc"))).toBe("");
  });

  it("ngày về tối thiểu = ngày đi; xe giường nằm +1", () => {
    expect(returnBounds(corridor("hn-moc"), "2026-10-31", "2026-10-29").min).toBe("2026-10-31");
    expect(returnBounds(corridor("hn-db"), "2026-10-31", "2026-10-29").min).toBe("2026-11-01");
  });

  it("ngày đi sát trần: ngày về tối đa không nhỏ hơn tối thiểu (giường nằm)", () => {
    const b = returnBounds(corridor("hn-db"), "2026-11-27", "2026-10-29");
    expect(b).toEqual({ min: "2026-11-28", max: "2026-11-28" });
  });

  it("ngày về mặc định: giường nằm ngày đi + 1, còn lại + 2, kẹp trong giới hạn", () => {
    expect(defaultReturnDate(corridor("hn-moc"), "2026-10-31", "2026-10-29")).toBe("2026-11-02");
    expect(defaultReturnDate(corridor("hn-db"), "2026-10-31", "2026-10-29")).toBe("2026-11-01");
    expect(defaultReturnDate(corridor("hn-moc"), "2026-11-27", "2026-10-29")).toBe("2026-11-27");
    expect(clampDate("2026-01-01", "2026-10-31", "")).toBe("2026-10-31");
  });
});

describe("ghi chú đón/trả", () => {
  it("'Đón: …; Trả: …' theo chiều, dùng tên tiếng Việt", () => {
    const moc = corridor("hn-moc");
    expect(pickupNote(moc, { chieu: "ab", diemDi: "my-dinh", diemDen: "nong-truong" })).toBe("Đón: Bến xe Mỹ Đình; Trả: Nông trường Mộc Châu");
    expect(pickupNote(moc, { chieu: "ba", diemDi: "nong-truong", diemDen: "my-dinh" })).toBe("Đón: Nông trường Mộc Châu; Trả: Bến xe Mỹ Đình");
  });

  it("thiếu trạm thì bỏ vế đó; không có gì → rỗng", () => {
    const moc = corridor("hn-moc");
    expect(pickupNote(moc, { chieu: "ab", diemDi: null, diemDen: "ben-xe-mc" })).toBe("Trả: Bến xe Mộc Châu");
    expect(pickupNote(moc, { chieu: "ab", diemDi: null, diemDen: null })).toBe("");
    expect(reverseChieu("ab")).toBe("ba");
  });
});

describe("liên kết thẻ tuyến chính", () => {
  it("tuyến chưa có landing: tìm chuyến theo trạm mặc định, không ghi ngày (mặc định hôm nay), có query riêng", () => {
    const href = corridorSearchHref(corridor("hn-moc"), "/en");
    const url = new URL(href, "https://haivan.com");
    expect(url.pathname).toBe("/en/xe-khach/tim-chuyen");
    expect(url.searchParams.has("date")).toBe(false);
    const now = Date.parse("2026-10-29T03:00:00Z");
    expect(parseSearch(url.searchParams, now)).toMatchObject({ date: "2026-10-29", numberGuest: 1, type: 2, from: { lat: 21.0284297 }, to: { lat: 20.8461723 } });
    expect(parseCorridorParams(url.searchParams)).toMatchObject({ tuyen: "hn-moc", chieu: "ab", diemDi: "my-dinh", diemDen: "nong-truong" });
  });
});
