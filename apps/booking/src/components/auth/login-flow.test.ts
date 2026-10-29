import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/msw-server";
import { requestOtp, safeNext, validateLoginInput } from "./login-flow";

describe("đăng nhập", () => {
  it("kiểm tra ô nhập như web cũ", () => {
    expect(validateLoginInput("0838000000")).toBeNull();
    expect(validateLoginInput("838000000")).toBe("login_form.msg.error_phone");
    expect(validateLoginInput("08380000001")).toBe("login_form.msg.error_phone");
    expect(validateLoginInput("a+b@haivan.com")).toBeNull();
    expect(validateLoginInput("abc")).toBe("login_form.msg.error_phone_email");
    expect(validateLoginInput(" ")).toBe("login_form.msg.error_input");
  });

  it("get-otp gọi thẳng apigw với channel=1, mã hoá từng giá trị (delta #1)", async () => {
    let url = "";
    let domain: string | null = null;
    server.use(
      http.get("https://apigw.haivan.com/api/get-otp", ({ request }) => {
        url = request.url;
        domain = request.headers.get("domain");
        return HttpResponse.json({ phone: null, email: "a+b@haivan.com", expire_time: "28-10-2026 14:30:00", install_app: 1, is_new: 0 });
      }),
    );
    const res = await requestOtp("a+b@haivan.com", "tok-captcha");
    expect(new URL(url).search).toBe("?phone=a%2Bb%40haivan.com&captcha=tok-captcha&channel=1");
    expect(domain).toBe("haivan.com");
    expect(res.expire_time).toBe("28-10-2026 14:30:00");
  });

  it("next chỉ nhận đường dẫn nội bộ", () => {
    expect(safeNext("/xe-khach/tim-chuyen?x=1")).toBe("/xe-khach/tim-chuyen?x=1");
    expect(safeNext("//evil.com")).toBe("/xe-khach");
    expect(safeNext("https://evil.com")).toBe("/xe-khach");
    expect(safeNext(null)).toBe("/xe-khach");
    expect(safeNext("/\t/evil.com", "/x", "https://haivan.com")).toBe("/x");
    expect(safeNext("/%09/evil.com", "/x", "https://haivan.com")).toBe("/%09/evil.com");
    expect(safeNext("/\n/evil.com", "/x", "https://haivan.com")).toBe("/x");
  });
});
