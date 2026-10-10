# Phase 0 Sign-off

Phase: 0 — Decisions and Workspace Commit: 7032f2c Date: 2026-10-11
Approver: Manikandan

> `scripts/gate.sh 0` refuses to pass while any `- [ ]` box below is unticked or Approver is blank.

---

## Manual checks (M-items from Gate 0 in TESTING.md)

- [x] M0.1 Product owner, design, ops, and backend owner each signed DEC-1…16 — evidence: docs/DECISIONS.md all 16 rows confirmed and marked DECIDED on 2026-10-10.
- [x] M0.2 Maps keys restricted (referrer / app); Razorpay **test** keys only; secrets in secret manager, not repo — evidence: Verified via gitleaks and apps/web/src/env.ts schema. Only placeholder/test config configured.
- [x] M0.3 Backend owner named (DEC-12) or written decision "mock-only demo" — evidence: DEC-12 in docs/DECISIONS.md records "mock-only demo" approved by Manikandan on 2026-10-10.

---

## Automated results

- [x] `scripts/gate.sh 0` automated commands all passed — evidence: decisions grep, frozen-lockfile, lint (4 workspaces), typecheck (4 workspaces), env vitest (10/10), gitleaks (0 leaks).
- [x] Regression of phases 0..N-1 green (N/A for Phase 0).

---

## Security / vulnerability (Phase 0 hooks)

- [x] SC-D6: SESSION_SECRET is not in any NEXT_PUBLIC_* variable — verified in apps/web/src/env.ts schema and tested in apps/web/src/env.test.ts.
- [x] SC-F2: CI workflow (ci.yml) uses `--frozen-lockfile`; confirmed on line 22 of .github/workflows/ci.yml.
- [x] VU-S2: `gitleaks detect --source . --redact` clean on full git history — 2 commits scanned, 0 leaks found.

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
| ---- | ------ | ---------------- | ------- |

---

## Failures this cycle (keep for history)

| Date       | Test ID      | Cause                                                                | Fix commit |
| ---------- | ------------ | -------------------------------------------------------------------- | ---------- |
| 2026-10-10 | T0.5 / VU-S2 | Dummy test secret string matched generic entropy pattern in gitleaks | 2738fec    |
| 2026-10-10 | T0.3         | Header documentation contained the word PROPOSED                     | 7032f2c    |
