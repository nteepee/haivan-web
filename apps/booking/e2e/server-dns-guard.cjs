/* eslint-disable @typescript-eslint/no-require-imports -- preload CommonJS cho NODE_OPTIONS=--require */
// Nạp bằng NODE_OPTIONS=--require cho tiến trình `next build` / `next start` của E2E:
// mọi tra DNS tới host production đều lỗi ENOTFOUND và được ghi vào E2E_DNS_LOG.
// global-teardown.ts đọc file này; có dòng nào là E2E fail. Đây là lớp "DNS override" phía server,
// độc lập với guard trong callApigw (src/server/upstream.ts) và với việc APIGW_URL trỏ mock.
const dns = require("node:dns");
const fs = require("node:fs");
const path = require("node:path");

const BLOCKED = ["haivan.com", "haivanexpress.vn"];
const LOG = process.env.E2E_DNS_LOG;

const isBlocked = (hostname) => {
  const host = String(hostname).toLowerCase().replace(/\.+$/, "");
  return BLOCKED.some((b) => host === b || host.endsWith(`.${b}`));
};

function record(hostname) {
  if (!LOG) return;
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, `${new Date().toISOString()} pid=${process.pid} ${hostname}\n`);
  } catch {
    // Không ghi được log thì vẫn phải chặn.
  }
}

function blockedError(hostname) {
  const error = new Error(`E2E: DNS tới ${hostname} bị chặn`);
  error.code = "ENOTFOUND";
  return error;
}

const lookup = dns.lookup;
dns.lookup = function patchedLookup(hostname, ...rest) {
  if (isBlocked(hostname)) {
    record(hostname);
    const callback = rest.find((arg) => typeof arg === "function");
    if (callback) process.nextTick(callback, blockedError(hostname));
    return undefined;
  }
  return lookup.call(dns, hostname, ...rest);
};

const promiseLookup = dns.promises.lookup;
dns.promises.lookup = async function patchedPromiseLookup(hostname, ...rest) {
  if (isBlocked(hostname)) {
    record(hostname);
    throw blockedError(hostname);
  }
  return promiseLookup.call(dns.promises, hostname, ...rest);
};
