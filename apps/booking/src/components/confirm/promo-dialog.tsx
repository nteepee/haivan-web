"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useT } from "@/components/providers";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Promotion } from "@/schemas/promotion";
import { priceTicketQuery } from "@/lib/confirm-queries";
import { ApiError, gw } from "@/lib/http";
import { checkPromotions, clearPromo } from "@/lib/promo-apply";
import { stringifyQuery } from "@/lib/qs";
import type { BookingDraft, DraftSeat } from "@/stores/booking-draft";
import { PromoCodeTab, PointsTab } from "./promo-tabs";

const priceSchema = z.looseObject({ data: z.array(z.looseObject({ ticketCode: z.string(), ticketPrice: z.union([z.number(), z.string()]) })).optional() });

interface Props {
  draft: BookingDraft;
  promotions: Promotion[];
  points: number;
  onApply: (seats: DraftSeat[]) => void;
  /** Đang tự áp ưu đãi: chưa cho mở để mã tay không chạy đua với mã tự áp. */
  disabled?: boolean;
}

/**
 * Thẻ "Khuyến mãi và đổi điểm" + modal (component gERW web cũ). Luôn mount để giữ bản sao ghế (O) và cờ combo (D)
 * cục bộ giữa các lần mở; chỉ "Áp dụng" mới ghi vào nháp.
 */
export function PromoBox({ draft, promotions, points, onApply, disabled = false }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState<DraftSeat[]>(draft.seats);
  const [comboMode, setComboMode] = useState(draft.is_combo === 1);
  const [applied, setApplied] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<"code" | "points">("code");
  const [busy, setBusy] = useState(false);

  // Nháp đổi (sau "Áp dụng") → đồng bộ bản sao (cập nhật state trong render, không qua effect).
  const [synced, setSynced] = useState(draft.seats);
  if (synced !== draft.seats) {
    setSynced(draft.seats);
    setSeats(draft.seats);
  }

  /** `GET api/price-ticket` đổi giữa giá combo (1) và giá niêm yết (0); chỉ đổi bản sao cục bộ. */
  const changeCombo = async (isCombo: 0 | 1, base = seats): Promise<DraftSeat[] | null> => {
    try {
      const res = await gw("price-ticket", { rawQuery: stringifyQuery(priceTicketQuery({ ...draft, seats: base }, isCombo)), schema: priceSchema });
      const prices = new Map((res.data ?? []).map((p) => [p.ticketCode, Number.parseInt(String(p.ticketPrice), 10)]));
      const next = base.map((s) => (s.code && prices.has(s.code) ? { ...s, price: prices.get(s.code)! } : s));
      setSeats(next);
      setComboMode(isCombo === 1);
      return next;
    } catch (error) {
      toast.warning(error instanceof ApiError && error.status === 400 ? error.message : t("booking_infor.msg.msg_error_occurred"));
      return null;
    }
  };

  const openBox = async () => {
    if (draft.is_combo === 1 && comboMode) {
      if (!window.confirm(`${t("booking_infor.noti")}: ${t("booking_infor.ask_use_promotions")}`)) return;
      if (!(await changeCombo(0))) return;
    }
    setOpen(true);
  };

  const applyCode = async (code: string | null, picked: number[]) => {
    if (busy) return;
    setBusy(true);
    try {
      const cleared = clearPromo(seats);
      if (!code || !picked.length) {
        const base = draft.is_combo === 1 && !cleared.some((s) => s.is_reward) ? ((await changeCombo(1, cleared)) ?? cleared) : cleared;
        setApplied(undefined);
        onApply(base);
        return setOpen(false);
      }
      const withCode = cleared.map((s) => (picked.includes(s.id) ? { ...s, promotion: code } : s));
      const next = await checkPromotions(draft, withCode);
      setSeats(next);
      setApplied(picked.length);
      onApply(next);
      toast.success(t("booking_infor.msg.applied_code_success"));
      setOpen(false);
    } catch (error) {
      // 400 và phản hồi sai hình dạng (422 do ta ném): hiện lý do của server; lỗi khác: câu chung.
      toast.warning(error instanceof ApiError && (error.status === 400 || error.status === 422) ? error.message : t("booking_infor.msg.invalid_promo_code"));
    } finally {
      setBusy(false);
    }
  };

  const applyPoints = async (next: DraftSeat[]) => {
    const base = draft.is_combo === 1 && !next.some((s) => s.is_reward) ? ((await changeCombo(1, next)) ?? next) : next;
    onApply(base);
    setOpen(false);
  };

  /** Đóng (×) khi chưa áp mã và không đổi điểm → price-ticket đảo cờ combo cho mọi chuyến, chỉ cục bộ (như web cũ). */
  const close = () => {
    setOpen(false);
    if (applied === undefined && !seats.some((s) => s.is_reward)) void changeCombo(comboMode ? 0 : 1);
  };

  return (
    <>
      <button type="button" disabled={disabled} aria-busy={disabled || undefined} onClick={() => void openBox()} className="hv-btn hv-btn-outline w-full" aria-haspopup="dialog" title={t("booking_infor.promotions")}>
        <Ticket className="size-icon" aria-hidden />
        {t("booking_infor.use_points")}
      </button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        {/* Điện thoại: tấm trượt đáy màn hình (kính trên scrim); từ 40rem: hộp giữa màn hình rộng 32rem. */}
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-lg">
          <DialogTitle>{t("booking_infor.HV_promotion")}</DialogTitle>
          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value as "code" | "points");
              setSeats(clearPromo(seats));
            }}
          >
            <TabsList aria-label={t("booking_infor.HV_promotion")}>
              <TabsTrigger value="code">{t("booking_infor.promo_code")}</TabsTrigger>
              <TabsTrigger value="points">{t("booking_infor.redeem_points")}</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="pt-4">
              <PromoCodeTab seats={seats} promotions={promotions} busy={busy} onApply={(code, picked) => void applyCode(code, picked)} />
            </TabsContent>
            <TabsContent value="points" className="pt-4">
              <PointsTab seats={seats} points={points} onApply={(next) => void applyPoints(next)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
