import { describe, expect, it } from "vitest";
import { customerSchema, definitionSchema, type CustomerData } from "@/schemas/account";
import { districtsOf, formatBirthday, identityEditable, isMember, needsForceUpdate, profileBody, profileInitial, profileRequest, restoreKey, taxBody, taxInitial, validateProfile, validateTax } from "./account-profile";

const customer = customerSchema.parse({
  data: {
    id: 1,
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
    invoice_info: { email: "inv@b.vn", company_name: "Cty", tax_code: "0100", company_address: "HN" },
  },
}).data;

const def = definitionSchema.parse({
  titles: [{ key: "mr", text: "Ông" }],
  jobs: [{ key: 3, text: "Nhân viên" }],
  travel_purposes: [{ key: "work", text: "Công tác" }],
  provinces: [{ id: 1, code: "79", name: "TP.HCM" }, { id: 2, code: "01", name: "Hà Nội" }],
  districts: [{ id: 1, code: "79760", name: "Quận 1" }, { id: 2, code: "01001", name: "Ba Đình" }],
  rank_evaluators: [{ description: ["a"] }],
}) as Parameters<typeof profileBody>[1];

describe("hồ sơ cá nhân", () => {
  it("ghi hồ sơ đúng endpoint theo trạng thái thành viên", () => {
    expect(isMember(customer)).toBe(true);
    expect(profileRequest(true)).toEqual({ method: "PUT", path: "customer/customers/update-profile" });
    expect(profileRequest(false)).toEqual({ method: "POST", path: "customer/customers" });
    expect(isMember({ subscribe_loyalty: 0 } as CustomerData)).toBe(false);
  });

  it("giá trị ban đầu: tên trùng SĐT coi như rỗng, khoá lựa chọn về chuỗi", () => {
    const initial = profileInitial(customer);
    expect(initial).toMatchObject({ title: "mr", name: "Khach Test", date_of_birth: "1990-05-06", province_code: "79", district_code: "79760", occupation: "3", travel_purpose: "work" });
    expect(profileInitial({ ...customer, name: "0900000000" }).name).toBe("");
    expect(profileInitial(null).address).toBe("");
  });

  it("body: ngày YYYY-MM-DD, khoá gốc (số) được giữ, không có phone, email rỗng → null", () => {
    const body = profileBody({ ...profileInitial(customer), email: "  " }, def);
    expect(body).toEqual({
      title: "mr",
      name: "Khach Test",
      date_of_birth: "1990-05-06",
      address: "1 Lê Lợi",
      province_code: "79",
      district_code: "79760",
      email: null,
      occupation: 3,
      travel_purpose: "work",
    });
    expect(body).not.toHaveProperty("phone");
    expect(restoreKey(def.jobs, "999")).toBe("999");
  });

  it("validate theo luật web cũ", () => {
    expect(validateProfile(profileInitial(customer))).toEqual({});
    const empty = validateProfile(profileInitial(null));
    expect(Object.keys(empty).sort()).toEqual(["address", "date_of_birth", "district_code", "name", "occupation", "province_code", "title", "travel_purpose"]);
    const base = profileInitial(customer);
    expect(validateProfile({ ...base, name: "A" }).name).toBe("login_form.msg.pls_min_name");
    expect(validateProfile({ ...base, name: "A".repeat(31) }).name).toBe("login_form.msg.pls_max_name");
    expect(validateProfile({ ...base, address: "x".repeat(61) }).address).toBe("account.err_address_max");
    expect(validateProfile({ ...base, email: "sai" }).email).toBe("msg.msg_invalid_email");
    expect(validateProfile({ ...base, email: `${"a".repeat(30)}@b.vn` }).email).toBe("login_form.msg.pls_max_email");
    expect(validateProfile({ ...base, email: "" })).toEqual({});
  });

  it("quận/huyện lọc theo mã tỉnh, tên + ngày sinh khoá khi đã là thành viên", () => {
    expect(districtsOf(def.districts, "79").map((d) => d.code)).toEqual(["79760"]);
    expect(districtsOf(def.districts, "")).toEqual([]);
    expect(identityEditable(customer)).toBe(false);
    expect(identityEditable({ ...customer, subscribe_loyalty: 0 })).toBe(true);
    expect(identityEditable({ ...customer, data_source: 1 })).toBe(true);
    expect(needsForceUpdate({ data_source: 1 })).toBe(true);
    expect(needsForceUpdate({ data_source: 0 })).toBe(false);
    expect(needsForceUpdate(null)).toBe(false);
    expect(formatBirthday("1990-05-06")).toBe("06/05/1990");
    expect(formatBirthday(null)).toBe("");
  });

  it("hoá đơn: rule độ dài + body", () => {
    expect(validateTax(taxInitial(customer))).toEqual({});
    expect(Object.keys(validateTax(taxInitial(null))).sort()).toEqual(["company_address", "company_name", "tax_code"]);
    const base = taxInitial(customer);
    expect(validateTax({ ...base, company_name: "x".repeat(51) }).company_name).toBe("account.err_company_max");
    expect(validateTax({ ...base, tax_code: "1".repeat(31) }).tax_code).toBe("account.err_tax_max");
    expect(validateTax({ ...base, company_address: "x".repeat(201) }).company_address).toBe("account.err_company_address_max");
    expect(validateTax({ ...base, email: "x" }).email).toBe("msg.msg_invalid_email");
    expect(taxBody({ ...base, company_name: " Cty " })).toEqual({ email: "inv@b.vn", company_name: "Cty", tax_code: "0100", company_address: "HN" });
  });

  it("definition chấp nhận dạng bọc data", () => {
    const wrapped = definitionSchema.parse({ data: { titles: [{ key: "a", text: "A" }] } }) as { titles: unknown[]; jobs: unknown[] };
    expect(wrapped.titles).toHaveLength(1);
    expect(wrapped.jobs).toEqual([]);
  });
});
