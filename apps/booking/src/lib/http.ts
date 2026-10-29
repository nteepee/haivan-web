import type { z } from "zod";
import { stringifyQuery, type Query } from "./qs";

/** Header cố định web haivan.com cũ gửi tới apigw (không có PartnerId). */
export const DOMAIN_HEADER = { Domain: "haivan.com" } as const;

export const APIGW_URL = (process.env.NEXT_PUBLIC_APIGW_URL ?? "https://apigw.haivan.com").replace(/\/$/, "");
export const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL ?? "https://cms.haivan.com").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Lấy thông báo lỗi như web cũ: giá trị đầu của `errors`, sau đó `message`. */
export function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const { errors, message } = body as { errors?: unknown; message?: unknown };
    if (errors && typeof errors === "object") {
      const first = Object.values(errors)[0];
      const text = Array.isArray(first) ? first[0] : first;
      if (typeof text === "string" && text) return text;
    }
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export interface RequestOptions<S extends z.ZodType> {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Query;
  /** Query đã dựng sẵn (chuỗi thô) khi cần giữ đúng byte như web cũ. */
  rawQuery?: string;
  body?: unknown;
  headers?: Record<string, string>;
  schema?: S;
  signal?: AbortSignal;
  /** Cho request sống tiếp khi trang điều hướng đi (log quét QR). */
  keepalive?: boolean;
}

export async function request<S extends z.ZodType = z.ZodType<unknown>>(
  url: string,
  { method = "GET", query, rawQuery, body, headers, schema, signal, keepalive }: RequestOptions<S> = {},
): Promise<z.output<S>> {
  const qs = rawQuery ?? (query ? stringifyQuery(query) : "");
  const res = await fetch(qs ? `${url}?${qs}` : url, {
    method,
    signal,
    keepalive,
    headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, `Lỗi ${res.status}`), data);
  return schema ? schema.parse(data) : (data as z.output<S>);
}

/** Gọi thẳng apigw từ trình duyệt (endpoint công khai), như web cũ. */
export const apigw = <S extends z.ZodType = z.ZodType<unknown>>(path: string, opts: RequestOptions<S> = {}) =>
  request(`${APIGW_URL}/api/${path}`, { ...opts, headers: { ...DOMAIN_HEADER, ...opts.headers } });

/** CMS không nhận Authorization. */
export const cms = <S extends z.ZodType = z.ZodType<unknown>>(path: string, opts: RequestOptions<S> = {}) =>
  request(`${CMS_URL}/api/${path}`, opts);

/** POST JSON tới route BFF cùng origin (đăng nhập/đăng ký/đăng xuất). */
export const bff = <S extends z.ZodType = z.ZodType<unknown>>(path: string, body: unknown, schema?: S) =>
  request(`/api/hv/${path}`, { method: "POST", body, schema, headers: { "X-HV-Req": "1" } });

// Mã đơn/mã vé lấy từ URL được ghép vào path: mỗi đoạn chỉ gồm chữ, số, "_" và "-" (cùng luật allowlist phía server),
// để link độc không lái trình duyệt gọi endpoint khác (vd. GET payment/*) bằng cookie của nạn nhân. Không dùng
// danh sách đen: trình duyệt bỏ tab/CR/LF trước khi xử lý "..", nên ". \t." vẫn thành "..".
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

/** Gọi endpoint cần đăng nhập qua BFF cùng origin (token nằm trong cookie httpOnly). */
export const gw = <S extends z.ZodType = z.ZodType<unknown>>(path: string, opts: RequestOptions<S> = {}) => {
  if (!path.split("/").every((segment) => SAFE_SEGMENT.test(segment))) return Promise.reject(new ApiError(400, "Yêu cầu không hợp lệ", null));
  const qs = opts.rawQuery ?? (opts.query ? stringifyQuery(opts.query) : "");
  // Gửi kèm chuỗi query gốc để BFF chuyển nguyên byte lên apigw (Next chuẩn hoá lại URL); chỉ ASCII in được.
  const raw: Record<string, string> = qs && /^[\x20-\x7e]*$/.test(qs) ? { "X-HV-Query": qs } : {};
  return request(`/api/hv/gw/${path}`, { ...opts, query: undefined, rawQuery: qs, headers: { "X-HV-Req": "1", ...raw, ...opts.headers } });
};
