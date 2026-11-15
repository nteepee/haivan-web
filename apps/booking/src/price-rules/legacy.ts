import type { PriceRuleInput, RuleWindow } from "./schema";

/**
 * Chuyển luật cũ sang luật giá v2:
 *  - chương trình combo của booking.haivan.com (`COMBO_JSON` / `GET …/haivan-booking/v1/web-combo` phần `rules`);
 *  - file lịch combo CSV của MKT (cột Ngày, Chiều, Dòng xe, Khung giờ chạy, Áp combo);
 *  - bài "Chương trình giảm giá" v1 (hv_promo, payload booking-config v1).
 * Luật nhập vào luôn ở trạng thái `test` (AI/CLI không được bật thẳng); người duyệt bật `on` sau khi mô phỏng.
 */

/** Mã chiều của booking cũ → tuyến + chiều của web mới. Chiều không có tuyến tương ứng bị bỏ (cảnh báo). */
export const LEGACY_DIRECTIONS: Record<string, { corridor: string; direction: "ab" | "ba" }> = {
  "sg-vt": { corridor: "sg-vt", direction: "ab" },
  "vt-sg": { corridor: "sg-vt", direction: "ba" },
  "hn-db": { corridor: "hn-db", direction: "ab" },
  "db-hn": { corridor: "hn-db", direction: "ba" },
  "hn-moc": { corridor: "hn-moc", direction: "ab" },
  "moc-hn": { corridor: "hn-moc", direction: "ba" },
  "hn-sl": { corridor: "hn-sl", direction: "ab" },
  "sl-hn": { corridor: "hn-sl", direction: "ba" },
};

/** Chi nhánh ERP theo chương trình cũ. */
export const LEGACY_MERCHANT: Record<string, string> = { db: "01", vt: "02", mcsl: "17" };

export interface LegacyLine {
  line: string;
  name: string;
  seats?: number;
}

/** Chương trình cũ: hợp của COMBO_JSON (có `lines`, `exact_seats`) và phần `rules` công khai của web-combo (có `windows`, `first_days`). */
export interface LegacyProgram {
  id: string;
  mode?: "off" | "test" | "optin" | "on";
  directions: string[];
  pricing?: "per_combo" | "per_seat";
  per_leg?: boolean;
  totals?: Record<string, Record<string, number>>;
  tiers?: Record<string, number> | unknown[];
  lines?: LegacyLine[];
  exact_seats?: Record<string, Record<string, string[]>>;
  blocked_seats?: string[];
  max_per_phone?: number;
  quota_per_trip?: number;
  date_from?: string;
  date_to?: string;
  min_days_ahead?: number;
  min_days_ahead_by_line?: Record<string, number> | unknown[];
  min_minutes_ahead?: number;
  roundtrip_discount_vnd?: number;
  windows?: Record<string, number[][][]>;
  specials?: Array<{ directions?: string[]; time_from: string; time_to: string; totals: Record<string, number>; label?: string }>;
}

export interface ImportResult {
  rules: PriceRuleInput[];
  warnings: string[];
}

const hh = (n: number, end = false) => `${String(n).padStart(2, "0")}:${end ? "59" : "00"}`;

/** Từ khoá hạng xe + số chỗ của một dòng xe cũ (vd. VT eco = "luxury" 9 chỗ). Không có `lines` → dùng chính tên dòng làm từ khoá. */
function lineSpecs(p: LegacyProgram, line: string): Array<{ products: string[]; vehicle_seats?: number[] }> {
  const entries = (p.lines ?? []).filter((l) => l.line.toLowerCase() === line.toLowerCase());
  if (!entries.length) return [{ products: [line] }];
  const bySeats = new Map<number, string[]>();
  for (const e of entries) bySeats.set(e.seats ?? 0, [...(bySeats.get(e.seats ?? 0) ?? []), e.name]);
  return [...bySeats.entries()].map(([seats, products]) => (seats ? { products, vehicle_seats: [seats] } : { products }));
}

function mapDirections(p: LegacyProgram, warnings: string[]) {
  const mapped = p.directions.flatMap((d) => {
    const m = LEGACY_DIRECTIONS[d];
    if (!m) warnings.push(`${p.id}: bỏ chiều "${d}" (chưa có tuyến tương ứng trên web mới)`);
    return m ? [{ legacy: d, ...m }] : [];
  });
  return {
    mapped,
    corridors: [...new Set(mapped.map((m) => m.corridor))],
    directions: [...new Set(mapped.map((m) => m.direction))],
  };
}

