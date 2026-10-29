import { describe, expect, it, vi } from "vitest";

vi.mock("react-leaflet", () => ({}));
vi.mock("leaflet/dist/leaflet.css", () => ({}));

describe("validStops", () => {
  it("bỏ toạ độ (0,0), thiếu, NaN, ngoài phạm vi; giữ thứ tự", async () => {
    const { validStops } = await import("./journey-map");
    const pts = [
      { place_name: "A", location: { lat: 10.8, lng: 106.6 } },
      { place_name: "Mũi Nghinh Phong", location: { lat: 0, lng: 0 } },
      { place_name: "B", location: null },
      { place_name: "C", location: { lat: Number.NaN, lng: 1 } },
      { place_name: "D", location: { lat: 95, lng: 1 } },
      { place_name: "E", location: { lat: 10.3, lng: 107.1 } },
    ];
    expect(validStops(pts).map((p) => p.place_name)).toEqual(["A", "E"]);
  });
});

describe("readMapColors", () => {
  it("đọc màu từ custom property của phần tử gốc", async () => {
    const { readMapColors } = await import("./journey-map");
    const root = document.createElement("div");
    root.style.setProperty("--color-muted", " #111111 ");
    root.style.setProperty("--color-accent", "#222222");
    root.style.setProperty("--color-ink", "#333333");
    document.body.append(root);
    expect(readMapColors(root)).toEqual({ line: "#111111", startFill: "#222222", startStroke: "#333333", endFill: "#333333" });
    root.remove();
  });

  it("thiếu token thì rơi về hex dự phòng, không trả chuỗi rỗng", async () => {
    const { readMapColors } = await import("./journey-map");
    const c = readMapColors(document.createElement("div"));
    expect(Object.values(c).every((v) => /^#[0-9A-F]{6}$/i.test(v))).toBe(true);
  });
});
