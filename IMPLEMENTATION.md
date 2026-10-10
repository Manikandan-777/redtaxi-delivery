# RedTaxi — Phase-by-Phase Implementation Plan

> Part of the RedTaxi delivery pack. Start at [README.md](README.md).
> Related: [PIPELINE.md](PIPELINE.md) · [TESTING.md](TESTING.md) · [SECURITY_CHECK.md](SECURITY_CHECK.md) · [VULNERABILITY.md](VULNERABILITY.md)
> Sources: [Web spec](specs/REDTAXI_WEB_TYPESCRIPT_SPEC.md) · [Mobile spec](specs/REDTAXI_EXPO_MOBILE_SPEC.md)

This plan builds **one product** (RedTaxi Pollachi) as a **Next.js web app** (24 screens) and an **Expo mobile app** (32 screens), sharing one domain core and one API contract.

## 0. The Rules

1. **Gate rule.** A phase is finished only when its gate in [TESTING.md](TESTING.md) passes. If a gate fails, you stay in that phase, fix, and re-run. You never start phase N+1 until `signoff/phase-N.passed` exists. Enforced by [`scripts/gate.sh`](scripts/gate.sh) and [`scripts/start-phase.sh`](scripts/start-phase.sh).
2. **Server is the source of truth** for fare, quote validity, booking state, payment and OTP. Clients display; they never decide.
3. **Money is integer paise everywhere.** Rupees exist only in display strings and the admin pricing form (converted at the edge).
4. **One shared package** (`packages/shared`) feeds both apps. No duplicate fare/state/format logic.
5. **Security and vulnerability hooks** listed in each phase are part of the phase, not an afterthought. IDs (`SC-*`, `VU-*`) point into [SECURITY_CHECK.md](SECURITY_CHECK.md) and [VULNERABILITY.md](VULNERABILITY.md).
6. Tags used by the specs are kept: **[Observed]** read from the design, **[Assumed]** not drawn (confirm), **[Inferred]** deduced.

### Naming used in this pack (avoids the A/B/C clashes between the two specs)

| Prefix | Meaning | Spec IDs |
|--------|---------|----------|
| `WP1–WP7` | Web Passenger | Web P1–P7 |
| `WD1–WD9` | Web Driver | Web D1–D9 |
| `WA1–WA8` | Web Admin | Web A1–A8 |
| `MP1–MP11` | Mobile Passenger | Mobile A1–A11 |
| `MD1–MD11` | Mobile Driver | Mobile B1–B11 |
| `MA1–MA10` | Mobile Admin | Mobile C1–C10 |

---

## 1. Target Architecture

```
redtaxi/                          (pnpm workspace monorepo)
├─ apps/
│  ├─ web/                        Next.js App Router, TS strict, Tailwind, Radix  (web spec §2–3)
│  └─ mobile/                     Expo + Expo Router, APP_VARIANT=passenger|driver|admin (mobile spec §2)
├─ packages/
│  ├─ shared/                     domain types, zod schemas, fare.ts, format.ts, rideMachine.ts,
│  │                              tokens.ts, socket event names, error codes
│  └─ api-client/                 typed client generated from contracts/openapi.yaml
├─ services/
│  ├─ mock-api/                   MSW handlers + local mock server (demo without backend)
│  └─ api/                        REAL backend — not defined by the specs (see DEC-12)
├─ contracts/openapi.yaml         single API contract (web + mobile)
├─ docs/                          DECISIONS.md, VULN_REGISTER.md, SECURITY_RUN_LOG.md
├─ scripts/                       gate.sh, start-phase.sh, gates.conf, security-smoke.sh
├─ signoff/                       phase-N.md (manual sign-offs) + phase-N.passed stamps
└─ .github/workflows/             ci.yml, security.yml, eas.yml
```

Notes
- Expo inside a pnpm monorepo: set `node-linker=hoisted` in `.npmrc` (or follow the current Expo monorepo guide) and add `packages/shared` to Metro `watchFolders`. Verify against current Expo docs.
- Web uses the **BFF** pattern (HttpOnly cookies, route handlers proxy to the API). Mobile talks to the API directly with tokens in `expo-secure-store`. Both consume the same OpenAPI contract.
- Razorpay on mobile needs an **EAS development build**, not Expo Go (mobile spec §2).

## 2. Screen Inventory and Cross-Platform Mapping (56 screens)

