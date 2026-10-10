# RedTaxi Web Application — TypeScript Implementation Specification

Source: `RedTaxi_Complete_Platform_UI_Collage.png` ("Web Application – All Screens (Single View)").
Tagline in image: "Your Reliable Travel Partner • Pollachi to All Over India".
Scope: **24 web screens** — Passenger 7, Driver 9, Admin 8.
Stack: **Next.js (App Router) + React + TypeScript (strict)**.

Tags: **[Observed]** = read from the image. **[Assumed]** = not visible, must be confirmed. **[Inferred]** = deduced from numbers or patterns in the image. Section 14 lists mismatches between this collage and the earlier mobile storyboard.

---

## 1. Product Overview

Three web surfaces in one codebase:

| Surface | Users | Entry | Auth |
|---------|-------|-------|------|
| Passenger site | Public + logged-in customers | `/` | Phone OTP |
| Driver portal | Drivers | `/driver` | Phone + 6-digit OTP |
| Admin panel | Operations staff | `/admin` | Email + password (+ MFA [Assumed]) |

Feature strip in the header [Observed]: **Book Rides, Live Tracking, Secure Payments, Outstation Trips, 24x7 Support**.

---

## 2. Technology Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js App Router, React Server Components | SEO for landing, tariff, outstation pages; fast first load |
| Language | TypeScript `strict: true`, `noUncheckedIndexedAccess` | Safety on money, ride state, API shapes |
| Styling | Tailwind CSS + CSS variables for tokens | Matches the design tokens below |
| UI primitives | Radix UI (via shadcn/ui pattern) | Accessible dialogs, tabs, dropdowns, toggles |
| Server state | TanStack Query | Caching, polling, invalidation by socket events |
| Client state | Zustand (booking draft, UI) | Small, typed stores |
| Forms | React Hook Form + Zod | One schema for client and server |
| Maps | Google Maps JavaScript API via `@vis.gl/react-google-maps` (Places, Directions, Geocoding) | Autocomplete, routes, markers |
| Charts | Recharts | Bar and line charts on earnings and analytics |
| Realtime | `socket.io-client` | Driver location, ride status, offers, dispatch |
| Payments | Razorpay Checkout (web) | Shown as "Secured by Razorpay" |
| Auth | HttpOnly cookie session via Next route handlers (BFF) | Tokens never reach JS |
| Dates and money | `dayjs`, `Intl.NumberFormat('en-IN')` | IST, Indian digit grouping |
| Testing | Vitest, React Testing Library, MSW, Playwright | Unit, component, mock API, E2E |
| Quality | ESLint, Prettier, `tsc --noEmit`, Husky | CI gates |
| Monitoring | Sentry, web-vitals | Errors and performance |

Verify current versions when installing; do not pin from this document.

### 2.1 Setup

```bash
npx create-next-app@latest redtaxi-web --typescript --tailwind --eslint --app --src-dir
cd redtaxi-web
npm i @tanstack/react-query zustand react-hook-form zod @hookform/resolvers \
  @vis.gl/react-google-maps recharts socket.io-client dayjs clsx tailwind-merge \
  class-variance-authority lucide-react jose
npm i -D vitest @testing-library/react @testing-library/jest-dom msw playwright \
  @playwright/test prettier husky lint-staged @types/node
```

`tsconfig.json` essentials:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 2.2 Environment variables

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=      # restricted by HTTP referrer
NEXT_PUBLIC_RAZORPAY_KEY_ID=
SESSION_SECRET=                    # server only
API_INTERNAL_URL=                  # server only
SENTRY_DSN=
```
Validate with Zod at boot (`src/env.ts`); fail fast on missing values.

---

## 3. Project Structure

```
src/
  app/
    (site)/                         # public + passenger
      layout.tsx                    # TopNav: Home Outstation Local Tariff About Support + Login
      page.tsx                      # P1 Landing
      outstation/page.tsx  local/page.tsx  tariff/page.tsx  about/page.tsx  support/page.tsx
      login/page.tsx
      book/
        vehicle/page.tsx            # P2
        route/page.tsx              # P3
        fare/page.tsx               # P4
        payment/page.tsx            # P5
      bookings/page.tsx
      bookings/[id]/track/page.tsx  # P6
      bookings/[id]/complete/page.tsx # P7
    driver/
      login/page.tsx                # D1
      (portal)/layout.tsx           # sidebar
      (portal)/page.tsx             # D2 dashboard
      (portal)/offers/page.tsx      # offer list
      (portal)/trips/[id]/{accepted,arrived,progress,complete}/page.tsx   # D4 D5 D6 D7
      (portal)/earnings/page.tsx    # D8
      (portal)/profile/page.tsx     # D9
      (portal)/vehicle/page.tsx  documents/page.tsx
    admin/
      login/page.tsx                # A1
      (panel)/layout.tsx            # sidebar
      (panel)/page.tsx              # A2 dashboard
      (panel)/drivers/page.tsx      # A3
      (panel)/drivers/[id]/page.tsx
      (panel)/bookings/page.tsx     # A4
      (panel)/dispatch/page.tsx     # A5
      (panel)/pricing/page.tsx      # A6
      (panel)/tickets/page.tsx      # A7
      (panel)/analytics/page.tsx    # A8
      (panel)/reports/page.tsx  settings/page.tsx
    api/                            # BFF route handlers (auth, proxy)
  components/
    ui/        # Button, Input, Select, Tabs, Toggle, Badge, Card, Dialog, Table, Skeleton...
    layout/    # TopNav, Sidebar, PageHeader
    booking/   # PlaceInput, VehicleCard, FareBreakdown, PaymentOptions, DriverCard, RatingStars, OtpInput
    map/       # MapView, RouteLayer, DriverMarker
    charts/    # BarChartWeek, RevenueLine
    admin/     # StatTile, DataTable, StatusBadge, DriverVerification
  features/    # passenger/ driver/ admin/ (hooks + queries per feature)
  lib/         # api.ts, fare.ts, format.ts, rideMachine.ts, socket.ts, auth.ts
  stores/      # bookingDraft.ts, ui.ts
  types/       # domain.ts, api.ts
  middleware.ts
  env.ts
