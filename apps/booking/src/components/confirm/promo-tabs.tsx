"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import { autoTokenPromoId } from "@/lib/auto-promo-token";
import { expiryOf, isExhausted, parsePromotions, type Promotion } from "@/schemas/promotion";
import { gw } from "@/lib/http";
import type { DraftSeat } from "@/stores/booking-draft";

/** Dòng meta của mã: "HSD 31/12/2026 · Không giới hạn lượt" hoặc "· Còn N lượt" (số lượng chữ khác giữ nguyên chữ). */
export function promoMeta(p: Promotion, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const parts: string[] = [];
  const end = expiryOf(p);
  if (end) parts.push(t("booking_infor.promo_expiry", { date: end.slice(0, 10).split("-").reverse().join("/") }));
  const q = p.available_quantity;
  if (typeof q === "number" || (typeof q === "string" && /^\s*\d+\s*$/.test(q))) {
    if (Number(q) > 0) parts.push(t("booking_infor.promo_left", { n: Number(q) }));
  } else if (typeof q === "string" && q.trim()) {
    parts.push(/kh[oô]ng\s+gi[oớ]i\s+h[aạ]n|unlimited/i.test(q) ? t("booking_infor.promo_unlimited") : q.trim());
  }
  return parts.join(" · ");
}

/** Nút chính "Áp dụng" rộng hết hàng: đang kiểm tra = vòng quay + chữ "Đang kiểm tra mã ..." (nút vẫn đậm màu, bấm lại bị bỏ qua). */
function ApplyButton({ busy, disabled, onClick, label }: { busy: boolean; disabled: boolean; onClick: () => void; label: string }) {
  const t = useT();
  return (
    <button type="button" disabled={disabled && !busy} aria-busy={busy || undefined} onClick={() => (busy ? undefined : onClick())} className="hv-btn hv-btn-primary hv-btn-block">
      {busy ? <Loader2 className="size-icon animate-spin" aria-hidden /> : null}
      {busy ? t("booking_infor.promo_applying") : label}
    </button>
  );
}

/** Tab "Mã khuyến mãi": danh sách + tìm mã ẩn (`admin/search-code-hide`, code thô), chọn ghế áp mã. */
export function PromoCodeTab({ seats, promotions, busy, onApply }: { seats: DraftSeat[]; promotions: Promotion[]; busy: boolean; onApply: (code: string | null, picked: number[]) => void }) {
  const t = useT();
  const [keyword, setKeyword] = useState("");
  const [found, setFound] = useState<Promotion[] | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const inputId = useId();

  useEffect(() => {
    const q = keyword.trim();
    if (!q) return;
    const timer = setTimeout(async () => {
      try {
        // Web cũ ghép `code` thô vào URL (không mã hoá).
        const res = parsePromotions(await gw("admin/search-code-hide", { rawQuery: `code=${q}&channel_code=WEBHAIVAN&channel=1` }));
        if (res.length) setFound(res);
        else toast.warning(t("booking_infor.msg.no_found_code"));
      } catch {
        toast.warning(t("booking_infor.msg.no_found_code"));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, t]);

  // Mã bị che thành token (`@auto:<id>`) là mã ẩn của chương trình tự áp: không liệt kê để chọn tay.
  const list = (keyword.trim() && found ? found : promotions).filter((p) => !isExhausted(p.available_quantity) && autoTokenPromoId(p.code) === null);
  const toggleSeat = (id: number) => setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  return (
    <div className="grid gap-4">
      <div>
        <label htmlFor={inputId} className="hv-label text-16">{t("booking_infor.promo_code")}</label>
        <input id={inputId} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t("booking_infor.msg.pls_insert_promo")} autoComplete="off" className="hv-field" />
      </div>
      <ul className="grid gap-2">
        {list.map((p) => {
          const chosen = code === p.code;
          const meta = promoMeta(p, t);
          return (
            <li key={p.code} className={`grid gap-2 rounded-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 ${chosen ? "bg-select select-ring" : "bg-surface shadow-1"}`}>
              <div className="min-w-0">
                <p className="font-extrabold [overflow-wrap:anywhere]">{p.name ?? p.code}</p>
                {meta ? <p className="text-14 text-muted">{meta}</p> : null}
              </div>
              <button type="button" onClick={() => { setCode(p.code); setPicked([]); }} aria-pressed={chosen} className="hv-btn hv-btn-outline hv-btn-sm w-fit justify-self-end">
                {chosen ? <Check className="size-icon" strokeWidth={3} aria-hidden /> : null}
                {t(chosen ? "booking_infor.promo_chosen" : "booking_infor.promo_use")}
              </button>
            </li>
          );
        })}
      </ul>
      {code ? (
        <div>
          <p className="mb-2 font-semibold">{t("booking_infor.select_seat_use_code")}</p>
          <div className="flex flex-wrap gap-2">
            {seats.map((s) => (
              <button key={s.id} type="button" disabled={s.is_reward} onClick={() => toggleSeat(s.id)} aria-pressed={picked.includes(s.id)} className={`flex min-h-control items-center gap-2 rounded-1 px-4 disabled:cursor-not-allowed disabled:opacity-55 ${picked.includes(s.id) ? "bg-select select-ring font-extrabold" : "bg-paper-2"}`}>
                {picked.includes(s.id) ? <Check className="size-4" strokeWidth={3} aria-hidden /> : null}
                {t("booking_infor.seats")} {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <p aria-live="polite" className="text-14 text-muted empty:hidden">{code ? (picked.length ? "" : t("booking_infor.promo_pick_seat_hint")) : list.length ? t("booking_infor.promo_pick_hint") : ""}</p>
      {/* Đã chọn mã thì cần ít nhất một ghế; chưa chọn mã thì "Áp dụng" gỡ mã đang áp (như web cũ). */}
      <ApplyButton busy={busy} disabled={!!code && picked.length === 0} onClick={() => onApply(code, picked)} label={t("booking_infor.apply")} />
    </div>
  );
}

/** Tab "Đổi điểm": 1 điểm = 1đ; ghế có mã KM hoặc không đủ điểm bị khoá. */
export function PointsTab({ seats: initial, points, onApply }: { seats: DraftSeat[]; points: number; onApply: (seats: DraftSeat[]) => void }) {
  const t = useT();
  const [seats, setSeats] = useState(initial);
  const used = seats.reduce((s, x) => (x.is_reward ? s + x.price : s), 0);
  return (
    <div className="grid gap-3">
      <p>{points - used} {t("booking_infor.usable_points")}</p>
      {seats.map((s) => {
        const locked = !!s.promotion || (!s.is_reward && points - used - s.price < 0);
        return (
          <label key={s.id} className="flex min-h-control cursor-pointer items-center justify-between gap-3 rounded-2 bg-surface p-3 shadow-1 has-checked:bg-select has-checked:select-ring">
            <span>{t("booking_infor.seats")} {s.name} — {s.price.toLocaleString("vi-VN")} {t("booking_infor.points")}</span>
            <input type="checkbox" disabled={locked} checked={!!s.is_reward} onChange={(e) => setSeats(seats.map((x) => (x.id === s.id ? { ...x, is_reward: e.target.checked } : x)))} className="size-icon shrink-0 accent-ink" />
          </label>
        );
      })}
      <button type="button" onClick={() => onApply(seats)} className="hv-btn hv-btn-primary hv-btn-block">{t("booking_infor.apply")}</button>
    </div>
  );
}
