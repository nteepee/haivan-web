import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickyBar } from "./sticky-bar";

const observers: { callback: () => void; disconnected: boolean }[] = [];
let height = 96;
let position = "fixed";

beforeEach(() => {
  height = 96;
  position = "fixed";
  observers.length = 0;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      entry: { callback: () => void; disconnected: boolean } = { callback: () => undefined, disconnected: false };
      constructor(callback: () => void) {
        this.entry.callback = callback;
        observers.push(this.entry);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        this.entry.disconnected = true;
      }
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ height }) as DOMRect);
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
    const style = real(el, pseudo);
    return new Proxy(style, { get: (target, prop) => (prop === "position" ? position : Reflect.get(target, prop)) });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty("--bar-h");
});

const barH = () => document.documentElement.style.getPropertyValue("--bar-h");

describe("StickyBar", () => {
  it("đo chiều cao thanh cố định và ghi --bar-h trên <html>; đổi cỡ thì cập nhật theo", () => {
    render(<StickyBar>nội dung</StickyBar>);
    expect(barH()).toBe("96px");
    height = 140;
    observers[0].callback();
    expect(barH()).toBe("140px");
  });

  it("khi thanh không còn cố định (từ 60rem) thì --bar-h về 0", () => {
    render(<StickyBar>nội dung</StickyBar>);
    position = "static";
    observers[0].callback();
    expect(barH()).toBe("0px");
  });

  it("gỡ thanh khỏi cây thì xoá --bar-h và ngắt ResizeObserver", () => {
    const { unmount } = render(<StickyBar>nội dung</StickyBar>);
    expect(barH()).toBe("96px");
    unmount();
    expect(barH()).toBe("");
    expect(observers[0].disconnected).toBe(true);
  });
});