/** `windows[chiều][thứ 0=T2]` = [[giờ từ, giờ đến]] (giờ nguyên, tính cả giờ cuối) → cửa sổ v2. */
export function windowsFromLegacy(windows: LegacyProgram["windows"], warnings: string[] = []): RuleWindow[] {
  const out: RuleWindow[] = [];
  for (const [dir, days] of Object.entries(windows ?? {})) {
    const m = LEGACY_DIRECTIONS[dir];
    if (!m) {
      warnings.push(`windows: bỏ chiều "${dir}"`);
      continue;
    }
    days.forEach((spans, i) => spans.forEach(([from, to = from]) => out.push({ directions: [m.direction], weekdays: [i + 1], from: hh(from), to: hh(to, true) })));
  }
  return mergeWindows(out);
}

/** Gộp cửa sổ giống nhau khác thứ (cho JSON gọn, dễ đọc trên CMS). */
function mergeWindows(list: RuleWindow[]): RuleWindow[] {
  const map = new Map<string, RuleWindow>();
  for (const w of list) {
    const key = JSON.stringify({ ...w, weekdays: undefined });
    const prev = map.get(key);
    if (prev) prev.weekdays = [...new Set([...(prev.weekdays ?? []), ...(w.weekdays ?? [])])].sort();
    else map.set(key, { ...w, weekdays: w.weekdays ? [...w.weekdays] : undefined });
  }
  return [...map.values()].map((w) => (w.weekdays?.length === 7 ? { ...w, weekdays: undefined } : w)).map(stripUndefined);
}

const stripUndefined = <T extends object>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

const WEEKDAY_TOKENS: Record<string, number> = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 7 };
const CSV_DIRECTIONS: Record<string, string> = {
  "SG→VT": "sg-vt", "VT→SG": "vt-sg", "HN→DB": "hn-db", "DB→HN": "db-hn", "HN→ĐB": "hn-db", "ĐB→HN": "db-hn",
};

function csvWeekdays(text: string): number[] {
  const days = new Set<number>();
  for (const token of text.split(/[,+&]|\s+(?:và|va)\s+/i).map((t) => t.trim().toUpperCase()).filter(Boolean)) {
    const range = token.split(/\s*[–—-]\s*|\s+(?:ĐẾN|DEN|TỚI|TOI)\s+/);
    if (range.length === 1) {
      const d = WEEKDAY_TOKENS[range[0]];
      if (!d) throw new Error(`ngày không hợp lệ: ${token}`);
      days.add(d);
    } else {
      const a = WEEKDAY_TOKENS[range[0]];
      const b = WEEKDAY_TOKENS[range[1]];
      if (!a || !b || b < a) throw new Error(`khoảng ngày không hợp lệ: ${token}`);
      for (let d = a; d <= b; d++) days.add(d);
    }
  }
  return [...days].sort();
}

function csvHours(text: string): { from: string; to: string } {
  const parts = text.trim().split(/\s*[–—-]\s*/);
  const one = (raw: string, end: boolean) => {
    const s = raw.trim().toLowerCase();
    if (s.includes(":")) {
      const [h, m] = s.split(":").map(Number);
      if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59)) throw new Error(`giờ không hợp lệ: ${raw}`);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    const h = Number(s.replace(/h$/, ""));
    if (!Number.isInteger(h) || h < 0 || h > 23) throw new Error(`giờ không hợp lệ: ${raw}`);
    return hh(h, end);
  };
  const from = one(parts[0], false);
  const to = one(parts[1] ?? parts[0], true);
  if (to < from) throw new Error(`khung giờ ngược: ${text}`);
  return { from, to };
}

/**
 * Lịch combo CSV của MKT → cửa sổ v2 (giữ số vé theo khung). Dòng sai → lỗi kèm số dòng (như parser cũ, không đoán).
 * Cột: Ngày, Chiều, Dòng xe, Khung giờ chạy, Áp combo ("Combo 2 + Combo 3").
 */