```

---

## 4. Design Tokens

Palette strip in the collage shows five swatches (indigo-blue, muted violet, green, navy, white). The hex values are not printed; the mobile storyboard printed the full set, and the web UI uses the same look — **[Assumed] reuse them**:

```ts
// tailwind.config.ts (theme.extend.colors)
colors: {
  accent:        '#6969EF',  // primary buttons, active tabs, links
  'accent-soft': '#7D7DFF',
  success:       '#50FF97',  // online, verified, completed
  surface:       '#D3D3FF',  // tinted cards, icon tiles
  'bg-dark':     '#C6C6FF',
  background:    '#F5F6F4',
  ink:           '#000344',  // headings
  body:          '#424242',
  muted:         '#A6A7BE',
  white:         '#FFFFFF',
  danger:        '#E5484D',  // [Assumed] SOS, End Trip, Decline, Cancelled, Logout
  warning:       '#F5A524',  // [Assumed] Pending, Medium priority
  star:          '#FFB400',  // [Assumed] ratings
}
```

Typography [Assumed]: Inter (400/500/600/700) via `next/font`. Page titles 24–30, section titles 18–20, body 14–16, table text 13–14, captions 12.
Shape [Assumed]: cards radius 12–16, buttons radius 8–10, chips pill, soft shadow, 1 px border.
Layout [Observed]: Public pages use a top navigation bar (logo left, links, **Login** button right). Driver and admin pages use a left sidebar with icons plus a slim top bar.

Contrast: white text on `accent` is acceptable only for ≥16 px semibold or ≥18 px; use `ink` text on `surface`. Never use `muted` for essential text.

---

## 5. Domain Types

```ts
// src/types/domain.ts
export type Paise = number & { readonly __brand: 'paise' };   // integer money
export const paise = (n: number) => Math.round(n) as Paise;

export type Role = 'passenger' | 'driver' | 'admin';
export type VehicleClass = 'hatchback' | 'sedan' | 'suv' | 'innova' | 'tempo';
export type TripMode = 'one_way' | 'round_trip' | 'local';

export interface Place { label: string; sublabel?: string; lat: number; lng: number; placeId?: string }

export interface Vehicle {
  id: string; class: VehicleClass; displayName: string;        // "Maruti Swift or Equivalent"
  passengers: number; bags: number;
  ratePerKm: Paise; minKm: number; imageUrl: string; popular?: boolean;
}

export interface FareLine { key: 'distance' | 'batta' | 'toll' | 'night' | 'gst'; label: string; amount: Paise }
export interface FareQuote {
  id: string; vehicleId: string; mode: TripMode;
  distanceKm: number; durationMin: number;
  lines: FareLine[]; total: Paise;
  depositOptions: { type: 'deposit' | 'full'; payNow: Paise; payAtDrop: Paise; recommended?: boolean }[];
  validUntil: string;                                           // ISO
}

export type BookingStatus =
  | 'created' | 'scheduled' | 'searching' | 'driver_assigned' | 'driver_arriving'
  | 'driver_arrived' | 'ongoing' | 'completed' | 'cancelled';

