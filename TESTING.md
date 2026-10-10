# RedTaxi — Phase Testing and Gate Document

> Part of the RedTaxi delivery pack. Start at [README.md](README.md).
> Related: [IMPLEMENTATION.md](IMPLEMENTATION.md) (what each phase builds) · [PIPELINE.md](PIPELINE.md) (where tests run) · [SECURITY_CHECK.md](SECURITY_CHECK.md) · [VULNERABILITY.md](VULNERABILITY.md)

## 1. The Gate Policy (read this first)

> **A phase is complete only if its gate is 100% green. If any must-pass item fails, you do not start the next phase.**

| Rule | Meaning |
|------|---------|
| G-1 | Every gate has **automated** tests (`T`) and **manual** checks (`M`). All `Must` items must pass. |
| G-2 | A failed item → stop, fix, re-run the **whole** gate (not just the failed test). |
| G-3 | **Regression:** gate N also re-runs gates 0…N-1 automated suites. A later phase that breaks an earlier one fails. |
| G-4 | **No skipping, no "pass with exceptions".** Only a documented *waiver* signed by the product owner, listed in the sign-off file, may waive a `Should` item. `Must` items cannot be waived. |
| G-5 | Passing writes `signoff/phase-N.passed` (commit SHA + timestamp). `scripts/start-phase.sh N+1` refuses to run without it. |
| G-6 | A gate result is valid only for the commit it ran on. New commits on that phase → re-run. |
| G-7 | Open defects: **zero Sev-1 / Sev-2**; Sev-3 allowed only if logged and not in the phase's own flow. |

### How to run a gate

```bash
scripts/start-phase.sh 4        # checks signoff/phase-3.passed exists, else REFUSES
# ... build phase 4 ...
cp signoff/TEMPLATE.md signoff/phase-4.md   # fill manual checks (M-items), tick every box
scripts/gate.sh 4               # runs phase-4 commands + regression of 0..3, checks sign-off, stamps pass
```

`scripts/gate.sh` reads commands from [`scripts/gates.conf`](scripts/gates.conf). Edit the commands once to match your real package names; the policy stays the same.

### Severity

| Sev | Definition | Example |
|-----|------------|---------|
| 1 | Money, safety or data loss; app unusable | Wrong fare charged; SOS fails; booking confirmed without payment |
| 2 | Core flow broken or security weakness | Cannot log in; role bypass; OTP not enforced |
| 3 | Workaround exists | Marker jitter; wrong empty-state text |
| 4 | Cosmetic | Spacing off by 2 px |

## 2. Tooling

| Layer | Web | Mobile |
|-------|-----|--------|
| Unit | Vitest | Jest (`jest-expo`) |
| Component | React Testing Library + `@testing-library/jest-dom` | `@testing-library/react-native` |
| API mocking | MSW | MSW (node) |
| E2E | Playwright | **Maestro** (recommended; Detox is the alternative named in mobile spec §11) |
| Accessibility | `axe-core` via Playwright / jest-axe, manual screen reader | Manual VoiceOver/TalkBack, 200% font scale |
| Performance | Lighthouse CI, web-vitals | Manual on low-end Android; Flipper/React DevTools profiler |
| Contract | OpenAPI lint (Spectral) + Schemathesis | same |
| Load (Gate 8) | k6 | k6 (API side) |

## 3. Shared Test Data (taken from the designs)

Use these fixtures everywhere so a number on screen is always traceable to the spec.

| Fixture | Value |
|---------|-------|
| Sample trip | Pollachi Bus Stand → Palani Temple, **65.2 km**, **85 min** |
| Sedan tariff | ₹16/km, batta ₹300, toll est. ₹80, GST 5% |
| Expected fare lines (paise) | distance **104300**, batta **30000**, toll **8000**, GST **7100**, total **149400** |
| Deposit | 25% of 1,494 = 373.50 → minimum ₹500 applies → pay now **50000**, pay at drop **99400** |
| Driver | Selvam Kumar, ★ 4.8, `TN 37 BY 1234`, Sedan |
| Passenger | Ravi Kumar, ★ 4.9 |
| Phones | valid `9876543210`, invalid `5876543210`, `98765`, `98765432101` |
| Analytics | revenue ₹2,48,500, bookings 342, completed 310, cancelled 22 → completion **90.6%** |
| Weekly earnings | ₹12,850, 18 trips, 32h 10m |
| Pricing form | ₹16.00 → 1600 paise; ₹350.00 → 35000 paise |

