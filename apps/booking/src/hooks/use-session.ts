"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const sessionSchema = z.object({
  loggedIn: z.boolean(),
  user: z.object({ name: z.string().nullable(), phone: z.string().nullable() }).nullable().optional(),
});
export type Session = z.infer<typeof sessionSchema>;

const LOGGED_OUT: Session = { loggedIn: false, user: null };

async function fetchSession(): Promise<Session> {
  const res = await fetch("/api/hv/auth/session", { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return LOGGED_OUT;
  const parsed = sessionSchema.safeParse(await res.json());
  return parsed.success ? parsed.data : LOGGED_OUT;
}

/** Trạng thái đăng nhập chỉ đọc qua BFF (token không bao giờ tới JS). */
export function useSession() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 30_000 });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/hv/auth/logout", { method: "POST", headers: { "X-HV-Req": "1", "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error(`logout ${res.status}`);
    },
    onError: () => {
      window.alert("Không đăng xuất được, vui lòng thử lại.");
    },
    onSuccess: () => {
      client.setQueryData(["session"], LOGGED_OUT);
      // "/" thuộc WordPress (nginx), không phải trang Next → điều hướng toàn trang.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    },
  });
  return { ...query, logout: () => logoutMutation.mutate() };
}
