"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Màu đọc từ token thiết kế (SVG của leaflet không nhận var()); chỉ chạy ở client vì bản đồ tải ssr:false. */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Bản đồ điểm đón của chuyến (tâm + chú thích `place_start`). */
export function TrackingMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return (
    <MapContainer center={[lat, lng]} zoom={13} zoomControl={false} className="size-full">
      <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap" />
      <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: token("--color-ink"), fillColor: token("--color-accent"), fillOpacity: 1 }}>
        {label ? <Tooltip permanent direction="top">{label.split(",")[0]}</Tooltip> : null}
      </CircleMarker>
    </MapContainer>
  );
}
