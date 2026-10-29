"use client";

import { useEffect, useRef } from "react";

interface Grecaptcha {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; hl?: string }) => number;
  reset: (id?: number) => void;
}
declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    __hvRecaptchaReady?: () => void;
  }
}

let loading: Promise<Grecaptcha> | null = null;
function loadRecaptcha(lang: string): Promise<Grecaptcha> {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  loading ??= new Promise((resolve, reject) => {
    window.__hvRecaptchaReady = () => (window.grecaptcha ? resolve(window.grecaptcha) : reject(new Error("recaptcha missing")));
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=__hvRecaptchaReady&render=explicit&hl=${lang}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("recaptcha blocked"));
    };
    document.head.append(script);
  });
  return loading;
}

/** reCAPTCHA v2 checkbox như web cũ (site key công khai của haivan.com). `resetKey` đổi → reset widget. */
export function Recaptcha({ onToken, lang, resetKey }: { onToken: (token: string) => void; lang: string; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !box.current) return;
    let cancelled = false;
    loadRecaptcha(lang)
      .then((g) => {
        if (cancelled || !box.current || widget.current !== null) return;
        widget.current = g.render(box.current, {
          sitekey: siteKey,
          hl: lang,
          callback: (token) => callback.current(token),
          "expired-callback": () => callback.current(""),
        });
      })
      .catch(() => callback.current(""));
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (resetKey > 0 && widget.current !== null) {
      window.grecaptcha?.reset(widget.current);
      callback.current("");
    }
  }, [resetKey]);

  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    return <p className="hv-err mt-0">Chưa cấu hình reCAPTCHA (NEXT_PUBLIC_RECAPTCHA_SITE_KEY).</p>;
  }
  return <div ref={box} className="min-h-16" />;
}