export interface Booking {
  id: string; code: string;                                     // "BK10234"
  customer: { id: string; name: string };
  pickup: Place; drop: Place; startsAt: string;                 // IST display, ISO store
  status: BookingStatus; quote: FareQuote;
  driver?: { id: string; name: string; rating: number; vehicleNo: string; vehicleClass: VehicleClass };
  startOtp?: string;                                            // 4 digits, shown to passenger only
  paid: Paise; due: Paise;
  timeline: { status: BookingStatus; at: string }[];
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export interface DriverRow {
  id: string; name: string; vehicleNo: string; vehicleClass: VehicleClass;
  status: ApprovalStatus; rating: number; online: boolean;
}

export interface PricingRule {
  vehicleClass: VehicleClass; baseRatePerKm: Paise; dailyBatta: Paise;
  nightAllowance: Paise; minOutstationKm: number;
  advanceDepositPercent: number; minDeposit: Paise;             // see section 6.2
}

export interface Ticket {
  id: string; code: string; title: string;
  reporter: 'customer' | 'driver'; priority: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved'; createdAt: string;
}
```

---

## 6. Core Business Logic

### 6.1 Fare calculation — **reconciles with the image**

The Fare Estimate screen shows **[Observed]**:

| Line | Amount |
|------|--------|
| Distance (65.2 km @ ₹16/km) | ₹1,043.00 |
| Driver Daily Batta | ₹300.00 |
| Toll / State Tax (est.) | ₹80.00 |
| GST (5%) | ₹71.00 |
| **Total Estimated Fare** | **₹1,494.00** |

Check: 65.2 × 16 = 1,043.2 → 1,043; GST = 5 % × (1,043 + 300 + 80 = 1,423) = 71.15 → 71; total 1,043 + 300 + 80 + 71 = **1,494** ✓.

```ts
// src/lib/fare.ts  — server is the source of truth; this mirrors it for display and tests
export interface FareInput {
  distanceKm: number; ratePerKm: number;          // rupees
  batta: number; tollEstimate: number; nightAllowance?: number;
  minKm?: number; gstRate?: number;               // 0.05
}
const r = (n: number) => Math.round(n);           // round each line to whole rupees

export function computeFare(i: FareInput) {
  const billableKm = Math.max(i.distanceKm, i.minKm ?? 0);
  const distance = r(billableKm * i.ratePerKm);
  const batta = r(i.batta);
  const toll = r(i.tollEstimate);
  const night = r(i.nightAllowance ?? 0);
  const gst = r((distance + batta + toll + night) * (i.gstRate ?? 0.05));
  return { distance, batta, toll, night, gst, total: distance + batta + toll + night + gst };
}
```

```ts
// fare.test.ts
it('matches storyboard sample', () => {
  const f = computeFare({ distanceKm: 65.2, ratePerKm: 16, batta: 300, tollEstimate: 80 });
  expect(f).toMatchObject({ distance: 1043, gst: 71, total: 1494 });
});
```

**Open point:** the image bills 65.2 km on a Sedan whose "Min 100 km" is shown on the vehicle card. If a minimum applies to *outstation only*, a 65 km Palani one-way is treated as local/transfer. Confirm whether `minKm` applies to this trip type. The estimate above follows the image (actual distance, no minimum).

### 6.2 Advance deposit

Payment options on Fare Estimate **[Observed]**:
- **Advance Deposit (Recommended)** — Pay Now ₹500 | Pay at Drop ₹994
- **100% Full Payment** — Pay Now ₹1,494

500 + 994 = 1,494 ✓. Pricing Rules shows an "Advance Deposit" field with value **25**.
**[Inferred]** deposit = `max(25 % × total, minDeposit ₹500)` → 25 % of 1,494 = ₹373.50, so ₹500 applies. Make both values configurable in Pricing Rules (`advanceDepositPercent`, `minDeposit`) and always let the server return the final numbers.

### 6.3 Booking state machine

```ts
// src/lib/rideMachine.ts
export const transitions: Record<BookingStatus, BookingStatus[]> = {
  created:         ['searching', 'scheduled', 'cancelled'],
  scheduled:       ['searching', 'cancelled'],
  searching:       ['driver_assigned', 'cancelled'],
  driver_assigned: ['driver_arriving', 'searching', 'cancelled'],
  driver_arriving: ['driver_arrived', 'cancelled'],
  driver_arrived:  ['ongoing', 'cancelled'],
  ongoing:         ['completed'],
  completed:       [],
  cancelled:       [],
};
export const canMove = (a: BookingStatus, b: BookingStatus) => transitions[a].includes(b);
```
The server enforces transitions; the client only reads status and renders the matching screen.

### 6.4 Formatters

```ts
export const inr = (p: number, frac = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: frac, maximumFractionDigits: frac }).format(p / 100);
// inr(149400) -> "₹1,494"; inr(24850000) -> "₹2,48,500"
export const km = (n: number) => `${n.toFixed(1)} km`;
export const dur = (min: number) => `${Math.floor(min / 60)} hr ${min % 60} min`;   // 85 -> "1 hr 25 min"
```

---

## 7. Auth, Roles, and API Layer

### 7.1 Session (BFF)
- Passenger/driver: `POST /api/auth/otp/send` → `POST /api/auth/otp/verify`; the route handler calls the backend, stores tokens in **HttpOnly, Secure, SameSite=Lax** cookies. Browser JS never sees tokens.
- Admin: `POST /api/auth/admin/login` (email, password, remember me); idle timeout; MFA step [Assumed].
- Refresh in the BFF on 401 once; failure clears cookies and redirects to the right login.

### 7.2 Route protection

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { readSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await readSession(req);                       // { role } | null
  const need = pathname.startsWith('/admin') ? 'admin'
             : pathname.startsWith('/driver') ? 'driver'
             : pathname.startsWith('/bookings') || pathname.startsWith('/book/payment') ? 'passenger' : null;
  const isLogin = /^\/(admin|driver)\/login$|^\/login$/.test(pathname);
  if (need && s?.role !== need && !isLogin) {
    const to = need === 'admin' ? '/admin/login' : need === 'driver' ? '/driver/login' : '/login';
    return NextResponse.redirect(new URL(`${to}?next=${encodeURIComponent(pathname)}`, req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*', '/driver/:path*', '/bookings/:path*', '/book/payment'] };
```
Enforce the same role checks again on the backend for every endpoint.

### 7.3 Typed API client

```ts
// src/lib/api.ts
import { z } from 'zod';
export class ApiError extends Error { constructor(public status: number, public code: string, msg: string) { super(msg); } }

export async function api<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, credentials: 'include' });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new ApiError(res.status, b.code ?? 'unknown', b.message ?? res.statusText); }
  return schema.parse(await res.json());          // runtime-validate every response
}
```

### 7.4 Realtime

