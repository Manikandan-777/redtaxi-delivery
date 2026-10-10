# RedTaxi Delivery Pack

Build plan, pipeline, tests, security check and vulnerability programme for the **RedTaxi Pollachi** platform:

- **Web app** — Next.js + TypeScript, 24 screens (Passenger 7, Driver 9, Admin 8)
- **Mobile app** — Expo + TypeScript, 32 screens (Passenger 11, Driver 11, Admin 10)

Both are built from the two specs in [`specs/`](specs/) and share one domain core and one API contract.

## The five documents — and how they connect

| # | File | Answers | Links to |
|---|------|---------|----------|
| 1 | [IMPLEMENTATION.md](IMPLEMENTATION.md) | **What do I build, in what order?** 11 phases (0–10) with tasks, spec references, security/vuln hooks | each phase → its gate in TESTING, its `SC-*` and `VU-*` items |
| 2 | [PIPELINE.md](PIPELINE.md) | **How does it go from start to production?** CI, security pipeline, environments, web + mobile delivery, rollback | phases ↔ stages ↔ gates; workflows in `.github/` |
| 3 | [TESTING.md](TESTING.md) | **Is this phase really finished?** Gates 0–10, pass/fail rules, test IDs | each gate → its phase; Gate 7/9 require files 4 and 5 |
| 4 | [SECURITY_CHECK.md](SECURITY_CHECK.md) | **After the demo: is every promised protection working?** 43 checks (`SC-*`) | runs at Gate 7 (demo) and Gate 9 (full); findings → file 5 |
| 5 | [VULNERABILITY.md](VULNERABILITY.md) | **Can it still be broken?** 9 scans (`VU-S*`), 22 attack tests (`VU-T*`), 15 spec-review findings (`VR-*`) | findings → register → fix in file 1 → new test in file 3 → new check in file 4 |

```
        ┌─────────────── IMPLEMENTATION (what to build) ◀──────────────┐
        │                      │ each phase ends at a                  │ fix in the
        │                      ▼                                       │ owning phase
        │                TESTING gate  ◀──── PIPELINE runs & enforces  │
        │                  │      │                                    │
        │     (Gate 7, 9)  ▼      ▼  (Gate 7, 9)                       │
        │         SECURITY_CHECK   VULNERABILITY ── finding ──▶ VULN_REGISTER
        │         "is it on?"      "can I break it?" ──────────────────┘
        └─ phase N+1 starts ONLY after gate N passes (scripts/gate.sh)
```

## The one rule

> **A phase is finished only when its gate passes. If it fails, you do not move on.**
> `scripts/start-phase.sh N` refuses to run without `signoff/phase-(N-1).passed`; `scripts/gate.sh N` only writes that stamp when every automated command succeeds, earlier phases still pass (regression), every manual sign-off box is ticked and an approver is named.

## Master traceability matrix