export function windowsFromScheduleCsv(csv: string, program: Pick<LegacyProgram, "id" | "lines">): RuleWindow[] {
  const lines = csv.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(",").map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const idx = { day: col("Ngày"), dir: col("Chiều"), line: col("Dòng xe"), hours: col("Khung giờ chạy"), sizes: col("Áp combo") };
  if (Object.values(idx).some((i) => i < 0)) throw new Error("CSV thiếu cột Ngày, Chiều, Dòng xe, Khung giờ chạy hoặc Áp combo");
  const out: RuleWindow[] = [];
  lines.slice(1).forEach((row, n) => {
    const c = row.split(",").map((x) => x.trim());
    try {
      const legacyDir = CSV_DIRECTIONS[c[idx.dir].toUpperCase().replace(/\s/g, "")] ?? c[idx.dir].toLowerCase();
      const m = LEGACY_DIRECTIONS[legacyDir];
      if (!m) return; // chiều chưa có tuyến trên web mới (MĐ↔BP, MĐ↔MC): bỏ, giống importer chương trình.
      const sizes = [...c[idx.sizes].matchAll(/combo\s*(\d)/gi)].map((x) => Number(x[1]));
      if (!sizes.length) return; // dòng "không áp"
      const { from, to } = csvHours(c[idx.hours]);
      for (const spec of lineSpecs(program as LegacyProgram, c[idx.line].toLowerCase() === "economy" ? "eco" : c[idx.line].toLowerCase())) {
        out.push(stripUndefined({ directions: [m.direction], weekdays: csvWeekdays(c[idx.day]), ...spec, from, to, seats: [...new Set(sizes)].sort() }));
      }
    } catch (e) {
      throw new Error(`CSV dòng ${n + 2}: ${(e as Error).message}`);
    }
  });
  return mergeWindows(out);
}

