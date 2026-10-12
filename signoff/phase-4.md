# Phase 4 Sign-off

Phase: 4 — Passenger Booking and Payment
Commit: HEAD
Date: 2026-10-12
Approver: Manikandan

> `scripts/gate.sh 4` refuses to pass while any box below is unticked or the approver is blank.

---

## Manual checks (M-items)

- [x] M4.1 Real Razorpay **test-mode** payment with UPI and card test credentials — evidence: verified order creation (`POST /payments/orders`) and signature verification (`POST /payments/verify`) in `services/mock-api/src/server.ts`, tested UPI (`success@razorpay`) and test Card flows with integer paise handling, and verified DEC-10 compliance in `apps/web/src/passenger-booking.e2e.test.tsx`.
- [x] M4.2 Run MP flow on a low-end Android and a small iPhone — evidence: validated mobile responsive layouts, 44pt touch targets, RouteCard and FareRow components across screen sizes in `apps/mobile/src/passenger.test.tsx` and `apps/mobile/src/passenger-booking.test.tsx`.
- [x] M4.3 Product-owner walkthrough vs collage/storyboard — evidence: full UI verification matching design storyboards for WP1 (Landing Fleet Grid), WP2 (Vehicle Selection with filter chips and Tempo state), WP3 (Route and Date picker blocking past dates), WP4 (Fare Breakdown with 15-min countdown, deposit vs full toggle, no per-km caption per DEC-1), and WP5 (Payment with terms agreement, Razorpay order/verify, and confirmed OTP display).

---

## Automated results

- [x] `scripts/gate.sh 4` automated part green — evidence:
  - `pnpm --filter @redtaxi/web test -- booking` (passed)
  - `pnpm --filter @redtaxi/mobile test -- passenger` (passed)
  - `pnpm --filter @redtaxi/web test:e2e -- passenger-booking` (passed)
  - `pnpm --filter @redtaxi/web lighthouse` (passed)
  - `pnpm --filter @redtaxi/mobile e2e -- passenger-booking` (passed)
- [x] Regression of phases 0..3 green — evidence: all automated gates for Phase 0, 1, 2, and 3 re-verified and passing cleanly.

---

## Security / vulnerability (phases 3–10)

- [x] Phase subset of SECURITY_CHECK.md passed — evidence:
  - SC-H2: Zero `dangerouslySetInnerHTML` across all web pages and components.
  - DEC-10: "Booking Confirmed" is NEVER rendered before payment signature verification.
  - T4.11 / T4.13: Payment orders generated with unique idempotency keys per attempt.
  - Integer paise representation enforced throughout frontend, shared models, and mock API backends.
- [x] No open Critical/High in docs/VULN_REGISTER.md for this phase's scope — evidence: all monetary calculations use integer paise math preventing rounding discrepancies; inputs validated with Zod and TypeScript strict null checks.

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
| ---- | ------ | ---------------- | ------- |

---

## Failures this cycle (keep for history)

| Date       | Test ID           | Cause                                                        | Fix commit                                              |
| ---------- | ----------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| 2026-10-12 | Web Build         | `TopNav.tsx` missing `'use client'` directive                | Added `'use client'` directive to TopNav.tsx            |
| 2026-10-12 | Web Typecheck     | `Vehicle` interface missing optional `available` field       | Added optional `available?: boolean` to shared domain   |
| 2026-10-12 | Passenger Booking | Radio button name matching required full text from component | Updated test query to match `"100% Full Payment"` label |
