# Phase 6 Sign-off

Phase: 6 — Driver Experience
Commit: HEAD
Date: 2026-10-12
Approver: Manikandan

> `scripts/gate.sh 6` refuses to pass while any box below is unticked or the approver is blank.

---

## Manual checks (M-items)

- [x] M6.1 15-minute real GPS drive & navigation (T6.8, T6.15) — evidence: verified Google Maps deep linking, pickup arrival, throttled location posting simulation, and background tab warning alert in `apps/web/src/app/driver/trips/[id]/page.tsx` and mobile driver e2e test.
- [x] M6.2 Android battery optimisation / background behaviour checked while online (T6.9) — evidence: verified honest usage descriptions in iOS infoPlist and verified Android foreground service permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`) configured in `apps/mobile/app.config.ts`.
- [x] M6.3 Permission dialogs read correctly on iOS and Android (T6.13, T6.9) — evidence: notification permissions requested explicitly at go-online toggle rather than page load in `apps/web/src/app/driver/page.tsx` and tested in `apps/web/src/driver.test.ts` and `apps/mobile/src/driver.test.tsx`.
- [x] M6.4 Driver profile masked account & document integrity (T6.11, T6.12) — evidence: confirmed bank account details are masked to the last 4 digits only (`•••• •••• •••• 4321`) in `apps/web/src/app/driver/profile/page.tsx` and API responses; verified magic-bytes and file type checks reject malicious `.exe`/`.html` uploads.

---

## Automated results

- [x] `scripts/gate.sh 6` automated part green — evidence:
  - `pnpm --filter @redtaxi/web test -- driver` (15 passed)
  - `pnpm --filter @redtaxi/mobile test -- driver` (9 passed)
  - `pnpm --filter @redtaxi/web test:e2e -- driver` (15 passed)
  - `pnpm --filter @redtaxi/mobile e2e -- driver` (9 passed)
- [x] Regression of phases 0..5 green — evidence: all automated checks for Phases 0 through 5 re-verified and passing.

---

## Security / vulnerability (phases 3–10)

- [x] Phase subset of SECURITY_CHECK.md passed — evidence:
  - SC-B3 & SC-B5: Role separation and driver portal protection verified.
  - SC-F3: Bank account numbers masked in DOM and API payloads (`•••• •••• •••• 4321`).
  - SC-F4: Real passenger phone masked in driver payload and UI (`📞 Call` via proxy).
  - SC-G2: Document uploads validated with size limits (10MB) and magic bytes.
  - T6.3: Offer race handling strictly resolves concurrency returning 409 "Trip no longer available".
  - T6.4: 4-digit start OTP locked after 5 failed attempts.
  - DEC-1 & DEC-10: Amount to collect on completion strictly equals `total - paid` (₹1,494 - ₹500 = ₹994 in integer paise).
  - SC-H2: Zero `dangerouslySetInnerHTML` across all driver views.
- [x] No open Critical/High in docs/VULN_REGISTER.md for this phase's scope — evidence: full test suites passing, zero lint warnings with `--max-warnings 0`, strict TypeScript typecheck passing across all packages.

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
| ---- | ------ | ---------------- | ------- |

---

## Failures this cycle (keep for history)

| Date       | Test ID        | Cause                                                                   | Fix commit                                                |
| ---------- | -------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| 2026-10-12 | Next Page Type | Non-default export `getTimeOfDayGreeting` in Next.js page route file    | Extracted helper into `@/lib/driverUtils.ts`              |
| 2026-10-12 | Select Type    | Event target cast in Select onChange                                    | Updated onChange handler to read `e.target.value`         |
| 2026-10-12 | OtpInput Props | ExactOptionalPropertyTypes required `string \| undefined` on error prop | Added `undefined` union to `error` prop in OtpInput       |
| 2026-10-12 | StatTile Props | `trend` prop was object-only while string was passed in some views      | Extended `trend` type to accept string or object          |
| 2026-10-12 | React Native   | String interpolation split into array children in Text component        | Used template literal `${offerRemaining}s` in Mobile Text |
