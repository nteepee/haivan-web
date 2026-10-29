"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";

interface Point {
  place_name: string;
  location?: { lat: number; lng: number } | null;
}

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Backend có điểm toạ độ (0,0) hoặc rỗng (vd. "Mũi Nghinh Phong") → bỏ, nếu không đường vẽ kéo ra giữa đại dương. */
export function validStops<T extends Point>(points: T[]): (T & { location: { lat: number; lng: number } })[] {
  return points.filter(
    (p): p is T & { location: { lat: number; lng: number } } =>
      !!p.location &&
      Number.isFinite(p.location.lat) &&
      Number.isFinite(p.location.lng) &&
      !(p.location.lat === 0 && p.location.lng === 0) &&
      Math.abs(p.location.lat) <= 90 &&
      Math.abs(p.location.lng) <= 180,
  );
}

/** Màu bản đồ, đọc từ token thiết kế lúc chạy để không phụ thuộc selector CSS lên SVG của Leaflet (Leaflet bỏ className khỏi SVG path ở bản production). */
export interface MapColors {
  line: string;
  startFill: string;
  startStroke: string;
  endFill: string;
}

const FALLBACK_COLORS: MapColors = { line: "#565552", startFill: "#FFC20E", startStroke: "#333333", endFill: "#333333" };

/** Đọc `--color-*` từ :root; thiếu token (hoặc không có DOM) thì dùng hex dự phòng cùng giá trị với tokens.css. */
export function readMapColors(root?: Element): MapColors {
  const el = root ?? (typeof document === "undefined" ? undefined : document.documentElement);
  if (!el) return FALLBACK_COLORS;
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const ink = read("--color-ink", FALLBACK_COLORS.startStroke);
  return {
    line: read("--color-muted", FALLBACK_COLORS.line),
    startFill: read("--color-accent", FALLBACK_COLORS.startFill),
    startStroke: ink,
    endFill: ink,
  };
}

/** Lộ trình như web cũ: đường xám, điểm đi vàng, điểm đến xám, fitBounds padding 30. Màu truyền qua pathOptions (đọc từ token). */
export function JourneyMap({ points }: { points: Point[] }) {
  const stops = validStops(points);
  const coords = stops.map((p) => [p.location.lat, p.location.lng] as [number, number]);
  // Component chỉ render phía client (dynamic ssr:false) nên đọc computed style ở đây không gây lệch hydration.
  const colors = useMemo(() => readMapColors(), []);
  if (coords.length < 2) return null;
  return (
    <MapContainer bounds={coords} boundsOptions={{ padding: [30, 30] }} scrollWheelZoom={false} className="size-full">
      <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap" />
      <Polyline positions={coords} pathOptions={{ color: colors.line, weight: 2 }} />
      <CircleMarker
        center={coords[0]}
        radius={8}
        pathOptions={{ color: colors.startStroke, fillColor: colors.startFill, fillOpacity: 1 }}
      >
        <Tooltip>{stops[0].place_name}</Tooltip>
      </CircleMarker>
      <CircleMarker
        center={coords[coords.length - 1]}
        radius={8}
        pathOptions={{ color: colors.startStroke, fillColor: colors.endFill, fillOpacity: 1 }}
      >
        <Tooltip>{stops[stops.length - 1].place_name}</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