/** Một chương trình cũ → các luật v2 (combo, giá đặc biệt theo khung giờ, khứ hồi), cùng nhóm không cộng dồn. */
export function importLegacyProgram(p: LegacyProgram, opts: { scheduleWindows?: RuleWindow[] } = {}): ImportResult {
  const warnings: string[] = [];
  const { corridors, directions } = mapDirections(p, warnings);
  if (!corridors.length) return { rules: [], warnings: [...warnings, `${p.id}: không còn chiều nào để nhập`] };
  const merchant = LEGACY_MERCHANT[p.id];
  const group = `${p.id}-uu-dai`;
  const scope = stripUndefined({ merchants: merchant ? [merchant] : undefined, corridors, directions: directions.length === 2 ? undefined : directions });
  const lead: Record<string, number> = {};
  if (p.min_days_ahead) lead.min_days = p.min_days_ahead;
  if (p.min_minutes_ahead) lead.min_minutes = p.min_minutes_ahead;
  const byLine = Array.isArray(p.min_days_ahead_by_line) ? {} : (p.min_days_ahead_by_line ?? {});
  const leadByProduct = Object.entries(byLine)
    .filter(([, days]) => days !== (p.min_days_ahead ?? 0))
    .flatMap(([line, days]) => lineSpecs(p, line).map((spec) => ({ ...spec, lead: { ...lead, min_days: days } })));
  const travel = stripUndefined({ from: p.date_from || undefined, to: p.date_to || undefined });
  const when = stripUndefined({
    travel: Object.keys(travel).length ? travel : undefined,
    lead: Object.keys(lead).length ? lead : undefined,
    lead_by_product: leadByProduct.length ? leadByProduct : undefined,
  });
  const status = "test" as const;
  const mode = p.mode === "on" ? ("auto" as const) : ("optin" as const);
  const rules: PriceRuleInput[] = [];

  const totals = p.pricing === "per_seat" ? undefined : p.totals;
  if (p.pricing === "per_seat") warnings.push(`${p.id}: pricing per_seat chưa nhập tự động (chưa có chương trình nào dùng); tạo luật seat_set_vnd bằng tay`);
  if (totals && Object.keys(totals).length) {
    const tiers = Object.entries(totals).flatMap(([line, bySize]) =>
      lineSpecs(p, line).flatMap((spec) => Object.entries(bySize).map(([seats, total]) => ({ seats: Number(seats), ...spec, total_vnd: total }))),
    );
    const exact = Object.entries(p.exact_seats ?? {}).flatMap(([seats, byLine]) =>
      Object.entries(byLine).flatMap(([line, numbers]) => lineSpecs(p, line).map((spec) => ({ seats: Number(seats), ...spec, numbers }))),
    );
    const sizes = tiers.map((t) => t.seats);
    const departure = opts.scheduleWindows ?? (p.windows ? windowsFromLegacy(p.windows, warnings) : undefined);
    rules.push({
      schema: 2,
      id: `${p.id}-combo`,
      title: `Combo ${p.id.toUpperCase()} (nhập từ booking.haivan.com)`,
      status,
      priority: 200,
      exclusive_group: group,
      scope,
      when: stripUndefined({ ...when, departure: departure?.length ? departure : undefined }),
      who: stripUndefined({
        seats: { min: Math.min(...sizes), max: Math.max(...sizes) },
        across_legs: p.per_leg === false,
        seat_match: p.blocked_seats?.length || exact.length ? stripUndefined({ exclude_numbers: p.blocked_seats?.length ? p.blocked_seats : undefined, exact_sets: exact.length ? exact : undefined }) : undefined,
        payments: ["qr" as const],
      }),
      quota: stripUndefined({ per_trip: p.quota_per_trip || undefined, per_phone: p.max_per_phone || undefined }),
      effect: { total_tiers: tiers, not_cheaper: true },
      apply: { mode, settlement: "erp_direct" },
      display: { label: { vi: "Giá combo đi nhóm", en: "Group combo fare" }, badge: { vi: "Combo", en: "Combo" }, terms: { vi: ["Thanh toán trước bằng QR, không hoàn tiền."], en: ["Prepaid by QR, non-refundable."] }, show_on: ["route", "trip_card"] },
    });
    (p.specials ?? []).forEach((sp, i) => {
      // Hệ cũ lọc giá khung giờ theo điểm đón đầu tuyến (`origins`: mã điểm agency, vd. tuyến Q1) nhưng `web-combo` công khai bỏ trường này.
      // Nhãn "Q1 …" → chỉ trạm q1; luôn cảnh báo để người duyệt kiểm lại trạm trước khi bật.
      const fromStops = /\bQ1\b/i.test(sp.label ?? "") ? ["q1"] : undefined;
      warnings.push(`${p.id}: giá khung giờ ${sp.time_from}–${sp.time_to}${sp.label ? ` (${sp.label})` : ""} — hệ cũ còn lọc theo điểm đón; ${fromStops ? "đã giới hạn trạm q1" : "CHƯA giới hạn trạm"}, kiểm lại scope.stops`);
      const spDirs = (sp.directions ?? p.directions).flatMap((d) => (LEGACY_DIRECTIONS[d] ? [LEGACY_DIRECTIONS[d].direction] : []));
      rules.push({
        schema: 2,
        id: `${p.id}-combo-khung-${i + 1}`,
        title: `Combo ${p.id.toUpperCase()} khung ${sp.time_from}–${sp.time_to}${sp.label ? ` (${sp.label})` : ""}`,
        status,
        priority: 300,
        exclusive_group: group,
        scope: stripUndefined({ ...scope, stops: fromStops ? { from: fromStops } : undefined }),
        when: stripUndefined({ ...when, departure: [{ directions: spDirs.length ? [...new Set(spDirs)] : undefined, from: sp.time_from, to: sp.time_to }].map(stripUndefined) }),
        who: { seats: { min: Math.min(...Object.keys(sp.totals).map(Number)), max: Math.max(...Object.keys(sp.totals).map(Number)) }, across_legs: p.per_leg === false, payments: ["qr"] },
        quota: stripUndefined({ per_trip: p.quota_per_trip || undefined, per_phone: p.max_per_phone || undefined }),
        effect: { total_tiers: Object.entries(sp.totals).map(([seats, total]) => ({ seats: Number(seats), total_vnd: total })), not_cheaper: true },
        apply: { mode, settlement: "erp_direct" },
        display: { label: { vi: sp.label ? `Combo ${sp.label}` : "Giá combo khung giờ", en: "Time-slot combo fare" }, badge: { vi: "Combo", en: "Combo" }, show_on: ["trip_card"] },
      });
    });
  }

  if (p.roundtrip_discount_vnd && p.roundtrip_discount_vnd > 0) {
    rules.push({
      schema: 2,
      id: `${p.id}-khu-hoi`,
      title: `Khứ hồi giảm ${p.roundtrip_discount_vnd / 1000}k/ghế chiều về – ${p.id.toUpperCase()} (nhập từ booking.haivan.com)`,
      status,
      priority: 100,
      exclusive_group: group,
      scope,
      when: stripUndefined({ travel: when.travel }),
      who: { across_legs: false, linked_order: { reverse: true, paid: true, same_customer: true, seats_lte: true } },
      effect: { seat_off_vnd: Math.min(p.roundtrip_discount_vnd, 100_000), not_cheaper: true },
      apply: { mode: "auto", settlement: "erp_direct" },
      display: {
        label: { vi: `Giảm ${p.roundtrip_discount_vnd / 1000}k/ghế chiều về`, en: `${p.roundtrip_discount_vnd / 1000}k off per return seat` },
        badge: { vi: `Khứ hồi -${p.roundtrip_discount_vnd / 1000}k`, en: `Return -${p.roundtrip_discount_vnd / 1000}k` },
        show_on: ["route", "form"],
      },
    });
  }
  return { rules, warnings };
}

