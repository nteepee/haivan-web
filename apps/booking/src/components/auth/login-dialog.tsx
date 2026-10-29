"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocale, useT } from "@/components/providers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { parseHvDateTime } from "@/lib/format";
import { ApiError } from "@/lib/http";
import { requestOtp } from "./login-flow";
import { OtpStep } from "./otp-step";
import { Recaptcha } from "./recaptcha";
import { RegisterStep } from "./register-step";
import { validateLoginInput } from "./login-flow";

type Step = { kind: "input" } | { kind: "otp"; id: string; expiresAt: number } | { kind: "register"; id: string; otp: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi khi đăng nhập/đăng ký xong. */
  onLoggedIn?: () => void;
  hint?: string;
}

/** Lỗi một câu dưới ô: icon + chữ (không chỉ màu), aria-live để đọc khi xuất hiện. */
function LoginError({ id, message }: { id: string; message: string }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p role="alert" className="hv-err mt-0 text-16">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}

export function LoginDialog({ open, onOpenChange, onLoggedIn, hint }: Props) {
  const t = useT();
  const locale = useLocale();
  const client = useQueryClient();
  const [step, setStep] = useState<Step>({ kind: "input" });
  const [input, setInput] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  // Lỗi hiện ngay dưới ô (icon + một câu), không dùng toast cho việc người dùng sửa được.
  const [error, setError] = useState("");
  // Lỗi thuộc ô nào thì ô đó mới đánh dấu aria-invalid (captcha không làm ô SĐT đỏ).
  const [errorField, setErrorField] = useState<"input" | "captcha">("input");
  const fail = (field: "input" | "captcha", message: string) => {
    setErrorField(field);
    setError(message);
  };

  const done = async () => {
    await client.invalidateQueries({ queryKey: ["session"] });
    setStep({ kind: "input" });
    onOpenChange(false);
    onLoggedIn?.();
  };

  const submitInput = async () => {
    const invalid = validateLoginInput(input);
    if (invalid) return fail("input", t(invalid));
    if (!captcha) return fail("captcha", t("login_form.msg.error_recaptcha"));
    setError("");
    setBusy(true);
    try {
      const res = await requestOtp(input, captcha);
      const id = res.phone || res.email || input.trim();
      // Web cũ: phản hồi không kèm thời hạn OTP → khách mới, sang form đăng ký.
      if (!res.expire_time) setStep({ kind: "register", id, otp: "" });
      else {
        let expiresAt = Date.now() + 5 * 60_000;
        try {
          expiresAt = parseHvDateTime(res.expire_time);
        } catch {
          /* định dạng lạ: dùng 5 phút */
        }
        setStep({ kind: "otp", id, expiresAt });
      }
    } catch (e) {
      fail("input", e instanceof ApiError ? e.message : t("login_form.msg.error_input"));
    } finally {
      setBusy(false);
      setCaptcha(""); // token captcha chỉ dùng một lần
      setResetKey((k) => k + 1);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setStep({ kind: "input" });
          setCaptcha("");
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{t(step.kind === "otp" ? "login_form.otp_verify" : "login_form.login")}</DialogTitle>
        <DialogDescription>{hint ?? t("login_form.hint_login")}</DialogDescription>

        {step.kind === "input" ? (
          <form
            className="grid gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submitInput();
            }}
          >
            <div className="grid gap-2">
              <label className="grid gap-2">
                <span className="hv-label mb-0 text-16">{t("login_form.enter_phone")}</span>
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError("");
                  }}
                  // Nhận số điện thoại hoặc email nên bàn phím chữ thường, không ép bàn phím email.
                  inputMode="text"
                  autoComplete="username"
                  aria-invalid={error && errorField === "input" ? true : undefined}
                  aria-describedby="login-error"
                  className="hv-field"
                />
              </label>
              <LoginError id="login-error" message={errorField === "input" ? error : ""} />
            </div>
            {/* Chỗ đặt reCAPTCHA: khung cố định cao để widget vào không làm nhảy bố cục. */}
            <div className="grid gap-2">
              <div className="min-h-24 rounded-1 bg-paper-2 p-2" data-slot="recaptcha">
                <Recaptcha onToken={(token) => { setCaptcha(token); if (token) setError(""); }} lang={locale} resetKey={resetKey} />
              </div>
              <LoginError id="captcha-error" message={errorField === "captcha" ? error : ""} />
            </div>
            <button type="submit" disabled={busy} aria-busy={busy} className="hv-btn hv-btn-primary hv-btn-block">
              {busy ? <Loader2 className="size-icon animate-spin" aria-hidden /> : null}
              {busy ? t("booking_infor.msg.in_progress") : t("login_form.continue")}
            </button>
          </form>
        ) : step.kind === "otp" ? (
          <OtpStep
            id={step.id}
            expiresAt={step.expiresAt}
            onExpired={() => setStep({ kind: "input" })}
            onNewCustomer={(otp) => setStep({ kind: "register", id: step.id, otp })}
            onLoggedIn={done}
          />
        ) : (
          <RegisterStep id={step.id} otp={step.otp} onLoggedIn={done} onBack={() => setStep({ kind: "input" })} />
        )}
      </DialogContent>
    </Dialog>
  );
}
