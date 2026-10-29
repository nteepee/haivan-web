import "server-only";

/**
 * Giới hạn số lần xác minh OTP theo SĐT/email trong bộ nhớ (một instance).
 * Cần vì verify-otp nay đi từ IP server; nginx limit_req theo IP client là lớp thứ hai.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function tooManyAttempts(key: string, now = Date.now()): boolean {
  const id = key.trim().toLowerCase();
  const entry = attempts.get(id);
  if (!entry || entry.resetAt <= now) {
    attempts.set(id, { count: 1, resetAt: now + WINDOW_MS });
    if (attempts.size > 10_000) {
      for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export function resetAttempts(key: string): void {
  attempts.delete(key.trim().toLowerCase());
}
