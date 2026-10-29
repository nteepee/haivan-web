import { describe, expect, it } from "vitest";
import { stringifyQuery } from "./qs";
import { appendCorridorParams, buildSearchUrl, parseCorridorParams, parseSearch, parseSearchWithCorridor, tripsQuery, type CorridorParams } from "./search-url";

const NOW = Date.parse("2026-10-28T07:00:00Z");

describe("URL tìm chuyến", () => {
  it("đọc link cũ không mã hoá (live 2026-10-28)", () => {
    const url = new URL("https://haivan.com/xe-khach/tim-chuyen?from=Quận 1,10.7753882,106.702825&to=Vũng Tàu,10.3391989,107.0710401&date=01-11-2026&numberGuest=1");
    expect(parseSearch(url.searchParams, NOW)).toEqual({
      from: { name: "Quận 1", lat: 10.7753882, lng: 106.702825 },
      to: { name: "Vũng Tàu", lat: 10.3391989, lng: 107.0710401 },
      date: "2026-11-01",
      numberGuest: 1,
      type: 0,
    });
  });

  it("cắt tên ở dấu phẩy đầu như web cũ, mặc định hôm nay và 1 khách", () => {
    const params = new URLSearchParams("from=159 Điện Biên Phủ, Đa Kao,10.78,106.69&to=Gành Hào,10.33,107.07&type=2");
    const data = parseSearch(params, NOW)!;
    expect(data.from.name).toBe("159 Điện Biên Phủ");
    expect(data.from.lat).toBe(10.78);
    expect(data.date).toBe("2026-10-28");
    expect(data.type).toBe(2);
  });

  it("thiếu điểm → null", () => {
    expect(parseSearch(new URLSearchParams("from=a,1,2"), NOW)).toBeNull();
  });

  it("build ↔ parse vòng tròn", () => {
    const data = parseSearch(new URLSearchParams("from=Quận 1,10.7753882,106.702825&to=Vũng Tàu,10.3391989,107.0710401&date=01-11-2026&numberGuest=2&type=2"), NOW)!;
    const built = new URL(`https://haivan.com${buildSearchUrl(data, "/en")}`);
    expect(built.pathname).toBe("/en/xe-khach/tim-chuyen");
    expect(parseSearch(built.searchParams, NOW)).toEqual(data);
  });

  it("query el/trips khớp request live", () => {
    // URL live không có type → request có type=0.
    const data = parseSearch(new URLSearchParams("from=Quận 1,10.7753882,106.702825&to=Vũng Tàu,10.3391989,107.0710401&date=01-11-2026&numberGuest=1"), NOW)!;
    expect(stringifyQuery(tripsQuery(data))).toBe(
      "from_location=10.7753882%2C106.702825&to_location=10.3391989%2C107.0710401&numberGuest=1&date=2026-11-01&sort_by=time&sort_mode=asc&type=0",
    );
    expect(stringifyQuery(tripsQuery(data, 2))).toContain("&page=2&");
  });
});

const MOC = {
  from: { name: "Mỹ Đình", lat: 21.0284297, lng: 105.7782687 },
  to: { name: "Mộc Châu", lat: 20.8461723, lng: 104.6415738 },
  date: "2026-10-31",
  numberGuest: 2,
  type: 2,
};
const OWN: CorridorParams = { tuyen: "hn-moc", chieu: "ab", diemDi: "my-dinh", diemDen: "nong-truong", ngayVe: "2026-11-02", chang: null, donDi: null, gio: null };

describe("query riêng của tuyến chính", () => {
  it("buildSearchUrl không đổi một byte; query riêng được nối sau bằng hàm riêng", () => {
    const base = buildSearchUrl(MOC);
    expect(base).toBe(
      "/xe-khach/tim-chuyen?from=M%E1%BB%B9%20%C4%90%C3%ACnh%2C21.0284297%2C105.7782687&to=M%E1%BB%99c%20Ch%C3%A2u%2C20.8461723%2C104.6415738&date=31-10-2026&numberGuest=2&type=2",
    );
    // trường corridor trong dữ liệu tìm không làm đổi link gốc
    expect(buildSearchUrl({ ...MOC, corridor: OWN })).toBe(base);
    expect(appendCorridorParams(base, OWN)).toBe(`${base}&tuyen=hn-moc&chieu=ab&diem_di=my-dinh&diem_den=nong-truong&ngay_ve=02-11-2026`);
  });

  it("query el/trips giống hệt khi có hay không có ý định tuyến chính", () => {
    expect(stringifyQuery(tripsQuery({ ...MOC, corridor: OWN }))).toBe(stringifyQuery(tripsQuery(MOC)));
    expect(stringifyQuery(tripsQuery(MOC))).toBe(
      "from_location=21.0284297%2C105.7782687&to_location=20.8461723%2C104.6415738&numberGuest=2&date=2026-10-31&sort_by=time&sort_mode=asc&type=2",
    );
  });

  it("append ↔ parse vòng tròn, gồm chặng về và khung giờ; parseSearch vẫn đọc phần apigw", () => {
    const own: CorridorParams = { ...OWN, chieu: "ba", ngayVe: null, chang: "ve", donDi: "B02ABC123", gio: "morning" };
    const url = new URL(`https://haivan.com${appendCorridorParams(buildSearchUrl(MOC), own)}`);
    expect(url.searchParams.get("chang")).toBe("ve");
    expect(url.searchParams.get("don_di")).toBe("B02ABC123");
    expect(parseCorridorParams(url.searchParams)).toEqual(own);
    expect(parseSearchWithCorridor(url.searchParams, NOW)).toEqual({ ...MOC, corridor: own });
    expect(parseSearch(url.searchParams, NOW)).toEqual(MOC);
  });

  it("không có tuyen hợp lệ → null; giá trị lạ bị bỏ chứ không tin", () => {
    expect(parseCorridorParams(new URLSearchParams("diem_di=my-dinh"))).toBeNull();
    expect(parseCorridorParams(new URLSearchParams("tuyen=../x"))).toBeNull();
    expect(parseCorridorParams(new URLSearchParams("tuyen=hn-moc&chieu=zz&diem_di=<script>&ngay_ve=1-1-1&chang=ra&don_di=a b&gio=night"))).toEqual({
      tuyen: "hn-moc",
      chieu: "ab",
      diemDi: null,
      diemDen: null,
      ngayVe: null,
      chang: null,
      donDi: null,
      gio: null,
    });
  });
});
