import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HotlineButton } from "./hotline-button";

afterEach(cleanup);

const rect = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

describe("HotlineButton", () => {
  it("nhường chỗ (data-dodge) khi ô nhập nằm dưới nút; không đổi khi chỉ có liên kết", async () => {
    render(
      <>
        <main>
          <input aria-label="Ngày đi" />
        </main>
        <HotlineButton locale="vi" hotline="1900 6763" />
      </>,
    );
    const fab = screen.getByRole("link", { name: /1900 6763/ });
    expect(fab).toHaveAttribute("href", "tel:19006763");
    fab.getBoundingClientRect = () => rect(300, 700, 52, 52);
    screen.getByLabelText("Ngày đi").getBoundingClientRect = () => rect(280, 690, 80, 48);
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(fab).toHaveAttribute("data-dodge", "true"));
    screen.getByLabelText("Ngày đi").getBoundingClientRect = () => rect(20, 100, 80, 48);
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(fab).not.toHaveAttribute("data-dodge"));
  });
});
