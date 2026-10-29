"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { translate, type Locale } from "@/i18n/t";
import { captureAffiliateCookies } from "@/lib/affiliate";

const LocaleContext = createContext<Locale>("vi");

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** t() phía client theo locale hiện tại. */
export function useT() {
  const locale = useLocale();
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  // Như `_app` web cũ: URL có utm_source/aff_sid → ghi cookie 30 ngày (chỉ giá trị thật).
  useEffect(() => captureAffiliateCookies(new URLSearchParams(window.location.search)), []);
  return (
    <LocaleContext.Provider value={locale}>
      <QueryClientProvider client={client}>
        {children}
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </LocaleContext.Provider>
  );
}
