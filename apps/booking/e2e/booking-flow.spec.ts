import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";
import { E2E_CAPTCHA_TOKEN, E2E_OTP, FAKE_PAYMENT_HOST, matching, only, TEST_PHONE } from "./mock-client";

const fixture = <T>(name: string): T => JSON.parse(readFileSync(`${__dirname}/../test/fixtures/${name}.json`, "utf8")) as T;
type Place = { name: string; lat: string; lng: string };

const ORIGIN = "http://127.0.0.1:3100";
const FROM = "Chợ Bến Thành";
const TO = "Vũng Tàu";
const places = fixture<Array<{ places: Place[] }>>("places").flatMap((g) => g.places);
const from = places.find((p) => p.name === FROM)!;
const to = places.find((p) => p.name === TO)!;
// Chuyến đầu tiên trong test/fixtures/trips.json và ghế "11" trong test/fixtures/seats.json.
const trip = fixture<{ data: Array<{ id: number; from: { place_id: number }; to: { place_id: number }; merchant: { code: string } }> }>("trips").data[0];
const seat = fixture<{ data: Array<Array<Array<{ id: number; name: string } | null>>> }>("seats").data.flat(2).find((s) => s?.name === "11")!;

const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

test("tìm chuyến → ghế → đăng nhập OTP → giữ chỗ → xác nhận → thanh toán (VNPay, không theo link)", async ({ page, mock, egress }) => {
  // --- Trang tìm chuyến; header/footer lấy từ layout "WordPress" của mock ---
  await page.goto("/xe-khach/tim-chuyen");
  // Hotline từ layout mock xuất hiện ở footer (mast và dòng pháp lý): chỉ cần thấy ít nhất một liên kết.
  await expect(page.getByRole("link", { name: "1900 E2E0", exact: true }).first()).toBeVisible();

  // --- Form tìm: chọn điểm từ api/places ---
  const combos = page.getByRole("combobox");
  await combos.nth(0).click();
  await page.getByRole("option", { name: FROM, exact: true }).click();
  await combos.nth(1).click();
  await page.getByRole("option", { name: TO, exact: true }).click();
  await page.getByRole("button", { name: "Tìm vé" }).click();

  await expect(page).toHaveURL(/\/xe-khach\/tim-chuyen\?from=.*&type=2$/);
  const search = new URL(page.url()).searchParams;
  expect(search.get("from")).toBe(`${FROM},${from.lat},${from.lng}`);
  expect(search.get("to")).toBe(`${TO},${to.lat},${to.lng}`);
  expect(search.get("numberGuest")).toBe("1");

  // --- Danh sách chuyến: query khớp web cũ (sort cứng time/asc, type=2 của tab liên tỉnh) ---
  const cards = page.locator("article");
  await expect(cards.first()).toBeVisible();
  const trips = only(await mock.requests(), "GET", "/api/el/trips");
  expect(trips.query).toEqual({
    from_location: `${from.lat},${from.lng}`,
    to_location: `${to.lat},${to.lng}`,
    numberGuest: "1",
    date: vnToday(),
    sort_by: "time",
    sort_mode: "asc",
    type: "2",
  });
  expect(trips.headers).toMatchObject({ domain: "haivan.com" });
  expect(trips.headers.authorization).toBeUndefined();

  // --- Mở thẻ chuyến đầu: sơ đồ ghế + lộ trình song song ---
  await cards.first().getByRole("button").first().click();
  await expect(page.getByRole("button", { name: /^Ghế 11(,|$)/ })).toBeVisible();
  const afterOpen = await mock.requests();
  expect(only(afterOpen, "GET", `/api/trips/${trip.id}`).rawQuery).toBe(
    `departure_id=${trip.from.place_id}&destination_id=${trip.to.place_id}&merchant_code=${trip.merchant.code}&numberGuest=1`,
  );
  expect(only(afterOpen, "GET", "/api/el/trip_detail").rawQuery).toBe(`trip_id=${trip.id}&merchant_code=${trip.merchant.code}`);

  // --- Bản đồ lộ trình (bản production): màu lấy từ token qua pathOptions, không nhờ class/CSS lên SVG của Leaflet ---
  const token = (name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
  // Leaflet bỏ className khỏi SVG path ở bản production nên chọn theo thứ tự vẽ: đường, điểm đi, điểm đến.
  const paths = page.locator(".leaflet-overlay-pane path");
  await expect(paths).toHaveCount(3);
  await expect(paths.nth(0)).toHaveAttribute("stroke", await token("--color-muted"));
  await expect(paths.nth(1)).toHaveAttribute("fill", await token("--color-accent"));
  await expect(paths.nth(2)).toHaveAttribute("fill", await token("--color-ink"));

  // --- Chọn ghế; chưa đăng nhập → "Tiếp tục" mở hộp đăng nhập, chưa giữ chỗ ---
  await page.getByRole("button", { name: /^Ghế 11(,|$)/ }).click();
  await expect(page.getByRole("button", { name: /^Ghế 11(,|$)/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(matching(await mock.requests(), "POST", "/api/hold-booking")).toHaveLength(0);

  // --- Đăng nhập OTP: captcha (stub), get-otp từ trình duyệt, verify-otp qua BFF ---
  await dialog.getByRole("textbox").fill(TEST_PHONE);
  await dialog.getByTestId("e2e-recaptcha").click();
  await dialog.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await dialog.getByLabel("OTP").fill(E2E_OTP);

  // --- Đăng nhập xong tự giữ chỗ đúng 1 lần rồi sang trang xác nhận ---
  await expect(page).toHaveURL(/\/xe-khach\/xac-nhan$/);
  const afterLogin = await mock.requests();
  expect(egress.recaptchaStubbed).toBe(1);

  const otp = only(afterLogin, "GET", "/api/get-otp");
  expect(otp.rawQuery).toBe(`phone=${TEST_PHONE}&captcha=${E2E_CAPTCHA_TOKEN}&channel=1`);
  expect(otp.headers.authorization).toBeUndefined();
  const verify = only(afterLogin, "POST", "/api/verify-otp");
  expect(verify.rawBody).toBe(JSON.stringify({ phone: TEST_PHONE, otp: E2E_OTP, channel: 1 }));
  expect(verify.headers).toMatchObject({ domain: "haivan.com", contentType: "application/json" });

  const hold = only(afterLogin, "POST", "/api/hold-booking");
  const holdBody = hold.body as Record<string, unknown>;
  // Ghế gửi nguyên object từ api/trips + is_select:true; không có aff/utm_source/aff_sid khi không có nguồn affiliate.
  expect(Object.keys(holdBody)).toEqual(["trip_id", "seats", "merchant_code", "channel"]);
  expect(holdBody).toMatchObject({ trip_id: trip.id, merchant_code: trip.merchant.code, channel: 1 });
  expect(holdBody.seats).toEqual([{ ...seat, is_select: true }]);
  expect(hold.headers.authorization).toMatch(/^Bearer e2e-token-\d+$/);
  expect(hold.headers.domain).toBe("haivan.com");

  // --- Trang xác nhận: dữ liệu vào trang (merchant 02 có dịch vụ đón/trả tận nhà) ---
  const holdResponse = { order_code: /^B02E2E\d{6}$/ };
  const orderCode = (await page.evaluate(() => JSON.parse(sessionStorage.getItem("hv_booking_draft") ?? "{}").state?.draft?.order_code)) as string;
  expect(orderCode).toMatch(holdResponse.order_code);
  await expect(page.getByText(`Ghế 11`).first()).toBeVisible();
  const confirmReqs = await mock.requests();
  expect(only(confirmReqs, "GET", "/api/v4/get-bonus-service").rawQuery).toBe("merchant_code=02");
  expect(only(confirmReqs, "POST", "/api/v4/get-price-transit").body).toMatchObject({ order_code: orderCode, merchant_code: "02", trip_id: trip.id });
  expect(only(confirmReqs, "GET", "/api/promotion/get-promotions").query).toMatchObject({ merchant_code: "02", route: "VTA-TSN", product: "LUXURY", channel: "1", channel_code: "WEBHAIVAN" });

  // --- Đặt vé: body api/bookings đúng thứ tự khoá và nội dung như live ---
  await page.getByRole("button", { name: /^Tiếp tục/ }).click();
  await expect(page).toHaveURL(/\/xe-khach\/thanh-toan\?/);
  const afterBooking = await mock.requests();
  const booking = only(afterBooking, "POST", "/api/bookings");
  const bookingBody = booking.body as Record<string, unknown>;
  expect(Object.keys(bookingBody)).toEqual(["pick_up", "drop_off", "trip", "transit", "seats", "order_code", "merchant_code", "note", "is_combo", "if_customer"]);
  expect(bookingBody).toEqual({
    pick_up: { address: FROM, coordinates: { lat: Number(from.lat), lng: Number(from.lng) } },
    drop_off: { address: TO, coordinates: { lat: Number(to.lat), lng: Number(to.lng) } },
    trip: { trip_id: trip.id, departure_id: trip.from.place_id, destination_id: trip.to.place_id },
    transit: { departure: true, destination: false },
    seats: [{ id: seat.id, is_reward: false }],
    order_code: orderCode,
    merchant_code: "02",
    note: "",
    is_combo: 0,
    if_customer: { email: null, phone: TEST_PHONE, name: "Khach Test" },
  });
  expect(Object.keys(bookingBody.if_customer as object)).toEqual(["email", "phone", "name"]);
  expect(booking.headers.authorization).toMatch(/^Bearer e2e-token-\d+$/);

  // hold-transit gửi ngay sau đặt vé thành công (services rỗng khi không chọn dịch vụ).
  await expect.poll(async () => matching(await mock.requests(), "POST", "/api/v4/hold-transit").length).toBe(1);
  const holdTransit = only(await mock.requests(), "POST", "/api/v4/hold-transit");
  expect(holdTransit.body).toMatchObject({ order_code: orderCode, merchant_code: "02", pick_up: FROM, drop_off: TO, services: [] });

  // --- Trang thanh toán ---
  const payUrl = new URL(page.url());
  expect(payUrl.pathname).toBe("/xe-khach/thanh-toan");
  expect(Object.fromEntries(payUrl.searchParams)).toEqual({ booking_code: orderCode, merchant_code: "02", trip_id: String(trip.id) });
  await expect(page.getByRole("heading", { name: "Lựa chọn thanh toán" })).toBeVisible();
  const payReqs = await mock.requests();
  expect(only(payReqs, "GET", "/api/info-payments").rawQuery).toBe(`merchant_code=02&trip_id=${trip.id}&booking=${orderCode}`);
  expect(only(payReqs, "GET", "/api/info-payment-block").rawQuery).toBe("merchant_code=02");
  expect(matching(payReqs, "GET", `/api/bookings/${orderCode}`)[0].rawQuery).toBe("merchant_code=02");

  // --- VNPay: backend nhận return_url ở cấp ngoài cùng order_code/bank_code/...; URL cổng trả về là host giả, không được theo ---
  await page.getByRole("radio", { name: /VNPAY-QR/ }).first().check();
  await page.getByRole("button", { name: /^Thanh toán/ }).click();
  await expect.poll(() => egress.paymentNavigations.length).toBe(1);

  const vnpay = only(await mock.requests(), "GET", "/api/payment/vnpay");
  const returnUrl = `${ORIGIN}/xe-khach/thanh-toan?booking_code=${orderCode}`;
  // Ngữ nghĩa (đã giải mã) đúng như web cũ. Dạng byte trên dây được kiểm riêng ở test cuối file.
  expect(Object.keys(vnpay.query)).toEqual(["return_url", "order_code", "bank_code", "merchant_code", "trip_id"]);
  expect(vnpay.query).toEqual({ return_url: returnUrl, order_code: orderCode, bank_code: "VNPAYQR", merchant_code: "02", trip_id: String(trip.id) });

  const gateway = new URL(egress.paymentNavigations[0]);
  expect(gateway.protocol).toBe("https:");
  expect(gateway.hostname).toBe(FAKE_PAYMENT_HOST);
  expect(gateway.searchParams.get("order")).toBe(orderCode);
  expect(gateway.searchParams.get("return")).toBe(returnUrl);
  // Điều hướng bị huỷ trước khi rời máy (trang lỗi nội bộ của Chromium), không có phản hồi nào từ host giả.
  expect(page.url()).not.toContain(FAKE_PAYMENT_HOST);
  expect(matching(await mock.requests(), "POST", "/api/update-booking")).toHaveLength(0);
});

test("VNPay: return_url tới backend giữ nguyên byte như web cũ (không mã hoá)", async ({ page, mock, egress }) => {
  // Đơn có sẵn trong mock (chưa thanh toán); đăng nhập qua BFF rồi vào thẳng trang thanh toán như khi cổng quay về.
  const res = await page.request.post("/api/hv/auth/verify", {
    data: { phone: TEST_PHONE, otp: E2E_OTP },
    headers: { Origin: ORIGIN, "X-HV-Req": "1", "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(200);
  const code = "B02E2EACCT0001";
  await page.goto(`/xe-khach/thanh-toan?booking_code=${code}&merchant_code=02&trip_id=${trip.id}`);
  await page.getByRole("radio", { name: /VNPAY-QR/ }).first().check();
  await page.getByRole("button", { name: /^Thanh toán/ }).click();
  await expect.poll(() => egress.paymentNavigations.length).toBe(1);
  const vnpay = only(await mock.requests(), "GET", "/api/payment/vnpay");
  expect(vnpay.rawQuery).toBe(`return_url=${ORIGIN}/xe-khach/thanh-toan?booking_code=${code}&order_code=${code}&bank_code=VNPAYQR&merchant_code=02&trip_id=${trip.id}`);
});
