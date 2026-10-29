import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import placesFixture from "../../../test/fixtures/places.json";
import { COMBO_PROMO, ROUNDTRIP_PROMO, withPromos } from "../../../test/booking-config";
import { BookingConfigProvider } from "@/components/booking-config-provider";
import { Providers } from "@/components/providers";
import type { BookingConfig } from "@/schemas/booking-config";
import { buildSearchUrl, parseCorridorParams, parseSearch, type CorridorParams, type SearchParamsData } from "@/lib/search-url";
import { SearchForm, SHOW_SERVICE_TABS } from "./search-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

/** Trạng thái giả của useTrips cho hàng "Chuyến hôm nay" (không gọi mạng). */
const tripsState = vi.hoisted(() => ({ value: { data: undefined, isPending: true, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: () => Promise.resolve() } as Record<string, unknown> }));
const tripsCalls = vi.hoisted(() => ({ searches: [] as unknown[], options: [] as unknown[] }));
const visible = vi.hoisted(() => ({ value: true }));
vi.mock("@/hooks/use-trips", () => ({
  usePlaces: () => ({ data: placesFixture }),
  useTrips: (search: unknown, options: unknown) => {
    tripsCalls.searches.push(search);
    tripsCalls.options.push(options);
    return tripsState.value;
  },
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T03:00:00Z")); // 10:00 giờ VN, hôm nay = 2026-10-29
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  // Hàng "Chuyến hôm nay" chỉ tải khi hiện trên màn hình: bản giả báo có mặt ngay.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: (entries: { isIntersecting: boolean }[]) => void) {}
      observe() { this.cb([{ isIntersecting: visible.value }]); }
      unobserve() {}
      disconnect() {}
    },
  );
  visible.value = true;
  push.mockClear();
  tripsCalls.searches.length = 0;
  tripsCalls.options.length = 0;
  tripsState.value = { data: undefined, isPending: true, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: () => Promise.resolve() };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

interface Opts {
  locale?: "vi" | "en";
  config?: BookingConfig;
  initial?: Partial<SearchParamsData>;
  todayChips?: boolean;
}
function renderForm({ locale = "vi", config, initial, todayChips }: Opts = {}) {
  const form = <SearchForm mode="corridor" initial={initial} todayChips={todayChips} />;
  return render(<Providers locale={locale}>{config ? <BookingConfigProvider config={config}>{form}</BookingConfigProvider> : form}</Providers>);
}
const select = (name: string | RegExp) => screen.getByRole("combobox", { name }) as HTMLSelectElement;
const optionLabels = (el: HTMLSelectElement) => [...el.options].map((o) => o.textContent);
const submit = () => userEvent.click(screen.getByRole("button", { name: "Tìm vé" }));
const pushed = () => {
  expect(push).toHaveBeenCalledTimes(1);
  const url = new URL(`https://haivan.com${push.mock.calls[0][0] as string}`);
  return { url, search: parseSearch(url.searchParams)!, own: parseCorridorParams(url.searchParams)! };
};

describe("SearchForm chế độ tuyến", () => {
  it("4 nút tuyến không có tiêu đề; tuyến đầu được chọn; trạm mặc định theo chiều a → b", () => {
    renderForm();
    const group = screen.getByRole("group", { name: "Tuyến chính" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Sài Gòn – Vũng Tàu", "Hà Nội – Điện Biên", "Hà Nội – Mộc Châu", "Hà Nội – Sơn La"]);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    // Điện thoại: hai dòng từ hai đầu tuyến (đầu a, rồi mũi tên + đầu b); cả bốn nút đều có mặt (không cuộn ngang).
    expect([...buttons[2].querySelectorAll(".hv-corr-a, .hv-corr-b")].map((e) => e.textContent)).toEqual(["Hà Nội", "Mộc Châu"]);
    expect(buttons[2].querySelector(".hv-corr-b svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument(); // không có tab một chiều/khứ hồi
    expect(select("Điểm đi").selectedOptions[0]).toHaveTextContent("Quận 1 – Phòng chờ 34 Nguyễn Thái Bình");
    expect(select("Điểm đến").selectedOptions[0]).toHaveTextContent("Vũng Tàu – Phòng chờ 156B Lê Hồng Phong");
    expect(select("Số vé")).toHaveValue("1");
    expect(select("Số vé").selectedOptions[0]).toHaveTextContent("1 vé");
    expect(optionLabels(select("Số vé"))).toEqual(["1 vé", "2 vé", "3 vé", "4 vé", "5 vé", "6 vé", "7 vé", "8 vé", "9 vé"]);
  });

  it("đổi tuyến → danh sách trạm của tuyến mới, chiều về a → b, nút được chọn đổi theo", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    expect(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sài Gòn – Vũng Tàu" })).toHaveAttribute("aria-pressed", "false");
    expect(optionLabels(select("Điểm đi"))).toEqual(["Bến xe Mỹ Đình", "35 Nguyễn Tuân", "10 Châu Văn Liêm"]);
    expect(select("Điểm đến")).toHaveValue("nong-truong");
    expect(optionLabels(select("Điểm đến"))).toHaveLength(8);
  });

  it("đổi chiều: hai ô đổi vai, trạm đã chọn đi theo, ngày đi và số vé giữ nguyên", async () => {
    renderForm({ initial: { date: "2026-10-31", numberGuest: 3 } });
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    await userEvent.selectOptions(select("Điểm đi"), "nguyen-tuan");
    await userEvent.selectOptions(select("Điểm đến"), "ben-xe-mc");
    await userEvent.click(screen.getByRole("button", { name: "Đổi chiều" }));
    expect(optionLabels(select("Điểm đi"))).toHaveLength(8);
    expect(select("Điểm đi")).toHaveValue("ben-xe-mc");
    expect(select("Điểm đến")).toHaveValue("nguyen-tuan");
    expect(screen.getByLabelText("Ngày đi")).toHaveValue("2026-10-31");
    expect(select("Số vé")).toHaveValue("3");
    await submit();
    const { search, own } = pushed();
    // chiều b → a: đi từ Mộc Châu về Mỹ Đình
    expect(search.from.name).toBe("Mộc Châu");
    expect(search.to.name).toBe("Bến xe Mỹ Đình");
    expect(own).toMatchObject({ tuyen: "hn-moc", chieu: "ba", diemDi: "ben-xe-mc", diemDen: "nguyen-tuan" });
  });

  it("ngày đi: tối thiểu hôm nay (giờ VN), tối đa hôm nay + max_days; mặc định hôm nay", () => {
    renderForm();
    const date = screen.getByLabelText("Ngày đi");
    expect(date).toHaveValue("2026-10-29");
    expect(date).toHaveAttribute("min", "2026-10-29");
    expect(date).toHaveAttribute("max", "2026-11-27");
  });

  it("ô ngày hiện nhãn kiểu Việt/Anh phủ lên input gốc", async () => {
    const { container, unmount } = renderForm({ initial: { date: "2026-10-31" } });
    expect(container.querySelector(".hv-datebox-text")).toHaveTextContent("Thứ bảy, 31/10/2026");
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngày về" }));
    expect([...container.querySelectorAll(".hv-datebox-text")].map((e) => e.textContent)).toEqual(["Thứ bảy, 31/10/2026", "Thứ hai, 02/11/2026"]);
    unmount();
    const en = renderForm({ initial: { date: "2026-10-31" }, locale: "en" });
    expect(en.container.querySelector(".hv-datebox-text")).toHaveTextContent("Sat, 31 Oct 2026");
  });

  it("ngày hôm qua (từ link cũ) bị đưa về hôm nay", () => {
    renderForm({ initial: { date: "2026-10-28" } });
    expect(screen.getByLabelText("Ngày đi")).toHaveValue("2026-10-29");
  });

  it("'+ Thêm ngày về': ô ngày về min = ngày đi, mặc định ngày đi + 2; × bỏ ngày về", async () => {
    renderForm({ initial: { date: "2026-10-31" } });
    expect(screen.queryByLabelText("Ngày về")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngày về" }));
    const back = screen.getByLabelText("Ngày về");
    expect(back).toHaveValue("2026-11-02");
    expect(back).toHaveAttribute("min", "2026-10-31");
    expect(screen.queryByRole("button", { name: "Thêm ngày về" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bỏ ngày về" }));
    expect(screen.queryByLabelText("Ngày về")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm ngày về" })).toBeInTheDocument();
  });

  it("xe giường nằm (Điện Biên): ngày về tối thiểu = ngày đi + 1", async () => {
    renderForm({ initial: { date: "2026-10-31" } });
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Điện Biên" }));
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngày về" }));
    expect(screen.getByLabelText("Ngày về")).toHaveAttribute("min", "2026-11-01");
    expect(screen.getByLabelText("Ngày về")).toHaveValue("2026-11-01"); // giường nằm: mặc định ngày đi + 1
  });

  it("ngày về tụt lại sau ngày đi thì tự đẩy lên mức tối thiểu mới", async () => {
    renderForm({ initial: { date: "2026-10-30" } });
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngày về" })); // 11-01
    fireEvent.change(screen.getByLabelText("Ngày đi"), { target: { value: "2026-11-05" } });
    expect(screen.getByLabelText("Ngày về")).toHaveValue("2026-11-05");
  });

  it("Tìm vé: buildSearchUrl không đổi + query riêng (tuyến, chiều, trạm, ngày về); toạ độ là đầu tuyến", async () => {
    renderForm({ initial: { date: "2026-10-31", numberGuest: 2 } });
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    await userEvent.selectOptions(select("Điểm đến"), "muong-thanh");
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngày về" }));
    await submit();
    const { url, search, own } = pushed();
    const expectedBase = buildSearchUrl({
      from: { name: "Bến xe Mỹ Đình", lat: 21.0284297, lng: 105.7782687 },
      to: { name: "Mộc Châu", lat: 20.8461723, lng: 104.6415738 },
      date: "2026-10-31",
      numberGuest: 2,
      type: 2,
    });
    expect(`${url.pathname}${url.search}`.startsWith(expectedBase)).toBe(true);
    expect(`${url.pathname}${url.search}`.slice(expectedBase.length)).toBe("&tuyen=hn-moc&chieu=ab&diem_di=my-dinh&diem_den=muong-thanh&ngay_ve=02-11-2026");
    expect(search.numberGuest).toBe(2);
    expect(own).toMatchObject<Partial<CorridorParams>>({ ngayVe: "2026-11-02", chang: null, donDi: null });
  });

  it("trạm có toạ độ riêng (sân bay Tân Sơn Nhất) → tìm chuyến theo toạ độ trạm", async () => {
    renderForm();
    await userEvent.selectOptions(select("Điểm đi"), "tsn-t1");
    await submit();
    const { search, own } = pushed();
    expect(search.from).toEqual({ name: "Sân bay Tân Sơn Nhất", lat: 10.8184631, lng: 106.6588245 });
    expect(search.to.name).toBe("TP Vũng Tàu (Gành Hào)");
    expect(own.diemDi).toBe("tsn-t1");
  });

  it("chọn sẵn từ URL: tuyến, chiều, trạm", () => {
    renderForm({
      initial: { date: "2026-10-31", corridor: { tuyen: "hn-sl", chieu: "ba", diemDi: "ben-xe-sl", diemDen: "chau-van-liem", ngayVe: null, chang: null, donDi: null, gio: null } },
    });
    expect(screen.getByRole("button", { name: "Hà Nội – Sơn La" })).toHaveAttribute("aria-pressed", "true");
    expect(select("Điểm đi")).toHaveValue("ben-xe-sl");
    expect(select("Điểm đến")).toHaveValue("chau-van-liem");
  });

  it("sửa lại tìm kiếm có ngày về: ô ngày về mở sẵn với ngày đó", () => {
    renderForm({
      initial: { date: "2026-10-31", corridor: { tuyen: "hn-moc", chieu: "ab", diemDi: null, diemDen: null, ngayVe: "2026-11-03", chang: null, donDi: null, gio: null } },
    });
    expect(screen.getByLabelText("Ngày về", { exact: true })).toHaveValue("2026-11-03");
    expect(screen.getByRole("button", { name: "Bỏ ngày về" })).toBeInTheDocument();
  });

  it("chặng về: không mời thêm khứ hồi; giữ chang/don_di khi tìm lại cùng tuyến + chiều", async () => {
    renderForm({
      initial: { date: "2026-10-31", corridor: { tuyen: "hn-moc", chieu: "ba", diemDi: "nong-truong", diemDen: "my-dinh", ngayVe: null, chang: "ve", donDi: "B02OUT1", gio: null } },
    });
    expect(screen.queryByRole("button", { name: "Thêm ngày về" })).not.toBeInTheDocument();
    await submit();
    expect(pushed().own).toMatchObject({ chang: "ve", donDi: "B02OUT1", chieu: "ba" });
  });

  it("liên kết 'Đi tỉnh khác?' chuyển sang chọn điểm tự do (cũ) và quay lại được", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Tìm theo điểm đi, điểm đến" }));
    expect(screen.getByText("Điểm xuất phát")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Loại hình" }) !== null).toBe(SHOW_SERVICE_TABS);
    await userEvent.click(screen.getByRole("button", { name: "Quay lại tuyến chính" }));
    expect(screen.getByRole("group", { name: "Tuyến chính" })).toBeInTheDocument();
  });

  it("bản EN: nhãn và tên tuyến tiếng Anh", () => {
    renderForm({ locale: "en" });
    expect(screen.getByRole("button", { name: "Saigon – Vung Tau" })).toBeInTheDocument();
    expect(select("From")).toBeInTheDocument();
    expect(select("Tickets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add return date" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search by origin and destination" })).toBeInTheDocument();
  });
});

describe("nhãn khứ hồi cạnh '+ Thêm ngày về'", () => {
  const config = withPromos([ROUNDTRIP_PROMO, COMBO_PROMO]);

  it("hiện khi có chương trình khứ hồi khớp tuyến + chiều về; đổi chiều (chiều về không khớp) thì ẩn", async () => {
    renderForm({ config });
    expect(screen.queryByText("Giảm 20k/ghế chiều về")).not.toBeInTheDocument(); // Sài Gòn – Vũng Tàu không có
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    expect(screen.getByText("Giảm 20k/ghế chiều về")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Đổi chiều" }));
    expect(screen.queryByText("Giảm 20k/ghế chiều về")).not.toBeInTheDocument();
  });

  it("nhãn theo điều kiện ngày: chương trình chỉ cho ngày đi tới 05/11 thì ẩn khi ngày về chọn sau đó", async () => {
    const limited = withPromos([{ ...ROUNDTRIP_PROMO, travel_to: "2026-11-05" }]);
    renderForm({ config: limited, initial: { date: "2026-10-31" } });
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    expect(screen.getByText("Giảm 20k/ghế chiều về")).toBeInTheDocument(); // còn ngày trong khoảng có thể chọn
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngày về" })); // mặc định 02/11: đủ điều kiện
    expect(screen.getByText("Giảm 20k/ghế chiều về")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Ngày về", { exact: true }), { target: { value: "2026-11-10" } });
    expect(screen.queryByText("Giảm 20k/ghế chiều về")).not.toBeInTheDocument();
  });

  it("không có chương trình → không hiện nhãn nào", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    expect(document.querySelector(".hv-badge")).toBeNull();
  });

  it("nhãn đi cùng ô ngày về khi đã mở, và dùng bản EN", async () => {
    renderForm({ config, locale: "en" });
    await userEvent.click(screen.getByRole("button", { name: "Hanoi – Moc Chau" }));
    await userEvent.click(screen.getByRole("button", { name: "Add return date" }));
    expect(screen.getByLabelText("Return date")).toBeInTheDocument();
    expect(screen.getByText("20k off per return seat")).toBeInTheDocument();
  });
});

describe("Chuyến hôm nay", () => {
  const trip = (hhmm: string) => ({ id: Math.random(), from: { reached_at: `2026-10-29 ${hhmm}:00` }, time: hhmm });
  const loaded = (times: string[]) => ({
    data: { pages: [{ data: times.map(trip) }] },
    isPending: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: () => Promise.resolve(),
  });

  it("tiêu đề theo chiều; số chuyến mỗi khung; khung rỗng bị vô hiệu; dùng đúng request của trang kết quả (hôm nay, 1 vé, type 2)", async () => {
    tripsState.value = loaded(["05:30", "07:00", "08:15", "13:00", "20:45"]);
    renderForm({ todayChips: true });
    expect(screen.getByText("Chuyến hôm nay").tagName).toBe("STRONG");
    expect(screen.getByText("Sài Gòn đi Vũng Tàu")).toHaveClass("hv-today-route");
    const group = screen.getByRole("group", { name: "Chuyến hôm nay Sài Gòn đi Vũng Tàu" });
    await waitFor(() => expect(within(group).getByRole("button", { name: /6–11h/ })).toBeEnabled()); // sau khi hết 400ms chờ
    const chip = (name: string) => within(group).getByRole("button", { name: new RegExp(name) });
    expect(chip("0–6h")).toHaveTextContent("1");
    expect(chip("6–11h")).toHaveTextContent("2");
    expect(chip("11–14h")).toHaveTextContent("1");
    expect(chip("14–18h")).toBeDisabled();
    expect(chip("18–24h")).toHaveTextContent("1");
    expect(within(group).getByRole("button", { name: /^Cả ngày/ })).toHaveTextContent("5");
    expect(within(group).getByRole("button", { name: /^Cả ngày/ })).toBeEnabled();
    expect(tripsCalls.searches.at(-1)).toMatchObject({
      from: { name: "Quận 1", lat: 10.7753882, lng: 106.702825 },
      to: { name: "TP Vũng Tàu (Gành Hào)" },
      date: "2026-10-29",
      numberGuest: 1,
      type: 2,
    });
  });

  it("chọn khung → mở kết quả hôm nay với gio=...; 'Cả ngày' không có gio", async () => {
    tripsState.value = loaded(["07:00"]);
    renderForm({ todayChips: true });
    await waitFor(() => expect(screen.getByRole("button", { name: /6–11h/ })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: /6–11h/ }));
    const first = pushed();
    expect(first.search.date).toBe("2026-10-29");
    expect(first.search.numberGuest).toBe(1);
    expect(first.own).toMatchObject({ tuyen: "sg-vt", chieu: "ab", gio: "morning", ngayVe: null });
    push.mockClear();
    await userEvent.click(screen.getByRole("button", { name: /^Cả ngày/ }));
    const all = pushed();
    expect(all.own.gio).toBeNull();
    expect(all.url.searchParams.get("gio")).toBeNull();
  });

  it("tiết kiệm apigw: chờ 400ms mới gọi, chỉ gọi khi hàng hiện trên màn hình, giữ mới 5 phút", async () => {
    visible.value = false;
    tripsState.value = loaded(["07:00"]);
    renderForm({ todayChips: true });
    // Chưa hiện trên màn hình: useTrips bị tắt dù đã qua thời gian chờ.
    await new Promise((r) => setTimeout(r, 500));
    expect(tripsCalls.options.at(-1)).toMatchObject({ enabled: false, staleTime: 5 * 60_000 });
    cleanup();
    visible.value = true;
    renderForm({ todayChips: true });
    expect(tripsCalls.options.at(-1)).toMatchObject({ enabled: true, staleTime: 5 * 60_000 });
    // Đổi tuyến: trong 400ms đầu không gọi khoá mới (useTrips tắt), sau đó mới gọi với điểm của tuyến mới.
    await userEvent.click(screen.getByRole("button", { name: "Hà Nội – Mộc Châu" }));
    expect(tripsCalls.options.at(-1)).toMatchObject({ enabled: false });
    await waitFor(() => expect(tripsCalls.options.at(-1)).toMatchObject({ enabled: true }));
    expect(tripsCalls.searches.at(-1)).toMatchObject({ to: { name: "Mộc Châu" }, numberGuest: 1 });
  });

  it("tab nền không gọi apigw; lượt đếm nền không thử lại (retry false)", async () => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    try {
      tripsState.value = loaded(["07:00"]);
      renderForm({ todayChips: true });
      await new Promise((r) => setTimeout(r, 500));
      expect(tripsCalls.options.at(-1)).toMatchObject({ enabled: false, retry: false });
    } finally {
      Reflect.deleteProperty(document, "hidden");
    }
  });

  it("bấm chip giữ số vé đã chọn trên form (đếm vẫn theo 1 vé)", async () => {
    tripsState.value = loaded(["07:00"]);
    renderForm({ todayChips: true });
    await userEvent.selectOptions(select("Số vé"), "3");
    await waitFor(() => expect(screen.getByRole("button", { name: /6–11h/ })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: /6–11h/ }));
    expect(pushed().search.numberGuest).toBe(3);
    expect(tripsCalls.searches.at(-1)).toMatchObject({ numberGuest: 1 });
  });

  it("đang tải: chip vẫn bấm được và hiện '…' thay số (không giống tất cả bị vô hiệu); mặc định không hiện hàng này nếu không bật", () => {
    renderForm({ todayChips: true });
    expect(screen.getByRole("button", { name: /0–6h/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /0–6h/ })).toHaveTextContent("…");
    expect(screen.getByRole("group", { name: /Chuyến hôm nay/ })).toHaveAttribute("aria-busy", "true");
    cleanup();
    renderForm();
    expect(screen.queryByText(/Chuyến hôm nay/)).not.toBeInTheDocument();
  });
});
