import { rankIcon } from "@/lib/loyalty";

/** Icon hạng thành viên (PNG trong public/assets/icons); `alt` là tên hạng. */
export function RankIcon({ rank, name, size = 32, muted }: { rank: number; name: string; size?: 32 | 40; muted?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- icon tĩnh 32-40px, không cần tối ưu ảnh
    <img src={rankIcon(rank)} alt={name} width={size} height={size} className={`shrink-0 object-contain ${muted ? "opacity-55 grayscale" : ""}`} style={{ width: size, height: size }} />
  );
}
