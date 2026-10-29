import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import infoPaymentsFixture from "../../../test/fixtures/info_payments.json";
import { infoPaymentsSchema, type PaymentMethod } from "@/schemas/booking";
import { MethodList, RADIO_GATE } from "./method-list";

const FIXTURE_METHODS = infoPaymentsSchema.parse(infoPaymentsFixture);
const BOOKING_CODE = "B02ELR3J6PD62D";
const PHONE = "0900000000";
const RADIO_VALUES = [5, 6, 1, 2, 3, 4] as const;

/** Nhãn accessible của từng radio (tiêu đề + mô tả) theo value trong MethodList. */
const RADIO_NAME: Record<number, RegExp> = {
  5: /mã QR qua VNPAY-QR/,
  6: /PayOS/,
  1: /thẻ ATM/,
  2: /thẻ quốc tế/,
  3: /chuyển khoản/,
  4: /tại nhà xe/,
};

/** Fixture info-payments với đúng các type trong `types` được mở (is_locked === false), các type khác khoá. */
const unlocked = (types: number[]): PaymentMethod[] => FIXTURE_METHODS.map((m) => ({ ...m, is_locked: !types.includes(m.type) }));

interface Overrides {
  methods?: PaymentMethod[];
  selected?: number;
  onSelect?: (radio: number) => void;
  onBank?: (code: string, payNow: boolean) => void;
  paid?: boolean;
  cashOnly?: boolean;
  routeId?: number;
}

function renderList(overrides: Overrides = {}) {
  const onSelect = overrides.onSelect ?? vi.fn();
  const onBank = overrides.onBank ?? vi.fn();
  render(
    <MethodList
      methods={overrides.methods ?? FIXTURE_METHODS}
      selected={overrides.selected ?? 0}
      bank=""
      onSelect={onSelect}
      onBank={onBank}
      bookingCode={BOOKING_CODE}
      phone={PHONE}
      routeId={overrides.routeId}
      paid={overrides.paid ?? false}
      cashOnly={overrides.cashOnly ?? false}
    />,
  );
  return { onSelect, onBank };
}

/** Các radio đang hiện, theo thứ tự trong MethodList. */
const shownRadios = () => RADIO_VALUES.filter((v) => screen.queryByRole("radio", { name: RADIO_NAME[v] }) !== null);
const bankButtons = () => screen.queryAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));

afterEach(() => {
  cleanup();
});

describe("RADIO_GATE", () => {
  it("ánh xạ radio → type info-payments đúng như đặc tả web cũ", () => {
    expect(RADIO_GATE).toEqual({ 5: 5, 6: 6, 1: 1, 2: 1, 3: 2, 4: 3 });
  });
});

