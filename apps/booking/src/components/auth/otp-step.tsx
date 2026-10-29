"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { useT } from "@/components/providers";
import { countdown } from "@/lib/format";
import { ApiError } from "@/lib/http";
import { verifyOtp } from "./login-flow";

interface Props {
  id: string;
  expiresAt: number;
  onExpired: () => void;
  onNewCustomer: (otp: string) => void;
  onLoggedIn: () => void;
}

/** Nhập OTP 6 số, tự gửi khi đủ 6 số (như web cũ); hết hạn → quay lại bước nhập. */
export function OtpStep({ id, expiresAt, onExpired, onNewCustomer, onLoggedIn }: Props) {
  const t = useT();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (now >= expiresAt) onExpired();
  }, [now, expiresAt, onExpired]);

  const submit = async (code: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await verifyOtp(id, code);
      if (res.loggedIn) onLoggedIn();
      else onNewCustomer(code);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login_form.msg.error_OTP"));
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <label htmlFor="otp-code" className="hv-label mb-0 text-16">
        {t("login_form.hint_otp")} <strong className="tabular-nums">{id}</strong>
      </label>
      <input
        id="otp-code"
        value={otp}
        disabled={busy}
        onChange={(e) => {
          const code = e.target.value.replace(/\D/g, "").slice(0, 6);
          setOtp(code);
          if (code.length === 6) void submit(code);
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="OTP"
        aria-invalid={error ? true : undefined}
        aria-describedby="otp-error"
        maxLength={6}
        className="hv-field text-center text-24 tracking-[0.6em] tabular-nums"
      />
      <div id="otp-error" aria-live="polite">
        {error ? (
          <p role="alert" className="hv-err mt-0 text-16">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
      <p className="text-center text-muted tabular-nums">{countdown(expiresAt, now)}</p>
    </div>
  );
}
