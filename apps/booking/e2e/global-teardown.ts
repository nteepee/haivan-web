import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Sau cả lượt chạy: server (build + start) không được tra DNS tới host production lần nào. */
export default function globalTeardown() {
  const log = path.join(__dirname, "..", ".e2e-output", "server-dns-blocked.log");
  const hits = existsSync(log) ? readFileSync(log, "utf8").trim() : "";
  if (hits) throw new Error(`Server Next thử kết nối production trong E2E:\n${hits}`);
  console.log("[e2e] server-side production DNS lookups: 0");
}
