"use client";

import { Check } from "lucide-react";
import { useT } from "@/components/providers";
import type { SeatGrid } from "@/lib/seats";
import type { Seat } from "@/schemas/trip";

interface Props {
  grid: SeatGrid;
  selected: Seat[];
  showPrice: boolean;
  onToggle: (seat: Seat) => void;
  label?: string;
}

/** "190000" → "190.000": số; đơn vị "VNĐ" hiện ở dòng riêng dưới giá (ô hẹp, như web cũ). */
const seatPrice = (n: number) => Math.round(n).toLocaleString("vi-VN");

/**
 * Một tầng trong khung xe (r-3, bánh, tài xế, "Đầu xe" và "Cuối xe"). Ghế 64x52 r-1: trống = viền edge 1px; chọn = nền vàng + vòng chọn + dấu tick;
 * đã đặt = nền xám, số gạch, chữ "Đã đặt" (không chỉ bằng màu). Ô null = lối đi.
 */
export function SeatFloor({ grid, selected, showPrice, onToggle, label }: Props) {
  const t = useT();
  const selectedIds = new Set(selected.map((s) => s.id));
  return (
    <div className="hv-bus" role="group" aria-label={label ?? t("list_trip.seat_map")}>
      {/* Bánh xe và đầu xe chỉ là hình (CSS); tài xế có chữ để người đọc màn hình biết đầu xe ở đâu. */}
      <i className="hv-bus-wheel hv-bus-wheel-l hv-bus-wheel-f" aria-hidden />
      <i className="hv-bus-wheel hv-bus-wheel-r hv-bus-wheel-f" aria-hidden />
      <i className="hv-bus-wheel hv-bus-wheel-l hv-bus-wheel-b" aria-hidden />
      <i className="hv-bus-wheel hv-bus-wheel-r hv-bus-wheel-b" aria-hidden />
      <div className="hv-bus-cab">
        <span className="hv-bus-driver">
          <i aria-hidden />
          {t("list_trip.driver")}
        </span>
        <p className="hv-bus-front">{label ? `${label}, ${t("list_trip.front")}` : t("list_trip.front")}</p>
        <span aria-hidden />
      </div>
      {grid.map((row, r) => (
        <div key={r} className="hv-bus-row">
          {row.map((seat, c) => {
            if (!seat) return <span key={`n${c}`} className="hv-seat-empty" aria-hidden />;
            const isSelected = selectedIds.has(seat.id);
            const booked = !seat.is_empty;
            const price = seatPrice(seat.price);
            const ariaLabel = booked ? t("ux.seat_aria_booked", { name: seat.name }) : showPrice ? t("ux.seat_aria_price", { name: seat.name, price: `${price} ${t("ux.vnd")}` }) : t("ux.seat_aria", { name: seat.name });
            return (
              <button
                key={seat.id}
                type="button"
                disabled={booked}
                onClick={() => onToggle(seat)}
                aria-pressed={isSelected}
                aria-label={ariaLabel}
                className={`hv-seat ${booked ? "hv-seat-booked" : ""}`}
              >
                <span className="hv-seat-no">{seat.name}</span>
                {booked ? (
                  <span className="hv-seat-price">{t("list_trip.booked")}</span>
                ) : showPrice ? (
                  <>
                    <span className="hv-seat-price">{price}</span>
                    <span className="hv-seat-unit">{t("ux.vnd")}</span>
                  </>
                ) : null}
                {isSelected ? <Check className="hv-seat-check size-4" strokeWidth={3} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ))}
      <p className="hv-bus-rear">{t("list_trip.rear")}</p>
    </div>
  );
}

/** Chú giải dùng đúng ô ghế thật thu nhỏ (24px): Chỗ trống, Đang chọn, Đã đặt. */
export function SeatLegend() {
  const t = useT();
  return (
    <ul className="hv-legend" aria-label={t("list_trip.legend")}>
      <li>
        <span aria-hidden className="hv-seat" />
        {t("list_trip.available_seats")}
      </li>
      <li>
        <span aria-hidden className="hv-seat hv-seat-on">
          <Check className="size-4" strokeWidth={3} />
        </span>
        {t("list_trip.progress")}
      </li>
      <li>
        <span aria-hidden className="hv-seat hv-seat-booked" />
        {t("list_trip.booked")}
      </li>
    </ul>
  );
}
