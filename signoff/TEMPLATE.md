# Phase N Sign-off  (copy to signoff/phase-N.md)

Phase: N — <title>          Commit: <sha>          Date: <YYYY-MM-DD>
Approver: <name>

> `scripts/gate.sh N` refuses to pass while any box below is unticked or the approver is blank.
> Copy the **M-items** for this phase from TESTING.md, add one box per item, attach evidence.

## Manual checks (M-items)
- [ ] M?.1 <description> — evidence: <link/screenshot/log>
- [ ] M?.2 <description> — evidence:

## Automated results
- [ ] `scripts/gate.sh N` automated part green (paste summary)
- [ ] Regression of phases 0..N-1 green

## Security / vulnerability (phases 3–10)
- [ ] Phase subset of SECURITY_CHECK.md passed (link run in docs/SECURITY_RUN_LOG.md)
- [ ] No open Critical/High in docs/VULN_REGISTER.md for this phase's scope

## Waivers (Should-items only; Must-items can never be waived)
| Item | Reason | Risk accepted by | Expires |
|------|--------|------------------|---------|

## Failures this cycle (keep for history)
| Date | Test ID | Cause | Fix commit |
|------|---------|-------|------------|
