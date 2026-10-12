# Security Run Log

Append one block per run of [SECURITY_CHECK.md](../SECURITY_CHECK.md). The gate scripts look for a line starting with "Run: Demo" (Gate 7) or "Run: Full" (Gate 9) and assert zero failed cells.
Copy the block below, fill it in, and keep old runs for history (a re-run after a fix is a new block).

```
Run: Demo
Date: 2026-10-12
Environment: Demo / Mock API
Commit: HEAD
Tester: Manikandan

| ID     | Result (PASS / FAIL / N-A) | Evidence (link/log) | Notes / Finding ID |
|--------|----------------------------|---------------------|--------------------|
| SC-A1  | PASS                       | scripts/security-smoke.sh | OTP 429 rate limit enforced |
| SC-A2  | PASS                       | services/mock-api   | 5-attempt boundary locked, no OTP logged |
| SC-A3  | PASS                       | apps/web/src/lib/auth.ts | HttpOnly; Secure; SameSite=Lax |
| SC-A4  | PASS                       | apps/web/src/app/admin/login | Generic error message, lockout after threshold |
| SC-A5  | PASS                       | apps/web/src/middleware.ts | Silent refresh, 401 cleared, logout deletes cookie |
| SC-A6  | PASS                       | apps/web/src/lib/auth.ts | Admin idle timeout enforced |
| SC-B1  | PASS                       | scripts/security-smoke.sh | Anonymous /admin, /driver, /bookings redirect to login; 401/403 on API |
| SC-B2  | PASS                       | services/mock-api   | IDOR blocked across bookings, quotes |
| SC-B3  | PASS                       | services/mock-api   | Driver sees own assigned trips only |
| SC-B4  | PASS                       | services/mock-api   | Start OTP (4 digits) returned to passenger only |
| SC-B5  | PASS                       | services/mock-api   | Unverified/expired drivers cannot go online (403) |
| SC-B6  | PASS                       | apps/web/src/middleware.ts | next-param validated, same-origin only |
| SC-C1  | PASS                       | services/mock-api   | Server recomputes fare, client amounts ignored |
| SC-C2  | PASS                       | services/mock-api   | Server verifies payment signature (sig_) |
| SC-C3  | N-A                        | N-A                 | Real Razorpay webhook handled at Gate 8 (R) |
| SC-C4  | PASS                       | services/mock-api   | Idempotency key prevents double charges |
| SC-C5  | PASS                       | services/mock-api   | Expired quotes (15 min) rejected |
| SC-C6  | PASS                       | services/mock-api   | Booking confirmed only after verified payment |
| SC-C7  | PASS                       | services/mock-api   | Price changes, refund, cancel audited; new quotes only |
| SC-D1  | N-A                        | N-A                 | Production HTTPS/HSTS verified at Gate 9 (R) |
| SC-D2  | PASS                       | scripts/security-smoke.sh | CSP, no unsafe-eval, nosniff, frame-ancestors |
| SC-D3  | PASS                       | apps/web/src/middleware.ts | CSRF / origin check on mutating routes |
| SC-D4  | PASS                       | scripts/security-smoke.sh | CORS allow-list enforced, no evil.example |
| SC-D5  | PASS                       | scripts/security-smoke.sh | Traversal & SSRF blocked on BFF proxy |
| SC-D6  | PASS                       | apps/web/src/env.test.ts | Zero secrets in client bundle |
| SC-E1  | PASS                       | services/mock-api   | WebSockets authenticate & scope to rooms |
| SC-E2  | PASS                       | services/mock-api   | Location posting throttled |
| SC-E3  | PASS                       | services/mock-api   | SOS alerts broadcast live location |
| SC-E4  | PASS                       | services/mock-api   | Tokenized share links expire at trip end |
| SC-F1  | PASS                       | services/mock-api   | Phone numbers masked between users |
| SC-F2  | PASS                       | apps/web/src/lib    | No personal data or credentials logged |
| SC-F3  | PASS                       | services/mock-api   | Upload magic bytes & type verified |
| SC-F4  | PASS                       | services/mock-api   | Bank accounts show last 4 digits only |
| SC-F5  | PASS                       | apps/web/src/app    | Terms agreement required, DPDP policy present |
| SC-F6  | PASS                       | services/mock-api   | Audit log read-only, tamper resistant |
| SC-G1  | PASS                       | apps/mobile/src     | SecureStore used for tokens |
| SC-G2  | PASS                       | apps/mobile/app.config.ts | Minimal permissions with specific iOS strings |
| SC-G3  | PASS                       | apps/mobile/src     | Zero secrets in mobile app bundle |
| SC-G4  | PASS                       | apps/mobile/src     | Deep links validated |
| SC-G5  | N-A                        | N-A                 | Native pinning verified in Gate 9 (R) |
| SC-H1  | PASS                       | services/mock-api   | Server re-validates all inputs with Zod |
| SC-H2  | PASS                       | packages/shared/src/csv.ts | XSS prevented, CSV formula prefixes neutralised |
| SC-H3  | PASS                       | scripts/security-smoke.sh | Malformed errors do not leak stack traces |

Totals: passed 38 / failed 0 / N-A 3 (every N-A needs a written reason: R-tagged checks reserved for staging/Gate 8-9)
Decision: PASS
Approver: Manikandan
```
