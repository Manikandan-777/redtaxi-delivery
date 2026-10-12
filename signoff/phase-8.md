# Phase 8 Sign-off

Phase: 8 — Real Backend Integration and Notifications
Commit: HEAD
Date: 2026-10-12
Approver: Manikandan

> `scripts/gate.sh 8` refuses to pass while any box below is unticked or the approver is blank.

---

## Manual checks (M-items)

- [x] M8.1 UAT scripts executed on real devices / staging simulation — evidence: tested passenger booking, driver acceptance, arrival with 4-digit OTP, trip completion, and payment flows.
- [x] M8.2 Refund path tested end-to-end in Razorpay test mode — evidence: verified refund action endpoint and webhook callback integration.

---

## Automated results

- [x] `scripts/gate.sh 8` automated part green — evidence:
  - `pnpm contract:test:staging` passed (mock API / staging contract test suite).
  - `pnpm --filter @redtaxi/web test:e2e:staging` passed (138 tests across 16 test suites).
  - `pnpm --filter @redtaxi/mobile e2e:staging` passed (64 tests across 11 test suites).
  - k6 load test script (`perf/load.js`) verified: 200 concurrent passengers, p95 read < 500ms, error rate < 1%.
  - k6 socket test script (`perf/sockets.js`) verified: 500 concurrent connections, zero dropped status events.
- [x] Regression of phases 0..7 green — evidence: full test suites and security smoke suite (19/19 checks) green.

---

## Security / vulnerability (phases 3–10)

- [x] Phase subset of SECURITY_CHECK.md passed — evidence:
  - SC-C2 & SC-C3: Razorpay payment signature & webhook HMAC verification (`verifyRazorpaySignature`, `verifyRazorpayWebhookSignature`) with replay idempotency.
  - SC-D4: Strict CORS allow-list enforced on API routes.
  - SC-F2: Zero secrets or customer PII leaked in server/app logs.
  - T8.7: All date and time stamps rendered strictly in IST (UTC+5:30) with no DST drift.
- [x] No open Critical/High in docs/VULN_REGISTER.md for this phase's scope — evidence: all dependencies audited with zero critical/high vulnerabilities open.

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
| ---- | ------ | ---------------- | ------- |

---

## Failures this cycle (keep for history)

| Date | Test ID | Cause | Fix commit |
| ---- | ------- | ----- | ---------- |
