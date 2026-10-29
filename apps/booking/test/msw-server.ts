import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { isProductionUrl, recordBlocked } from "./network-guard";

// Catch-all cuối danh sách: request production chưa có handler riêng → lỗi mạng.
// Trả undefined cho host khác để MSW xử lý theo onUnhandledFrame.
const productionCatchAll = http.all(/.*/, ({ request }) => {
  if (!isProductionUrl(request.url)) return undefined;
  recordBlocked(`${request.method} ${request.url}`);
  return HttpResponse.error();
});

export const server = setupServer(productionCatchAll);

// resetHandlers(...args) trong MSW 3 thay hẳn danh sách gốc (mất catch-all).
const originalReset = server.resetHandlers.bind(server);
server.resetHandlers = (...next: Parameters<typeof server.resetHandlers>) => {
  if (next.length > 0) throw new Error("Dùng server.use(...) thay vì resetHandlers(handlers): giữ catch-all chặn production");
  originalReset();
};
