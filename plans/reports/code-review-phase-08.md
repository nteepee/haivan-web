# Code Review — Phase 08 (Tài khoản, chuyến đi của tôi, hồ sơ, tracking)

Date: 2026-10-28 · Reviewer: code-reviewer · Mode: read-only (no source edits)

## Scope
- Files: `src/app/[lang]/tai-khoan/(account)/**`, `tai-khoan/dang-xuat`, `xe-khach/cap-nhat-dich-vu`, `tracking/**`, `src/components/account/**` (24 files), `src/components/tracking/**`, `src/lib/account-*.ts`, `src/schemas/account.ts`, `account.*` i18n, `ForceProfileDialog` in `src/app/[lang]/layout.tsx`. ~2.9k LOC incl. tests.
- Verified against spec `03-payment-account.md` §3–5, live capture, `02-confirm-booking.md` (cap-nhat-dich-vu), AND the old bundle in `archive/old-site/_next/static/chunks/**` (grep-verified).
- Checks: `typecheck` pass, `lint` 0 issues, `test` 23 files / 127 tests pass (MSW guard throws on unhandled, DNS block on; no prod traffic).

## Overall
Contract work is solid: query bytes, cancel bodies, DELETE body, PUT vs POST, tax, update-transit, download-bill all match spec + old bundle. Promo HTML XSS fixed (text render). Main issues: one invented cancel gate not present in old web, missing 401 parity, an unencoded path segment from a URL param.

## Critical
None.

## High
**H1. `is_cancel` gating hides "Huỷ vé"/"Huỷ đơn hàng"; old web never reads `is_cancel`.**
`src/lib/account-cancel.ts:15-19,23-24`, `booking-row.tsx:38,70`, `booking-detail.tsx:72,105`.
- Old bundle: `grep is_cancel` over `archive/old-site/_next/static/chunks` = 0 hits. Spec §3 rule: `payment.type===0 && status.type∈{1,2,3}` → Huỷ vé, nothing else.
- Meaning of the field is unproven. `test/fixtures/my_bookings.json` has `is_cancel:true` on all 11 tickets that are ALREADY cancelled (status 5 "Huy", booking status 3). That fits "is cancelled" better than "can still cancel". If that's what it means, every active unpaid ticket has `is_cancel:false` → button replaced by "Chưa thanh toán" → users can't cancel online. Fails acceptance criterion 2 ("Nút huỷ chỉ hiện đúng điều kiện").
- The plan text says "(khi `booking_ticket[].is_cancel`)", but that comes from a live-capture claim nobody has verified.
- Fix: drop `listAllows` from `ticketAction`/`canCancelOrder` (match old web); the backend already enforces with 400/422. Or keep it only after a live check of an active unpaid ticket shows `is_cancel` semantics.

**H2. The old web's only 401 handling (customer fetch → logout + `/`) is not reproduced.**
`use-customer.ts:11`, `force-profile-dialog.tsx:17-20`, `require-login.tsx:14-18`.
- When upstream returns 401, the BFF clears the cookie (`route.ts:30-33`), but the client `["session"]` cache still says `loggedIn` (staleTime 30s, no refetch on focus). Account pages get stuck on "Lỗi dữ liệu", the header still shows logged in, and RequireLogin never redirects. The `seat-panel.tsx:53` pattern (invalidate session on 401) isn't used here.
- Fix: in `useCustomer` queryFn (runs on every page via ForceProfileDialog), catch `ApiError.status===401` → `setQueryData(["session"], LOGGED_OUT)`, clear `["account"]`, and `location.assign("/")` (old behaviour). Better: one shared `onError` on the QueryCache for gw 401s.

## Medium
**M1. A URL param goes unencoded into the gw path → it can reach other allowlisted endpoints, including GETs with side effects.**
`service-update-page.tsx:20` (`code` from `useSearchParams`, line 129).
- `?code=../../payment/vnpay?x=` → the browser resolves `/api/hv/gw/v4/detail-transit/../../payment/vnpay?...` into `/api/hv/gw/payment/vnpay`. `gw()` adds `X-HV-Req`, so the CSRF check passes, and `GET_WRITES` endpoints (`payment/vnpay|payos`, `price-ticket`) get called with the victim's cookie and attacker-chosen query.
- The same class already exists in phase 7: `payment-page.tsx:49,109` (`update-booking/${booking_code}` POST), `success-page.tsx:30`.
- Fix centrally: in `gw()` reject any path segment that fails `/^[A-Za-z0-9_-]+$/`, or `encodeURIComponent` each interpolated segment. Also validate `code` in the page.

