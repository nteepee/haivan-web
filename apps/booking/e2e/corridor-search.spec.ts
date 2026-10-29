import { expect, test } from "./fixtures";
import { matching } from "./mock-client";

const vnDay = (offset: number) => new Date(Date.now() + 7 * 3600_000 + offset * 86400_000).toISOString().slice(0, 10);
const dmy = (iso: string) => iso.split("-").reverse().join("-");

test("ô tìm vé theo tuyến: chọn tuyến, trạm, ngày về → link tim-chuyen giữ nguyên query apigw + query riêng, trang kết quả chọn lại form", async ({ page, mock }) => {
  await page.goto("/xe-khach");
  const group = page.getByRole("group", { name: "Tuyến chính" });
  // Tên truy cập = nhãn đầy đủ (bên trong có hai dòng cho điện thoại, hai bản hiển thị theo bề rộng)
  await expect(group.getByRole("button")).toHaveCount(4);
  expect(await group.getByRole("button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))).toEqual(["Sài Gòn – Vũng Tàu", "Hà Nội – Điện Biên", "Hà Nội – Mộc Châu", "Hà Nội – Sơn La"]);

  await group.getByRole("button", { name: "Hà Nội – Mộc Châu" }).click();
  // Nhãn ưu đãi từ cấu hình WP (mock) chỉ có cho Hà Nội – Mộc Châu chiều đi (chiều về được giảm).
  await expect(page.getByText("Giảm 20k/ghế chiều về")).toBeVisible();
  await page.getByRole("combobox", { name: "Điểm đến" }).selectOption("ben-xe-mc");
  await page.getByRole("button", { name: "Thêm ngày về" }).click();
  const back = page.getByLabel("Ngày về", { exact: true });
  await expect(back).toHaveValue(vnDay(2));
  await expect(back).toHaveAttribute("min", vnDay(0));
  await page.getByRole("combobox", { name: "Số vé" }).selectOption("2");
  await page.getByRole("button", { name: "Tìm vé", exact: true }).click();

  await expect(page).toHaveURL(/\/xe-khach\/tim-chuyen\?/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("from")).toBe("Bến xe Mỹ Đình,21.0284297,105.7782687");
  expect(params.get("to")).toBe("Mộc Châu,20.8461723,104.6415738");
  expect(params.get("date")).toBe(dmy(vnDay(0)));
  expect(params.get("numberGuest")).toBe("2");
  expect(params.get("type")).toBe("2");
  expect(Object.fromEntries([...params].filter(([k]) => ["tuyen", "chieu", "diem_di", "diem_den", "ngay_ve"].includes(k)))).toEqual({
    tuyen: "hn-moc",
    chieu: "ab",
    diem_di: "my-dinh",
    diem_den: "ben-xe-mc",
    ngay_ve: dmy(vnDay(2)),
  });

  // Request apigw không đổi: không có query riêng nào lọt vào el/trips.
  await expect(page.locator("article").first()).toBeVisible();
  // (Hàng "Chuyến hôm nay" của trang chủ cũng gọi el/trips, nên lọc theo toạ độ Mộc Châu.)
  const mocChau = matching(await mock.requests(), "GET", "/api/el/trips").filter((r) => r.query.to_location === "20.8461723,104.6415738");
  expect(mocChau.length).toBeGreaterThan(0);
  expect(mocChau.at(-1)!.rawQuery).toBe(
    `from_location=21.0284297%2C105.7782687&to_location=20.8461723%2C104.6415738&numberGuest=2&date=${vnDay(0)}&sort_by=time&sort_mode=asc&type=2`,
  );

  // "Sửa" mở lại form theo tuyến đã chọn sẵn.
  await page.getByRole("button", { name: "Sửa" }).click();
  await expect(page.getByRole("button", { name: "Hà Nội – Mộc Châu" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Điểm đến" })).toHaveValue("ben-xe-mc");
  // (Trang chủ trước đó còn nằm ẩn trong DOM khi điều hướng mềm: chỉ xét ô đang hiện.)
  await expect(page.getByLabel("Ngày về", { exact: true }).locator("visible=true")).toHaveValue(vnDay(2));
});

test("Chuyến hôm nay: chip khung giờ có số chuyến; 'Cả ngày' mở kết quả hôm nay", async ({ page }) => {
  await page.goto("/xe-khach");
  const chips = page.getByRole("group", { name: /^Chuyến hôm nay Sài Gòn đi Vũng Tàu$/ });
  await expect(chips).toBeVisible();
  // Mock trả các chuyến cố định: ít nhất một khung có chuyến và bấm được.
  await expect(chips.getByRole("button", { name: /, \d+ chuyến$/ }).first()).toBeEnabled();
  await chips.getByRole("button", { name: "Cả ngày" }).click();
  await expect(page).toHaveURL(/\/xe-khach\/tim-chuyen\?.*tuyen=sg-vt/);
  expect(new URL(page.url()).searchParams.get("gio")).toBeNull();
});

test("trang tuyến của một tuyến chính chọn sẵn tuyến; trang tuyến khác giữ ô chọn điểm tự do", async ({ page }) => {
  await page.goto("/xe-khach/my-dinh/dien-bien");
  await expect(page.getByRole("button", { name: "Hà Nội – Điện Biên" })).toHaveAttribute("aria-pressed", "true");
  // Xe giường nằm: ngày về tối thiểu = ngày đi + 1.
  await page.getByRole("button", { name: "Thêm ngày về" }).click();
  await expect(page.getByLabel("Ngày về", { exact: true })).toHaveAttribute("min", vnDay(1));

  await page.goto("/xe-khach/quan-1/vung-tau");
  await expect(page.getByRole("button", { name: "Sài Gòn – Vũng Tàu" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Tìm theo điểm đi, điểm đến" }).click();
  await expect(page.getByText("Điểm xuất phát")).toBeVisible();
});

test("trang tuyến chính mà CMS không biết (my-dinh/moc-chau): dựng từ bài WP, có H1, index, nút chiều ngược, bảng giá, chuyến theo toạ độ đầu tuyến", async ({ page, mock }) => {
  const res = await page.goto("/xe-khach/my-dinh/moc-chau");
  // H1 nằm trong HTML tĩnh (không chờ JS)
  const html = await res!.text();
  expect(html).toContain("<h1");
  // Khối nội dung chính không bị bỏ cho client render (chỉ khối LanguageSwitch ở header, B:0, được phép)
  expect(html).not.toMatch(/\$RX\("B:(?!0")\d+"/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đặt vé xe Hà Nội đi Mộc Châu");
  await expect(page).toHaveTitle("Xe đi Mộc Châu từ Hà Nội (Mỹ Đình) E2E");
  expect(await page.locator('meta[name="robots"]').count()).toBe(0); // index
  await expect(page.getByRole("button", { name: "Hà Nội – Mộc Châu" })).toHaveAttribute("aria-pressed", "true");

  // Nút chiều ngược dưới H1 → trang chiều về, cũng index và đúng chiều
  await page.getByRole("link", { name: /Xem chiều ngược lại/ }).click();
  await expect(page).toHaveURL(/\/xe-khach\/moc-chau\/my-dinh$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đặt vé xe Mộc Châu về Hà Nội");
  await expect(page.getByRole("combobox", { name: "Điểm đi" })).toHaveValue("nong-truong");

  // Chuyến lấy từ apigw theo toạ độ đầu tuyến của chiều về (Mộc Châu → Mỹ Đình), cùng query như mọi trang tuyến
  await expect(page.locator("article").first()).toBeVisible();
  const trips = matching(await mock.requests(), "GET", "/api/el/trips").filter((r) => r.query.from_location === "20.8461723,104.6415738" && r.query.to_location === "21.0284297,105.7782687");
  expect(trips.length).toBeGreaterThan(0);
  expect(trips[0].rawQuery).toBe(`from_location=20.8461723%2C104.6415738&to_location=21.0284297%2C105.7782687&numberGuest=1&date=${vnDay(0)}&sort_by=time&sort_mode=asc`);
});

test("slug lạ vẫn 200 + noindex; footer không còn <h2> cột; chỉ một <h1>", async ({ page }) => {
  const res = await page.goto("/xe-khach/khong-co/tuyen-nay");
  expect(res!.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/xe-khach/my-dinh/dien-bien");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("footer h2")).toHaveCount(0);
  await expect(page.locator("section.hv-app-band h2")).toHaveCount(0);
  // Chiều ngược của tuyến này chưa có trong cấu hình → dùng reverse_route của bài WP (dưới H1)
  await expect(page.locator("#route-h1 + p").getByRole("link", { name: "Chiều ngược lại: Điện Biên đi Hà Nội" })).toBeVisible();
});

test("mã khứ hồi thật không bao giờ tới trình duyệt: không có trong booking-config công khai, HTML hay JS của trang", async ({ page, request }) => {
  const REAL = "E2EKHUHOI";
  // Mock WP: route công khai không có `code`, chỉ `has_code`; route riêng từ chối khi thiếu bí mật.
  const config = await (await request.get("http://127.0.0.1:4010/wp-json/haivan-web/v1/booking-config")).text();
  expect(config).toContain("has_code");
  expect(config).not.toContain(REAL);
  expect((await request.get("http://127.0.0.1:4010/wp-json/haivan-web/v1/promo-codes")).status()).toBe(403);

  const res = await page.goto("/xe-khach");
  expect(await res!.text()).not.toContain(REAL);
  const scripts = await page.locator("script[src]").evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
  expect(scripts.length).toBeGreaterThan(0);
  for (const src of scripts) {
    if (new URL(src).origin !== "http://127.0.0.1:3100") continue;
    expect(await (await request.get(src)).text(), src).not.toContain(REAL);
  }
  // Nhãn công khai vẫn hiện (cấu hình có has_code)
  await page.getByRole("button", { name: "Hà Nội – Mộc Châu" }).click();
  await expect(page.getByText("Giảm 20k/ghế chiều về")).toBeVisible();
});
