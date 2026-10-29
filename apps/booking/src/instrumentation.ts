/** Kiểm cấu hình khi server khởi động: thiếu SESSION_SECRET thì production dừng ngay thay vì hỏng ngầm. */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length >= 32) return;
  const message = "SESSION_SECRET phải dài ít nhất 32 ký tự (đăng nhập sẽ không hoạt động)";
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") throw new Error(message);
  console.warn(`[config] ${message}`);
}
