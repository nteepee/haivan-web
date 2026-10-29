"use client";

import { ArrowLeft, CircleAlert, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers";
import { ApiError } from "@/lib/http";
import { register } from "./login-flow";

/** Khách mới: nhập tên (+ email/SĐT còn thiếu) → `api/register` như web cũ. */
export function RegisterStep({ id, otp, onLoggedIn, onBack }: { id: string; otp: string; onLoggedIn: () => void; onBack: () => void }) {
  const t = useT();
  const isEmail = id.includes("@");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(isEmail ? "" : id);
  const [email, setEmail] = useState(isEmail ? id : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) return setError(t("login_form.msg.pls_insert_name"));
    setBusy(true);
    try {
      const res = await register({ name: name.trim(), phone: phone.trim(), email: email.trim(), otp });
      if (res.loggedIn) {
        toast.success(t("login_form.msg.registration_success"));
        onLoggedIn();
      } else toast.error(t("login_form.msg.error_registration"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("login_form.msg.error_registration"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="grid gap-field"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="grid gap-2">
        <span className="hv-label mb-0 text-16">{t("booking_infor.full_name")}</span>
        <input className="hv-field" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} autoComplete="name" aria-invalid={error ? true : undefined} aria-describedby="register-error" />
      </label>
      <div id="register-error" aria-live="polite">
        {error ? (
          <p role="alert" className="hv-err mt-0 text-16">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
      <label className="grid gap-2">
        <span className="hv-label mb-0 text-16">{t("login_form.phone")}</span>
        <input className="hv-field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" disabled={!isEmail} />
      </label>
      <label className="grid gap-2">
        <span className="hv-label mb-0 text-16">Email</span>
        <input className="hv-field" value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" disabled={isEmail} />
      </label>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <button type="button" onClick={onBack} aria-label={t("ux.back")} className="hv-btn hv-btn-outline">
          <ArrowLeft className="size-icon" aria-hidden />
        </button>
        <button type="submit" disabled={busy} aria-busy={busy} className="hv-btn hv-btn-primary">
          {busy ? <Loader2 className="size-icon animate-spin" aria-hidden /> : null}
          {busy ? t("booking_infor.msg.in_progress") : t("login_form.continue")}
        </button>
      </div>
    </form>
  );
}
