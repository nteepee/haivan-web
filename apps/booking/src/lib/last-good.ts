/**
 * Kho "bản tốt gần nhất" trong bộ nhớ tiến trình cho nội dung lấy từ WP/CMS.
 *
 * Kho nằm NGOÀI hàm `'use cache'` (hàm đó chỉ nhớ kết quả theo hạn `cacheLife` và bị tạo lại ở foreground khi hết hạn;
 * nếu lúc đó upstream lỗi thì không còn bản cũ). Wrapper gọi `resolve` mỗi lần nên bản tốt sống qua mọi lần làm mới.
 *
 * - `load` trả giá trị → lưu và trả về.
 * - `load` trả `null` → upstream xác nhận "không có" (vd 404): xoá bản tốt, trả `null`.
 * - `load` ném lỗi (mạng, 5xx, timeout, sai hợp đồng) → trả bản tốt nếu có; chưa có thì ném lại (`onMiss: "throw"`)
 *   hoặc trả `null` để nơi gọi dùng nội dung dự phòng (`onMiss: "null"`). Mỗi khoá chỉ cảnh báo một lần cho tới khi hồi phục.
 */
const MAX_WARNED = 500;

/**
 * Kết quả của hàm `'use cache'`. Hàm cache KHÔNG được ném lỗi upstream: lỗi ném trong phạm vi cache bị Next coi là lỗi prerender
 * (build/ISR hỏng) kể cả khi nơi gọi đã bắt, và nhật ký ngập. Lỗi tạm được trả dưới dạng giá trị (cache ngắn) rồi wrapper
 * ngoài phạm vi cache mới quyết định dùng bản tốt, dùng dự phòng hay ném.
 */
export type Fetched<T> = { status: "ok"; data: T } | { status: "none" } | { status: "error"; message: string };

/** `ok` → dữ liệu; `none` → null (upstream xác nhận không có); `error` → ném (để `resolve` dùng bản tốt/ném tiếp). */
export function unwrapFetched<T>(result: Fetched<T>): T | null {
  if (result.status === "error") throw new Error(result.message);
  return result.status === "ok" ? result.data : null;
}

export interface LastGood<T> {
  resolve(key: string, load: () => Promise<T | null>): Promise<T | null>;
  warnOnce(key: string, message: string, error?: unknown): void;
}

export function createLastGood<T>(tag: string, onMiss: "throw" | "null"): LastGood<T> {
  const good = new Map<string, T>();
  const warned = new Set<string>();

  const warnOnce: LastGood<T>["warnOnce"] = (key, message, error) => {
    if (warned.has(key)) return;
    if (warned.size >= MAX_WARNED) warned.clear(); // khoá do URL sinh ra: chặn phình bộ nhớ
    warned.add(key);
    console.warn(`${tag} ${key}: ${message}`, ...(error === undefined ? [] : [String(error)]));
  };

  return {
    warnOnce,
    async resolve(key, load) {
      try {
        const value = await load();
        if (value === null) good.delete(key);
        else {
          good.set(key, value);
          warned.delete(key);
        }
        return value;
      } catch (error) {
        const kept = good.get(key);
        if (kept !== undefined) {
          warnOnce(key, "lỗi tạm, dùng bản tốt gần nhất", error);
          return kept;
        }
        warnOnce(key, onMiss === "throw" ? "lỗi tạm và chưa có bản tốt, báo lỗi để giữ bản cũ" : "lỗi tạm và chưa có bản tốt, dùng nội dung dự phòng", error);
        if (onMiss === "throw") throw error;
        return null;
      }
    },
  };
}