| Flow | Web route | Web ID | Mobile screen | Mobile ID |
|------|-----------|--------|---------------|-----------|
| Splash / onboarding | — | — | Splash, Onboarding | MP1, MP2 |
| Passenger login | `/login` | (extra) | Login / OTP | MP3 |
| Home / landing | `/` | WP1 | Home | MP4 |
| Pickup/drop & route | `/book/route` | WP3 | Select Location | MP5 |
| Vehicle | `/book/vehicle` | WP2 | Choose a Vehicle | MP6 |
| Fare quote | `/book/fare` | WP4 | Fare Quote | MP7 |
| Payment | `/book/payment` | WP5 | Payment | MP8 |
| Live tracking | `/bookings/[id]/track` | WP6 | Ride Tracking | MP9 |
| Trip in progress | (same page, ongoing view) | WP6 | Trip In Progress | MP10 |
| Complete + rating | `/bookings/[id]/complete` | WP7 | Ride Completed | MP11 |
| Driver splash | — | — | Splash | MD1 |
| Driver login | `/driver/login` | WD1 | Login / OTP | MD2 |
| Driver dashboard | `/driver` | WD2 | Dashboard | MD3 |
| Incoming offer | modal + `/driver/offers` | WD3 | Incoming Offer | MD4 |
| Trip accepted | `/driver/trips/[id]/accepted` | WD4 | Trip Details | MD5 |
| Navigate to pickup | (button opens Google Maps) | WD4 | Navigate to Pickup | MD6 |
| Arrived + OTP | `/driver/trips/[id]/arrived` | WD5 | Arrived at Pickup | MD7 |
| Trip in progress | `/driver/trips/[id]/progress` | WD6 | Trip In Progress | MD8 |
| Complete trip | `/driver/trips/[id]/complete` | WD7 | Complete Trip | MD9 |
| Earnings | `/driver/earnings` | WD8 | Earnings | MD10 |
| Profile & documents | `/driver/profile` | WD9 | Profile & Documents | MD11 |
| Admin login | `/admin/login` | WA1 | Login | MA1 |
| Admin dashboard | `/admin` | WA2 | Dashboard | MA2 |
| Driver management | `/admin/drivers` | WA3 | Driver Management | MA3 |
| Driver verification | `/admin/drivers/[id]` | WA3 | Driver Verification | MA4 |
| Bookings | `/admin/bookings` | WA4 | (list is extra) | — |
| Live dispatch | `/admin/dispatch` | WA5 | Live Dispatch | MA5 |
| Booking details | `/admin/bookings/[id]` (extra) | WA4 | Booking Details | MA6 |
| Pricing | `/admin/pricing` | WA6 | Pricing Management | MA7 |
| Tickets | `/admin/tickets` | WA7 | Support Tickets | MA8 |
| Analytics | `/admin/analytics` | WA8 | Analytics | MA9 |
| Menu / logout | sidebar | — | Menu / Logout | MA10 |

### Required screens that are NOT drawn (both specs flag these) — scheduled into phases

| Missing screen | Phase |
|----------------|-------|
| OTP entry step (web + mobile), approval-pending/rejected page, driver register flow | 3, 6 |
| Passenger Bookings list and Profile, notifications list, cancel-ride sheet, chat, passenger ride-OTP display | 4, 5 |
| Driver documents upload page, driver detail/earnings detail | 6 |
| Admin booking detail, ticket detail, Reports, Settings, Audit Logs | 7 |
| 404/500, empty/error states, cookie banner, legal pages (Terms, Privacy), data-deletion request | 2, 9 |

---

## Phase 0: Decisions and Workspace

