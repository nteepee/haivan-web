import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/msw-server";
import { Providers } from "@/components/providers";
import { customerSchema } from "@/schemas/account";
import { ForceProfileDialog } from "./force-profile-dialog";
import { ProfileDialog } from "./profile-dialog";

const ORIGIN = "http://localhost:3000";
const BASE = `${ORIGIN}/api/hv/gw`;

const rawCustomer = {
  id: 7,
  name: "Khach Test",
  phone: "0900000000",
  email: "a@b.vn",
  address: "1 Lê Lợi",
  date_of_birth: "1990-05-06",
  title: { key: "mr", text: "Ông" },
  province: { code: "79", name: "TP.HCM" },
  district: { code: "79760", name: "Quận 1" },
  occupation: { key: 3, text: "Nhân viên" },
  travel_purpose: { key: "work", text: "Công tác" },
  subscribe_loyalty: 1,
  data_source: 0,
};
const definition = {
  titles: [{ key: "mr", text: "Ông" }],
  jobs: [{ key: 3, text: "Nhân viên" }],
  travel_purposes: [{ key: "work", text: "Công tác" }],
  provinces: [{ id: 1, code: "79", name: "TP.HCM" }],
  districts: [{ id: 1, code: "79760", name: "Quận 1" }],
  rank_evaluators: [],
};

beforeEach(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => real(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  server.use(http.get(`${BASE}/customer/definition`, () => HttpResponse.json(definition)));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function submitProfile(subscribe: number) {
  const bodies: Array<{ method: string; body: Record<string, unknown> }> = [];
  const reply = async ({ request }: { request: Request }) => {
    bodies.push({ method: request.method, body: (await request.json()) as Record<string, unknown> });
    return HttpResponse.json({ status: "OK" });
  };
  server.use(http.put(`${BASE}/customer/customers/update-profile`, reply), http.post(`${BASE}/customer/customers`, reply), http.get(`${BASE}/customer/customers`, () => HttpResponse.json({ data: rawCustomer })));
  const customer = customerSchema.parse({ data: { ...rawCustomer, subscribe_loyalty: subscribe } }).data;
  render(
    <Providers locale="vi">
      <ProfileDialog open onOpenChange={() => undefined} customer={customer} title="Đổi thông tin cá nhân" />
    </Providers>,
  );
  return bodies;
}

describe("ProfileDialog", () => {
  it("thành viên thân thiết → PUT update-profile với giá trị form, tên + ngày sinh bị khoá", async () => {
    const bodies = submitProfile(1);
    const user = userEvent.setup();
    await screen.findByDisplayValue("Khach Test");
    expect(screen.getByDisplayValue("Khach Test")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].method).toBe("PUT");
    expect(bodies[0].body).toEqual({ title: "mr", name: "Khach Test", date_of_birth: "1990-05-06", address: "1 Lê Lợi", province_code: "79", district_code: "79760", email: "a@b.vn", occupation: 3, travel_purpose: "work" });
  });

  it("chưa là thành viên → POST customers (đăng ký), lỗi form chặn gửi", async () => {
    const bodies = submitProfile(0);
    const user = userEvent.setup();
    const name = await screen.findByDisplayValue("Khach Test");
    expect(name).toBeEnabled();
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByText("Vui lòng nhập họ tên")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
    await user.type(name, "Nguyen Van A");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].method).toBe("POST");
    expect(bodies[0].body.name).toBe("Nguyen Van A");
  });
});

describe("ForceProfileDialog", () => {
  const session = (loggedIn: boolean) => http.get(`${ORIGIN}/api/hv/auth/session`, () => HttpResponse.json({ loggedIn, user: null }));

  it("data_source===1 → modal không đóng được", async () => {
    server.use(session(true), http.get(`${BASE}/customer/customers`, () => HttpResponse.json({ data: { ...rawCustomer, data_source: 1, subscribe_loyalty: 0 } })));
    render(
      <Providers locale="vi">
        <ForceProfileDialog />
      </Providers>,
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cập nhật thông tin cá nhân" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await userEvent.setup().keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("data_source khác 1 hoặc chưa đăng nhập → không hiện", async () => {
    let customerCalls = 0;
    server.use(session(false), http.get(`${BASE}/customer/customers`, () => (customerCalls++, HttpResponse.json({ data: { ...rawCustomer, data_source: 1 } }))));
    render(
      <Providers locale="vi">
        <ForceProfileDialog />
      </Providers>,
    );
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(customerCalls).toBe(0);
  });
});
