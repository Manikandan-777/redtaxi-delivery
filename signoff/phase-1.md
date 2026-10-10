# Phase 1 Sign-off

Phase: 1 — Shared Core and API Contract Commit: <fill-after-gate-passes> Date: 2026-10-11
Approver: <name — required before gate passes>

> `scripts/gate.sh 1` refuses to pass while any `- [ ]` box below is unticked or Approver is blank.

---

## Manual checks (M-items from Gate 1 in TESTING.md)

- [ ] M1.1 Finance/ops reviewed the fare table (DEC-1, DEC-2, DEC-5) against the real tariff sheet — evidence: Placeholder seed data verified, DEC-1/2/5 confirmed in docs/DECISIONS.md.
- [ ] M1.2 Backend owner reviewed openapi.yaml — evidence: contracts/openapi.yaml reviewed against Appendix B.

---

## Automated results

- [ ] `scripts/gate.sh 1` automated commands all passed
- [ ] Regression of phases 0..N-1 green (Phase 0 re-tested clean)

---

## Security / vulnerability (Phase 1 hooks)

- [ ] SC-C1: All money amounts in contracts/openapi.yaml, schemas, and domain core are integer paise
- [ ] SC-H1: Zero secret keys in client bundles or contracts
- [ ] VU-T3: Mock API ignores client-sent amounts and recalculates server-side (server.test.ts)
- [ ] VU-T4: Quote validity verified (15-min fake timer test in server.test.ts)
- [ ] VU-S9: Spectral OpenAPI lint clean with 0 errors

---

## Waivers (Should-items only; Must-items can never be waived)

| Item | Reason | Risk accepted by | Expires |
| ---- | ------ | ---------------- | ------- |

---

## Failures this cycle (keep for history)

| Date | Test ID | Cause | Fix commit |
| ---- | ------- | ----- | ---------- |
