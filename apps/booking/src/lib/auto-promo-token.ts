/**
 * Mã khứ hồi được áp ẨN: mã thật không bao giờ tới trình duyệt. Client chỉ gắn token `@auto:<promoId>:<mã đơn chiều đi>` vào
 * `seat.promotion` / `codes[].promotion` / `seats[].code`; BFF (phía server) kiểm điều kiện rồi mới đổi token thành mã thật trước khi
 * chuyển lên apigw, và che mã thật về `@auto:<promoId>` trong phản hồi. Dùng chung client/server.
 */
export const AUTO_PREFIX = "@auto:";

/** Token đầy đủ gửi lên BFF (kèm đơn chiều đi để BFF kiểm tra). */
export const autoToken = (promoId: number, outboundOrder: string): string => `${AUTO_PREFIX}${promoId}:${outboundOrder}`;

/** Token đã che trong phản hồi (không có đơn chiều đi). */
export const maskedToken = (promoId: number | string): string => `${AUTO_PREFIX}${promoId}`;

/** Đọc `promoId` từ token (đầy đủ hoặc đã che); null nếu không phải token tự áp. */
export function autoTokenPromoId(value: string | null | undefined): number | null {
  const m = /^@auto:(\d+)(?::[A-Za-z0-9]+)?$/.exec(value ?? "");
  return m ? Number(m[1]) : null;
}

/** Token đầy đủ trong văn bản: JSON (`"@auto:12:B02…"`) hoặc query đã mã hoá (`%40auto%3A12%3AB02…`). */
export const TOKEN_IN_JSON = /"@auto:(\d+):([A-Za-z0-9]+)"/g;
export const TOKEN_IN_QUERY = /%40auto%3A(\d+)%3A([A-Za-z0-9]+)/gi;
