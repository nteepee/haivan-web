import { dmyToIso, isoToDmy, todayIsoVn } from "./format";
import { TIME_BUCKETS, type TimeBucketKey } from "./trip-filters";

export interface SearchPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface SearchParamsData {
  from: SearchPoint;
  to: SearchPoint;
  /** "YYYY-MM-DD" */
  date: string;
  numberGuest: number;
  /** 2 = Xe liên tỉnh (tab mặc định web cũ), 1 = Xe sân bay; null khi URL không có. */
  type: number | null;
  /** Ý định theo tuyến chính (query riêng của trang mình, không gửi apigw): `tripsQuery`/`buildSearchUrl` không đọc trường này. */
  corridor?: CorridorParams;
}

/**
 * Query riêng trên URL `tim-chuyen` (xem plans/261029-1444-core-routes-search-promos/contract.md): chọn lại form theo tuyến,
 * ghi chú trạm vào đơn, ngày về cho khứ hồi, chặng về của khứ hồi, khung giờ đang xem. Không bao giờ vào request apigw.
 */
export interface CorridorParams {
  tuyen: string;
  chieu: "ab" | "ba";
  diemDi: string | null;
  diemDen: string | null;
  /** "YYYY-MM-DD" */
  ngayVe: string | null;
  chang: "ve" | null;
  /** Mã đơn chiều đi (chỉ khi chang = "ve"). */
  donDi: string | null;
  gio: TimeBucketKey | null;
}

/** "Quận 1,10.7753882,106.702825" → điểm. Như web cũ: tên = phần trước dấu phẩy đầu, toạ độ = 2 phần cuối. */
export function parsePoint(raw: string | null): SearchPoint | null {
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length < 3) return null;
  const lng = Number(parts.pop());
  const lat = Number(parts.pop());
  const name = (parts[0] ?? "").trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { name, lat, lng };
}

/** Đọc query `/xe-khach/tim-chuyen` theo đúng định dạng web cũ (cả link cũ không mã hoá). */
export function parseSearch(params: URLSearchParams, now = Date.now()): SearchParamsData | null {
  const from = parsePoint(params.get("from"));
  const to = parsePoint(params.get("to"));
  if (!from || !to) return null;
  const rawDate = params.get("date");
  let date = todayIsoVn(now);
  if (rawDate && /^\d{2}-\d{2}-\d{4}$/.test(rawDate)) date = dmyToIso(rawDate);
  const guests = Number.parseInt(params.get("numberGuest") ?? "1", 10);
  // Web cũ (pages router): thiếu `type` trên URL → gửi type=0 (khớp request live).
  const type = params.get("type") ?? "0";
  return {
    from,
    to,
    date,
    numberGuest: Number.isFinite(guests) && guests > 0 ? guests : 1,
    type: /^\d+$/.test(type) ? Number(type) : 0,
  };
}

const point = (p: SearchPoint) => encodeURIComponent(`${p.name},${p.lat},${p.lng}`);

/** Link tìm chuyến (mã hoá đầy đủ; parseSearch đọc được cả bản cũ). */
export function buildSearchUrl(data: SearchParamsData, prefix = ""): string {
  const query = [`from=${point(data.from)}`, `to=${point(data.to)}`, `date=${isoToDmy(data.date)}`, `numberGuest=${data.numberGuest}`];
  if (data.type !== null) query.push(`type=${data.type}`);
  return `${prefix}/xe-khach/tim-chuyen?${query.join("&")}`;
}

/** Query `api/el/trips` như web cũ (sort cứng time asc; `type` chỉ gửi khi có). */
export function tripsQuery(data: SearchParamsData, page?: number) {
  return {
    from_location: `${data.from.lat},${data.from.lng}`,
    to_location: `${data.to.lat},${data.to.lng}`,
    numberGuest: data.numberGuest,
    date: data.date,
    page,
    sort_by: "time",
    sort_mode: "asc",
    type: data.type ?? undefined,
  };
}

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ORDER_CODE = /^[A-Za-z0-9]{3,40}$/;

/** Đọc query riêng; giá trị lạ bị bỏ (null) chứ không tin. `null` khi không có `tuyen` hợp lệ. Việc đối chiếu với cấu hình tuyến làm ở nơi dùng. */
export function parseCorridorParams(params: URLSearchParams): CorridorParams | null {
  const tuyen = params.get("tuyen") ?? "";
  if (!ID.test(tuyen)) return null;
  const pick = (name: string) => {
    const v = params.get(name);
    return v && ID.test(v) ? v : null;
  };
  const ve = params.get("ngay_ve");
  const donDi = params.get("don_di");
  const gio = params.get("gio");
  return {
    tuyen,
    chieu: params.get("chieu") === "ba" ? "ba" : "ab",
    diemDi: pick("diem_di"),
    diemDen: pick("diem_den"),
    ngayVe: ve && /^\d{2}-\d{2}-\d{4}$/.test(ve) ? dmyToIso(ve) : null,
    chang: params.get("chang") === "ve" ? "ve" : null,
    donDi: donDi && ORDER_CODE.test(donDi) ? donDi : null,
    gio: TIME_BUCKETS.find((b) => b.key === gio)?.key ?? null,
  };
}

/** Gắn query riêng vào link `buildSearchUrl` (nối chuỗi, không đổi phần apigw). */
export function appendCorridorParams(url: string, p: CorridorParams): string {
  const q = [`tuyen=${p.tuyen}`, `chieu=${p.chieu}`];
  if (p.diemDi) q.push(`diem_di=${p.diemDi}`);
  if (p.diemDen) q.push(`diem_den=${p.diemDen}`);
  if (p.ngayVe) q.push(`ngay_ve=${isoToDmy(p.ngayVe)}`);
  if (p.chang) q.push(`chang=${p.chang}`);
  if (p.donDi) q.push(`don_di=${encodeURIComponent(p.donDi)}`);
  if (p.gio) q.push(`gio=${p.gio}`);
  return `${url}${url.includes("?") ? "&" : "?"}${q.join("&")}`;
}

/** `parseSearch` + query riêng của URL (nếu có). */
export function parseSearchWithCorridor(params: URLSearchParams, now = Date.now()): SearchParamsData | null {
  const search = parseSearch(params, now);
  if (!search) return null;
  const corridor = parseCorridorParams(params);
  return corridor ? { ...search, corridor } : search;
}
