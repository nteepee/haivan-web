import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequireLogin } from "./require-login";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const tree = (client: QueryClient) => (
  <QueryClientProvider client={client}>
    <RequireLogin>
      <p>noi dung rieng tu</p>
    </RequireLogin>
  </QueryClientProvider>
);

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
let root: Root | undefined;
let host: HTMLElement;

beforeEach(() => {
  replace.mockClear();
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host.remove();
  vi.restoreAllMocks();
});

/** Server chưa có phiên (khung chờ); client hydrate khi phiên đã nằm trong cache (header tải xong trước vùng nội dung). */
async function hydrateWithSession(loggedIn: boolean) {
  host.innerHTML = renderToString(tree(newClient()));
  const serverHtml = host.innerHTML;
  const client = newClient();
  client.setQueryData(["session"], { loggedIn, user: null });
  const recoverable: unknown[] = [];
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  await act(async () => {
    root = hydrateRoot(host, tree(client), { onRecoverableError: (e) => recoverable.push(e) });
  });
  return { serverHtml, recoverable, consoleError };
}

describe("RequireLogin hydrate", () => {
  it("chưa đăng nhập, phiên đã cache: không lệch hydrate, chuyển hướng sau khi hydrate xong", async () => {
    const { serverHtml, recoverable, consoleError } = await hydrateWithSession(false);
    expect(serverHtml).not.toContain("noi dung rieng tu");
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0][0]).toMatch(/^\/tai-khoan\/dang-nhap\?next=/);
    expect(host.textContent).toContain("Đăng nhập");
  });

  it("đã đăng nhập, phiên đã cache: hiện nội dung, không chuyển hướng, không lệch hydrate", async () => {
    const { recoverable, consoleError } = await hydrateWithSession(true);
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(host.textContent).toContain("noi dung rieng tu");
  });
});
