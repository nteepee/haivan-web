import type { CustomerData, Definition } from "@/schemas/account";

export interface ProfileValues {
  title: string;
  name: string;
  date_of_birth: string;
  address: string;
  province_code: string;
  district_code: string;
  email: string;
  occupation: string;
  travel_purpose: string;
}
export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

export interface TaxValues {
  email: string;
  company_name: string;
  tax_code: string;
  company_address: string;
}
export type TaxErrors = Partial<Record<keyof TaxValues, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Thành viên thân thiết (`subscribe_loyalty` truthy) → PUT update-profile; ngược lại POST customers (đăng ký). */
export const isMember = (c: Pick<CustomerData, "subscribe_loyalty"> | null | undefined) => !!c?.subscribe_loyalty;
export const profileRequest = (member: boolean) =>
  member ? ({ method: "PUT", path: "customer/customers/update-profile" } as const) : ({ method: "POST", path: "customer/customers" } as const);

/** Tên + ngày sinh chỉ sửa được khi hồ sơ lấy từ nguồn 1 hoặc chưa đăng ký thân thiết. */
export const identityEditable = (c: Pick<CustomerData, "data_source" | "subscribe_loyalty"> | null | undefined) =>
  c?.data_source === 1 || c?.subscribe_loyalty === 0 || c?.subscribe_loyalty === false;

/** Modal bắt buộc cập nhật hồ sơ khi `data_source === 1`. */
export const needsForceUpdate = (c: Pick<CustomerData, "data_source"> | null | undefined) => c?.data_source === 1;

/** "2026-10-28" (hoặc "2026-10-28 00:00:00") → "28/10/2026". */
export const formatBirthday = (value?: string | null) => (value ? value.slice(0, 10).split("-").reverse().join("/") : "");

/** Giá trị ban đầu của form; tên trùng SĐT (tài khoản mới) coi như chưa có tên. */
export function profileInitial(c: CustomerData | null | undefined): ProfileValues {
  return {
    title: c?.title?.key != null ? String(c.title.key) : "",
    name: c?.name && c.name !== c.phone ? c.name : "",
    date_of_birth: c?.date_of_birth ? c.date_of_birth.slice(0, 10) : "",
    address: c?.address ?? "",
    province_code: c?.province?.code ?? "",
    district_code: c?.district?.code ?? "",
    email: c?.email ?? "",
    occupation: c?.occupation?.key != null ? String(c.occupation.key) : "",
    travel_purpose: c?.travel_purpose?.key != null ? String(c.travel_purpose.key) : "",
  };
}

/** Lỗi theo khoá i18n (rỗng = hợp lệ), cùng luật với form web cũ. */
export function validateProfile(v: ProfileValues, opts: { identityLocked?: boolean } = {}): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = v.name.trim();
  if (!v.title) errors.title = "msg.msg_empty_title";
  // Tên + ngày sinh bị khoá (không sửa được) thì không bắt nhập, kẻo hồ sơ không bao giờ lưu được.
  if (opts.identityLocked) {
    /* bỏ qua tên, ngày sinh */
  } else if (!name) errors.name = "msg.msg_empty_name";
  else if (name.length < 2) errors.name = "login_form.msg.pls_min_name";
  else if (name.length > 30) errors.name = "login_form.msg.pls_max_name";
  if (!opts.identityLocked && !v.date_of_birth) errors.date_of_birth = "msg.msg_empty_dob";
  if (!v.address.trim()) errors.address = "msg.msg_empty_address";
  else if (v.address.length > 60) errors.address = "account.err_address_max";
  if (!v.province_code) errors.province_code = "msg.msg_empty_city";
  if (!v.district_code) errors.district_code = "msg.msg_empty_district";
  if (v.email && !EMAIL.test(v.email)) errors.email = "msg.msg_invalid_email";
  else if (v.email.length > 30) errors.email = "login_form.msg.pls_max_email";
  if (!v.occupation) errors.occupation = "msg.msg_empty_job";
  if (!v.travel_purpose) errors.travel_purpose = "msg.msg_empty_travel";
  return errors;
}

/** Quận/huyện thuộc tỉnh: mã quận bắt đầu bằng mã tỉnh. */
export const districtsOf = (districts: Definition["districts"], provinceCode: string) =>
  provinceCode ? districts.filter((d) => d.code.startsWith(provinceCode)) : [];

/** Trả khoá gốc (số hoặc chuỗi) của lựa chọn đã chọn trong <select>. */
export const restoreKey = (options: Definition["titles"], value: string): string | number => options.find((o) => String(o.key) === value)?.key ?? value;

/** Body ghi hồ sơ: giá trị form, ngày sinh `YYYY-MM-DD`; không gửi `phone` (không có ô nhập). */
export function profileBody(v: ProfileValues, def: Definition) {
  return {
    title: restoreKey(def.titles, v.title),
    name: v.name.trim(),
    date_of_birth: v.date_of_birth,
    address: v.address.trim(),
    province_code: v.province_code,
    district_code: v.district_code,
    email: v.email.trim() || null,
    occupation: restoreKey(def.jobs, v.occupation),
    travel_purpose: restoreKey(def.travel_purposes, v.travel_purpose),
  };
}

export function taxInitial(c: CustomerData | null | undefined): TaxValues {
  const i = c?.invoice_info;
  return { email: i?.email ?? "", company_name: i?.company_name ?? "", tax_code: i?.tax_code ?? "", company_address: i?.company_address ?? "" };
}

export function validateTax(v: TaxValues): TaxErrors {
  const errors: TaxErrors = {};
  if (v.email && !EMAIL.test(v.email)) errors.email = "msg.msg_invalid_email";
  if (!v.company_name.trim()) errors.company_name = "msg.msg_empty_company_name";
  else if (v.company_name.length > 50) errors.company_name = "account.err_company_max";
  if (!v.tax_code.trim()) errors.tax_code = "msg.msg_empty_tax";
  else if (v.tax_code.length > 30) errors.tax_code = "account.err_tax_max";
  if (!v.company_address.trim()) errors.company_address = "msg.msg_empty_company_address";
  else if (v.company_address.length > 200) errors.company_address = "account.err_company_address_max";
  return errors;
}

/** Body `POST api/customer/customers/tax`. */
export const taxBody = (v: TaxValues) => ({
  email: v.email.trim(),
  company_name: v.company_name.trim(),
  tax_code: v.tax_code.trim(),
  company_address: v.company_address.trim(),
});

export const RANK_NAMES = ["Thành viên", "Bạc", "Vàng", "Kim cương"] as const;