```ts
// src/lib/socket.ts
import { io, type Socket } from 'socket.io-client';
let s: Socket | null = null;
export const getSocket = () => (s ??= io(process.env.NEXT_PUBLIC_WS_URL!, { withCredentials: true, transports: ['websocket'] }));
```
Events: `driver.location`, `booking.status`, `offer.new`, `offer.expired`, `dispatch.update`, `sos.alert`. On each event, update the TanStack Query cache or invalidate the matching key. Fall back to 5–10 s polling when the socket is down.

---

# PART A — PASSENGER WEB (7 screens)

> Image numbering for this row reads 1, 2, 3, 4, 6, 7 (no 5). The seven drawn cards are mapped below in order; the "Booking Confirmation" label sits on the Secure Payment card.

**Navigation [Observed].** Logged-out: logo, **Home, Outstation, Local, Tariff, About, Support**, **Login** button. Logged-in (Live Tracking and Completed screens): **Bookings, Support, Profile** (dropdown) [Assumed], with a **Share** button on tracking.

## P1. Landing Page — `/`
**Layout [Observed]**
1. Top nav (above).
2. Hero with scenic Tamil Nadu backdrop and a white SUV. Headline "**Pollachi's Trusted Outstation & City Cabs**". Subtext "**Travel Anywhere Across India**".
3. Booking widget: **From** (default "Pollachi"), **To** ("Where to?"), button **Search Cabs**.
4. Four feature icons: **Safe & Reliable**, **Transparent Fares**, **24/7 Support**, **All India Travel**.
5. Section "**Our Fleet**" — four selectable cards:

| Vehicle | Rate | Seats |
|---------|------|-------|
| Hatchback | ₹14 / km | 4 Seater |
| Sedan | ₹16 / km | 4 Seater (text small; confirm) |
| Prime SUV | ₹22 / km | 6 Seater |
| Innova Crysta | ₹26 / km | 7 Seater |

**Behavior.** Both inputs use Places Autocomplete restricted to India. "Search Cabs" validates both places then stores a draft in `bookingDraft` and goes to `/book/vehicle`. Clicking a fleet card goes to the same step with that class pre-filtered. Fleet data and rates come from `GET /vehicles` (server-rendered, revalidated).
**SEO.** Static/ISR page, `Organization` and `LocalBusiness` JSON-LD, OG tags, sitemap; Core Web Vitals budget: LCP < 2.5 s (hero image via `next/image`, priority).
**States.** Autocomplete empty/error, outside service area message, fleet loading skeleton.

## P2. Select Vehicle — `/book/vehicle`
**Layout [Observed].** Title "**Choose Your Vehicle**". Filter chips: **All, Hatchback, Sedan, SUV, Innova, Tempo Traveller**. Sort/search control at right (label small; [Assumed] sort dropdown). 2×2 grid of cards, each with photo, name, class, capacity, rate, minimum, **Select** button:

| Card | Class | Capacity | Rate | Min | Notes |
|------|-------|----------|------|-----|-------|
| Maruti Swift or Equivalent | Hatchback | 4 Passengers • 2 Bags | ₹14/km | Min 80 km | |
| Maruti Dzire or Equivalent | Sedan | 4 Passengers • 2 Bags | ₹16/km | Min 100 km | **Popular** tag |
| Toyota Ertiga or Equivalent | Prime SUV | 6 Passengers • 2 Bags | ₹22/km | Min 100 km | |
| Toyota Innova Crysta | Innova | 7 Passengers • bags count small | ₹26/km | Min 150 km | |

**Behavior.** Filter chips filter client-side; **Select** stores `vehicleId` in the draft and goes to `/book/route`. Tempo Traveller chip has no card drawn; show an empty state or its card if available.
**States.** Loading, empty filter, vehicle unavailable (disabled button + reason).

## P3. Route & Map (Trip Details) — `/book/route`
**Layout [Observed].** Left panel + right map.
- Title "**Trip Details**".
- Trip type segmented control: **One Way** (selected), **Round Trip**, **Local**.
- **From:** "Pollachi Bus Stand"; **To:** "Palani Temple, Palani"; swap icon.
- "**Date & Time**": option "Schedule for later"; date field "10 Oct 2026" with clear (×); time field "06:30 AM".
- Map showing the route from Pollachi to Palani with start/end markers.
- Summary under map: **Distance 65.2 km**, **Est. Time 1 hr 25 min**.
- Primary button at the bottom of the panel (cut off in image; [Assumed] "Get Fare").

**Behavior.** Changing places or mode re-requests directions and a quote. Date cannot be in the past; time uses IST; "Schedule for later" off = book now. Round Trip adds a return date. Local mode changes fare to hourly packages [Assumed].
**API.** `POST /quotes` → `FareQuote`. Debounce place changes (400 ms).
**States.** Route not found, no service, map key error fallback (text-only summary).

## P4. Fare Quote (Fare Estimate) — `/book/fare`
**Layout [Observed].** Title "**Fare Estimate**". Vehicle card: Sedan, "Maruti Dzire or Equivalent". Breakdown table (section 6.1). Total row **Total Estimated Fare ₹1,494.00** (bold). Two payment choice cards (radio):
1. **Advance Deposit (Recommended)** — Pay Now ₹500 | Pay at Drop ₹994 (selected, accent border)
2. **100% Full Payment** — Pay Now ₹1,494
Button **Proceed to Payment**.

**Behavior.** Quote expires at `validUntil`; show countdown and a Refresh action when expired. Selection stored in the draft; button → `/book/payment`. Tolls are labelled "(est.)" — final toll settled at drop [Assumed].
**A11y.** Payment choice is a `radiogroup` with descriptive labels.