> Note: the web spec shows completion rate 90.8% but 310 ÷ 342 = 90.6%. Tests assert **90.6%** (DEC-7).

---

## Gate 0: Decisions and Workspace

**Entry:** project kicked off. **Maps to:** [Phase 0](IMPLEMENTATION.md#phase-0-decisions-and-workspace)

| ID | Test | Tool | Must |
|----|------|------|------|
| T0.1 | `pnpm install --frozen-lockfile` succeeds on a clean checkout | CI | ✔ |
| T0.2 | Lint + typecheck pass on all workspaces (strict TS flags on) | ESLint, tsc | ✔ |
| T0.3 | `docs/DECISIONS.md` has **no** `PROPOSED` rows (all 16 `DECIDED`) | grep | ✔ |
| T0.4 | Env validation: booting web with a missing `SESSION_SECRET` throws; with all vars set boots | Vitest | ✔ |
| T0.5 | Secret scan clean on full git history | gitleaks | ✔ |
| T0.6 | CI workflow runs green on a PR; `main` is branch-protected | GitHub | ✔ |
| M0.1 | Product owner, design, ops, and backend owner each signed DEC-1…16 | review | ✔ |
| M0.2 | Maps keys restricted (referrer / app); Razorpay **test** keys only; secrets in manager, not repo | console check | ✔ |
| M0.3 | Backend owner named (DEC-12) or written decision "mock-only demo" | review | ✔ |

**Exit:** all ✔ → `scripts/gate.sh 0`.

---

## Gate 1: Shared Core and API Contract

**Maps to:** [Phase 1](IMPLEMENTATION.md#phase-1-shared-core-and-api-contract)

| ID | Test | Expected | Must |
|----|------|----------|------|
| T1.1 | `computeFare` sample (65.2 km, ₹16, batta 300, toll 80) | lines 1043 / 300 / 80, GST 71, **total 1494** (paise ×100) | ✔ |
| T1.2 | Fare edges: `minKm` raises billable km; night allowance added before GST; each line rounded; distance 0; negative input rejected | as stated | ✔ |
| T1.3 | Deposit: total 149400 → payNow 50000 / payAtDrop 99400; total 1000000 → 25% = 250000; `full` option | correct | ✔ |
| T1.4 | **Property test:** for 10,000 random quotes `payNow + payAtDrop == total` and all values are integers | always true | ✔ |
| T1.5 | `inr(149400)` → `₹1,494`; `inr(24850000)` → `₹2,48,500` (Indian grouping) | exact | ✔ |
| T1.6 | `km(65.2)` → `65.2 km`; `dur(85)` → `1 hr 25 min`; `dur(45)` → `45 min`; `dur(120)` → `2 hr` | exact | ✔ |
| T1.7 | State machine: full N×N matrix — every allowed edge accepted, every other edge rejected; `completed` and `cancelled` have no exits | matrix | ✔ |
| T1.8 | Unified status enum used by schemas, mock API and both apps (no `ongoing` anywhere) | grep + types | ✔ |
| T1.9 | Zod: phone `^[6-9]\d{9}$` accepts `9876543210`, rejects fixtures above; login OTP 6 digits; ride OTP 4 digits | table test | ✔ |
| T1.10 | OpenAPI passes Spectral lint; every endpoint in [Appendix B](IMPLEMENTATION.md#appendix-b-unified-api-contract) exists | Spectral | ✔ |
| T1.11 | Mock API passes contract test (Schemathesis) with 0 failures | Schemathesis | ✔ |
| T1.12 | Mock API **ignores client-sent amounts** and recomputes; rejects illegal state transitions with `{code,message}` | integration | ✔ |
| T1.13 | Quote expires after 15 min (fake timers); booking from expired quote → error | integration | ✔ |
| T1.14 | Coverage: `fare.ts`, `rideMachine.ts`, `deposit.ts` = **100%** lines/branches; `packages/shared` ≥ 90% | Vitest | ✔ |
| T1.15 | `apps/web` and `apps/mobile` both build while importing `@redtaxi/shared` | build | ✔ |
| M1.1 | Finance/ops reviewed the fare table (DEC-1, DEC-2, DEC-5) against the real tariff sheet | review | ✔ |
| M1.2 | Backend owner reviewed `openapi.yaml` | review | ✔ |

---

## Gate 2: Design System and App Shells

**Maps to:** [Phase 2](IMPLEMENTATION.md#phase-2-design-system-and-app-shells)

| ID | Test | Expected | Must |
|----|------|----------|------|
| T2.1 | Tokens: Tailwind theme values equal `theme/tokens.ts` values (snapshot) | identical | ✔ |
| T2.2 | Each shared web component renders in **default / focus-visible / disabled / loading / error** | RTL | ✔ |
| T2.3 | Each shared mobile component renders in the same states | RNTL | ✔ |
| T2.4 | axe on `/_dev/ui`: **0 serious/critical** violations | jest-axe/Playwright | ✔ |
| T2.5 | Contrast unit test: body/ink on background/surface ≥ 4.5:1; white-on-accent flagged large/bold only; `muted` never used for essential text | script | ✔ |
| T2.6 | `OtpInput`: 4 and 6 digits, auto-advance, backspace goes back, paste fills, `aria-label="Digit 1 of 4"` | RTL | ✔ |
| T2.7 | `DataTable`: sort, pagination, empty, loading with `aria-busy` | RTL | ✔ |
| T2.8 | `ConfirmDialog` traps focus, Esc closes, returns focus | RTL | ✔ |
| T2.9 | Layouts at 360 / 768 / 1024 / 1280 / 1536: nav collapses, sidebar → bottom bar/drawer, no horizontal page scroll | Playwright | ✔ |
| T2.10 | Skip link is first tab stop and works | Playwright | ✔ |
| T2.11 | Mobile touch targets ≥ 44×44 on Button, ListRow, Tabs, icon buttons | RNTL | ✔ |
| T2.12 | No `dangerouslySetInnerHTML` (ESLint rule enforced) | ESLint | ✔ |
| T2.13 | Web and mobile production builds succeed | build | ✔ |
| M2.1 | Visual comparison with collage + storyboard palette/typography signed by design | review | ✔ |
| M2.2 | Keyboard-only walk through gallery page | manual | ✔ |
| M2.3 | VoiceOver and TalkBack read AppBar, Button, StatusBadge, Toggle correctly | manual | ✔ |
| M2.4 | Mobile at 200% font scale: no clipped text in the gallery | manual | ✔ |

---

## Gate 3: Authentication and Roles

**Maps to:** [Phase 3](IMPLEMENTATION.md#phase-3-authentication-and-roles) · **Security subset:** SC-A1…A6, SC-B1, SC-B6, SC-G1

| ID | Test | Expected | Must |
|----|------|----------|------|
| T3.1 | Phone validation on web + mobile uses shared schema; button disabled until valid | table | ✔ |
| T3.2 | OTP happy path: send → verify → session | MSW | ✔ |
| T3.3 | Resend timer 30 s (fake timers); resend before 0 blocked | RTL | ✔ |
| T3.4 | Wrong OTP → inline error; expired OTP → error; **5th wrong attempt locks** | integration | ✔ |
| T3.5 | Middleware matrix: {anonymous, passenger, driver, admin} × {`/admin`, `/driver`, `/bookings/x`, `/book/payment`, `/`} — redirect or allow exactly as spec §7.2 | table | ✔ |
| T3.6 | **`?next=` is sanitised:** `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:` all fall back to a safe default; `/driver` is kept | table | ✔ |
| T3.7 | Session cookie has **HttpOnly; Secure; SameSite=Lax**; token is not present in `document.cookie`, `localStorage`, or response JSON | integration | ✔ |
| T3.8 | 401 → refresh **once** → retry; second 401 → cookies cleared, redirect to right login | MSW | ✔ |
| T3.9 | Admin login: wrong password and unknown email return the **same** message; lockout after N failures; MFA step required | integration | ✔ |
| T3.10 | Mobile tokens are written to SecureStore only (AsyncStorage mock asserts no token writes) | Jest | ✔ |
| T3.11 | Splash routing: first launch → onboarding; valid token → home; refresh failure → login | RNTL | ✔ |
| T3.12 | Apple login button rendered on iOS only | RNTL | ✔ |
| T3.13 | Logout clears cookies / SecureStore, closes sockets, resets stores | integration | ✔ |
| T3.14 | Unapproved driver lands on pending page, not dashboard | RTL/RNTL | ✔ |
| T3.15 | E2E: passenger login; driver login → pending page; admin login with MFA | Playwright | ✔ |
| T3.16 | Phase subset of [SECURITY_CHECK.md](SECURITY_CHECK.md) (items tagged G3) passes | script | ✔ |
| M3.1 | Real SMS OTP received on a device through the staging provider (if provider chosen) | manual | ☐ Should |
| M3.2 | Google/Apple sign-in on a **dev build** (not Expo Go) | manual | ✔ |

---

## Gate 4: Passenger Booking and Payment

**Maps to:** [Phase 4](IMPLEMENTATION.md#phase-4-passenger-booking-and-payment) · **Security subset:** SC-C1…C6

| ID | Test | Expected | Must |
|----|------|----------|------|
| T4.1 | WP1 server-renders fleet from `/vehicles`; JSON-LD valid; OG tags present | Playwright | ✔ |
| T4.2 | Lighthouse: landing **LCP < 2.5 s** (mobile profile) | Lighthouse CI | ✔ |
| T4.3 | Places autocomplete restricted to India; outside-service-area message shown | RTL (mock) | ✔ |
| T4.4 | WP2 filter chips filter; Select stores `vehicleId` and navigates; Tempo chip → empty state; unavailable vehicle disabled with reason | RTL | ✔ |
| T4.5 | WP3: past date blocked; Round Trip shows return date; swap works; place change → **one** quote call per 400 ms burst | fake timers | ✔ |
| T4.6 | WP3 error states: route not found, no service, map key failure → text summary | RTL | ✔ |
| T4.7 | WP4 shows lines exactly as server returns; sample renders **₹1,494.00**, pay now ₹500 / at drop ₹994 | E2E | ✔ |
| T4.8 | Quote countdown; at 0 button disabled and Refresh shown; refresh gets new `validUntil` | fake timers | ✔ |
| T4.9 | Payment choice is a `radiogroup`; arrow keys work | RTL | ✔ |
| T4.10 | WP5 **Pay** disabled until T&C ticked **and** a method chosen; amount on button = selected `payNow` | RTL | ✔ |
| T4.11 | Order → Razorpay (mocked) → verify → **only then** the "Booking Confirmed" state with booking code | integration | ✔ |
| T4.12 | "Booking Confirmed" is **never** visible before verify (DEC-10) | RTL | ✔ |
| T4.13 | Payment failure: inline error + Retry, quote kept; **new** idempotency key per attempt; double-click sends **one** request | integration | ✔ |
| T4.14 | Closed checkout and network drop after payment → order status polled → correct final state | integration | ✔ |
| T4.15 | Tampered request (client sends amount 1) → server uses quote amount | integration | ✔ |
| T4.16 | Mobile MP4–MP8 RNTL flows; "Pay at Pickup" disabled with explanation when ineligible | RNTL | ✔ |
| T4.17 | Mobile: kill app mid-payment → relaunch polls order and resumes | RNTL | ✔ |
| T4.18 | Fare Quote screen shows **no** "(₹14.90 / km)" caption (DEC-1) | RNTL | ✔ |
| T4.19 | axe: 0 serious/critical on WP1–WP5 | Playwright | ✔ |
| T4.20 | **E2E web:** land → search → vehicle → route → fare → pay (Razorpay test mode) → confirmed | Playwright | ✔ |
| T4.21 | **E2E mobile:** onboarding → login → home → location → vehicle → quote → pay → tracking | Maestro | ✔ |
| T4.22 | Security subset (tag G4) passes | script | ✔ |
| M4.1 | Real Razorpay **test-mode** payment with UPI and card test credentials | manual | ✔ |
| M4.2 | Run MP flow on a low-end Android and a small iPhone | manual | ✔ |
| M4.3 | Product-owner walkthrough vs collage/storyboard | demo | ✔ |

---

## Gate 5: Live Tracking and Trip Completion

**Maps to:** [Phase 5](IMPLEMENTATION.md#phase-5-live-tracking-and-trip-completion) · **Security subset:** SC-E1…E4, SC-B2, SC-B4, SC-F1

| ID | Test | Expected | Must |
|----|------|----------|------|
| T5.1 | Socket authenticates; subscribes only to own booking room; `booking.status` / `driver.location` update TanStack cache | integration | ✔ |
| T5.2 | Socket killed → polling every 5–10 s takes over; reconnect resumes sockets | integration | ✔ |
| T5.3 | Status → screen map: `driver_assigned`/`driver_arriving` → tracking; `driver_arrived` → arrival banner; `in_progress` → trip view; `completed` → complete | table | ✔ |
| T5.4 | Start OTP (4 digits) visible to the **passenger only** | RTL + API | ✔ |
| T5.5 | Marker moves smoothly (no jump > threshold between updates); ETA text updates | RTL | ✔ |
| T5.6 | SOS: confirm → `POST /sos` → confirmation; on mobile offline → queued → retried; haptic fired | RNTL | ✔ |
| T5.7 | Share creates tokenised public link; public view shows **no** phone, no full name, no payment data; expires at trip end | integration | ✔ |
| T5.8 | Cancel sheet requires reason; driver cancels → UI returns to "searching" | integration | ✔ |
| T5.9 | Connection-lost and driver-offline banners | RTL | ✔ |
| T5.10 | Rating: stars required; comment ≤ 500; submit → thank-you; balance due shown when `due > 0` | RTL | ✔ |
| T5.11 | Completion copy reads "completed", not "booked" (DEC-10) | RTL | ✔ |
| T5.12 | Mobile active-ride resume after kill/restart | RNTL | ✔ |
| T5.13 | **E2E with driver simulator:** tracking → arrived → in progress → completed → rating | Playwright + Maestro | ✔ |
| T5.14 | Gate 3–4 regression green | CI | ✔ |
| M5.1 | Two real devices (passenger + driver) see each other's state in real time | manual | ✔ |
| M5.2 | SOS drill in staging (no real emergency contacts): admin receives `sos.alert` | manual | ✔ |

---

## Gate 6: Driver Experience

**Maps to:** [Phase 6](IMPLEMENTATION.md#phase-6-driver-experience) · **Security subset:** SC-B3, SC-B5, SC-F3, SC-F4, SC-G2

| ID | Test | Expected | Must |
|----|------|----------|------|
| T6.1 | Go-online blocked when any document is unverified or expired, with reason shown | RTL | ✔ |
| T6.2 | Offer countdown uses server `expiresAt` (inject 5 s clock skew — still correct); auto-decline at 0 | fake timers | ✔ |
| T6.3 | Two drivers accept the same offer concurrently → exactly one wins; the other sees "Trip no longer available" | integration | ✔ |
| T6.4 | Arrived screen: 4 boxes, auto-advance, paste, backspace; button disabled until 4 digits; **5 wrong attempts lock** | RTL | ✔ |
| T6.5 | Correct OTP → status `in_progress` | integration | ✔ |
| T6.6 | Complete screen amount to collect = total − paid (**₹994** for the sample) | RTL | ✔ |
| T6.7 | Odometer field numeric only | RTL | ✔ |
| T6.8 | Location posting throttled (not more than 1 per N s); web shows warning when tab hidden | fake timers | ✔ |
| T6.9 | Mobile config: foreground-service location, background location **only** while online; iOS usage strings present and specific | config test | ✔ |
| T6.10 | Earnings: range switch, bar tooltip, accessible table fallback, empty state "No trips this week" | RTL | ✔ |
| T6.11 | Document upload rejects wrong type, oversize, and renamed `.exe`/`.html` as `.pdf` (magic-byte check server-side) | integration | ✔ |
| T6.12 | Bank details show last 4 only everywhere (DOM + API payload) | integration | ✔ |
| T6.13 | Browser notification permission requested at go-online, not on page load | RTL | ✔ |
| T6.14 | Call/Message use masked numbers; real passenger phone absent from driver payload | integration | ✔ |
| T6.15 | **E2E web:** driver accepts → OTP → completes. **E2E mobile (Maestro):** same | Playwright, Maestro | ✔ |
| T6.16 | Gate 0–5 regression green | CI | ✔ |
| M6.1 | 15-minute real GPS drive: path plausible on passenger tracking | manual | ✔ |
| M6.2 | Android battery optimisation / background behaviour checked while online | manual | ✔ |
| M6.3 | Permission dialogs read correctly on iOS and Android | manual | ✔ |

---

## Gate 7: Admin Operations and Demo Security Run

**Maps to:** [Phase 7](IMPLEMENTATION.md#phase-7-admin-operations) · **This gate marks the Demo.**

| ID | Test | Expected | Must |
|----|------|----------|------|
| T7.1 | Admin shell nav, drawer on small screens; non-admin cannot reach any `/admin/*` route or `/admin` API | table | ✔ |
| T7.2 | Dashboard tiles show defined metrics (DEC-6); each tile links to the right filtered list; 30 s refresh; date is today's real date | RTL | ✔ |
| T7.3 | Drivers: server-side pagination/sort; search debounced; tabs filter | integration | ✔ |
| T7.4 | Verification: Approve disabled until all docs verified; Reject needs a reason; each action creates an **audit entry** (actor, target, before/after, time) | integration | ✔ |
| T7.5 | Bookings: tabs, search, + New Booking validation; detail timeline; reassign/cancel/refund require confirm and are audited | integration | ✔ |
| T7.6 | Dispatch: nearby drivers sorted ascending by distance; offline disabled; Assign confirms; `dispatch.update` moves markers | integration | ✔ |
| T7.7 | Pricing: dirty state; diff dialog lists old → new; validation (rate > 0, batta ≥ 0, deposit 0–100); ₹16.00 ↔ 1600 paise round-trip exact | RTL | ✔ |
| T7.8 | **Pricing change affects new quotes only** — existing quote total unchanged | integration | ✔ |
| T7.9 | Tickets ordered by priority then age; detail; resolve | RTL | ✔ |
| T7.10 | Analytics: completion rate **90.6%** for 310/342; % change vs previous period; line chart has table fallback | RTL | ✔ |
| T7.11 | CSV export neutralises cells starting with `=`, `+`, `-`, `@` | unit | ✔ |
| T7.12 | Audit log is read-only: no update/delete endpoint exists | contract | ✔ |
| T7.13 | Mobile MA1–MA10 parity tests; Expo Web renders admin responsively | RNTL | ✔ |
| T7.14 | **E2E:** admin approves a driver and assigns a booking (web); Maestro for mobile admin | Playwright, Maestro | ✔ |
| T7.15 | Gate 0–6 regression green | CI | ✔ |
| **S7** | **Demo Security Run:** every item tagged `D` in [SECURITY_CHECK.md](SECURITY_CHECK.md) passes; log in `docs/SECURITY_RUN_LOG.md` | script + manual | ✔ |
| **V7** | Quick scans `VU-S1` (dependencies), `VU-S2` (secrets), `VU-S3` (SAST): **no Critical/High** open | CI | ✔ |
| M7.1 | Operations lead walks through all admin flows | demo | ✔ |
| M7.2 | 10,000-row driver/booking dataset: pages stay responsive | manual | ☐ Should |

---

## Gate 8: Real Backend Integration

**Maps to:** [Phase 8](IMPLEMENTATION.md#phase-8-real-backend-integration-and-notifications) · **Security subset:** all `R` items

| ID | Test | Expected | Must |
|----|------|----------|------|
| T8.1 | Contract test of staging vs `openapi.yaml` | 0 failures | ✔ |
| T8.2 | **All E2E from Gates 4–7 re-run against staging** (mock off) | green | ✔ |
| T8.3 | Razorpay webhook: valid signature accepted; forged signature rejected; **replay twice → one state change** | integration | ✔ |
| T8.4 | Payment reconciliation: every paid order maps to exactly one booking; no orphan | job report | ✔ |
| T8.5 | Push notification delivered on real iOS and Android (offer, assignment, arrival, completion) | manual+device | ✔ |
| T8.6 | Maps/Directions calls stay within quota; key restrictions verified; billing alert set | console | ✔ |
| T8.7 | All times display in IST; DST-free; scheduled bookings correct | RTL | ✔ |
| T8.8 | Load test: 200 concurrent passengers, p95 read < 500 ms, error rate < 1% (targets are assumptions — set real ones) | k6 | ✔ |
| T8.9 | Socket test: 500 concurrent connections, no dropped status events | k6/ws | ✔ |
| T8.10 | Rate limits work against the real gateway: OTP send, OTP verify, admin login | script | ✔ |
| M8.1 | UAT scripts executed by non-developers on real devices | manual | ✔ |
| M8.2 | Refund path tested end-to-end in Razorpay test mode | manual | ✔ |

---

## Gate 9: Hardening

**Maps to:** [Phase 9](IMPLEMENTATION.md#phase-9-hardening-security-vulnerabilities-performance-accessibility-privacy)

| ID | Test | Expected | Must |
|----|------|----------|------|
| T9.1 | **Full Security Check** ([SECURITY_CHECK.md](SECURITY_CHECK.md)): all `D` and `R` items pass | 0 fails | ✔ |
| T9.2 | **Full vulnerability programme** ([VULNERABILITY.md](VULNERABILITY.md)): all scans run, all `VU-T` tests run; **0 Critical, 0 High open**; Medium have owner + date | register | ✔ |
| T9.3 | axe on **every** page: 0 serious/critical; manual screen-reader pass of passenger booking, driver trip, admin verification | Playwright + manual | ✔ |
| T9.4 | Performance: landing LCP < 2.5 s; maps and charts code-split (bundle analysis shows separate chunks); admin tables server-paginated | Lighthouse, analyzer | ✔ |
| T9.5 | Mobile: 200% font scale, low-end Android, slow 3G profile — flows complete, no clipping | manual | ✔ |
| T9.6 | Offline/expired-session behaviour: offline banner, redirect to login, state preserved | E2E | ✔ |
| T9.7 | Privacy: Terms/consent before payment; privacy policy page; data-deletion request path works; cookie banner | E2E | ✔ |
| T9.8 | 404 and 500 pages; every list has empty + error state | Playwright | ✔ |
| T9.9 | Sentry receives a test error with readable stack (source maps) for web and mobile | manual | ✔ |
| T9.10 | CSP in enforce mode with **0 violations** across the E2E suite | Playwright | ✔ |
| T9.11 | Gate 0–8 regression green | CI | ✔ |

---

## Gate 10: Release

**Maps to:** [Phase 10](IMPLEMENTATION.md#phase-10-release-and-launch)

| ID | Test | Expected | Must |
|----|------|----------|------|
| T10.1 | Production build is reproducible from a tag; smoke suite green on prod-like staging | CI | ✔ |
| T10.2 | Rollback drill executed: web previous build restored; EAS Update rolled back — time recorded | drill | ✔ |
| T10.3 | Feature flags default to the intended launch state; staged-rollout plan written | review | ✔ |
| T10.4 | Store readiness: privacy policy URL, data-safety form, permission justifications, driver background-location review text | checklist | ✔ |
| T10.5 | Monitoring: dashboards + alerts for error rate, payment failures, socket disconnects, OTP spikes | manual | ✔ |
| T10.6 | Security Check and Vulnerability register final sign-offs attached to the release | sign-off | ✔ |
| T10.7 | **Post-deploy smoke** on production (login, quote, a ₹1 or test-flagged booking if possible, admin read) | script | ✔ |
| T10.8 | `scripts/security-smoke.sh` against production URL passes | script | ✔ |
| M10.1 | Product-owner and operations UAT sign-off | sign-off | ✔ |

---

## 4. Device and Browser Matrix

| Area | Minimum |
|------|---------|
| Web browsers | Latest Chrome, Safari, Firefox, Edge; Chrome Android; Safari iOS |
| Web viewports | 360, 768, 1024, 1280, 1536 |
| Mobile devices | Low-end Android (≤ 3 GB RAM), large Android, small iPhone, current iPhone |
| Network | Fast, slow 3G, offline mid-flow |
| Accessibility | VoiceOver, TalkBack, NVDA or JAWS on web, keyboard-only |

## 5. Sign-off File

Each gate needs `signoff/phase-N.md` (copy of [`signoff/TEMPLATE.md`](signoff/TEMPLATE.md)) with every manual check ticked, evidence linked and the approver named. `scripts/gate.sh` fails if any `- [ ]` remains.

## 6. When a Gate Fails

1. Stay in the phase. Do **not** start building the next one.
2. Log the failure (test ID, commit, owner) in the sign-off file under *Failures*.
3. Fix the cause (not the test). Add a regression test if the failure was not covered.
4. Re-run the **entire** gate.
5. If the failure is a security finding, also add it to `docs/VULN_REGISTER.md` and follow [VULNERABILITY.md](VULNERABILITY.md) §Triage.