| Phase | What it builds ([IMPLEMENTATION](IMPLEMENTATION.md)) | Gate ([TESTING](TESTING.md)) | Security checks ([SECURITY_CHECK](SECURITY_CHECK.md)) | Vulnerability items ([VULNERABILITY](VULNERABILITY.md)) | Pipeline stage ([PIPELINE](PIPELINE.md)) |
|------:|------------------------------|------|------------------------|-----------------------------|----------|
| 0 | Decisions, workspace, CI skeleton | [G0](TESTING.md#gate-0-decisions-and-workspace) | SC-D6, SC-F2 | VU-S2, VU-T22 | 1–2 |
| 1 | Shared core, OpenAPI, mock API | [G1](TESTING.md#gate-1-shared-core-and-api-contract) | SC-C1, SC-H1 | VU-T3, T4, S9 · VR-4, VR-5 | 3 |
| 2 | Design system, shells | [G2](TESTING.md#gate-2-design-system-and-app-shells) | SC-H2, SC-D2 | VU-S3 | 4 |
| 3 | Auth, roles | [G3](TESTING.md#gate-3-authentication-and-roles) | SC-A1–A6, B1, B6, G1, H3 | VU-T2, T6, T14, T15, T18 · VR-1, 2, 7, 8, 11 | 5 |
| 4 | Passenger booking + payment | [G4](TESTING.md#gate-4-passenger-booking-and-payment) | SC-C1–C6, D5, F5, H1 | VU-T3, T4, T5, T20 · VR-10 | 6 |
| 5 | Live tracking + completion | [G5](TESTING.md#gate-5-live-tracking-and-trip-completion) | SC-E1–E4, B2, B4, F1 | VU-T8, T11, T16, T17 · VR-3, VR-6 | 7 |
| 6 | Driver | [G6](TESTING.md#gate-6-driver-experience) | SC-B3, B5, C5, E2, F3, F4, G2 | VU-T4, T10, T12, T16, T19 · VR-9, VR-15 | 8 |
| 7 | Admin → **DEMO** | [G7](TESTING.md#gate-7-admin-operations-and-demo-security-run) | **Demo Security Run (all `D`)** | **Quick scans VU-S1, S2, S3** · VU-T1, T9, T12, T13, T21 · VR-12, VR-14 | 9 |
| 8 | Real backend, push | [G8](TESTING.md#gate-8-real-backend-integration) | all `R` items | VU-T5, T15, T20, S5 · VR-13 | 10 |
| 9 | Hardening | [G9](TESTING.md#gate-9-hardening) | **Full run (all SC)** | **Full programme (all VU-S, VU-T)** | 11 |
| 10 | Release | [G10](TESTING.md#gate-10-release) | production smoke | VU-S7, S8 | 12–13 |

## Folder map

```
README.md                 ← you are here
IMPLEMENTATION.md         phases 0–10, screen map (56 screens), decision register, unified API
PIPELINE.md               start-to-end pipeline, CI/CD, environments, rollback
TESTING.md                gates 0–10, pass/fail policy, shared test data
SECURITY_CHECK.md         SC-A … SC-H checks, Demo/Full run protocol
VULNERABILITY.md          VU-S scans, VU-T attack tests, VR findings, triage
specs/                    your two original spec files (unchanged)
docs/DECISIONS.md         Phase-0 decision register (Gate 0 fails while any row is PROPOSED)
docs/VULN_REGISTER.md     findings register, pre-seeded with VR-1…VR-15
docs/SECURITY_RUN_LOG.md  where each Security Check run is recorded
scripts/gate.sh           run a gate; writes signoff/phase-N.passed only on full pass
scripts/start-phase.sh    refuses to start phase N until gate N-1 passed
scripts/gates.conf        the automated commands per gate (edit to match your repo)
scripts/security-smoke.sh automatable subset of SECURITY_CHECK (headers, role walls, proxy, CORS, rate limit)
signoff/TEMPLATE.md       manual sign-off template (one file per phase)
.github/workflows/        ci.yml · security.yml · eas.yml
```

## Quick start

```bash
# 1. Phase 0
scripts/start-phase.sh 0
#    fill docs/DECISIONS.md, scaffold the workspace (IMPLEMENTATION.md → Phase 0)
cp signoff/TEMPLATE.md signoff/phase-0.md   # tick manual checks, name the approver
scripts/gate.sh 0                           # PASS → signoff/phase-0.passed

# 2. Each following phase N
scripts/start-phase.sh N                    # refuses if gate N-1 hasn't passed
#    build it, following IMPLEMENTATION.md → Phase N
scripts/gate.sh N                           # fix & re-run until it passes

# 3. After Phase 7 (the demo): record a "Run: Demo" block in docs/SECURITY_RUN_LOG.md
#    using SECURITY_CHECK.md, then gate 7.
```

## What was verified in this pack, and what was not

**Verified (I ran them):** the gate scripts block out-of-order phases, fail on unticked sign-off boxes or a missing approver, fail on a failing command and only stamp on a full pass; `security-smoke.sh` passes 14/14 on a hardened mock server and fails on a bare one; all three workflow files parse as YAML; every cross-document `SC-*`, `VU-*`, `VR-*`, `DEC-*` reference resolves to a definition.

**Not verified / needs your input:**
1. **This pack is the plan and the enforcement tooling, not the application code.** No screens were generated.
2. **The backend is not defined by the specs** (they only suggest a contract). Phase 8 is blocked until decision DEC-12 names an owner; until then the mock API gives you a demo.
3. `scripts/gates.conf` commands (e.g. `pnpm contract:lint`, `pnpm --filter @redtaxi/web test:e2e`) assume package names and npm scripts **you create in Phases 0–2**. Adjust them to your repo; the policy stays the same.
4. Tool versions and CLI flags (Next, Expo SDK, Semgrep, ZAP, Trivy, GitHub Actions) change. Check current docs and pin actions by SHA before relying on the workflows.
5. Numeric targets (load-test volumes, p95 latency, lockout counts, rate-limit thresholds, SLA days) are sensible starting values, not requirements from your specs. Set real ones.

## Issues found in the specs while preparing this pack

Beyond the mismatches the specs already list (web §14, mobile §15):

| Found | Where handled |
|-------|---------------|
| Status enums differ between web (`ongoing`) and mobile (`in_progress`, `no_driver`) | DEC-8 |
| Endpoint and event names differ (`/bookings` vs `/rides`, `booking.status` vs `ride.status`) | DEC-9 |
| Web fare code uses rupee floats while the model uses branded paise | VR-5, Phase 1 task 1.2 |
| Screen IDs clash (web admin `A1` vs mobile passenger `A1`, etc.) | renamed `WP/WD/WA` and `MP/MD/MA` |
| 15 security risks visible in the spec text itself (open redirect, proxy SSRF, socket hijack, OTP leakage via shared type, GPS spoofing, SMS pumping, …) | [VULNERABILITY.md §6](VULNERABILITY.md), `docs/VULN_REGISTER.md` |