## P5. Secure Payment & Booking Confirmation — `/book/payment`
**Layout [Observed].** Title "**Secure Payment**". Green check "**Booking Confirmed!**" with text "Your ride Payment for Booking." (copy needs fixing). Payment methods list (collapsible rows): UPI (Google Pay, PhonePe, …), **Credit / Debit Card**, **Net Banking**, **Wallet (Paytm)**. Checkbox "**I agree to the Terms & Conditions**". Button **Pay ₹500**. Footer "Secured by Razorpay".

**Behavior.**
1. Button disabled until the checkbox is ticked and a method is chosen.
2. `POST /payments/orders` → open Razorpay Checkout → on success `POST /payments/verify` (signature check on server) → booking becomes confirmed.
3. Only after verification show the **Booking Confirmed** state with booking code and a "Track ride" button. Before payment, hide the green check (the image shows both together; treat it as the success state).
4. Failure → inline error + Retry; keep the quote; idempotency key per attempt.
5. Amount shown on the button = selected option's `payNow`.
**Edge cases.** User closes checkout, double-click, network drop after payment (poll order status), expired quote.

## P6. Live Tracking (Driver Arriving) — `/bookings/[id]/track`
**Layout [Observed].** Nav with **Share** button. Title "**Driver Arriving**", subtitle "**4 min away • 1.2 km**". Large map with pickup label "Pollachi Bus Stand", car marker and route. Driver card: photo, **Selvam Kumar**, ★ 4.8, "TN 37 BY 1234 • Sedan". Actions: **Call**, **Message**, **SOS** (red).

**Behavior.** Subscribe to `driver.location` for the booking; smooth marker movement; ETA text updates. **Share** copies a public tracking link (token, expires at trip end). **Call** via masked number from server. **Message** opens chat panel [Assumed]. **SOS** asks for confirmation then `POST /bookings/:id/sos` and shows the confirmation. Show the 4-digit start OTP prominently here [Assumed — required by driver screen D5]. Status changes: arrived → banner; ongoing → "Trip in progress" view with ETA [Assumed]; completed → P7.
**States.** Driver offline, connection lost banner, driver cancelled → searching state.

## P7. Trip Completed & Rating — `/bookings/[id]/complete`
**Layout [Observed].** Green check, "**Trip Completed!**", text "Your ride has been successfully booked." (wrong copy — see section 14). Summary: **Total Fare ₹1,494**, **Amount Paid ₹1,494**, **Payment Method UPI (GPay)**. Driver row: **Selvam Kumar**, ★ 4.8, TN 37 BY 1234. "**Rate Your Driver**" with 5 stars. Textarea "Share your experience (optional)". Button **Submit Feedback**.

**Behavior.** Stars required; comment max 500 chars. Submit → `POST /bookings/:id/rating` → thank-you state with link to Bookings. Receipt download (PDF) [Assumed]. Show "Balance due at drop" if `due > 0`.

---

# PART B — DRIVER WEB (9 screens)

> Image numbering reads 1, 2, 3, 4, 6, 7, 8, 9; the "Arrived at Pickup" card (5) has no visible label.

**Shell [Observed].** After login: left sidebar — **Dashboard, Trip Offers, My Trips, Earnings, My Vehicle, Documents, Profile** — plus a slim top bar.

## D1. Login — `/driver/login`
**Layout [Observed].** Steering-wheel/car icon, "**RedTaxi Driver**", "Drive. Earn. Grow. With RedTaxi Pollachi." Fields: **Phone Number** (`+91 98765 43210`), **OTP** (placeholder "Enter 6-digit OTP") with **Get OTP** button, primary **Verify & Login**, link "**New Driver? Register**".
**Behavior.** Get OTP → 30 s resend timer; 6-digit input with paste support; Verify → session cookie → `/driver`. Register → onboarding flow (documents upload) [Assumed]. Unapproved drivers see a "pending approval" page.

## D2. Dashboard — `/driver`
**Layout [Observed].** "**Welcome Selvam Kumar**" with **Online** toggle (on). Stat tiles: **Today's Earnings ₹2,850**, **Trips 4**, **Rating 4.8**, **Completion 100%**. Card "**Current Trip**": "No active trip" and button **Go Online to receive offers**. "**Quick Actions**": **My Documents**, **My Vehicle**, **Support**.
**Behavior.** Toggle online/offline calls `POST /driver/online`; going online requires verified documents. When a trip is active the card shows it with a Resume button. Offers appear as a modal anywhere in the portal (D3). Greeting by time of day [Assumed].

## D3. Incoming Trip Offer — modal / `/driver/offers`
**Layout [Observed].** "**New Trip Offer**", red text "**45 seconds to accept**". Map with route. "Pollachi Bus Stand → Palani Temple", "65.2 km • 1 hr 25 min". Vehicle "Sedan (Dzire)", "4 Passengers • 2 Bags". Fare **₹1,494** "(₹14.90 / km)". Buttons **Decline** (outline red), **Accept**.
**Behavior.** Countdown from `expiresAt` (server time); auto-decline at 0; play sound and show browser notification (permission requested at go-online). Accept → `POST /offers/:id/accept`; if taken, show "Trip no longer available". Decline logs reason optionally.