describe("MethodList: radio nào hiện theo gate", () => {
  // Chỉ một type được mở mỗi lần: radio nào có gate trùng type đó mới hiện.
  it.each([
    [5, [5]],
    [6, [6]],
    [1, [1, 2]],
    [2, [3]],
    [3, [4]],
  ])("chỉ type %i mở → hiện radio %j", (gate, expected) => {
    renderList({ methods: unlocked([gate]) });
    expect(shownRadios()).toEqual(expected);
  });

  it("is_locked không phải false tường minh (thiếu hoặc null) thì ẩn radio", () => {
    const methods: PaymentMethod[] = [
      { type: 5, name: "QR" },
      { type: 1, name: "ATM", is_locked: undefined },
      { type: 3, name: "Tiền mặt", is_locked: null as unknown as boolean },
    ];
    renderList({ methods });
    expect(shownRadios()).toEqual([]);
  });

  it("nhiều method cùng type: chỉ entry đầu tiên quyết định hiện/ẩn (không gộp theo is_locked)", () => {
    const methods: PaymentMethod[] = [
      { type: 1, name: "ATM khoá", is_locked: true },
      { type: 1, name: "ATM mở", is_locked: false },
    ];
    renderList({ methods });
    expect(shownRadios()).toEqual([]);
  });

  it("không có method nào thì không có radio", () => {
    renderList({ methods: [] });
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("cashOnly (show_price = 0) chỉ giữ tiền mặt dù các type khác đang mở", () => {
    renderList({ methods: unlocked([1, 2, 3, 5, 6]), cashOnly: true });
    expect(shownRadios()).toEqual([4]);
  });

  it("radio 6 lấy tiêu đề từ info-payments", () => {
    renderList({ methods: unlocked([6]) });
    const payos = FIXTURE_METHODS.find((m) => m.type === 6)!;
    expect(screen.getByRole("radio", { name: new RegExp(payos.name) })).toBeEnabled();
  });
});

describe("MethodList: khoá khi đã thanh toán", () => {
  it("paid: QR, PayOS, chuyển khoản, tiền mặt bị khoá; ATM và thẻ quốc tế vẫn chọn được", () => {
    renderList({ methods: unlocked([1, 2, 3, 5, 6]), paid: true });
    for (const v of [5, 6, 3, 4]) expect(screen.getByRole("radio", { name: RADIO_NAME[v] })).toBeDisabled();
    for (const v of [1, 2]) expect(screen.getByRole("radio", { name: RADIO_NAME[v] })).toBeEnabled();
  });

  it("chưa thanh toán: không radio nào bị khoá", () => {
    renderList({ methods: unlocked([1, 2, 3, 5, 6]), paid: false });
    for (const v of RADIO_VALUES) expect(screen.getByRole("radio", { name: RADIO_NAME[v] })).toBeEnabled();
  });
});

describe("MethodList: chọn radio và lưới ngân hàng", () => {
  it("bấm radio chưa chọn gọi onSelect(value)", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderList({ methods: unlocked([1]), selected: 0 });
    await user.click(screen.getByRole("radio", { name: RADIO_NAME[1] }));
    expect(onSelect).toHaveBeenLastCalledWith(1);
  });

  it("bấm lại radio đang chọn không bỏ chọn và không đóng lưới ngân hàng", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderList({ methods: unlocked([1]), selected: 1 });
    await user.click(screen.getByRole("radio", { name: RADIO_NAME[1] }));
    expect(onSelect).not.toHaveBeenCalledWith(0);
    expect(bankButtons()).toHaveLength(33);
  });

  it("bấm vào dòng chuyển khoản đang chọn không làm mất thông tin tài khoản", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderList({ methods: unlocked([2]), selected: 3 });
    await user.click(screen.getByRole("radio", { name: RADIO_NAME[3] }));
    expect(onSelect).not.toHaveBeenCalledWith(0);
    expect(screen.getByText("66868888999")).toBeInTheDocument();
  });

  it("ATM được chọn → 33 ngân hàng; bấm một ngân hàng gọi onBank(code, false)", async () => {
    const user = userEvent.setup();
    const { onBank } = renderList({ methods: unlocked([1]), selected: 1 });
    expect(bankButtons()).toHaveLength(33);
    await user.click(screen.getByRole("button", { name: "VIETCOMBANK" }));
    expect(onBank).toHaveBeenLastCalledWith("VIETCOMBANK", false);
  });

  it("thẻ quốc tế được chọn → đúng 4 thẻ VISA/MASTERCARD/AMEX/JCB", () => {
    renderList({ methods: unlocked([1]), selected: 2 });
    expect(bankButtons().map((b) => b.getAttribute("aria-label"))).toEqual(["VISA", "MASTERCARD", "AMEX", "JCB"]);
  });

  it("nhấp đúp ngân hàng gọi onBank(code, true) để thanh toán ngay", async () => {
    const user = userEvent.setup();
    const { onBank } = renderList({ methods: unlocked([1]), selected: 1 });
    await user.dblClick(screen.getByRole("button", { name: "ACB" }));
    expect(onBank).toHaveBeenLastCalledWith("ACB", true);
  });

  it("radio ATM/thẻ quốc tế chưa được chọn thì không hiện lưới ngân hàng", () => {
    renderList({ methods: unlocked([1]), selected: 3 });
    expect(bankButtons()).toHaveLength(0);
  });
});

describe("MethodList: thông tin chuyển khoản và tiền mặt", () => {
  it("chuyển khoản được chọn: lấy tài khoản từ info-payments; nội dung = mã đơn + SĐT", () => {
    renderList({ methods: unlocked([2]), selected: 3 });
    expect(screen.getByText("66868888999")).toBeInTheDocument();
    expect(screen.getByText("MB bank - Chi nhánh Vũng Tàu")).toBeInTheDocument();
    expect(screen.getByText(`${BOOKING_CODE} ${PHONE}`)).toBeInTheDocument();
  });

  it("tuyến 10043 dùng tài khoản MB cứng thay cho info-payments", () => {
    renderList({ methods: unlocked([2]), selected: 3, routeId: 10043 });
    expect(screen.getByText("1556355555")).toBeInTheDocument();
    expect(screen.queryByText("66868888999")).not.toBeInTheDocument();
  });

  it("tiền mặt được chọn thì hiện mã giữ chỗ", () => {
    renderList({ methods: unlocked([3]), selected: 4 });
    expect(screen.getByText(BOOKING_CODE)).toBeInTheDocument();
  });

  it("chưa chọn vẫn hiện thông tin chuyển khoản và mã giữ chỗ (như web cũ)", () => {
    renderList({ methods: unlocked([2, 3]), selected: 0 });
    expect(screen.getByText("66868888999")).toBeInTheDocument();
    expect(screen.getByText(`${BOOKING_CODE} ${PHONE}`)).toBeInTheDocument();
    expect(screen.getByText(BOOKING_CODE)).toBeInTheDocument();
  });

  it("chọn ATM thì vẫn hiện thông tin chuyển khoản và mã giữ chỗ của các dòng khác", () => {
    renderList({ methods: unlocked([1, 2, 3]), selected: 1 });
    expect(screen.getByText("66868888999")).toBeInTheDocument();
    expect(screen.getByText(BOOKING_CODE)).toBeInTheDocument();
  });

  it("tiền mặt không bị khoá khi chưa thanh toán và chọn được", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderList({ methods: unlocked([3]) });
    const cash = screen.getByRole("radio", { name: RADIO_NAME[4] });
    expect(cash).toBeEnabled();
    await user.click(cash);
    expect(onSelect).toHaveBeenCalledWith(4);
  });
});
