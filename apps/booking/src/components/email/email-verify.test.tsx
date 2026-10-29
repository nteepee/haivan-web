import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/msw-server";
import { EmailVerify } from "./email-verify";

const BASE = "https://apigw.haivan.com/api";
let search = "";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search) }));

const view = () => render(<QueryClientProvider client={new QueryClient()}><EmailVerify /></QueryClientProvider>);

describe("EmailVerify", () => {
  beforeEach(() => { search = "expires=1700000000&hash=ab12&id=42&signature=cd34"; });

  it("ghép query thô như web cũ, 200 + OK → thành công", async () => {
    let url = "";
    server.use(http.get(`${BASE}/customer/email/verify`, ({ request }) => { url = request.url; return HttpResponse.json({ status: "OK" }); }));
    view();
    expect(await screen.findByText("Xác minh email thành công!")).toBeTruthy();
    expect(new URL(url).search).toBe("?expires=1700000000&hash=ab12&id=42&signature=cd34");
  });

  it("200 khác OK → đã xác minh; lỗi → quá hạn", async () => {
    server.use(http.get(`${BASE}/customer/email/verify`, () => HttpResponse.json({ status: "VERIFIED" })));
    const { unmount } = view();
    expect(await screen.findByText("Email đã được xác minh!")).toBeTruthy();
    unmount();
    server.use(http.get(`${BASE}/customer/email/verify`, () => HttpResponse.json({ message: "expired" }, { status: 403 })));
    view();
    expect(await screen.findByText("Xác minh đã quá hạn!")).toBeTruthy();
  });
});