## D4. Trip Accepted — `/driver/trips/[id]/accepted`
**Layout [Observed].** "**Trip Accepted**", subtitle "Navigate to Pickup". Pickup "Pollachi Bus Stand", Drop "Palani Temple". Passenger **Ravi Kumar** ★ 4.9. Buttons **Call**, **Message**. Primary **Start Navigation**.
**Behavior.** Start Navigation opens Google Maps directions in a new tab (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`). Move trip status to `driver_arriving`.

## D5. Arrived at Pickup — `/driver/trips/[id]/arrived`
**Layout [Observed].** Title "**Arrived at Pickup**", large location icon, "**Enter 4-Digit OTP**", text "Ask the passenger for their OTP to start the trip", four boxes, primary **Start Trip**.
**Behavior.** Auto-advance between boxes, backspace and paste handling. Button disabled until 4 digits. Wrong OTP → error + attempt limit (5). Success → `ongoing`. Waiting-time timer after grace period [Assumed].

## D6. Trip In Progress — `/driver/trips/[id]/progress`
**Layout [Observed].** "**Trip in Progress**", "1 hr 10 min • 65.2 km". Map with route and car. Outline button **Navigate**, red **End Trip**.
**Behavior.** Location posted every few seconds from `navigator.geolocation.watchPosition` (with throttling). End Trip → confirm dialog → D7. Warn if the page is hidden/backgrounded (browsers may pause tracking).

## D7. Complete Trip — `/driver/trips/[id]/complete`
**Layout [Observed].** Title "**Complete Trip**". "**Trip Summary**": Pollachi → Palani; **Distance 65.2 km**; **Duration 1 hr 25 min**; **Total Fare ₹1,494**. Input "**Enter final odometer (optional)**" placeholder "e.g., 45200". Primary **Complete Trip**.
**Behavior.** Show amount to collect = total − paid. Odometer numeric only. Complete → `POST /bookings/:id/complete` → Dashboard; toast with earnings added.

## D8. Earnings — `/driver/earnings`
**Layout [Observed].** Title "**Earnings**", dropdown "This Week". **₹12,850**. Bar chart Mon–Sun (Thu tallest). Tiles **Trips 18**, **Online Hours 32h 10m**. Link-button **View Detailed Earnings**.
**Behavior.** Range: Today / This Week / This Month [Assumed]. Hover/tap bar shows day total. Detail view = table of trips with fare, commission, net, payout status [Assumed]. Empty state "No trips this week".

## D9. Profile & Documents — `/driver/profile`
**Layout [Observed].** Avatar, **Selvam Kumar**, "Driver • ★ 4.8", "TN 37 BY 1234". **Online** toggle. Rows: **Personal Details**, **Vehicle Details**, **Documents** (green "Verified"), **Bank Details**, **Settings**, **Logout** (red).
**Behavior.** Documents page: upload (PDF/JPG/PNG, size limit, preview), status per document, expiry dates; an expired document blocks going online. Bank details are masked (last 4 digits only).

---

# PART C — ADMIN WEB (8 screens)

**Shell [Observed].** Left sidebar: **Dashboard, Bookings, Drivers, Dispatch, Pricing, Support Tickets, Analytics, Reports, Settings**. Top bar with search/notifications [Assumed].

## A1. Admin Login — `/admin/login`
**Layout [Observed].** Icon, "**RedTaxi Admin**", "Operations Control Center". **Email** (`admin@redtaxi.com`), **Password**, checkbox "**Remember me**", link "**Forgot password**", primary **Login**, link "Forgot password?" below.
**Behavior.** Zod validation; rate limit and lockout after repeated failures; password show/hide; MFA step [Assumed]; generic error ("Invalid email or password").

## A2. Dashboard — `/admin`
**Layout [Observed].** Stat tiles: **Total Bookings 128 (+12%)**, **Active Online 08**, **Drivers Online 96**, **Pending Drivers 12**. Section "**Live Map - Active Rides**" with legend **Driver Online** / **Active Ride**.
**Behavior.** Tiles link to filtered lists. Live map uses socket updates; cluster markers when many. Auto-refresh figures every 30 s.

## A3. Driver Management — `/admin/drivers`
**Layout [Observed].** Title "**Drivers**". Tabs **All, Pending, Approved, Rejected**. Search "Search drivers…". Table columns **Name, Vehicle, Status, Rating**:

| Name | Vehicle | Class | Status | Rating |
|------|---------|-------|--------|--------|
| Selvam Kumar | TN 37 BY 1234 | Sedan | Approved | 4.8 |
| Arun Kumar | TN 37 AB 1234 | SUV | Pending | 4.6 |
| Mohan Raj | TN 37 CD 5678 | Innova | Pending | 4.5 |
| Karthik | TN 37 EF 9012 | Hatchback | Approved | 4.7 |

**Behavior.** Server-side pagination, sorting, search (debounced). Row → `/admin/drivers/[id]` verification page (documents: Driving License, Vehicle RC, Insurance with Approve/Reject, reason required on reject, audit-logged — same as the mobile Driver Verification screen).

## A4. Booking Management — `/admin/bookings`
**Layout [Observed].** Title "**Bookings**". Tabs **All, Ongoing, Scheduled, Completed, Cancelled**. Search "Search bookings…". Primary **+ New Booking**. Table columns **ID, Customer, Route, Date & Time, Status**:

| ID | Customer | Route | Date & Time | Status |
|----|----------|-------|-------------|--------|
| #BK10234 | Ravi Kumar | Pollachi → Palani | 10 Oct, 06:30 AM | Ongoing |
| #BK10233 | Arun S | Pollachi → Coimbatore | 10 Oct, 09:00 AM | Scheduled |
| #BK10232 | Priya M | Pollachi → Chennai | 09 Oct, 07:30 AM | Completed |
| #BK10231 | Karthik R | Pollachi → Madurai | 09 Oct, 05:00 PM | Cancelled |

**Behavior.** Row → booking detail with timeline, driver, payment, actions (reassign, cancel, refund — all with confirm and audit) [Assumed]. **+ New Booking** opens a phone-booking form (customer, pickup, drop, vehicle, time) [Assumed]. Status badge colors: Ongoing = accent, Scheduled = warning, Completed = success, Cancelled = danger.

## A5. Dispatch / Live Monitoring — `/admin/dispatch`
**Layout [Observed].** Title "**Live Dispatch**". Filter dropdown "**All Vehicles**". Large map with vehicle markers and a pickup pin. Right panel "**Nearby Drivers**" with distance: Selvam Kumar 1.2 km; Arun Kumar 3.5 km; Mohan Raj 4.1 km; Karthik 6.3 km; Dinesh 8.2 km (shown in red = offline/unavailable [Assumed]).
**Behavior.** Select an unassigned booking → drivers sorted by distance → **Assign** (confirm). Filter by vehicle class. Real-time marker updates; list updates on `dispatch.update`. Offline drivers disabled.

## A6. Pricing Management — `/admin/pricing`
**Layout [Observed].** Title "**Pricing Rules**". Tabs **Hatchback, Sedan, SUV, Innova** (Hatchback active in the image). Fields (₹ with two decimals):

| Field | Value shown |
|-------|-------------|
| Base Rate Per Km (₹) | 16.00 |
| Driver Daily Batta (₹) | 350.00 |
| Night Allowance (₹) | 200.00 |
| Minimum Outstation Km | 100 |
| Advance Deposit | 25 |

Primary **Save Changes**.
**Behavior.** Dirty-state tracking; Save shows a diff (old → new) in a confirm dialog; audit-logged; applies to **new quotes only**. Validate ranges (rate > 0, batta ≥ 0, deposit 0–100 %). Add `minDeposit` field [Inferred, section 6.2]. Values are decimal rupees on this screen; convert to integer paise for the API.

## A7. Support Tickets — `/admin/tickets`
**Layout [Observed].** Title "**Support Tickets**". Tabs **All, Open (8), Resolved**. List cards with priority icon:

| ID | Title | Reporter • Priority | Age |
|----|-------|--------------------|-----|
| #STK1001 | Fare dispute - Overcharged | Customer • High | 2 hours ago |
| #STK1002 | Driver not arriving | Customer • Medium | 5 hours ago |
| #STK1003 | Lost item in vehicle | Customer • Medium | 1 day ago |

**Behavior.** Row → ticket detail with conversation, assign, change priority, resolve [Assumed]. Sorted by priority then age; relative times via `dayjs.relativeTime`.

## A8. Analytics — `/admin/analytics`
**Layout [Observed].** Title "**Analytics**", dropdown "**Last 7 Days**". "**Total Revenue ₹2,48,500**" (**+12%**). Line chart. Rows **Bookings 342**, **Completed 310**, **Cancelled 22**, **Completion Rate 90.8%**.
**Behavior.** Ranges: 7 / 30 days / custom [Assumed]. Compare to previous period for the % change. Export CSV (Reports). Chart has accessible table fallback.

---

## 8. Backend Contract (suggested)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/otp/send`, `/auth/otp/verify`, `/auth/admin/login`, `/auth/refresh`, `/auth/logout` |
| Catalog | `GET /vehicles`, `GET /tariff` |
| Places | `GET /places/autocomplete`, `/places/details`, `/directions` |
| Quote | `POST /quotes`, `GET /quotes/:id` |
| Payments | `POST /payments/orders`, `POST /payments/verify`, webhook (server only) |
| Bookings | `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel`, `/rating`, `/sos` |
| Driver | `POST /driver/online`, `GET /driver/stats`, `POST /offers/:id/accept|decline`, `POST /bookings/:id/arrived|start|complete`, `GET /driver/earnings?range=`, `GET/PUT /driver/profile`, `POST /driver/documents` |
| Admin | `GET /admin/stats`, `GET /admin/drivers`, `POST /admin/drivers/:id/approve|reject`, `GET /admin/bookings`, `POST /admin/bookings`, `GET /admin/dispatch`, `POST /admin/bookings/:id/assign`, `GET/PUT /admin/pricing/:class`, `GET /admin/tickets`, `GET /admin/analytics?range=`, `GET /admin/audit` |

All requests validated with Zod; errors use `{ code, message, fields? }`.

## 9. Shared Components (build once)

`TopNav`, `Sidebar`, `PageHeader`, `Button` (primary/outline/danger/loading/disabled), `Input`, `PhoneInput`, `OtpInput` (4 and 6 digits), `PlaceInput`, `Select`, `SegmentedControl`, `Tabs`, `Toggle`, `Badge`/`StatusBadge`, `Card`, `StatTile`, `DataTable` (sort, pagination, empty, loading), `Dialog`/`ConfirmDialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `VehicleCard`, `FareBreakdown`, `PaymentOptions`, `DriverCard`, `RatingStars`, `Timeline`, `MapView`, `RouteLayer`, `BarChartWeek`, `RevenueLine`.

States for every interactive element: default, hover, focus-visible, active, disabled, loading, error.

## 10. Responsive Behavior
- Breakpoints: 360, 768, 1024, 1280, 1536.
- Passenger site is mobile-first: nav collapses to a menu; booking flow becomes single-column; map moves above or below the panel.
- Driver portal: sidebar collapses to a bottom bar on small screens.
- Admin panel: desktop-first; tables scroll horizontally inside their container below 1024; sidebar collapses to a drawer.

## 11. Accessibility (WCAG 2.2 AA)
Semantic landmarks, skip link, visible focus rings, keyboard-operable tabs, radio groups, dialogs (focus trap, Esc), OTP inputs with labels (`aria-label="Digit 1 of 4"`), live regions for countdowns and ETA, `aria-busy` on loading tables, text alternatives for charts and map status, no color-only status (badges carry text), 44 px minimum targets on touch layouts, respect `prefers-reduced-motion`.

## 12. Security and Privacy
HttpOnly cookies; CSRF protection on mutating BFF routes (SameSite + origin check); strict CSP; no secrets in `NEXT_PUBLIC_*`; Maps key restricted by referrer and API; rate-limit OTP and login; never log OTPs, tokens, or card data; masked phone numbers between driver and passenger; upload validation and private storage with signed URLs; admin actions audit-logged; consent and Terms checkbox before payment; privacy policy and data-deletion request path (India DPDP); server-side fare and state only.

## 13. Quality, Testing, Delivery
- **Unit:** `computeFare` (including the ₹1,494 case), formatters, state machine, OTP input logic.
- **Component:** every shared component in all states; fare breakdown; payment options.
- **Integration:** MSW-mocked API for quote → payment → tracking.
- **E2E (Playwright):** passenger books and pays (Razorpay test mode); driver accepts → OTP → completes; admin approves a driver and assigns a booking.
- **Performance:** LCP < 2.5 s on landing; admin tables paginated server-side; code-split maps and charts (`next/dynamic`).
- **CI:** lint → typecheck → unit → build → E2E smoke → deploy preview; protected main branch.
- **Release:** feature flags, staged rollout, rollback plan, Sentry release tracking.

### 13.1 Build order
1. Tokens, UI kit, layouts, env validation, API client.
2. Auth (OTP, admin login), middleware.
3. Passenger P1–P5 with mocked API; fare logic and tests.
4. Realtime P6–P7.
5. Driver D1–D9.
6. Admin A1–A8.
7. Real API, payments, hardening, E2E, launch checklist.

### 13.2 Screen checklist

| Group | Screens | Built | Tested |
|-------|---------|-------|--------|
| Passenger | P1–P7 (7) | ☐ | ☐ |
| Driver | D1–D9 (9) | ☐ | ☐ |
| Admin | A1–A8 (8) | ☐ | ☐ |

A screen is done when: text and layout match the collage, all states exist, keyboard and screen-reader paths work, responsive checks pass, and tests are green.

---

## 14. Mismatches and Open Points (confirm before build)

1. **Fare resolved on web.** The web Fare Estimate fully explains ₹1,494 (distance + batta + toll + GST). The mobile storyboard's "(₹14.90 / km)" caption and the Offer screen's "(₹14.90 / km)" do not match this formula (1,494 ÷ 65.2 ≈ ₹22.9/km). Replace that caption with the breakdown or the effective rate.
2. **Advance deposit.** Web shows a flat ₹500 deposit (balance ₹994); mobile labelled it "Advance (25%)". The Pricing screen's value 25 plus a ₹500 minimum reproduces both — confirmed only by inference (section 6.2).
3. **Rates differ between platforms.** Web fleet: Hatchback ₹14/km, Prime SUV ₹22/km; mobile list: Hatchback ₹13/km, Prime SUV ₹21.80/km. Sedan ₹16 and Innova ₹26 match. Use one server-side tariff for both.
4. **Pricing screen inconsistencies.** Hatchback tab is active but shows ₹16.00/km (Sedan rate); Batta is ₹350 there but ₹300 in the fare estimate; mobile pricing screen used paise (1350 = ₹13.50) while web uses rupees. Standardize on integer paise in the API and a single display format in admin.
5. **Minimum km.** Cards show "Min 80/100/150 km", but the sample trip bills 65.2 km. Define which trip types the minimum applies to.
6. **Admin dashboard labels.** Web: "Drivers Online 96", "Active Online 08"; mobile: "96 Completed", "08 Active Rides". Define the metrics once.
7. **Driver statuses.** Web lists Karthik as Approved; mobile listed him as Rejected. Sample data only.
8. **Analytics.** Completion Rate shows 90.8 %; 310 / 342 = 90.6 %. Bookings 342 ≠ 310 + 22 (10 unaccounted: ongoing/scheduled).
9. **Copy errors.** Trip Completed says "Your ride has been successfully booked." (should say completed). Secure Payment shows "Booking Confirmed!" before paying and "Your ride Payment for Booking." (incomplete sentence).
10. **Trip durations.** Offer card shows 1 hr 25 min; Trip in Progress shows 1 hr 10 min remaining. Not a conflict if the second is remaining time — label it "remaining".
11. **Image label numbering skips 5** in the passenger and driver rows; mapping used here is by card order.
12. **Not drawn but required:** register flow for drivers, passenger Bookings list and Profile, chat, notifications, ticket detail, booking detail, driver documents page, admin Reports and Settings, audit log, 404/500 pages, empty and error states, cookie banner and legal pages.
