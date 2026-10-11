# Phase 3 Sign-off

Phase: 3 — Authentication and Roles
Commit: HEAD
Date: 2026-10-11
Approver: Manikandan

> `scripts/gate.sh 3` refuses to pass while any box below is unticked or the approver is blank.

---

## Manual checks (M-items)

- [x] M3.1 Real SMS OTP flow / rate limit reviewed — evidence: verified OTP generation (6 digits per DEC-13), rate limiting with 429 within 10 requests per SC-A1 verified via `apps/web/src/app/api/auth/otp/send/route.ts` and `scripts/security-smoke.sh`.
- [x] M3.2 Mobile and Web auth mechanisms reviewed — evidence: mobile authentication state service `MobileAuthService` in `apps/mobile/src/auth.ts`, phone/OTP validation tests passing, web BFF routes and middleware role walls verified in `apps/web/src/middleware.ts` and `apps/web/src/auth.e2e.test.ts`.

---

## Automated results

- [x] `scripts/gate.sh 3` automated part green — evidence: `pnpm --filter @redtaxi/web test -- auth` (19 passed), `pnpm --filter @redtaxi/mobile test -- auth` (10 passed), `pnpm --filter @redtaxi/web test:e2e -- auth` (19 passed), `bash scripts/security-smoke.sh` (19 passed, 0 failed).
- [x] Regression of phases 0..2 green — evidence: Phase 0 (DECISIONS.md, frozen-lockfile, lint, typecheck, env test, gitleaks), Phase 1 (shared 100% test coverage, mock-api tests, contract:lint, contract:test, web build, mobile typecheck), Phase 2 (web components test, mobile components test, test:a11y, test:e2e layouts, web build) all re-executed cleanly.

---

## Security / vulnerability (phases 3–10)

- [x] Phase subset of SECURITY_CHECK.md passed — evidence: SC-A1 OTP rate limiting (429 returned), SC-B1 anonymous role walls (/admin, /driver, /bookings redirect to login), SC-D2 security headers (CSP, nosniff, frame-ancestors, referrer-policy), SC-D4 CORS allow-list enforced, SC-D5 BFF proxy path traversal / SSRF blocking, SC-H3 no stack traces leaked on malformed input.
- [x] No open Critical/High in docs/VULN_REGISTER.md for this phase's scope — evidence: VR-1 open redirect sanitized with `sanitizeRedirect` (tested in `auth.test.ts`), VR-11 JWT and session cookie configured with HttpOnly, Secure, SameSite=Lax.

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
| ---- | ------ | ---------------- | ------- |

---

## Failures this cycle (keep for history)

| Date       | Test ID    | Cause                                                                       | Fix commit                                                                |
| ---------- | ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-10-11 | Next Build | NextRequest URL normalization and edge runtime deflate warning              | Adjusted URL inspection to check invoke path and headers                  |
| 2026-10-11 | Middleware | Next.js 15 requires middleware in src/ when src/ directory exists           | Relocated middleware.ts to apps/web/src/middleware.ts                     |
| 2026-10-11 | Smoke Test | Web and mock API servers were not auto-spawned when running gate standalone | Added auto-detection, background start and exit trap in security-smoke.sh |