**M2. The forced profile modal can become an unclosable dead end.** `profile-dialog.tsx:101,117-118`, `force-profile-dialog.tsx:21`.
- In locked mode, if `customer/definition` fails (shape unverified, see spec open Q5; 5xx), the modal shows only "Lỗi dữ liệu", with no form, no retry, and no close. The whole site is blocked for that user on every page.
- Fix: add a retry button (`def.refetch()`). If definition keeps failing in locked mode, allow closing or render without the modal.

**M3. Double-submit of production writes.** `booking-detail.tsx:54-63`.
- The modal closes right away and the request is fire-and-forget. The "Huỷ vé"/"Huỷ đơn hàng"/"Huỷ dịch vụ" buttons stay enabled while it's in flight, so a second click sends a second cancel POST/DELETE.
- Old web behaves the same, but this is a cheap fix: keep a `pending` state and disable the action buttons until `run` settles.

**M4. Required-but-disabled fields can block saving.** `account-profile.ts:32-33,61-64`, `profile-dialog.tsx:73-74`.
- Case: member (`subscribe_loyalty=1`, `data_source≠1`) whose `name===phone`, or whose `date_of_birth` is null. The field starts empty, is disabled, and validation still requires it → "Xác nhận" can never succeed.
- Same rule as the old web, but UI bugs may be fixed. Skip name/DOB validation when `!identityEditable`, or prefill name with phone.

**M5. Stale caches after update-transit.** `service-update-page.tsx:60-62` pushes to the trips page without invalidating `["account","booking",code]`/`["account","bookings"]` (default staleTime 60s), so a reopened order shows old service data. Invalidate `["account"]` before `router.push`.

## Low
- L1 `service-update-page.tsx:26,30-39`: `toggle` awaits `check-transit` and then calls `replace` with the `services` captured before the await. Another edit made during the wait is lost. Use the functional form `setEdited(prev => …)`.
- L2 `schemas/account.ts:54-79` duplicates `myBookingsSchema` (`schemas/booking.ts:58-69`), which is now used only by `schemas.test.ts`. Parallel schema; merge them. `formatBirthday` (`account-profile.ts:39`) duplicates `formatCreatedDate` (`account-trips.ts:41`).
- L3 `schemas/account.ts:103`: `billSchema.data` is `.optional()` and not `.nullish()`. A `{data:null, base64pdf:"…"}` body throws ZodError → generic toast, even though `extractBase64Pdf` handles null.
- L4 `booking-detail.tsx:47`: adds a success toast "msg.canceled". Spec says no toast on 200. Harmless UI change; record it as an intentional deviation.
- L5 `account-text.ts:1,14`: only 6 entities are decoded. `&agrave;`/`&#7841;`-style content shows raw. Safe (text render); use `DOMParser().parseFromString(...).body.textContent` client-side for fidelity.
- L6 `trips-page.tsx:58`: refetching every infinite page after a cancel can shift rows between pages → duplicate React keys or skipped rows. Accepted limitation; dedupe by code.
- L7 `profile-dialog.test.tsx:111`: test is named "data_source khác 1 hoặc chưa đăng nhập" but only covers the logged-out case. Add `data_source:0` with logged in.
- L8 `account-profile.ts:92`: empty email is sent as `null`. Old form sends the initial value or `""`. Unverified; harmless unless the backend rejects null.
- L9 `logout-page.tsx:12-19`: if the logout POST fails → alert, then a permanent spinner (no retry). Add a retry button.
- L10 (out of scope, `layout/account-menu.tsx`): the header dropdown has no "Khách hàng thân thiết" item. Spec §5 requires it when `subscribe_loyalty`.

