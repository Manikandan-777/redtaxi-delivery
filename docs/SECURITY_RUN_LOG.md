# Security Run Log

Append one block per run of [SECURITY_CHECK.md](../SECURITY_CHECK.md). The gate scripts look for a line that **starts with** `Run: Demo` (Gate 7) or `Run: Full` (Gate 9) and fail on any table cell `| FAIL |`.
Copy the block below, fill it in, and keep old runs for history (a re-run after a fix is a **new** block).

```
Run: <Demo | Full | Phase-N | Production-smoke>
Date:                 Commit:
Environment:          Tester:

| ID     | Result (PASS / FAIL / N-A) | Evidence (link/log) | Notes / Finding ID |
|--------|----------------------------|---------------------|--------------------|
| SC-A1  |                            |                     |                    |
| ...    |                            |                     |                    |

Totals: passed __ / failed __ / N-A __   (every N-A needs a written reason)
Decision: PASS | FAIL        Approver:
```
