# Phase 0 Sign-off

Phase: 0 — Decisions and Workspace          Commit: <fill-after-gate-passes>          Date: 2026-10-10
Approver: <name — required before gate passes>

> `scripts/gate.sh 0` refuses to pass while any `- [ ]` box below is unticked or Approver is blank.
> Fill every box, add your name as Approver, then re-run the gate.

---

## Manual checks (M-items from Gate 0 in TESTING.md)

- [ ] M0.1 Product owner, design, ops, and backend owner each signed DEC-1…16 — evidence: <link/screenshot/log>
- [ ] M0.2 Maps keys restricted (referrer / app); Razorpay **test** keys only; secrets in secret manager, not repo — evidence: <console screenshot / vault link>
- [ ] M0.3 Backend owner named (DEC-12) or written decision "mock-only demo" — evidence: DEC-12 in docs/DECISIONS.md records "mock-only demo" by product owner on 2026-10-10 (tick this box once you have confirmed the entry is correct)

---

## Automated results (tick after `scripts/gate.sh 0` automated section is green)

- [ ] `scripts/gate.sh 0` automated commands all passed (paste gate output summary here)
- [ ] Regression of phases 0..N-1 green (N/A for Phase 0)

---

## Security / vulnerability (Phase 0 hooks)

- [ ] SC-D6: SESSION_SECRET is not in any NEXT_PUBLIC_* variable — verified in apps/web/src/env.ts schema
- [ ] SC-F2: CI workflow (ci.yml) uses `--frozen-lockfile`; confirmed on line 22 of .github/workflows/ci.yml
- [ ] VU-S2: `gitleaks detect --source . --redact` clean on full git history (gate command output)

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
|------|--------|------------------|---------|

---

## Failures this cycle (keep for history)

| Date | Test ID | Cause | Fix commit |
|------|---------|-------|------------|