/** Payload "Chương trình giảm giá" v1 (hv_promo_payload của WP, có thể kèm `code`). */
export interface V1Promo {
  id: number;
  type: "roundtrip" | "combo";
  corridor: string;
  direction: "ab" | "ba" | "both";
  book_from?: string | null;
  book_to?: string | null;
  travel_from?: string | null;
  travel_to?: string | null;
  weekdays?: number[] | null;
  hours?: { from: string; to: string } | null;
  book_ahead_minutes?: number | null;
  seats?: { min: number; max: number };
  per_seat_vnd?: number | null;
  tiers?: Array<{ seats: number; class: string; price_vnd: number; was_vnd?: number | null }>;
  label: { vi: string; en: string };
  badge: { vi: string; en: string };
  headline?: { vi: string; en: string } | null;
  terms?: { vi: string[]; en: string[] };
  show_on_route?: boolean;
  enabled?: boolean;
  title?: string;
}

/** hv_promo v1 → luật v2 (cách thu tiền giữ nguyên: mã ERP). */
export function importV1Promo(p: V1Promo): PriceRuleInput {
  const range = (from?: string | null, to?: string | null) => (from || to ? stripUndefined({ from: from ?? undefined, to: to ?? undefined }) : undefined);
  const isCombo = p.type === "combo";
  return stripUndefined({
    schema: 2 as const,
    id: `wp-promo-${p.id}`,
    title: p.title ?? `${isCombo ? "Combo" : "Khứ hồi"} ${p.corridor} (chuyển từ chương trình #${p.id})`,
    status: "test" as const,
    priority: isCombo ? 200 : 100,
    exclusive_group: `${p.corridor}-uu-dai`,
    scope: { corridors: [p.corridor], directions: p.direction === "both" ? undefined : [p.direction] },
    when: {
      book: range(p.book_from, p.book_to),
      travel: range(p.travel_from, p.travel_to),
      weekdays: p.weekdays?.length ? p.weekdays : undefined,
      departure: p.hours ? [{ from: p.hours.from, to: p.hours.to }] : undefined,
      lead: p.book_ahead_minutes ? { min_minutes: p.book_ahead_minutes } : undefined,
    },
    who: {
      seats: p.seats && (p.seats.min !== 1 || p.seats.max !== 9) ? p.seats : undefined,
      across_legs: false,
      linked_order: isCombo ? undefined : { reverse: true as const, paid: true, same_customer: true as const, seats_lte: true },
    },
    effect: isCombo
      ? { total_tiers: (p.tiers ?? []).map((t) => stripUndefined({ seats: t.seats, products: t.class.trim() ? [t.class.trim()] : undefined, total_vnd: t.price_vnd })), not_cheaper: true }
      : { seat_off_vnd: p.per_seat_vnd ?? 0, not_cheaper: true },
    apply: { mode: "auto" as const, settlement: "erp_code" as const },
    display: {
      label: p.label,
      badge: p.badge,
      headline: p.headline ?? undefined,
      terms: p.terms ?? { vi: [], en: [] },
      show_on: [...(p.show_on_route === false ? [] : ["route" as const]), isCombo ? ("trip_card" as const) : ("form" as const)],
    },
  });
}
