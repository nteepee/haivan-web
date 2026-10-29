"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CircleAlert, Loader2 } from "lucide-react";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useLocale, useT } from "@/components/providers";
import { StickyBar } from "@/components/ui/sticky-bar";
import { useSession } from "@/hooks/use-session";
import { localePrefix } from "@/i18n/t";
import { readAffiliate } from "@/lib/affiliate";
import { draftFromHold } from "@/lib/hold-draft";
import { formatMoney } from "@/lib/format";
import { ApiError, gw } from "@/lib/http";
import type { SearchParamsData } from "@/lib/search-url";
import { buildHoldBody, mergeFloors, toggleSeat } from "@/lib/seats";
import { holdResponseSchema } from "@/schemas/booking";
import type { Seat, SeatMapResponse, Trip } from "@/schemas/trip";
import { useBookingDraft } from "@/stores/booking-draft";
import { GuestCountDialog } from "./guest-count-dialog";
import { SeatFloor, SeatLegend } from "./seat-grid";

/** id của chỗ gắn thẻ tổng (cột phải của trang kết quả). */
export const SUMMARY_SLOT_ID = "seat-summary-slot";

const noopSubscribe = () => () => {};
const findSummarySlot = () => document.getElementById(SUMMARY_SLOT_ID);

interface Props {
  trip: Trip;
  search: SearchParamsData;
  seatMap: SeatMapResponse;
  numberGuest: number;
  onGuestsChange: (n: number) => void;
}

