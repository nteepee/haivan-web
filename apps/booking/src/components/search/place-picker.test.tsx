import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import placesFixture from "../../../test/fixtures/places.json";
import { Providers } from "@/components/providers";
import { PlacePicker } from "./place-picker";

vi.mock("@/hooks/use-trips", () => ({ usePlaces: () => ({ data: placesFixture }) }));

/** Các dòng gợi ý theo thứ tự hiển thị (dòng đầu: nhóm đầu tiên của fixture). */
const FIRST = placesFixture[0].places[0];
const LAST_GROUP = placesFixture[placesFixture.length - 1];
const LAST = LAST_GROUP.places[LAST_GROUP.places.length - 1];

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup() {
  const onChange = vi.fn();
  const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
  render(
    <Providers locale="vi">
      <form onSubmit={onSubmit}>
        <PlacePicker label="Điểm xuất phát" placeholder="Chọn điểm xuất phát" value={null} onChange={onChange} />
      </form>
    </Providers>,
  );
  return { onChange, onSubmit, user: userEvent.setup(), input: screen.getByRole("combobox", { name: "Điểm xuất phát" }) };
}

describe("PlacePicker: WAI-ARIA combobox", () => {
  it("ô nhập là combobox; danh sách là listbox có nhóm gắn nhãn và các option", async () => {
    const { user, input } = setup();
    expect(input).toHaveAttribute("aria-expanded", "false");
    await user.click(input);

    expect(input).toHaveAttribute("aria-expanded", "true");
    const list = await screen.findByRole("listbox", { name: "Điểm xuất phát" });
    expect(input).toHaveAttribute("aria-controls", list.id);
    const group = screen.getByRole("group", { name: placesFixture[0].name });
    expect(group).toContainElement(screen.getByRole("option", { name: FIRST.name }));
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("ArrowDown trỏ dòng đầu, ArrowUp quay vòng xuống dòng cuối; aria-selected và aria-activedescendant khớp nhau", async () => {
    const { user, input } = setup();
    await user.click(input);
    await screen.findByRole("listbox");

    await user.keyboard("{ArrowDown}");
    const first = screen.getByRole("option", { name: FIRST.name });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", first.id);

    await user.keyboard("{ArrowUp}");
    const last = screen.getByRole("option", { name: LAST.name });
    expect(last).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", last.id);
    expect(first).toHaveAttribute("aria-selected", "false");
  });

  it("Home và End nhảy tới dòng đầu/cuối khi đang trỏ một dòng", async () => {
    const { user, input } = setup();
    await user.click(input);
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{ArrowDown}{End}");
    expect(input).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: LAST.name }).id);
    await user.keyboard("{Home}");
    expect(input).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: FIRST.name }).id);
  });

  it("Enter chọn dòng đang trỏ, đóng danh sách, không gửi form", async () => {
    const { user, input, onChange, onSubmit } = setup();
    await user.click(input);
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith({ name: FIRST.name, lat: Number(FIRST.lat), lng: Number(FIRST.lng) });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue(FIRST.name);
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
  });

  it("Enter khi chưa trỏ dòng nào thì để form gửi như thường", async () => {
    const { user, input, onChange, onSubmit } = setup();
    await user.click(input);
    await screen.findByRole("listbox");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Escape đóng danh sách, giữ tiêu điểm ở ô nhập và bỏ dòng đang trỏ", async () => {
    const { user, input } = setup();
    await user.click(input);
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Escape}");

    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("ArrowDown mở lại danh sách đã đóng và trỏ dòng đầu; gõ lọc danh sách và đặt lại dòng đang trỏ", async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: FIRST.name }).id);

    await user.keyboard(FIRST.name.slice(0, 3));
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });
});