## (b) API contract — verified
| Item | Result |
|---|---|
| `bookings` query | `?booking-status%5B0%5D=N`; page>1 → `?page=N&booking-status%5B0%5D=T` (page first) ✓ (test + spec) |
| cancel-seat | byte-exact live body, no `type` ✓; note `""` unless reason id 1 ✓ (note is trimmed, old sent raw — negligible) |
| cancel-booking | `{order_code, merchant_code, reason_cancel_id, reason_cancel_note, type:0}` ✓ (old bundle confirmed) |
| DELETE transit/cancel-order | body `{reason,type:0}` forwarded by BFF (`route.ts:20`, `bff.test.ts:211`) ✓; old `onRefreshList` bug fixed via invalidate ✓ |
| profile | member → `PUT customer/customers/update-profile`, else `POST customer/customers`; no `phone`; DOB `YYYY-MM-DD`; success `status==="OK"` ✓ |
| tax | `POST customer/customers/tax` 4 fields, success `"success"`, cache patched like old store mutation ✓ |
| update-transit | `{order_code, merchant_code, seats:[checked tickets + is_group, dvbs_id]}`: matches old chunk `cap-nhat-dich-vu-4f710e21…` ✓ |
| download-bill | `?ticket_code&merchant_code` → `base64pdf` (top-level or `data`) → `<code>.pdf` blob ✓ |
| offers / loyalty | `promotional_code_list_all?source=1` ✓; loyalty uses `customer/definition.rank_evaluators`, matching the old chunk (plan's `reward/definition` is wrong in the plan, not the code) |
| transit card | "Đã thanh toán" when `booking_info.status_payment`: matches old chunk ✓ |

## (c) Security
- XSS: no `dangerouslySetInnerHTML` in scope. Promo `content` is rendered as text ✓. Driver `tel:` link uses backend phone; React escapes attributes.
- Open redirect: `RequireLogin` builds `next` from same-origin path; `safeNext` validates the origin ✓.
- PII: no console logging in scope. Tracking `ticket_code` in URL is the same as old.
- Unauthenticated access: pages render nothing sensitive before the session check; BFF returns 401 without the cookie ✓.
- Tracking direct apigw: public GET, no Authorization (old axios sent Bearer when logged in, see Q2); query is encoded.
- Path injection: M1.

## (d) React
- Hooks order OK (Loyalty/Profile early returns come after all hooks). Suspense wraps both `useSearchParams` pages; the root layout also wraps children.
- ForceProfileDialog: anonymous users → no customer fetch (gated on `session.loggedIn`; header already fetches the session). Logged-in users → one `customer/customers` per page with 60s cache, the same as old /70b. No dynamic API, so static prerender isn't affected (SSR renders null).
- Invalidation after cancel: detail and all bookings tabs ✓. After update-transit: missing (M5).
- 2 `eslint-disable exhaustive-deps` (RequireLogin, LogoutPage): justified; `useEffectEvent` would be cleaner.

## (e) Patterns
Reuses `TicketCard`, `AddressSearch`, `gw`/`ApiError`, sonner, ui/Dialog, the same way as phases 6–7. Minor duplication: L2, plus `Field` (`confirm/customer-forms.tsx:8`) vs `account/form-field.tsx`.

## (f) Public contracts
- Allowlist covers every phase-8 call with exact methods (`bff.test.ts:52-70`). Compared with the phase-03 list it only adds `v4/check-transit|get-price-ticket`; nothing was removed or widened beyond `CODE=[A-Za-z0-9]+`.
- No exported interface was broken (typecheck is green).
- Note: `src/server/upstream.ts` (mtime 16:18:59) and `bff.test.ts` (16:19:14) changed during this review, so another agent is editing concurrently. Re-run the tests after that work lands.

## Plan follow-ups (no plan edits made)
- AC1 met. AC2 partly met (pay URL ✓; cancel visibility depends on H1). AC3 met.
- Fix the plan text: loyalty uses `customer/definition`, not `reward/definition`.
- Deferred and documented: realtime tracking, `/tracking/hv|hshv`.

## Unresolved questions
1. Is `booking_ticket[].is_cancel` = "can cancel" or "is cancelled"? Needs one live read of an active unpaid order (blocks H1 decision).
2. Is `trip/search-location-detail` really usable without Authorization? Old web sent Bearer when logged in.
3. `customer/definition` top-level vs `data`-wrapped (spec Q5) — matters for M2.
4. Who is editing `upstream.ts`/`bff.test.ts` right now, and is that in phase-8 scope?

Status: DONE_WITH_CONCERNS
Summary: The API contracts match spec and the old bundle, and typecheck/lint/127 tests pass. One invented `is_cancel` gate (H1) may hide cancel buttons, and the old 401 handling is missing (H2).
Concerns/Blockers: H1 should be fixed (or verified live) before AC2 counts as met; M1 is a systemic gw path-encoding gap shared with phase 7.
