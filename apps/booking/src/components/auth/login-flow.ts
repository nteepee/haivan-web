import { z } from "zod";
import { apigw, bff } from "@/lib/http";

/** Kiểm tra ô nhập như web cũ: SĐT 10 số bắt đầu 0, hoặc email. Trả khoá i18n lỗi hoặc null. */
export function validateLoginInput(input: string): string | null {
  const value = input.trim();
  if (!value) return "login_form.msg.error_input";
  if (/^\d+$/.test(value)) return value.startsWith("0") && value.length === 10 ? null : "login_form.msg.error_phone";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "login_form.msg.error_phone_email";
}

const otpResponse = z.looseObject({
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  expire_time: z.string().nullish(),
  is_new: z.union([z.number(), z.boolean()]).optional(),
});
export type OtpResponse = z.infer<typeof otpResponse>;

/** `GET api/get-otp?phone=&captcha=&channel=1` gọi thẳng apigw từ trình duyệt (giữ IP người dùng). */
export function requestOtp(input: string, captcha: string) {
  return apigw("get-otp", { query: { phone: input.trim(), captcha, channel: 1 }, schema: otpResponse });
}

const authResult = z.object({
  loggedIn: z.boolean(),
  isNew: z.boolean().optional(),
  user: z.object({ name: z.string().nullable(), phone: z.string().nullable() }).nullable().optional(),
});

export const verifyOtp = (phone: string, otp: string) => bff("auth/verify", { phone, otp }, authResult);

export const register = (data: { name: string; phone: string; email: string; otp: string }) => bff("auth/register", data, authResult);

/** Chỉ cho chuyển tiếp tới đường dẫn nội bộ (chặn open redirect, kể cả ký tự điều khiển trình duyệt tự bỏ). */
export function safeNext(next: string | null | undefined, fallback = "/xe-khach", origin = typeof window !== "undefined" ? window.location.origin : "https://haivan.com"): string {
  if (!next || !next.startsWith("/") || /[\u0000-\u001F\u007F\\]/.test(next)) return fallback;
  try {
    const url = new URL(next, origin);
    return url.origin === origin ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
