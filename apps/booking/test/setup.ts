// Thứ tự nạp quan trọng: chặn DNS trước, rồi MSW, trước khi test file import gì.
import "./dns-block";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, expect } from "vitest";
import { server } from "./msw-server";
import { blockedProductionRequests, isProductionUrl, recordBlocked } from "./network-guard";

// Lắng nghe ngay khi nạp setup (không chờ beforeAll) để fetch được lưu lúc import cũng bị chặn.
server.listen({
  onUnhandledFrame({ frame }) {
    const request = (frame as { request?: unknown }).request;
    const url = request instanceof Request ? request.url : "";
    if (url && isProductionUrl(url)) recordBlocked(`UNHANDLED ${url}`);
    // Throw thì MSW chặn hẳn; defaults.error() vẫn cho đi tiếp với request dạng tài sản.
    throw new Error(`Unhandled request in test: ${url || "(non-http frame)"}`);
  },
});

// jsdom chạy XHR đồng bộ ở tiến trình con, ngoài tầm MSW.
if (typeof XMLHttpRequest !== "undefined") {
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
    if (args[2] === false) throw new Error("XMLHttpRequest đồng bộ bị cấm trong test");
    return (open as (...a: unknown[]) => void).apply(this, args);
  } as typeof open;
}

function assertNoProductionRequests() {
  const leaked = blockedProductionRequests.splice(0);
  // Test cố ý kiểm tra chặn thì tự xoá danh sách trước khi kết thúc.
  expect(leaked, "Test chạm backend production (đã chặn)").toEqual([]);
}

afterEach(() => {
  server.resetHandlers();
  assertNoProductionRequests();
});

afterAll(() => {
  assertNoProductionRequests();
  server.close();
});
