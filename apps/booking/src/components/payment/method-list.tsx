"use client";

import { CircleCheck, Info } from "lucide-react";
import { useT } from "@/components/providers";
import { ATM_BANKS, bankLogo, CARD_BANKS } from "@/lib/banks";
import type { PaymentMethod } from "@/schemas/booking";
import { CopyButton } from "./copy-button";

/** Radio → type info-payments (không 1:1, như web cũ): 5 QR, 6 PayOS, 1 ATM & 2 thẻ quốc tế (cùng gate type 1), 3 chuyển khoản (type 2), 4 tại nhà xe (type 3). */
export const RADIO_GATE: Record<number, number> = { 5: 5, 6: 6, 1: 1, 2: 1, 3: 2, 4: 3 };

interface Props {
  methods: PaymentMethod[];
  selected: number;
  bank: string;
  onSelect: (radio: number) => void;
  onBank: (code: string, payNow: boolean) => void;
  bookingCode: string;
  phone: string;
  routeId?: number;
  paid: boolean;
  cashOnly: boolean;
}

/**
 * Danh sách phương thức như web cũ: thông tin chuyển khoản và "Mã giữ chỗ" tiền mặt luôn hiện (khách xem trước khi chọn);
 * lưới ngân hàng chỉ mở ở ATM/thẻ quốc tế đang chọn. Bấm lại dòng đang chọn không đóng gì (radio không tự bỏ chọn).
 */
export function MethodList({ methods, selected, bank, onSelect, onBank, bookingCode, phone, routeId, paid, cashOnly }: Props) {
  const t = useT();
  const open = (type: number) => methods.find((m) => m.type === type)?.is_locked === false;
  const transfer = methods.find((m) => m.type === 2)?.info?.[0];
  const mbHue = routeId === 10043 || routeId === 15725;
  const radios = [
    { value: 5, title: t("payment.VNPAY_QR"), hint: t("payment.VNPAY_QR"), lock: true },
    { value: 6, title: methods.find((m) => m.type === 6)?.name ?? "PayOS", hint: methods.find((m) => m.type === 6)?.description ?? "", lock: true },
    { value: 1, title: t("payment.ATM"), hint: t("payment.ATM_hint"), lock: false },
    { value: 2, title: t("payment.credit_payment"), hint: t("payment.ATM_hint"), lock: false },
    { value: 3, title: t("payment.bank_transfer"), hint: t("payment.bank_transfer_hint"), lock: true },
    { value: 4, title: t("payment.cash"), hint: t("payment.cash_hint"), lock: true },
  ].filter((r) => open(RADIO_GATE[r.value]) && (!cashOnly || r.value === 4));

  const row = (label: string, value: string | undefined | null, opts: { copy?: boolean; upper?: boolean; copyValue?: string } = {}) => (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-rule py-2">
      <dt className="col-span-full text-14 font-semibold text-muted">{label}</dt>
      <dd className={`text-18 font-extrabold tabular-nums break-words ${opts.upper ? "uppercase" : ""}`}>{value}</dd>
      {opts.copy && value ? <dd><CopyButton value={opts.copyValue ?? value} /></dd> : null}
    </div>
  );

  return (
    <div className="grid gap-cards" role="radiogroup" aria-label={t("payment.select_payment")}>
      {radios.map((r) => {
        const on = selected === r.value;
        const locked = r.lock && paid;
        return (
          // Cả hàng là một <label> (không phủ lớp tuyệt đối lên ô radio). Chọn = nền select + vòng chọn + dấu tick, không chỉ màu.
          <div key={r.value} className={`relative rounded-3 ${on ? "bg-select select-ring" : "bg-surface shadow-1 hover:shadow-2"} ${locked ? "opacity-55" : ""}`}>
            <label className={`flex min-h-control items-start gap-4 p-card ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="radio"
                name="payment"
                disabled={locked}
                checked={on}
                onChange={() => onSelect(r.value)}
                className="mt-1 size-icon shrink-0 accent-ink"
              />
              <span className="min-w-0 pr-8">
                <span className="block text-18 font-extrabold text-ink">{r.title}</span>
                {r.hint && r.hint !== r.title ? <span className="block text-14 text-muted">{r.hint}</span> : null}
              </span>
            </label>
            {on ? <CircleCheck className="pointer-events-none absolute top-4 right-4 size-icon text-ink" aria-hidden /> : null}
            {on && (r.value === 1 || r.value === 2) ? (
              <div className="px-card pb-card">
                <div className={`grid gap-2 ${r.value === 1 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {(r.value === 1 ? ATM_BANKS : CARD_BANKS).map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={bank === code}
                      aria-label={code}
                      onClick={() => onBank(code, false)}
                      onDoubleClick={() => onBank(code, true)}
                      className={`relative grid h-16 place-items-center rounded-1 bg-surface p-1 ${bank === code ? "select-ring" : "border border-edge hover:bg-accent-soft"}`}
                    >
                      {bank === code ? <CircleCheck className="absolute top-1 right-1 size-4 text-ink" aria-hidden /> : null}
                      {/* eslint-disable-next-line @next/next/no-img-element -- logo ngân hàng từ VNPay */}
                      <img src={bankLogo(code)} alt={code} width={96} height={48} className="max-h-full max-w-full object-contain" loading="lazy" />
                    </button>
                  ))}
                </div>
                <p className="hv-hint mt-2">{t("ux.select_bank_hint")}</p>
              </div>
            ) : null}
            {r.value === 3 ? (
              <div className="grid gap-3 px-card pb-card">
                <dl>
                  {row(t("payment.account"), mbHue ? "1556355555" : transfer?.code, { copy: true })}
                  {row(t("payment.beneficiary"), mbHue ? "CN CONG TY LD VCQT HAI VAN" : transfer?.name_cp, { copy: true })}
                  {row(t("payment.bank"), mbHue ? t("payment.MB_bank") : transfer?.name)}
                  {row(t("payment.branch"), mbHue ? t("payment.branch_hint") : transfer?.branch)}
                  {row(t("payment.transfer_content"), `${bookingCode} ${phone}`, { copy: true, upper: true, copyValue: `${bookingCode} ${phone}`.trim() })}
                </dl>
                <p className="hv-notice">
                  <Info className="size-icon shrink-0" aria-hidden />
                  <span className="font-semibold">{t("payment.bank_note")}</span>
                </p>
              </div>
            ) : null}
            {r.value === 4 ? (
              <p className="px-card pb-card">{t("payment.reservation_code")} <strong className="ml-4 uppercase">{bookingCode}</strong></p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
