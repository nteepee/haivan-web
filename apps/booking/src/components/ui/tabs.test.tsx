import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

afterEach(cleanup);

function Demo() {
  const [value, setValue] = useState("a");
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="Chuyến đi">
        <TabsTrigger value="a">Sắp tới</TabsTrigger>
        <TabsTrigger value="b">Hoàn thành</TabsTrigger>
        <TabsTrigger value="c">Chuyến huỷ</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Danh sách sắp tới</TabsContent>
      <TabsContent value="b">Danh sách hoàn thành</TabsContent>
      <TabsContent value="c">Danh sách huỷ</TabsContent>
    </Tabs>
  );
}

describe("Tabs (Radix)", () => {
  it("tablist có tên, tab đang chọn aria-selected, panel gắn nhãn bằng chính tab", () => {
    render(<Demo />);
    expect(screen.getByRole("tablist", { name: "Chuyến đi" })).toBeInTheDocument();
    const first = screen.getByRole("tab", { name: "Sắp tới" });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Sắp tới" })).toHaveTextContent("Danh sách sắp tới");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("mũi tên trái/phải và Home/End đổi tab, panel đổi theo", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Sắp tới" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Hoàn thành" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Danh sách hoàn thành");

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Chuyến huỷ" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Sắp tới" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Chuyến huỷ" })).toHaveAttribute("aria-selected", "true");
  });
});
