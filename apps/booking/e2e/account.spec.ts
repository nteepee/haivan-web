import { expect, test } from "./fixtures";
import { E2E_OTP, matching, only, TEST_PHONE } from "./mock-client";

const ORIGIN = "http://127.0.0.1:3100";
const ORDER = "B02E2EACCT0001";
const TICKET = "V02E2EACCT00001";

test.beforeEach(async ({ page }) => {
  // Đăng nhập qua BFF (UI đăng nhập đã được kiểm ở auth.spec); cookie phiên nằm trong context.
  const res = await page.request.post("/api/hv/auth/verify", {
    data: { phone: TEST_PHONE, otp: E2E_OTP },
    headers: { Origin: ORIGIN, "X-HV-Req": "1", "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(200);
});

test("Chuyến đi của tôi: danh sách, mở đơn, huỷ vé gửi đúng body cancel-seat", async ({ page, mock }) => {
  await page.goto("/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh");

  // Danh sách "sắp tới": query booking-status[0]=1 như web cũ; đơn seed hiện ra.
  const row = page.locator("section", { hasText: ORDER });
  await expect(row).toBeVisible();
  const list = matching(await mock.requests(), "GET", "/api/bookings").find((r) => r.rawQuery === "booking-status%5B0%5D=1");
  expect(list, "GET bookings?booking-status[0]=1").toBeTruthy();
  expect(list!.headers.authorization).toMatch(/^Bearer e2e-token-\d+$/);
  expect(only(await mock.requests(), "GET", "/api/list-reason").headers.domain).toBe("haivan.com");

  // Mở đơn → chi tiết kèm merchant_code, thẻ vé + nút Huỷ vé.
  await row.getByRole("button", { name: new RegExp(ORDER) }).click();
  await expect(row.getByText(TICKET)).toBeVisible();
  expect(only(await mock.requests(), "GET", `/api/bookings/${ORDER}`).rawQuery).toBe("merchant_code=02");

  // Huỷ vé: chọn lý do, đồng ý → POST cancel-seat.
  await row.getByRole("button", { name: "Huỷ vé" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Tôi muốn thay đổi lộ trình" }).click();
  await dialog.getByRole("button", { name: "Đồng ý" }).click();

  await expect.poll(async () => matching(await mock.requests(), "POST", "/api/cancel-seat").length).toBe(1);
  const cancel = only(await mock.requests(), "POST", "/api/cancel-seat");
  expect(Object.keys(cancel.body as object)).toEqual(["order_code", "seat_code", "merchant_code", "reason_cancel_id", "reason_cancel_note"]);
  expect(cancel.body).toEqual({ order_code: ORDER, seat_code: TICKET, merchant_code: "02", reason_cancel_id: 5, reason_cancel_note: "" });
  expect(cancel.headers.authorization).toMatch(/^Bearer e2e-token-\d+$/);

  // Sau khi huỷ: toast, đơn rời tab "sắp tới" và sang tab "Chuyến huỷ".
  await expect(page.getByText("Huỷ thành công")).toBeVisible();
  await expect(page.locator("section", { hasText: ORDER })).toHaveCount(0);
  await expect(page.getByText("Bạn chưa có chuyến đi nào!")).toBeVisible();
  await page.getByRole("tab", { name: "Chuyến huỷ" }).click();
  await expect(page.locator("section", { hasText: ORDER })).toBeVisible();
  expect(matching(await mock.requests(), "GET", "/api/bookings").some((r) => r.rawQuery === "booking-status%5B0%5D=3")).toBe(true);
});
