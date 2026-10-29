import en from "./en.json";
import vi from "./vi.json";

export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";

const dictionaries: Record<Locale, unknown> = { vi, en };

/** Tra khoá dạng "a.b.c" (chuỗi từ locales của web cũ); thiếu → rơi về vi rồi trả khoá. */
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const lookup = (dict: unknown) =>
    key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), dict);
  const raw = lookup(dictionaries[locale]) ?? lookup(dictionaries[DEFAULT_LOCALE]);
  const text = typeof raw === "string" ? raw : key;
  return vars ? text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name] ?? "")) : text;
}

export function isLocale(value: unknown): value is Locale {
  return value === "vi" || value === "en";
}

/** Tiền tố URL cho locale (web cũ phục vụ /en/xe-khach/...). */
export const localePrefix = (locale: Locale) => (locale === "en" ? "/en" : "");