**Goal.** Remove every contradiction in the specs *before* writing code, and stand up the empty workspace and CI.
**Size.** S. **Gate.** [Gate 0](TESTING.md#gate-0-decisions-and-workspace)

### Why this phase exists
The two specs disagree with each other and internally (web §14, mobile §15). Building on top of those conflicts bakes bugs into the shared core. Resolve them in [`docs/DECISIONS.md`](docs/DECISIONS.md). Gate 0 fails while any decision is still `PROPOSED`.

### Decision register (recommended defaults — owner confirms)

| ID | Conflict | Recommended default |
|----|----------|--------------------|
| DEC-1 | "₹14.90/km" caption vs ₹1,494 total | Fare = distance + batta + toll + night + GST(5%) per web §6.1. Remove the per-km caption; show breakdown or effective rate |
| DEC-2 | Advance ₹500 vs "25%" | `deposit = max(percent × total, minDeposit)`; `minDeposit` = ₹500; both configurable; server returns final numbers |
| DEC-3 | Rates differ web vs mobile (Hatchback 14 vs 13, SUV 22 vs 21.80) | One server tariff, both apps read it; no hardcoded rates |
| DEC-4 | Pricing screen paise (mobile) vs rupees (web) | API in integer paise; admin form shows rupees with 2 decimals and converts at the edge |
| DEC-5 | `minKm` (80/100/150) vs 65.2 km sample | `minKm` applies to **outstation** only; local/transfer under threshold bills actual km. Confirm trip-type rule |
| DEC-6 | Dashboard labels differ ("96 Completed / 08 Active" vs "Drivers Online 96 / Active Online 08") | Define metrics once: Total Bookings (today), Active Rides, Drivers Online, Pending Drivers, Completed Today |
| DEC-7 | Completion rate 90.8% (web) vs 90.6% (mobile) | `completed ÷ total bookings` = 310 ÷ 342 = **90.6%**; define the 10 "other" (ongoing/scheduled) |
| DEC-8 | Status enums differ: web `ongoing`, mobile `in_progress`; web `created/scheduled`, mobile `quoted/booked/no_driver` | One enum in `packages/shared`: `created, scheduled, searching, driver_assigned, driver_arriving, driver_arrived, in_progress, completed, cancelled, no_driver`. **Not listed in the specs — found during this review** |
| DEC-9 | Endpoints/events differ: `/bookings` vs `/rides`; `booking.status` vs `ride.status` | Use `/bookings` and `booking.status` in the contract. **Found during this review** |
| DEC-10 | Copy errors (web §14.9) | "Trip Completed" → "Your ride has been completed."; no "Booking Confirmed!" before payment verifies; fix the incomplete payment sentence |
| DEC-11 | Extra colour tokens not in the palette strip (danger, warning, star) | Adopt web spec values; designer confirms |
| DEC-12 | Who builds the backend? Specs only *suggest* a contract | Name an owner. If none, Phase 8 cannot start — the mock API is demo-only |
| DEC-13 | OTP lengths: login 4 or 6? | Login OTP = 6 digits; ride-start OTP = 4 digits (both drawn that way) |
| DEC-14 | Admin MFA method (assumed in both) | TOTP authenticator app; SMS not used for admin |
| DEC-15 | Service area / geofence ("outside service area") | Define radius or polygon around Pollachi + allowed outstation destinations |
| DEC-16 | Certificate pinning on mobile (spec calls it optional) | Decide to implement or consciously decline; record it (SC-G5) |

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 0.1 | Fill and sign `docs/DECISIONS.md` (all 16 rows → `DECIDED`) | Web §14, Mobile §15 |
| 0.2 | Create pnpm workspace, `.npmrc`, `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | Web §2.1 |
| 0.3 | Scaffold `apps/web` (`create-next-app`), `apps/mobile` (`create-expo-app`), `packages/shared`, `services/mock-api` | Web §2.1, Mobile §2 |
| 0.4 | ESLint, Prettier, Husky + lint-staged, `tsc --noEmit` scripts at root | Web §2, §13 |
| 0.5 | Env validation: Zod `src/env.ts` (web) and `app.config.ts` (mobile). Boot fails on missing values | Web §2.2, Mobile §2 |
| 0.6 | Create restricted keys: Google Maps (web: HTTP referrer; Android/iOS: app restriction), Razorpay **test** keys. Store in secret manager, never in repo | Web §12 |
| 0.7 | Wire CI skeleton from [PIPELINE.md](PIPELINE.md) (`ci.yml`, `security.yml`); protect `main` | Web §13 |
| 0.8 | Add `gitleaks` pre-commit and CI job | — |
| 0.9 | Copy `scripts/` and `signoff/TEMPLATE.md`; write `scripts/gates.conf` commands to match real package names | — |

**Security hooks:** SC-D6 (no secrets in `NEXT_PUBLIC_*`), SC-F2 · **Vuln hooks:** VU-S2 (secret scan), VU-T22 (supply chain: lockfile, `--frozen-lockfile`)
**Deliverables:** empty workspace builds, CI green, `DECISIONS.md` signed.
**Exit:** `scripts/gate.sh 0` → creates `signoff/phase-0.passed`.

---

## Phase 1: Shared Core and API Contract

**Goal.** Build the logic both apps depend on, test it exhaustively, and publish a contract plus a mock API so every later phase can build against something real.
**Size.** M. **Gate.** [Gate 1](TESTING.md#gate-1-shared-core-and-api-contract)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 1.1 | `packages/shared/domain.ts`: `Paise` brand, `Role`, `VehicleClass`, `TripMode`, `Place`, `Vehicle`, `FareQuote`, `Booking`, `DriverRow`, `PricingRule`, `Ticket`, unified status enum (DEC-8) | Web §5, Mobile §3 |
| 1.2 | `fare.ts` — **paise-based** `computeFare` (web spec's version uses rupee floats; port to integer paise, round each line). Must produce 1043 / 300 / 80 / 71 → **₹1,494** for 65.2 km @ ₹16 | Web §6.1 |
| 1.3 | `deposit.ts` — `max(percent × total, minDeposit)`; options `deposit` and `full`; `payNow + payAtDrop == total` always | Web §6.2 |
| 1.4 | `rideMachine.ts` — transitions map, `canMove`, status → screen map for passenger and driver | Web §6.3, Mobile §6 |
| 1.5 | `format.ts` — `inr` (en-IN grouping, paise → ₹), `km`, `dur` ("1 hr 25 min"; improvement: omit "0 hr"), IST date helpers (never hardcode "9 Oct 2026") | Web §6.4, Mobile §15.8 |
| 1.6 | Zod schemas for every request/response; phone `^[6-9]\d{9}$`; OTP 6 digits (login) / 4 digits (ride); error shape `{ code, message, fields? }` | Web §8 |
| 1.7 | `contracts/openapi.yaml` covering the unified endpoints (see [Appendix B](#appendix-b-unified-api-contract)) | Web §8, Mobile §5 |
| 1.8 | `services/mock-api`: MSW handlers + node server implementing the contract with seed data taken from the designs (Selvam Kumar, TN 37 BY 1234, ₹1,494, 342/310/22 analytics, etc.) | — |
| 1.9 | Mock API must **behave like a server**: re-compute fare, ignore client amounts, expire quotes at 15 min, enforce `rideMachine`, check OTP, 45 s offers | Web §6.3 |
| 1.10 | Socket event constants and payload types: `driver.location`, `booking.status`, `offer.new`, `offer.expired`, `dispatch.update`, `sos.alert` | Web §7.4 |
| 1.11 | Wire `packages/shared` into both apps (Next transpile, Metro watch folder) and prove a build imports it | — |

**Security hooks:** SC-C1, SC-H1 · **Vuln hooks:** VU-T3 (amount tampering), VU-T4 (races), VU-S9 (contract fuzz)
**Exit:** `scripts/gate.sh 1`.

---

## Phase 2: Design System and App Shells

**Goal.** Tokens, shared components and layouts for both platforms, built once, accessible by default.
**Size.** M–L. **Gate.** [Gate 2](TESTING.md#gate-2-design-system-and-app-shells)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 2.1 | `tokens.ts`: accent `#6969EF`, accentLight `#7D7DFF`, success `#50FF97`, surface `#D3D3FF`, bgDark `#C6C6FF`, background `#F5F6F4`, ink `#000344`, body `#424242`, muted `#A6A7BE`, + danger/warning/star (DEC-11). Feed Tailwind theme (web) and `theme/tokens.ts` (mobile) from the **same** source | Web §4, Mobile §1.1 |
| 2.2 | Inter via `next/font` and `@expo-google-fonts/inter` (400/500/600/700) | Web §4, Mobile §1.2 |
| 2.3 | **Web components:** TopNav, Sidebar, PageHeader, Button, Input, PhoneInput, OtpInput (4/6), PlaceInput, Select, SegmentedControl, Tabs, Toggle, Badge/StatusBadge, Card, StatTile, DataTable, Dialog/ConfirmDialog, Toast, Skeleton, EmptyState, ErrorState, VehicleCard, FareBreakdown, PaymentOptions, DriverCard, RatingStars, Timeline, MapView, RouteLayer, BarChartWeek, RevenueLine | Web §9 |
| 2.4 | **Mobile components:** Screen, AppBar, Button, TextField, PhoneField, OtpBoxes, Card, ListRow, StatusBadge, Tabs, Toggle, StatTile, RatingStars, DriverCard, RouteCard, FareRow, MapView, BottomTabBar, Timeline, BarChart, LineChart, EmptyState, ErrorState, Skeleton | Mobile §1.4 |
| 2.5 | Every interactive element: default, hover, focus-visible, active, disabled, loading, error | Web §9 |
| 2.6 | Web layouts: public TopNav, driver sidebar (→ bottom bar on small), admin sidebar (→ drawer), skip link, breakpoints 360/768/1024/1280/1536 | Web §10–11 |
| 2.7 | Mobile layouts: auth gate in root `_layout`, passenger stack, driver bottom tabs, admin drawer | Mobile §2.1 |
| 2.8 | Contrast rules: white on `accent` only for ≥16 px semibold; never `muted` for essential text. Add a contrast unit test | Web §4, Mobile §8 |
| 2.9 | Global states: loading skeleton, empty, inline error, full-screen error + Retry, offline banner, session-expired redirect, 404/500 | Mobile §9, Web §14.12 |
| 2.10 | Component gallery page (web `/_dev/ui`, gated by env) for visual and axe testing | — |

**Security hooks:** SC-H2 (no `dangerouslySetInnerHTML`; lint rule), SC-D2 (CSP baseline in `next.config`) · **Vuln hooks:** VU-S3 (SAST rules active)
**Exit:** `scripts/gate.sh 2`.

---

## Phase 3: Authentication and Roles

**Goal.** Secure login for all three roles on both platforms and enforced role separation.
**Size.** M. **Gate.** [Gate 3](TESTING.md#gate-3-authentication-and-roles)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 3.1 | **Web BFF:** `/api/auth/otp/send`, `/api/auth/otp/verify`, `/api/auth/admin/login`, `/api/auth/refresh`, `/api/auth/logout`; tokens in **HttpOnly, Secure, SameSite=Lax** cookies; refresh once on 401 then clear and redirect | Web §7.1 |
| 3.2 | `lib/auth.ts` `readSession` (jose), `middleware.ts` route protection (admin/driver/passenger) | Web §7.2 |
| 3.3 | **Sanitise the `?next=` redirect.** The middleware writes `?next=<path>`, and the spec does not say the login pages validate it before redirecting back; because the URL parameter is user-editable this is an open-redirect risk (VR-1). Allow only same-origin relative paths | Web §7.2 |
| 3.4 | BFF proxy `/api/proxy/*` with an **allow-list** of backend paths (VR-2). No arbitrary forwarding | Web §7.3 |
| 3.5 | CSRF: origin check + SameSite on mutating BFF routes; mutations POST/PUT/DELETE only | Web §12 |
| 3.6 | Web screens: `/login` (passenger OTP), WD1 driver login (30 s resend, 6-digit paste), WA1 admin login (show/hide, remember me, generic error, lockout, MFA step) | Web D1, A1 |
| 3.7 | Mobile: MP1 splash routing (first launch → onboarding; valid token → home; else login), MP2 onboarding pager, MP3 login + OTP screen (phone `6–9` start, 10 digits), Apple button iOS-only, Google/Apple via `expo-auth-session` | Mobile A1–A3 |
| 3.8 | Mobile: MD1/MD2 driver splash/login, MA1 admin login; tokens in `expo-secure-store`; axios interceptor refresh-once-then-logout | Mobile §6 |
| 3.9 | Driver approval states: pending/rejected page instead of dashboard | Mobile B2, Web D1 |
| 3.10 | Logout: clear cookies / SecureStore, close sockets, reset stores | Mobile C10 |
| 3.11 | Mock API: OTP send/verify with rate limit (e.g., 5/hour/phone), attempt limit (5), expiry (5 min), admin lockout, TOTP stub | Web §12 |

**Security hooks:** SC-A1…A6, SC-B1, SC-B6, SC-G1, SC-H3 · **Vuln hooks:** VU-T2, VU-T6, VU-T14, VU-T15, VU-T18
**Exit:** `scripts/gate.sh 3`.

---

## Phase 4: Passenger Booking and Payment

**Goal.** A passenger can pick places, see an honest fare, and pay to confirm a booking — web and mobile.
**Size.** L. **Gate.** [Gate 4](TESTING.md#gate-4-passenger-booking-and-payment)

### Tasks — Web

| # | Task | Spec ref |
|---|------|----------|
| 4.1 | **WP1 Landing** `/`: hero, From/To widget (Places Autocomplete restricted to India), four feature icons, fleet cards from `GET /vehicles` (ISR + revalidate), JSON-LD, OG tags, sitemap, `next/image` priority hero, LCP < 2.5 s | Web P1 |
| 4.2 | Static pages: Outstation, Local, Tariff, About, Support, Terms, Privacy | Web §3 |
| 4.3 | `bookingDraft` Zustand store (places, mode, vehicleId, schedule, payment choice) | Web §3 |
| 4.4 | **WP2 Vehicle** `/book/vehicle`: filter chips (All/Hatchback/Sedan/SUV/Innova/Tempo), card grid, **Popular** tag, unavailable state, Tempo empty state | Web P2 |
| 4.5 | **WP3 Route** `/book/route`: One Way/Round Trip/Local, swap, schedule-for-later, past dates blocked, map + distance/time, 400 ms debounce → `POST /quotes`, route-not-found and map-key fallback | Web P3 |
| 4.6 | **WP4 Fare** `/book/fare`: `FareBreakdown`, totals, deposit vs full radiogroup, validity countdown + Refresh | Web P4 |
| 4.7 | **WP5 Payment** `/book/payment`: T&C checkbox, method list, `POST /payments/orders` → Razorpay Checkout → `POST /payments/verify` → **only then** show "Booking Confirmed" with code and "Track ride"; idempotency key per attempt; retry; poll on network drop | Web P5 |
| 4.8 | Passenger Bookings list and Profile menu | Web §14.12 |

### Tasks — Mobile

| # | Task | Spec ref |
|---|------|----------|
| 4.9 | **MP4 Home**: header + bell, search, current location via `expo-location` reverse geocode, Quick Access (Ride Now / Outstation / Rental / Schedule), promo banner, permission-denied banner | Mobile A4 |
| 4.10 | **MP5 Select Location**: draggable pin map, search autocomplete, confirm pickup → drop, outside-area/GPS-off/geocode-fail states | Mobile A5 |
| 4.11 | **MP6 Vehicle**: tabs One Way/Outstation/Rental, radio list from server, unavailable rows | Mobile A6 |
| 4.12 | **MP7 Fare Quote**: distance, duration, fare, **fix caption per DEC-1**, advance row, 15-min countdown, "Quote expired — Refresh" | Mobile A7 |
| 4.13 | **MP8 Payment**: Pay Advance card, UPI/Card/Net Banking/**Pay at Pickup (eligible only)**, Razorpay via dev build, idempotency, resume after app kill by polling order | Mobile A8 |
| 4.14 | Notifications list screen (bell), schedule date-time picker | Mobile A4 |

### Rules for this phase
- Fare, advance and validity come only from `POST /quotes`. The UI never calculates a price (the shared `computeFare` is for tests and the mock).
- A booking exists as *confirmed* only after server signature verification.
- Expired quote → button disabled, Refresh visible.

**Security hooks:** SC-C1…C6, SC-D5, SC-F5 (consent), SC-H1 · **Vuln hooks:** VU-T3, VU-T4, VU-T5, VU-T20
**Exit:** `scripts/gate.sh 4`.

---

## Phase 5: Live Tracking and Trip Completion

**Goal.** Real-time ride visibility for the passenger from "driver arriving" to rating.
**Size.** M–L. **Gate.** [Gate 5](TESTING.md#gate-5-live-tracking-and-trip-completion)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 5.1 | `lib/socket.ts` (web) and `lib/socket.ts` (mobile) with cookie/token auth; events update TanStack Query cache; **fallback polling 5–10 s** when the socket drops | Web §7.4 |
| 5.2 | **WP6 / MP9 Tracking:** map, smooth car marker, ETA, driver card, Call (masked), Message (chat panel), **SOS** (confirm → `POST /bookings/:id/sos`), Share (public tracking link), **start OTP shown prominently** | Web P6, Mobile A9 |
| 5.3 | **MP10 / WP6 ongoing view:** ETA, fare details dropdown, SOS with press-and-hold or confirm, haptic, **offline queue + retry** (mobile) | Mobile A10 |
| 5.4 | Status → screen mapping from `rideMachine` (arrived → banner; ongoing → trip view; completed → complete) | Mobile §6 |
| 5.5 | Cancel-ride sheet with reason; driver-cancelled → back to searching; driver-offline and connection-lost banners | Mobile A9 |
| 5.6 | **WP7 / MP11 Completed & rating:** stars required, comment ≤ 500, receipt PDF, balance due, **corrected copy (DEC-10)** | Web P7, Mobile A11 |
| 5.7 | Public tracking route (e.g. `/t/[token]`): **separate from authenticated `/bookings/*`**, token expires at trip end, shows minimum data (VR-6) | Web P6 |
| 5.8 | Mobile: persist active ride ID; resume correct screen after kill/restart | Mobile §6 |
| 5.9 | Mock API: driver simulator that moves along a polyline and walks the state machine on a timer | — |

**Security hooks:** SC-E1…E4, SC-F1, SC-B2, SC-B4 · **Vuln hooks:** VU-T8, VU-T11, VU-T16, VU-T17
**Exit:** `scripts/gate.sh 5`.

---

## Phase 6: Driver Experience

**Goal.** Drivers can register, go online, receive offers, run a trip, and see earnings — web and mobile.
**Size.** L. **Gate.** [Gate 6](TESTING.md#gate-6-driver-experience)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 6.1 | **WD2 / MD3 Dashboard:** greeting by time of day, **Online toggle** (blocked if documents unverified/expired), stat tiles, current trip card, quick actions | Web D2, Mobile B3 |
| 6.2 | **WD3 / MD4 Offer:** modal anywhere in portal; **45 s countdown from server `expiresAt`**; sound/vibrate/browser notification (permission asked at go-online); Accept race → "Trip no longer available"; auto-decline | Web D3, Mobile B4 |
| 6.3 | **WD4 / MD5 / MD6** Trip accepted and navigate-to-pickup (Google Maps deep link; "I've Arrived" within ~100 m) | Web D4, Mobile B5–B6 |
| 6.4 | **WD5 / MD7 Arrived:** 4-digit OTP, auto-advance, paste, attempt limit 5, waiting timer | Web D5, Mobile B7 |
| 6.5 | **WD6 / MD8 In progress:** location posting (web `watchPosition` throttled + hidden-tab warning; mobile foreground service, background location only while online), Navigate, End Trip confirm | Web D6, Mobile B8 |
| 6.6 | **WD7 / MD9 Complete:** summary, **amount to collect = total − paid** (₹1,494 − ₹500 = ₹994), odometer numeric only | Web D7, Mobile B9 |
| 6.7 | **WD8 / MD10 Earnings:** range dropdown (Today/Week/Month), bar chart Mon–Sun with accessible table fallback, trips and online-hours tiles, detailed list | Web D8, Mobile B10 |
| 6.8 | **WD9 / MD11 Profile & Documents:** license, RC, insurance upload (PDF/JPG/PNG, size limit, preview, expiry), status badges, bank details masked (last 4), logout | Web D9, Mobile B11 |
| 6.9 | Driver register flow + pending-approval page | Web D1 |
| 6.10 | Mobile permissions in `app.config.ts` with honest iOS usage strings; Android foreground service + `POST_NOTIFICATIONS` | Mobile §7 |
| 6.11 | Mock API: offers generator, document verification states | — |

**Security hooks:** SC-B3, SC-B5, SC-C5, SC-E2, SC-F3, SC-F4, SC-G2 · **Vuln hooks:** VU-T4, VU-T10, VU-T12, VU-T16, VU-T19
**Exit:** `scripts/gate.sh 6`.

---

## Phase 7: Admin Operations

**Goal.** Operations staff can verify drivers, dispatch, price, handle tickets and read analytics. **This phase ends in the Demo.**
**Size.** L. **Gate.** [Gate 7](TESTING.md#gate-7-admin-operations-and-demo-security-run)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 7.1 | Admin shell: sidebar (Dashboard, Bookings, Drivers, Dispatch, Pricing, Support Tickets, Analytics, Reports, Settings), top bar search/notifications; mobile drawer (MA10) | Web Part C, Mobile C10 |
| 7.2 | **WA2 / MA2 Dashboard:** tiles linking to filtered lists, live map with clustering, 30 s refresh, real date (not constant) | Web A2, Mobile C2 |
| 7.3 | **WA3 / MA3 / MA4 Drivers:** tabs, server-side pagination/sort/debounced search, **verification page** (per-document approve/reject, approve disabled until all verified, reject needs a reason, audit-logged) | Web A3, Mobile C3–C4 |
| 7.4 | **WA4 / MA6 Bookings:** tabs, search, **+ New Booking** phone form, detail page with timeline, reassign/cancel/refund with confirm + audit | Web A4, Mobile C6 |
| 7.5 | **WA5 / MA5 Dispatch:** map, unassigned list, nearby drivers sorted by distance, offline disabled, Assign with confirm, `dispatch.update` live | Web A5, Mobile C5 |
| 7.6 | **WA6 / MA7 Pricing:** per-class tabs, dirty tracking, **diff confirm dialog**, validation (rate > 0, batta ≥ 0, deposit 0–100), `minDeposit`, paise conversion at the edge, applies to **new quotes only** | Web A6, Mobile C7 |
| 7.7 | **WA7 / MA8 Tickets:** tabs with counts, priority→age ordering, ticket detail, reply, resolve | Web A7, Mobile C8 |
| 7.8 | **WA8 / MA9 Analytics:** range dropdown, previous-period % change, line chart + table fallback, completion rate per DEC-7, CSV export (formula-injection safe) | Web A8, Mobile C9 |
| 7.9 | Reports, Settings, **Audit Logs** (read-only, append-only) | Mobile C10 |
| 7.10 | Admin on mobile also works on Expo Web (responsive) | Mobile §15.7 |

### Demo checkpoint
When Gate 7 passes you have a **demo**: all 3 roles × 2 platforms working end-to-end on the mock API (or staging). Before Phase 8, run the **Demo Security Run** in [SECURITY_CHECK.md](SECURITY_CHECK.md) (items marked `D`) and the quick scans `VU-S1`, `VU-S2`, `VU-S3` in [VULNERABILITY.md](VULNERABILITY.md). Gate 7 requires both.

**Security hooks:** SC-B1, SC-B3, SC-C7, SC-F6, SC-H2 · **Vuln hooks:** VU-T1, VU-T9, VU-T12, VU-T13, VU-T21
**Exit:** `scripts/gate.sh 7`.

---

## Phase 8: Real Backend Integration and Notifications

**Goal.** Replace the mock API with the real backend, turn on real payments (test mode), push notifications and realtime at scale.
**Size.** L. **Gate.** [Gate 8](TESTING.md#gate-8-real-backend-integration)
**Blocked until** DEC-12 names a backend owner.

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 8.1 | Point web BFF (`API_INTERNAL_URL`) and mobile (`EXPO_PUBLIC_API_URL`) at staging; keep mock for offline dev | Web §2.2 |
| 8.2 | Contract tests: staging API vs `openapi.yaml` (schemathesis) | — |
| 8.3 | Razorpay: server orders, signature verify, **webhook** with idempotent handler, reconciliation job | Web P5, Mobile A8 |
| 8.4 | Push notifications: `expo-notifications` (FCM/APNs), web notifications for offers; templates for offer, assignment, arrival, completion | Mobile §7 |
| 8.5 | Masked calling provider; maps quotas and billing alerts | Web §12 |
| 8.6 | Realtime scale: sticky sessions or Redis adapter for socket.io; origin allow-list | Web §7.4 |
| 8.7 | Observability: Sentry (web + mobile), web-vitals, structured logs without PII | Web §2 |
| 8.8 | Re-run **all** E2E suites from Gates 4–7 against staging | — |

**Security hooks:** SC-C2, SC-C3, SC-D3, SC-D4, SC-E1, SC-F2 (all `R` items) · **Vuln hooks:** VU-T5, VU-T15, VU-T20, VU-S5
**Exit:** `scripts/gate.sh 8`.

---

## Phase 9: Hardening (Security, Vulnerabilities, Performance, Accessibility, Privacy)

**Goal.** Prove the product is safe, fast, accessible and compliant before anyone outside the team uses it.
**Size.** M. **Gate.** [Gate 9](TESTING.md#gate-9-hardening)

### Tasks

| # | Task | Ref |
|---|------|-----|
| 9.1 | Run the **full** Security Check (`D` and `R` items) and log results in `docs/SECURITY_RUN_LOG.md` | [SECURITY_CHECK.md](SECURITY_CHECK.md) |
| 9.2 | Run the full vulnerability programme (all `VU-S*` scans, all `VU-T*` tests); every finding goes into `docs/VULN_REGISTER.md` | [VULNERABILITY.md](VULNERABILITY.md) |
| 9.3 | Fix findings → re-test → close. No Critical/High left open | VULNERABILITY.md §Triage |
| 9.4 | WCAG 2.2 AA pass: axe on every page, keyboard-only and screen-reader walk-through of the three main flows, 200% font scale on mobile | Web §11, Mobile §8 |
| 9.5 | Performance: LCP < 2.5 s on landing, code-split maps/charts (`next/dynamic`), server-side paginated admin tables, low-end Android + slow 3G pass | Web §13 |
| 9.6 | Privacy (India DPDP): consent + Terms before payment, privacy policy, data-deletion request path, cookie banner, retention rules | Web §12 |
| 9.7 | Strict CSP final tuning, HSTS, security headers, CORS allow-list | Web §12 |
| 9.8 | Error pages (404/500), empty/error states complete, offline banner everywhere | Mobile §9 |

**Exit:** `scripts/gate.sh 9`.

---

## Phase 10: Release and Launch

**Goal.** Ship to production safely with a rollback path.
**Size.** S–M. **Gate.** [Gate 10](TESTING.md#gate-10-release)

### Tasks

| # | Task | Spec ref |
|---|------|----------|
| 10.1 | Web: production deploy via [PIPELINE.md](PIPELINE.md) CD; feature flags; staged rollout; Sentry release + source maps | Web §13 |
| 10.2 | Mobile: EAS `production` profiles for `passenger`, `driver`, `admin` variants (distinct bundle IDs, names, icons); store submissions | Mobile §12 |
| 10.3 | Store paperwork: privacy policy URL, data-safety form, permission justifications, **background-location review text for the driver app** | Mobile §12 |
| 10.4 | OTA policy: EAS Update for JS-only fixes, store build for native changes | Mobile §12 |
| 10.5 | Rollback drill executed (web redeploy previous build; EAS Update rollback); on-call and alerting live | Web §13 |
| 10.6 | Post-launch: run security smoke + vulnerability scan on production; schedule recurring scans | [VULNERABILITY.md](VULNERABILITY.md) |

**Exit:** `scripts/gate.sh 10` → product is launched.

---

## Appendix A: Definition of Done for a Screen

A screen is done when **all** are true (web §13.2, mobile §14):
1. Text and layout match the collage/storyboard (or the decision in `DECISIONS.md`).
2. All states exist: loading, empty, error, offline, expired.
3. Keyboard and screen-reader paths work; touch targets ≥ 44 px.
4. Responsive checks pass (web 360/768/1024/1280/1536; mobile small iPhone, low-end Android, large Android).
5. Unit + component + E2E tests green for the screen's flow.
6. The phase's `SC-*` checks that touch the screen pass.

## Appendix B: Unified API Contract

Replaces the two "suggested" contracts (web §8, mobile §5). Money in **paise**, times ISO-8601, errors `{ code, message, fields? }`.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/admin/login`, `POST /auth/admin/mfa`, `POST /auth/refresh`, `POST /auth/logout` |
| Catalog | `GET /vehicles?pickup=&drop=&mode=`, `GET /tariff` |
| Places | `GET /places/autocomplete`, `GET /places/details`, `GET /places/reverse`, `GET /directions` |
| Quote | `POST /quotes`, `GET /quotes/:id` |
| Payments | `POST /payments/orders`, `POST /payments/verify`, `POST /webhooks/razorpay` (server only) |
| Bookings | `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel`, `POST /bookings/:id/rating`, `POST /bookings/:id/sos`, `POST /bookings/:id/share`, `GET /public/track/:token` |
| Driver | `POST /driver/online`, `GET /driver/stats`, `GET /driver/offers/:id`, `POST /offers/:id/accept`, `POST /offers/:id/decline`, `POST /bookings/:id/arrived`, `POST /bookings/:id/start` (OTP), `POST /bookings/:id/complete`, `GET /driver/earnings?range=`, `GET/PUT /driver/profile`, `POST /driver/documents` |
| Admin | `GET /admin/stats`, `GET /admin/drivers`, `GET /admin/drivers/:id`, `POST /admin/drivers/:id/approve`, `POST /admin/drivers/:id/reject`, `GET/POST /admin/bookings`, `GET /admin/bookings/:id`, `POST /admin/bookings/:id/assign`, `GET /admin/dispatch`, `GET/PUT /admin/pricing/:class`, `GET /admin/tickets`, `GET /admin/tickets/:id`, `GET /admin/analytics?range=`, `GET /admin/audit` |
| Realtime | `driver.location`, `booking.status`, `offer.new`, `offer.expired`, `dispatch.update`, `sos.alert` |

Payload rules that matter for security: the start OTP is returned **only** to the booking's passenger; passenger/driver/admin see different projections of the same booking; `PUT` endpoints use explicit allow-listed fields (no mass assignment).

## Appendix C: Phase Dependency Map

```
P0 Decisions ─▶ P1 Shared core ─▶ P2 Design system ─▶ P3 Auth ─▶ P4 Booking+Pay ─▶ P5 Tracking
                                                                                       │
        P10 Release ◀─ P9 Hardening ◀─ P8 Real backend ◀── DEMO ◀─ P7 Admin ◀─ P6 Driver ◀┘
```
Every arrow is a **passed gate**. Nothing skips.
