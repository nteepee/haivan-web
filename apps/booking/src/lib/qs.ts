/**
 * Serialize query giống `qs.stringify` mặc định mà web haivan.com cũ dùng
 * (mảng dạng indices `a[0][b]=`, ngoặc và dấu phẩy được mã hoá, khoảng trắng → %20).
 * Khác qs: bỏ cả `null` và `""` (backend từ chối tham số rỗng, vd. `sort_by=`).
 */
export type QueryValue = string | number | boolean | null | undefined | QueryValue[] | { [key: string]: QueryValue };
export type Query = Record<string, QueryValue>;

/** Mã hoá một giá trị query đúng kiểu `qs` của web cũ (dùng cả phía server khi đổi token thành mã thật). */
export const encodeQueryValue = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const encode = encodeQueryValue;

function walk(prefix: string, value: QueryValue, out: string[]): void {
  if (value === undefined || value === null || value === "") return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(`${prefix}[${i}]`, v, out));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(`${prefix}[${k}]`, v, out);
    return;
  }
  out.push(`${encode(prefix)}=${encode(String(value))}`);
}

export function stringifyQuery(query: Query): string {
  const out: string[] = [];
  for (const [k, v] of Object.entries(query)) walk(k, v, out);
  return out.join("&");
}
