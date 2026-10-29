// Lớp chặn thấp nhất: mọi tra DNS tới host production đều lỗi ENOTFOUND.
// Bắt cả các đường không đi qua MSW (fetch lưu từ lúc import, undici trực tiếp,
// passthrough()). Phải được nạp trước mọi module khác trong setup.
import dns from "node:dns";
import { isProductionHost, recordBlocked } from "./network-guard";

function blockedError(hostname: string): NodeJS.ErrnoException {
  const err: NodeJS.ErrnoException = new Error(`DNS blocked in tests: ${hostname}`);
  err.code = "ENOTFOUND";
  return err;
}

const originalLookup = dns.lookup;
const patchedLookup = function (hostname: string, ...rest: unknown[]) {
  if (isProductionHost(hostname)) {
    recordBlocked(`DNS ${hostname}`);
    const callback = rest.find((a) => typeof a === "function") as ((e: Error) => void) | undefined;
    if (callback) process.nextTick(() => callback(blockedError(hostname)));
    return;
  }
  return (originalLookup as (...args: unknown[]) => unknown).call(dns, hostname, ...rest);
};
(dns as { lookup: unknown }).lookup = patchedLookup;

const originalPromiseLookup = dns.promises.lookup;
(dns.promises as { lookup: unknown }).lookup = async (hostname: string, ...rest: unknown[]) => {
  if (isProductionHost(hostname)) {
    recordBlocked(`DNS ${hostname}`);
    throw blockedError(hostname);
  }
  return (originalPromiseLookup as (...args: unknown[]) => unknown).call(dns.promises, hostname, ...rest);
};
