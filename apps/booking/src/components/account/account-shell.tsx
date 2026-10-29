"use client";

import type { ReactNode } from "react";
import { AccountSidebar } from "./account-sidebar";
import { RequireLogin } from "./require-login";

/** Khung trang tài khoản: yêu cầu phiên; điện thoại = thanh mục cuộn ngang trên nội dung, từ 48rem = sidebar trái. */
export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <RequireLogin>
      <div className="hv-container hv-app-main grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
        <aside className="min-w-0">
          <AccountSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </RequireLogin>
  );
}
