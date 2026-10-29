import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { E2E_OTP, matching, TEST_PHONE } from "./mock-client";

const ORIGIN = "http://127.0.0.1:3100";
const sameOrigin = { Origin: ORIGIN, "X-HV-Req": "1", "Content-Type": "application/json" };

async function startLogin(page: Page, phone = TEST_PHONE) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill(phone);
  await dialog.getByTestId("e2e-recaptcha").click();
  await dialog.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  return dialog;
}

test("đăng nhập từ header: OTP sai ở lại, OTP đúng tạo phiên httpOnly, token không tới JS, đăng xuất", async ({ page, mock }) => {
  await page.goto("/xe-khach/tim-chuyen");
  await page.getByRole("link", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap\?next=%2Fxe-khach%2Ftim-chuyen$/);

  const dialog = await startLogin(page);
  await dialog.getByLabel("OTP").fill("000000");
  await expect(page.getByText("Mã OTP bạn nhập vào chưa đúng")).toBeVisible();
  await expect(dialog.getByLabel("OTP")).toHaveValue("");
  expect(await (await page.request.get("/api/hv/auth/session")).json()).toEqual({ loggedIn: false, user: null });

  await dialog.getByLabel("OTP").fill(E2E_OTP);
  // Đăng nhập xong quay về trang `next`.
  await expect(page).toHaveURL(/\/xe-khach\/tim-chuyen$/);
  await expect(page.getByRole("button", { name: "Tài khoản" })).toBeVisible();

  const reqs = await mock.requests();
  expect(matching(reqs, "POST", "/api/verify-otp").map((r) => (r.body as { otp: string }).otp)).toEqual(["000000", E2E_OTP]);
  // BFF lấy tên hiển thị bằng token vừa nhận; header cố định của web cũ.
  const customer = matching(reqs, "GET", "/api/customer/customers")[0];
  expect(customer.headers.authorization).toMatch(/^Bearer e2e-token-\d+$/);
  expect(customer.headers.domain).toBe("haivan.com");

  // Phiên: cookie httpOnly, JS không đọc được, phản hồi session không có token.
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === "hv_session");
  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("hv_session");
  const body = await (await page.request.get("/api/hv/auth/session")).text();
  expect(JSON.parse(body)).toEqual({ loggedIn: true, user: { name: "Khach Test", phone: TEST_PHONE } });
  expect(body).not.toContain("e2e-token");
  expect(JSON.stringify(await page.evaluate(() => ({ ...localStorage, ...sessionStorage })))).not.toContain("e2e-token");

  // Đăng xuất: không gọi apigw (như web cũ), xoá cookie phiên.
  const before = (await mock.requests()).length;
  await page.getByRole("button", { name: "Tài khoản" }).click();
  await page.getByRole("menuitem", { name: "Đăng xuất" }).click();
  await expect.poll(async () => (await page.context().cookies()).some((c) => c.name === "hv_session")).toBe(false);
  expect((await mock.requests()).slice(before).filter((r) => r.path !== "/api/places")).toEqual([]);
});

test("kiểm tra đầu vào: chưa tick captcha hoặc SĐT sai thì không gọi get-otp", async ({ page, mock }) => {
  await page.goto("/tai-khoan/dang-nhap");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // SĐT hợp lệ nhưng chưa tick captcha.
  await dialog.getByRole("textbox").fill(TEST_PHONE);
  await dialog.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.getByText("Bạn chưa xác thực Captcha")).toBeVisible();

  // Đã tick captcha nhưng SĐT sai.
  await dialog.getByTestId("e2e-recaptcha").click();
  await dialog.getByRole("textbox").fill("12345");
  await dialog.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.getByText("Số điện thoại không hợp lệ")).toBeVisible();

  expect(matching(await mock.requests(), "GET", "/api/get-otp")).toHaveLength(0);
});

test("trang tài khoản chưa đăng nhập chuyển tới đăng nhập kèm next", async ({ page }) => {
  await page.goto("/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh");
  await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap\?next=%2Ftai-khoan%2Fchuyen-di-cua-toi%2Fxe-lien-tinh$/);
});

test("ranh giới BFF: chưa đăng nhập 401, thiếu X-HV-Req 403, ngoài allowlist 404, CSRF POST bị chặn", async ({ page, mock }) => {
  await page.goto("/tai-khoan/dang-nhap");
  const get = (path: string, headers: Record<string, string> = { "X-HV-Req": "1" }) => page.request.get(path, { headers });
  expect((await get("/api/hv/gw/list-reason")).status()).toBe(401);
  expect((await get("/api/hv/gw/list-reason", {})).status()).toBe(403);
  expect((await get("/api/hv/gw/admin/users")).status()).toBe(404);
  const crossOrigin = await page.request.post("/api/hv/auth/verify", { data: { phone: TEST_PHONE, otp: E2E_OTP }, headers: { ...sameOrigin, Origin: "https://evil.example" } });
  expect(crossOrigin.status()).toBe(403);
  // Không request nào chạm backend (mock) cho các lần bị chặn.
  expect((await mock.requests()).filter((r) => r.path.startsWith("/api/") && r.path !== "/api/places")).toEqual([]);
});
