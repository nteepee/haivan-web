// Logic thuần của trang Khách hàng thân thiết: hạng, ngưỡng lên hạng, định dạng ngày giao dịch.
import type { Locale } from "@/i18n/t";

export const MAX_RANK = 3;
export const RANK_KEYS = ["account.rank_0", "account.rank_1", "account.rank_2", "account.rank_3"] as const;
const RANK_FILES = ["member", "silver", "gold", "diamond"] as const;

/** Icon hạng trong public/assets/icons (alt = tên hạng, do nơi dùng truyền). */
export const rankIcon = (rank: number) => `/assets/icons/icon_${RANK_FILES[clampRank(rank)]}_.png`;

export const clampRank = (rank: number | null | undefined) => Math.min(MAX_RANK, Math.max(0, Math.trunc(rank ?? 0)));

/** Ngưỡng tĩnh theo trang chương trình trên WordPress (xét trong 12 tháng gần nhất): vé hoàn thành hoặc điểm. */
export const STATIC_THRESHOLDS: { tickets: number; points: number | null }[] = [
  { tickets: 0, points: null },
  { tickets: 1, points: null },
  { tickets: 30, points: 150_000 },
  { tickets: 50, points: 250_000 },
];

export interface NextRank {
  rank: number;
  /** Số vé còn thiếu (null = không biết). */
  ticketsLeft: number | null;
  /** Điểm còn thiếu khi biết chắc; không thì chỉ có mốc điểm. */
  pointsLeft: number | null;
  pointsTotal: number | null;
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : Number.NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const firstNum = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const n = num(obj[key]);
    if (n !== null) return n;
  }
  return null;
};

// Hình dạng thật của `rank.next_rank` chưa xác nhận: nhận tên khoá "còn thiếu" và "mốc cần đạt"; không đọc được thì để ngưỡng tĩnh lo.
const LEFT_TICKETS = ["remain_transaction", "remaining_transaction", "need_transaction", "remain_tickets", "remain_ticket", "left_transaction"];
const LEFT_POINTS = ["remain_point", "remaining_point", "need_point", "remain_points", "left_point"];
const TOTAL_TICKETS = ["transaction", "transactions", "tickets", "ticket", "min_transaction", "period_transaction"];
const TOTAL_POINTS = ["point", "points", "min_point", "score"];

/**
 * Điều kiện lên hạng kế tiếp. Ưu tiên `rank.next_rank` của API (nếu đọc được), không thì ngưỡng tĩnh trừ vé đã hoàn thành.
 * Hạng cao nhất → null.
 */
export function nextRankInfo(rank: number, rankInfo: unknown, completedTickets: number): NextRank | null {
  const current = clampRank(rank);
  if (current >= MAX_RANK) return null;
  const target = current + 1;
  const raw = rankInfo && typeof rankInfo === "object" ? (rankInfo as Record<string, unknown>).next_rank : undefined;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const ticketsTotal = firstNum(o, TOTAL_TICKETS);
    const ticketsLeft = firstNum(o, LEFT_TICKETS) ?? (ticketsTotal !== null ? Math.max(0, ticketsTotal - completedTickets) : null);
    const pointsLeft = firstNum(o, LEFT_POINTS);
    const pointsTotal = firstNum(o, TOTAL_POINTS);
    if (ticketsLeft !== null || pointsLeft !== null || pointsTotal !== null) {
      const targetRank = num(o.rank);
      return { rank: targetRank !== null && targetRank > current ? clampRank(targetRank) : target, ticketsLeft, pointsLeft, pointsTotal };
    }
  }
  const rule = STATIC_THRESHOLDS[target];
  return { rank: target, ticketsLeft: Math.max(0, rule.tickets - completedTickets), pointsLeft: null, pointsTotal: rule.points };
}

const VN_ZONE = "Asia/Ho_Chi_Minh";
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;
const PLAIN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;

/**
 * "hh:mm dd/mm/yyyy" theo giờ Việt Nam. Có offset hoặc `Z` → đổi sang Asia/Ho_Chi_Minh;
 * dạng `Y-m-d H:i:s` không offset (backend Laravel) coi như đã là giờ Việt Nam. Không đọc được → "".
 */
export function formatTxDate(value?: string | null): string {
  if (!value) return "";
  const text = value.trim();
  if (HAS_OFFSET.test(text) && PLAIN.test(text)) {
    const ms = Date.parse(text.replace(" ", "T"));
    if (!Number.isFinite(ms)) return "";
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: VN_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms));
    const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${pick("hour")}:${pick("minute")} ${pick("day")}/${pick("month")}/${pick("year")}`;
  }
  const m = text.match(PLAIN);
  return m ? `${m[4]}:${m[5]} ${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Số theo ngôn ngữ trang (vi: 150.000, en: 150,000). */
export const formatCount = (value: number, locale: Locale) => value.toLocaleString(locale === "en" ? "en-US" : "vi-VN");
