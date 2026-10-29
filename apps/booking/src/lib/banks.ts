/** Lưới ngân hàng VNPay của web cũ (module `Oqsq`), logo cùng nguồn web cũ dùng. */
export const ATM_BANKS = [
  "ABBANK", "ACB", "AGRIBANK", "BACABANK", "BIDV", "DONGABANK", "EXIMBANK", "HDBANK", "IVB", "MBBANK", "MSBANK",
  "NAMABANK", "NCB", "OCB", "OJB", "PVCOMBANK", "SACOMBANK", "SAIGONBANK", "SCB", "SHB", "TECHCOMBANK", "TPBANK",
  "VPBANK", "SEABANK", "VIB", "VIETABANK", "VIETBANK", "VIETCAPITALBANK", "VIETCOMBANK", "VIETINBANK", "BIDC",
  "LAOVIETBANK", "WOORIBANK",
] as const;
export const CARD_BANKS = ["VISA", "MASTERCARD", "AMEX", "JCB"] as const;

export const bankLogo = (code: string) => `https://sandbox.vnpayment.vn/apis/assets/images/bank/${code.toLowerCase()}_logo.png`;
