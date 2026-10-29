"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useT } from "@/components/providers";
import { priceTransitBody, servicesForPricing, type BonusService, type PricedService } from "@/lib/bonus-services";
import { getPromotionsQuery, hasHomeTransit } from "@/lib/confirm-queries";
import { toast } from "sonner";
import { ApiError, gw } from "@/lib/http";
import { parsePromotions, type Promotion } from "@/schemas/promotion";
import type { BookingDraft } from "@/stores/booking-draft";

const customerSchema = z.looseObject({
  data: z.looseObject({
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    invoice_info: z.looseObject({ company_name: z.string().nullish(), company_address: z.string().nullish(), tax_code: z.string().nullish(), email: z.string().nullish() }).nullish(),
    account: z.looseObject({ balance: z.number().nullish() }).nullish(),
  }),
});


/** Dữ liệu trang xác nhận tải lúc vào (như componentDidMount web cũ). */
export function useConfirmData(draft: BookingDraft | null) {
  const t = useT();
  const customer = useQuery({
    queryKey: ["customer"],
    enabled: !!draft,
    queryFn: () => gw("customer/customers", { schema: customerSchema }),
    staleTime: 60_000,
  });
  const promotions = useQuery({
    queryKey: ["promotions", draft?.order_code],
    enabled: !!draft,
    // Danh sách mã chỉ là gợi ý: lỗi mạng không chặn đặt vé, nhưng lỗi KHÔNG được nuốt im lặng (cảnh báo) và phần tử lạ không làm trống cả danh sách.
    queryFn: async (): Promise<{ data: Promotion[] }> => {
      try {
        return { data: parsePromotions(await gw("promotion/get-promotions", { query: getPromotionsQuery(draft!) })) };
      } catch (error) {
        console.warn("[promotions] không lấy được danh sách mã khuyến mãi:", error);
        return { data: [] };
      }
    },
  });
  const services = useQuery({
    queryKey: ["bonus-services", draft?.order_code],
    enabled: !!draft && hasHomeTransit(draft),
    queryFn: async (): Promise<PricedService[]> => {
      const list = (await gw("v4/get-bonus-service", { query: { merchant_code: draft!.trip_info.merchant.code } })) as BonusService[];
      if (!Array.isArray(list) || !list.length) return [];
      const prepared = servicesForPricing(list, draft!, { pickUp: t("booking_infor.pick_up_transit"), dropOff: t("booking_infor.drop_off_transit") });
      let priced: PricedService[];
      try {
        priced = (await gw("v4/get-price-transit", { method: "POST", body: priceTransitBody(draft!, prepared) })) as PricedService[];
      } catch (error) {
        // Như web cũ: lỗi báo bằng toast (message của backend, không có thì câu chung), đơn vẫn đặt được không kèm dịch vụ tận nhà.
        toast.warning(error instanceof ApiError && error.message ? error.message : t("booking_infor.msg.msg_error_occurred"));
        return [];
      }
      const titles = new Map(prepared.map((s) => [s.dvbs_code, s] as const));
      return (Array.isArray(priced) ? priced : []).map((s) => ({
        ...s,
        title: titles.get(s.dvbs_code)?.title ?? s.dvbs_name,
        seat: draft!.seats.length,
        seatCheck: 0,
        check: false,
        address: [],
        dvbs_tickets: (s.dvbs_tickets ?? []).map((tk) => ({ ...tk, check: false })),
      }));
    },
    staleTime: Infinity,
  });
  return { customer, promotions, services };
}