/** Sơ đồ ghế + "Tiếp tục" → (đăng nhập) → giữ chỗ → /xe-khach/xac-nhan, theo thứ tự kiểm tra của web cũ. */
export function SeatPanel({ trip, search, seatMap, numberGuest, onGuestsChange }: Props) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const queryClient = useQueryClient();
  const setDraft = useBookingDraft((s) => s.setDraft);
  const [selected, setSelected] = useState<Seat[]>([]);
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  // Bấm "Tiếp tục" khi chưa chọn ghế: nhấn mạnh dòng gợi ý (không toast, không im lặng).
  const [needSeat, setNeedSeat] = useState(false);
  const isCombo = !!seatMap.is_combo;
  const showPrice = (trip.route.show_price ?? 0) !== 0;
  const [floor1, floor2] = useMemo(() => mergeFloors(seatMap.data), [seatMap.data]);

  const hold = useMutation({
    mutationFn: () => gw("hold-booking", { method: "POST", body: buildHoldBody(trip, selected, isCombo, readAffiliate()), schema: holdResponseSchema }),
    onSuccess: (res) => {
      setDraft(draftFromHold({ trip, search, seats: selected, hold: res, isCombo, user: session?.user ?? null }));
      router.push(`${localePrefix(locale)}/xe-khach/xac-nhan`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: ["session"] });
        return setLoginOpen(true);
      }
      toast.error(error instanceof ApiError ? error.message : "Không giữ được chỗ, vui lòng thử lại");
    },
  });

  const keepSeat = () => {
    if (hold.isPending || hold.isSuccess || sessionPending) return;
    if (!selected.length) return setNeedSeat(true);
    if (isCombo && selected.length !== numberGuest) return setGuestOpen(true);
    if (seatMap.is_locked) return toast.warning(t("list_trip.msg.msg_block_booking"));
    if (!session?.loggedIn) return setLoginOpen(true);
    hold.mutate();
  };

  const onToggle = (seat: Seat) => {
    const next = toggleSeat(selected, seat, { isCombo, numberGuest });
    if (next.error === "max") toast.warning(t("list_trip.msg.msg_booking_select_seat"));
    if (next.error === "guest") setGuestOpen(true);
    setSelected(next.seats);
    if (next.seats.length) setNeedSeat(false);
  };

  // Thẻ tổng: nếu trang có chỗ gắn (#seat-summary-slot, cột phải của kết quả) thì vẽ ở đó; không có thì vẽ ngay dưới sơ đồ.
  const slot = useSyncExternalStore(noopSubscribe, findSummarySlot, () => null);
  const total = selected.reduce((sum, s) => sum + s.price, 0);
  const summary: ReactNode = (
    <StickyBar>
      <div className="hv-sticky-inner">
        {/* Thẻ cột phải (từ 60rem): ghế đã chọn dạng chip; điện thoại chỉ có thanh đáy (tổng + nút). */}
        {selected.length ? (
          <ul className="hv-sel-chips">
            {selected.map((s) => (
              <li key={s.id} className="hv-tag hv-tag-on">
                {t("ux.seat_aria", { name: s.name })}
              </li>
            ))}
          </ul>
        ) : null}
        <p aria-live="polite" className={selected.length ? "hv-sticky-sum" : needSeat ? "hv-err mt-0 text-16" : "hv-hint"}>
          {selected.length ? (
            <>
              <span className="hv-sticky-label">
                {t("list_trip.selected_seats", { seats: selected.map((s) => s.name).join(", "), product: trip.product.name, time: trip.time })}
              </span>
              {showPrice ? <span className="hv-total">{formatMoney(total)}</span> : null}
              {showPrice ? <span className="hv-sticky-label">{t("booking_infor.total")}</span> : null}
            </>
          ) : (
            <>
              {needSeat ? <CircleAlert className="mt-1 size-6 shrink-0" aria-hidden /> : null}
              {t("ux.pick_seat_hint")}
            </>
          )}
        </p>
        <button
          type="button"
          onClick={keepSeat}
          disabled={hold.isPending || hold.isSuccess || sessionPending}
          aria-disabled={!selected.length || undefined}
          aria-busy={hold.isPending || undefined}
          className="hv-btn hv-btn-primary hv-btn-lg"
        >
          {hold.isPending ? <Loader2 className="size-6 animate-spin" aria-hidden /> : null}
          {hold.isPending ? t("list_trip.msg.in_progress") : t("list_trip.continue")}
        </button>
      </div>
    </StickyBar>
  );

  return (
    <div className="grid gap-6">
      <SeatLegend />
      <div className="relative">
        <div className="hv-bus-scroll">
          <SeatFloor grid={floor1} selected={selected} showPrice={showPrice} onToggle={onToggle} label={floor2.length ? `${t("list_trip.floor")} 1` : undefined} />
          {floor2.length ? <SeatFloor grid={floor2} selected={selected} showPrice={showPrice} onToggle={onToggle} label={`${t("list_trip.floor")} 2`} /> : null}
        </div>
        {seatMap.is_locked || (seatMap.note && !noteDismissed) ? (
          <div className="absolute inset-0 grid place-items-center rounded-3 bg-scrim p-6 text-center text-surface">
            <div className="max-w-sm space-y-3">
              {seatMap.is_locked ? <p className="text-lg font-extrabold">{t("list_trip.noti")}</p> : null}
              <p className="whitespace-pre-line">{seatMap.is_locked ? seatMap.message : seatMap.note}</p>
              {seatMap.is_locked && seatMap.link ? (
                <a href={seatMap.link} target="_blank" rel="noopener" className="hv-btn hv-btn-primary">
                  {t("list_trip.view_details")}
                </a>
              ) : null}
              {!seatMap.is_locked ? (
                <button type="button" onClick={() => setNoteDismissed(true)} className="hv-btn hv-btn-primary">
                  {t("list_trip.continue")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {/* Phone: thanh cố định đáy (tổng + "Tiếp tục"); từ 60rem thành thẻ dính cột phải. Chưa chọn ghế: dòng gợi ý aria-live, nút không bị vô hiệu. */}
      {slot ? createPortal(summary, slot) : summary}
      {/* Sửa lỗi UI web cũ: đăng nhập xong tự giữ chỗ đúng 1 lần (chỉ khi đăng nhập từ chính nút này). */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} hint={t("login_form.hint_login_booking")} onLoggedIn={() => hold.mutate()} />
      <GuestCountDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        value={numberGuest}
        max={trip.available_seats}
        onUpdate={(n) => {
          if (n < selected.length) setSelected([]);
          onGuestsChange(n);
        }}
      />
    </div>
  );
}
