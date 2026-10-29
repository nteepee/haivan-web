"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, gw } from "@/lib/http";
import { customerSchema, definitionSchema, type CustomerData } from "@/schemas/account";

export const CUSTOMER_KEY = ["account", "customer"] as const;

/** Hồ sơ khách (`customer/customers`): tên, điểm, hạng, hoá đơn. Chỉ tải khi đã đăng nhập. */
export function useCustomer(enabled = true) {
  const client = useQueryClient();
  return useQuery({
    queryKey: CUSTOMER_KEY,
    enabled,
    staleTime: 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
    queryFn: async () => {
      try {
        return await gw("customer/customers", { schema: customerSchema });
      } catch (error) {
        // Web cũ: 401 ở đây là xử lý hết phiên duy nhất → đăng xuất, về trang chủ (BFF đã xoá cookie).
        if (error instanceof ApiError && error.status === 401) {
          await client.invalidateQueries({ queryKey: ["session"] });
          // "/" thuộc WordPress → điều hướng toàn trang.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/");
        }
        throw error;
      }
    },
  });
}

/** Danh mục form hồ sơ + hạng thân thiết (`customer/definition`). */
export function useDefinition(enabled = true) {
  return useQuery({ queryKey: ["account", "definition"], enabled, staleTime: 10 * 60_000, queryFn: () => gw("customer/definition", { schema: definitionSchema }) });
}

/** Cập nhật cache hồ sơ sau khi ghi thành công (tải lại, hoặc gộp giá trị đã gửi). */
export function useCustomerCache() {
  const client = useQueryClient();
  return {
    refetch: () => client.invalidateQueries({ queryKey: CUSTOMER_KEY }),
    patch: (patch: Partial<CustomerData>) =>
      client.setQueryData(CUSTOMER_KEY, (old: { data: CustomerData } | undefined) => (old ? { ...old, data: { ...old.data, ...patch } } : old)),
  };
}
