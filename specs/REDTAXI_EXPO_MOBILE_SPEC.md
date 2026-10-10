# RedTaxi Pollachi — Expo Mobile App Specification

Source: `RedTaxi_Pollachi_App_UI_Storyboard.png` ("Mobile App – All Screens (Single View)").
Scope: **32 screens** — Passenger 11, Driver 11, Admin 10 (mobile view).
Stack: **Expo (React Native) + TypeScript + Expo Router**.

Everything marked **[Observed]** is read directly from the storyboard. Everything marked **[Assumed]** is not visible in the image and must be confirmed. Section 15 lists mismatches found in the storyboard.

---

## 1. Brand and Design Tokens

**Brand:** RedTaxi, sub-brand "Pollachi". Tagline: "Safe. Reliable. Everywhere in Pollachi."
Variants: "RedTaxi" (passenger), "RedTaxi Driver", "RedTaxi Admin — Operations Control Center".
Logo: car icon above wordmark (passenger), steering-wheel icon (driver), car icon (admin).

### 1.1 Colors [Observed — palette strip at top of image]

| Token | Hex | Label in image | Use |
|-------|-----|----------------|-----|
| `accent` | `#6969EF` | Accent | Primary buttons, selected states, links, active tab |
| `accentLight` | `#7D7DFF` | Accent | Gradients, secondary accents |
| `success` | `#50FF97` | Accent | Online toggle, verified, completed |
| `surface` | `#D3D3FF` | Surface | Card tints, icon tiles, chips |
| `bgDark` | `#C6C6FF` | Bg Dark | Page gradient end, dividers |
| `background` | `#F5F6F4` | Background | Screen background |
| `text` | `#000344` | Text | Headings, primary text |
| `textBody` | `#424242` | Text | Body text |
| `textSecondary` | `#A6A7BE` | Text Secondary | Hints, placeholders, captions |
| `white` | `#FFFFFF` | White | Cards, text on accent |

**[Assumed] extra tokens** (visible in the image but not in the palette strip; sample from the design file before build):
- `danger` ≈ coral red — SOS, End Trip, Decline outline, Rejected badge, Logout text.
- `warning` ≈ orange — Pending badge, Medium priority.
- `star` ≈ amber — rating stars.

### 1.2 Typography [Assumed]
Clean geometric sans. Use **Inter** via `@expo-google-fonts/inter` (weights 400, 500, 600, 700). Sizes estimated from image: caption 10–11, body 12–14, label 14, title 16–18, screen title 18–20, big number 28–32.

### 1.3 Shape and spacing [Assumed from image]
- 4 px base grid; screen horizontal padding 16.
- Buttons: height 44–48, radius 8–10, full width.
- Cards: white, radius 12–16, soft shadow, 1 px light border.
- Chips and badges: pill, radius 999.
- Icon tiles: 40×40, `surface` background, radius 10.

### 1.4 Shared components to build once
`Screen`, `AppBar` (back arrow + centered or left title + optional right action), `Button` (primary / outline / danger / disabled / loading), `TextField`, `PhoneField` (+91 prefix), `OtpBoxes` (4), `Card`, `ListRow`, `StatusBadge` (Pending / Approved / Rejected / Verified / Assigned / Open / Resolved), `Tabs` (segmented text tabs), `Toggle`, `StatTile`, `RatingStars`, `DriverCard`, `RouteCard` (pickup → drop), `FareRow`, `MapView` with route polyline and markers, `BottomTabBar`, `Timeline`, `BarChart`, `LineChart`, `EmptyState`, `ErrorState`, `Skeleton`.

---

## 2. Expo Project Setup

```bash
npx create-expo-app@latest redtaxi --template default
cd redtaxi
npx expo install expo-router expo-location expo-notifications expo-secure-store \
  expo-font @expo-google-fonts/inter expo-image expo-image-picker expo-document-picker \
  expo-linking expo-sharing expo-haptics expo-localization expo-constants \
  expo-apple-authentication expo-auth-session expo-web-browser expo-dev-client \
  react-native-maps react-native-svg react-native-reanimated react-native-gesture-handler \
  react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage
npm i zustand @tanstack/react-query axios zod react-hook-form @hookform/resolvers \
  react-native-gifted-charts socket.io-client dayjs
npm i -D typescript eslint jest jest-expo @testing-library/react-native detox
```

Notes:
- **Razorpay** (payment screen) needs a native module → use an **EAS development build** (`eas build --profile development`), not Expo Go.
- Google Sign-In and Apple Sign-In also need a development build for production.
- Maps: Google Maps API key for Android, Apple Maps on iOS (or Google). Put keys in `app.config.ts` via env, never in source.
- Always check current versions with `npx expo install --check`.

### 2.1 One codebase, three roles
Route groups, role-gated after login:

```
app/
  _layout.tsx                  # providers, fonts, auth gate
  index.tsx                    # redirect by role/auth state
  (auth)/
    splash.tsx  onboarding.tsx  login.tsx  otp.tsx
  (passenger)/
    _layout.tsx
    home.tsx  select-location.tsx  vehicle.tsx  fare-quote.tsx
    payment.tsx  tracking.tsx  trip.tsx  rating.tsx
  (driver)/
    _layout.tsx                # bottom tabs: Home, Trips, Earnings, Profile
    (tabs)/dashboard.tsx  trips.tsx  earnings.tsx  profile.tsx
    offer.tsx  trip-accepted.tsx  navigate-pickup.tsx
    arrived.tsx  trip-progress.tsx  complete-trip.tsx
  (admin)/
    _layout.tsx                # drawer menu
    dashboard.tsx  drivers.tsx  driver/[id].tsx  dispatch.tsx
    booking/[id].tsx  pricing.tsx  tickets.tsx  analytics.tsx  menu.tsx
src/
  api/ (client.ts, auth.ts, rides.ts, driver.ts, admin.ts, payments.ts)
  components/ (ui/, map/, charts/)
  features/ (passenger/, driver/, admin/)
  store/ (auth.ts, ride.ts, driver.ts)
  theme/ (tokens.ts)
  lib/ (format.ts, socket.ts, location.ts)
  types/ (domain.ts)
```

To ship separate store apps, use `APP_VARIANT=passenger|driver|admin` in `app.config.ts` (different name, bundle ID, icon) and EAS build profiles; the code stays shared.

---

## 3. Domain Model (TypeScript)

All money is stored as **integer paise**; format only in the UI (`₹1,494`).

```ts
export type Role = 'passenger' | 'driver' | 'admin';

export type RideStatus =
  | 'quoted' | 'booked' | 'searching' | 'driver_assigned'
  | 'driver_arriving' | 'driver_arrived' | 'in_progress'
  | 'completed' | 'cancelled' | 'no_driver';

export interface Place { name: string; subtitle?: string; lat: number; lng: number }

export interface Quote {
  id: string; pickup: Place; drop: Place;
  distanceKm: number; durationMin: number;
  fareTotalPaise: number; ratePerKmPaise: number;
  advancePaise: number; advancePercent: number;
  validUntil: string;                       // ISO, 15 min window
}

export interface Ride {
  id: string; bookingNo: string;            // e.g. BK10234
  status: RideStatus; quote: Quote; vehicleType: VehicleType;
  driver?: DriverSummary; otp?: string;     // 4-digit start OTP
  timeline: { status: RideStatus; at: string }[];
  paidPaise: number; balanceDuePaise: number;
}

export type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'innova';
export interface DriverSummary {
  id: string; name: string; rating: number; vehicleNo: string; vehicleType: VehicleType; phone?: string;
}

export type DocStatus = 'verified' | 'pending' | 'rejected';
export type DriverApproval = 'pending' | 'approved' | 'rejected';
```

---

## 4. Navigation Map

**Passenger:** Splash → Onboarding → Login → OTP → Home → Select Location → Vehicle → Fare Quote → Payment → Ride Tracking → Trip In Progress → Completed & Rating → Home.

**Driver:** Splash → Login → OTP → Dashboard → (Incoming Offer) → Trip Accepted → Navigate to Pickup → Arrived (OTP) → Trip In Progress → Complete Trip → Dashboard. Tabs: Home, Trips, Earnings, Profile.

**Admin:** Login → Dashboard → Drivers → Driver Verification; Dashboard → Live Dispatch → Booking Details; Menu → Pricing Rules, Support Tickets, Analytics (via Dashboard / Menu), Audit Logs, Settings, Logout.

---

# PART A — PASSENGER APP (11 screens)

> Common: no bottom tab bar is shown on passenger screens in the storyboard. Back arrow appears top-left on screens 3, 5, 6, 7, 8, 9, 10.

## A1. Splash
- **Route:** `(auth)/splash.tsx`
- **Layout [Observed]:** Light gradient background. Centered car icon, wordmark "RedTaxi", sub-label "Pollachi". Tagline "Your Reliable Travel Partner". Bottom illustration: city skyline with a sedan.
- **Behavior:** Hold 1.5–2 s while loading fonts, reading secure-stored tokens. Route: first launch → Onboarding; token valid → Home; else → Login.
- **States:** loading only. If token refresh fails → Login.

## A2. Onboarding
- **Route:** `(auth)/onboarding.tsx`
- **Layout [Observed]:** Illustration (person holding phone with map pin). Title "Travel Anywhere in Pollachi". Body "Trusted drivers, transparent fares and safe rides for every journey." Pagination dots (first active). Primary button "Get Started". Text link "Skip" below.
- **Behavior:** "Get Started" and "Skip" both → Login; set `onboardingSeen` in storage. Storyboard shows one slide; dots imply a carousel — build as a horizontal pager, with content for extra slides [Assumed].

## A3. Login / OTP
- **Route:** `(auth)/login.tsx`, `(auth)/otp.tsx`
- **Layout [Observed]:** Back arrow. Title "Welcome Back". Subtitle "Enter your phone number to continue". Phone field with flag and `+91`, value shown `98765 43210`. Primary button "Send OTP". Divider text "Other login options". Buttons "Continue with Google" and "Continue with Apple".
- **Validation:** 10-digit Indian mobile starting 6–9. Disable button until valid.
- **OTP step [Assumed — not drawn]:** 4 or 6 boxes, 30 s resend timer, attempt limit, auto-read SMS on Android.
- **API:** `POST /auth/otp/send`, `POST /auth/otp/verify` → tokens saved in SecureStore.
- **Errors:** invalid number, too many requests, wrong or expired OTP, network failure.
- **Note:** Apple button must show on iOS only (hide on Android).

## A4. Home
- **Route:** `(passenger)/home.tsx`
- **Layout [Observed]:**
  1. Header: car logo, "RedTaxi / Pollachi", notification bell with red dot (right).
  2. Search bar "Where would you like to go?" with chevron.
  3. Card: "Current location — Pollachi Bus Stand" (blue dot) and "Enter destination" (orange dot), connected by a line.
  4. "Quick Access" row, four icon tiles: **Ride Now**, **Outstation**, **Rental**, **Schedule**.
  5. Promo banner: "Special Fares to Palani, Coimbatore & More" with car image.
- **Behavior:** Tapping search or "Enter destination" → Select Location. Ride Now → Select Location (One Way). Outstation / Rental → Vehicle screen with that tab preselected. Schedule → date-time picker [Assumed]. Bell → notifications list [Assumed, not drawn].
- **Data:** current location via `expo-location` reverse geocode; default label falls back to "Pollachi Bus Stand" only when permission denied [Assumed].
- **States:** permission denied banner, no network, loading skeleton for banner.

## A5. Select Location
- **Route:** `(passenger)/select-location.tsx`
- **Layout [Observed]:** Back arrow, title "Select Location". Search field "Search for a location". Full map with draggable pin. Bottom sheet card: pin icon, "Pollachi Bus Stand", "Pollachi, Tamil Nadu". Primary button "Confirm Pickup".
- **Behavior:** Drag map to move pin → reverse geocode → update card. Search → place autocomplete list. "Confirm Pickup" → drop selection (same screen in drop mode, button label "Confirm Drop" [Assumed]) → Vehicle.
- **Edge cases:** outside service area message, GPS off, geocode failure.

## A6. Choose a Vehicle
- **Route:** `(passenger)/vehicle.tsx`
- **Layout [Observed]:** Back arrow, title "Choose a Vehicle". Tabs: **One Way** (selected), **Outstation**, **Rental**. Radio list:

| Vehicle | Rate | Seats | Selected |
|---------|------|-------|----------|
| Hatchback | ₹13.00 / km | 4 seats | no |
| Sedan | ₹16.00 / km | 4 seats | **yes** |
| Prime SUV | ₹21.80 / km | 6 seats | no |
| Innova Crysta | ₹26.00 / km | 7 seats | no |

  Each row: car image, name, rate, seats, radio on right. Primary button "Continue".
- **Behavior:** Single-select; selected row highlighted with `accent` border and tinted background. Continue → creates quote → Fare Quote.
- **Data:** rates and availability come from the server; do not hardcode.
- **States:** loading, vehicle unavailable (disabled row), no vehicles.

## A7. Fare Quote
- **Route:** `(passenger)/fare-quote.tsx`
- **Layout [Observed]:** Back arrow, title "Fare Quote". Route card: "Pollachi Bus Stand / Pollachi" → "Palani Temple / Palani". Rows: **Distance** 65.2 km; **Duration** 1 hr 25 min. Large fare **₹1,494** with caption "(₹14.90 / km)". Row **Advance (25%)** ₹500. Row **Valid for 15 minutes** with chevron. Primary button "Book Now".
- **Behavior:** Countdown from `validUntil`; when expired, disable button and show "Quote expired — Refresh". "Book Now" → Payment.
- **Rule:** Fare is computed on the server; the app only displays it. See mismatch note 15.1.

## A8. Payment
- **Route:** `(passenger)/payment.tsx`
- **Layout [Observed]:** Back arrow, title "Payment". Card "Pay Advance" with amount **₹500**. Radio list:
  1. **UPI (GPay, PhonePe, etc.)** — selected
  2. **Credit / Debit Card**
  3. **Net Banking**
  4. **Pay at Pickup** — caption "(For eligible users)"
  Primary button "Pay Now". Footer "Secured by Razorpay".
- **Behavior:** Pay Now → create order on server → open Razorpay checkout → on success verify signature on server → booking confirmed → Ride Tracking. Failure → inline error with Retry. "Pay at Pickup" row disabled with explanation when the user is not eligible.
- **Rules:** Amount from server; idempotency key per attempt; verify payment server-side before confirming; handle app killed mid-payment by polling order status on next launch.

## A9. Ride Tracking
- **Route:** `(passenger)/tracking.tsx`
- **Layout [Observed]:** Back arrow, title "Driver Arriving", subtitle "4 min away • 1.2 km". Map with pickup label "Pollachi Bus Stand" and car marker with route. Bottom card: driver photo, **Selvam Kumar**, ★ 4.8, "TN 37 BY 1234 • Sedan". Three actions: **Call**, **Message**, **Share**.
- **Behavior:** Live driver location via WebSocket; ETA recalculated. Call → `tel:` (masked number via server). Message → in-app chat [Assumed]. Share → `expo-sharing` / share sheet with live-trip link. Ride OTP for start must be shown to the passenger [Assumed — not visible; required by driver screen D7].
- **Cancel:** not drawn; add Cancel with reason sheet [Assumed].
- **States:** driver lost connection, driver cancelled → re-search.

## A10. Trip In Progress
- **Route:** `(passenger)/trip.tsx`
- **Layout [Observed]:** Back arrow, title "Trip in Progress", subtitle "ETA: 1 hr 10 min". Map with route and car marker. Card: destination "Palani Temple", "65.2 km • 1 hr 10 min", dropdown "Fare Details". Large red button **SOS**.
- **Behavior:** SOS requires press-and-hold or confirm dialog [Assumed], then sends live location to admin and emergency contacts, and shows confirmation. "Fare Details" expands breakdown. Trip end → Completed.
- **Rule:** SOS must work offline-tolerant: queue and retry; haptic feedback on trigger.

## A11. Ride Completed & Rating
- **Route:** `(passenger)/rating.tsx`
- **Layout [Observed]:** Title "Ride Completed". Green check circle. "Thank you for riding with RedTaxi". **₹1,494** with caption "Total Fare". Driver row: photo, Selvam Kumar, ★ 4.8, "TN 37 BY 1234". Five tappable stars. Button "Submit Feedback".
- **Behavior:** Stars required (min 1); comment optional [Assumed]. Submit → `POST /rides/:id/rating` → Home. Show remaining balance to pay if `balanceDuePaise > 0` [Assumed].

---

# PART B — DRIVER APP (11 screens)

> Bottom tab bar (Home, Trips, Earnings, Profile) appears on Dashboard, Earnings, and Profile screens.

## B1. Splash
- **Route:** `(auth)/splash.tsx` (driver variant)
- **Layout [Observed]:** Steering-wheel icon, "RedTaxi", "Driver". Text "Drive. Earn. Grow. With RedTaxi Pollachi." Skyline illustration with a car.

## B2. Login / OTP
- **Route:** `(auth)/login.tsx` (driver variant)
- **Layout [Observed]:** Title "Welcome Driver". Phone field `+91 98765 43210`. Button "Send OTP". No social login.
- **Behavior:** Same OTP flow as A3. After login, if `approval !== 'approved'`, show a pending/rejected status screen [Assumed] instead of Dashboard.

## B3. Dashboard
- **Route:** `(driver)/(tabs)/dashboard.tsx`
- **Layout [Observed]:** Avatar, "Good Morning", **Selvam Kumar**. Wide **Online** bar with toggle (on, green). Two stat cards: **Today's Earnings ₹2,850**, **Trips 4**. 2×2 tiles: **Trip Offers**, **Earnings**, **My Vehicle**, **Documents**. Bottom tabs: Home (active), Trips, Earnings, Profile.
- **Behavior:** Toggle online/offline → starts/stops location streaming and offer listening. Block going online if documents are not verified [Assumed]. Greeting changes by time of day [Assumed]. Tiles navigate to their sections.
- **Background:** use `expo-location` foreground service on Android with persistent notification while online [requires dev build config].

## B4. Incoming Offer
- **Route:** `(driver)/offer.tsx` (also shown as full-screen modal on push)
- **Layout [Observed]:** Back arrow, title "New Trip Offer", subtitle "45 seconds to accept". Map with route. Route text "Pollachi Bus Stand → Palani Temple", "65.2 km • 1 hr 10 min". Fare **₹1,494** "(₹14.90 / km)". Buttons: **Decline** (outline red) and **Accept** (primary).
- **Behavior:** 45 s countdown; at zero auto-decline and return to Dashboard. Accept → `POST /offers/:id/accept`; if another driver won, show "Trip no longer available". Play sound and vibrate on arrival.

## B5. Trip Details (Accepted)
- **Route:** `(driver)/trip-accepted.tsx`
- **Layout [Observed]:** Title "Trip Accepted" with subtitle line. Card: Pickup "Pollachi Bus Stand", Drop "Palani Temple". Passenger row: photo, **Ravi Kumar**, ★ 4.8. Buttons **Call**, **Message**. Primary "Start Navigation".
- **Behavior:** Start Navigation → Navigate to Pickup. Call via masked number.

## B6. Navigate to Pickup
- **Route:** `(driver)/navigate-pickup.tsx`
- **Layout [Observed]:** Title "Navigate to Pickup", subtitle "4 min • 1.2 km". Map with route and destination pin. Button "Open Maps".
- **Behavior:** "Open Maps" deep-links to Google Maps / Apple Maps with the pickup coordinates via `expo-linking`. When within ~100 m of pickup, show "I've Arrived" [Assumed] → Arrived screen. Notify passenger on arrival.

## B7. Arrived at Pickup
- **Route:** `(driver)/arrived.tsx`
- **Layout [Observed]:** Title "Arrived at Pickup". Check icon. Heading "Enter 4-Digit OTP". Text "Ask the passenger for their OTP to start the trip". Four empty OTP boxes. Primary "Start Trip".
- **Behavior:** Button disabled until 4 digits. Wrong OTP → shake + error, attempt limit (e.g., 5). Success → Trip In Progress. Waiting-time charge after grace period [Assumed].

## B8. Trip In Progress
- **Route:** `(driver)/trip-progress.tsx`
- **Layout [Observed]:** Title "Trip in Progress", subtitle "1 hr 10 min • 65.2 km". Map with route and car. Outline button "Navigate". Red button "End Trip".
- **Behavior:** Navigate opens external maps to the drop. End Trip → confirm dialog → Complete Trip. Location keeps streaming; trip distance recorded server-side.

## B9. Complete Trip
- **Route:** `(driver)/complete-trip.tsx`
- **Layout [Observed]:** Back arrow, title "Complete Trip". Card "Trip Summary": Pollachi → Palani; Distance 65.2 km; Duration 1 hr 25 min; Total Fare **₹1,494**. Info card "Collect remaining amount from passenger". Primary "Complete Trip" (with arrow icon).
- **Behavior:** Show amount to collect = total − advance paid. Complete → `POST /rides/:id/complete` → Dashboard; trip appears in Earnings.

## B10. Earnings
- **Route:** `(driver)/(tabs)/earnings.tsx`
- **Layout [Observed]:** Title "Earnings", dropdown "This Week". Big **₹12,850**. Bar chart Mon–Sun (Thu tallest, Fri and Sun shortest). Two tiles: **Trips 18**, **Online Hours 32h 10m**. Link button "View Detailed Earnings".
- **Behavior:** Dropdown: Today / This Week / This Month [Assumed]. Bars tappable to show value. Detailed view → per-trip list and payout status [Assumed].
- **States:** empty week ("No trips yet"), loading skeleton.

## B11. Profile & Documents
- **Route:** `(driver)/(tabs)/profile.tsx`
- **Layout [Observed]:** Avatar, **Selvam Kumar**, "★ 4.8 • 124 trips", Online toggle. Menu rows with chevron: **Personal Details**, **Vehicle Details**, **Documents** (green "Verified"), **Payout Details**, **Settings**. Bottom tabs with Profile active.
- **Behavior:** Documents screen lists license, RC, insurance with status and upload via `expo-image-picker` / `expo-document-picker` [Assumed]. Expired document blocks going online.

---

# PART C — ADMIN APP (10 screens, mobile view)

## C1. Login
- **Route:** `(auth)/login.tsx` (admin variant)
- **Layout [Observed]:** Icon, "RedTaxi", "Admin", "Operations Control Center". Email field `admin@redtaxi.com`, password field (masked). Primary "Login". Link "Forgot password?".
- **Behavior:** Email + password; MFA step recommended [Assumed]. Lock after repeated failures. Show/hide password toggle.

## C2. Dashboard
- **Route:** `(admin)/dashboard.tsx`
- **Layout [Observed]:** Title "Dashboard", date "Today, 9 Oct 2026", bell icon. 2×2 stat tiles: **128 Total Bookings**, **96 Completed**, **08 Active Rides**, **12 Pending Drivers**. Section "Live Map - Active Rides" with map and markers.
- **Behavior:** Auto-refresh every 15–30 s or via socket. Tiles navigate (Bookings, Drivers → Pending tab, Live Dispatch). Date uses device locale, shown as "Today, D MMM YYYY".

## C3. Driver Management
- **Route:** `(admin)/drivers.tsx`
- **Layout [Observed]:** Title "Drivers". Tabs **All**, **Pending**, **Approved**, **Rejected**. List rows: photo, name, vehicle number, status badge:

| Driver | Vehicle | Status |
|--------|---------|--------|
| Arun Kumar | TN 37 AB 1234 | Pending |
| Selvam Kumar | TN 37 BY 1234 | Approved |
| Mohan Raj | TN 37 CD 5678 | Pending |
| Karthik | TN 37 EF 9012 | Rejected |

- **Behavior:** Row → Driver Verification. Search and pagination [Assumed].

## C4. Driver Verification
- **Route:** `(admin)/driver/[id].tsx`
- **Layout [Observed]:** Header: photo, **Arun Kumar**, "TN 37 AB 1234". Tabs **Documents** (active), **Details**, **History**. Rows: **Driving License — Verified**, **Vehicle RC — Verified**, **Insurance — Pending**. Buttons **Reject** (outline) and **Approve** (primary).
- **Behavior:** Tap a document → full-screen viewer with approve/reject per document [Assumed]. Approve disabled until all documents are verified [Assumed]. Reject requires a reason. Every action is audit-logged.

## C5. Live Dispatch
- **Route:** `(admin)/dispatch.tsx`
- **Layout [Observed]:** Title "Live Dispatch". Section "Unassigned Bookings" with count badge **3**. Cards:

| Route | Vehicle • Fare | Status | Action |
|-------|----------------|--------|--------|
| Pollachi → Palani | Sedan • ₹1,494 | "Searching drivers…" with timer 00:22 | — |
| Pollachi → Coimbatore | Hatchback • ₹850 | "5 drivers in range" | **Assign** |
| Pollachi → Valparai | SUV • ₹2,850 | "Manual review" | **Assign** |

- **Behavior:** Assign → driver picker (nearby, sorted by distance) → confirm. Timer counts up since request. Live updates by socket.

## C6. Booking Details
- **Route:** `(admin)/booking/[id].tsx`
- **Layout [Observed]:** Title "Booking #BK10234". Route line (Pollachi → Palani). Status badge "Driver Assigned" (green). Driver row: photo, Selvam Kumar, ★ 4.8, TN 37 BY 1234. Buttons **Call**, **Message**. "Trip Timeline": Booking Created 09:15 AM; Driver Assigned 09:17 AM; Driver Arriving 09:22 AM; Trip Started (time not visible).
- **Behavior:** Timeline built from `ride.timeline`; future steps shown as hollow dots. Admin actions [Assumed]: reassign, cancel, refund.

## C7. Pricing Management
- **Route:** `(admin)/pricing.tsx`
- **Layout [Observed]:** Title "Pricing Rules", subtitle "Pollachi Base Hub", settings icon. Tabs **Hatchback**, **Sedan** (active), **SUV**, **Innova**. Fields (value + helper):

| Field | Value | Helper |
|-------|-------|--------|
| Base Rate Per Km | 1350 | paise (₹13.50) |
| Driver Daily Batta | 30000 | paise (₹300) |
| Night Allowance | 15000 | paise (₹150) |
| Minimum Outstation Km | 80 | — |

  Primary "Save Changes".
- **Behavior:** Numeric inputs in **paise**; helper updates live to rupees. Save → confirm dialog showing old → new values; audit-logged; effective for new quotes only. See mismatch 15.2.

## C8. Support Tickets
- **Route:** `(admin)/tickets.tsx`
- **Layout [Observed]:** Title "Support Tickets". Tabs **All**, **Open**, **Resolved**. Cards:

| ID | Title | Reporter • Priority | Age |
|----|-------|--------------------|-----|
| #STK1001 | Fare dispute - Overcharged | Customer • High | 1 hour ago |
| #STK1002 | Driver not arriving | Customer • Medium | 3 hours ago |
| #STK1003 | Lost item in vehicle | Customer • Medium | 5 hours ago |

  Each has a colored left icon by priority (red = High, orange = Medium).
- **Behavior:** Row → ticket detail with reply and resolve [Assumed].

## C9. Analytics
- **Route:** `(admin)/analytics.tsx`
- **Layout [Observed]:** Title "Analytics", dropdown "Last 7 Days". "Total Revenue" **₹2,48,500** with **+12%** (green). Line/area chart. Rows: **Bookings 342**, **Completed 310**, **Cancelled 22**, **Completion Rate 90.6%**.
- **Behavior:** Range: 7 days / 30 days / custom [Assumed]. Use Indian digit grouping (`en-IN`).

## C10. Menu / Logout
- **Route:** `(admin)/menu.tsx` (drawer content)
- **Layout [Observed]:** Header "RedTaxi / Admin" with logo. Items with icons: **Dashboard**, **Bookings**, **Drivers**, **Pricing Rules**, **Support Tickets**, **Audit Logs**, **Settings**, **Logout** (red). Decorative building illustration on the closed-menu preview.
- **Behavior:** Logout → confirm → clear SecureStore, close sockets, → Login. "Bookings", "Audit Logs", "Settings" screens are not drawn — build as list screens [Assumed].

---

## 5. Backend Contract (suggested)

| Area | Endpoint |
|------|----------|
| Auth | `POST /auth/otp/send`, `/auth/otp/verify`, `/auth/refresh`, `/auth/admin/login`, `/auth/logout` |
| Places | `GET /places/search?q=`, `GET /places/reverse?lat=&lng=` |
| Quote | `GET /vehicles?pickup=&drop=&mode=`, `POST /quotes` |
| Booking | `POST /rides` (needs paid advance or eligible pay-at-pickup), `GET /rides/:id`, `POST /rides/:id/cancel`, `POST /rides/:id/rating`, `POST /rides/:id/sos` |
| Payments | `POST /payments/orders`, `POST /payments/verify`, webhook (server only) |
| Driver | `POST /driver/online`, `GET /driver/offers/:id`, `POST /offers/:id/accept|decline`, `POST /rides/:id/arrived`, `/start` (with OTP), `/complete`, `GET /driver/earnings?range=`, `GET/PUT /driver/profile`, `POST /driver/documents` |
| Admin | `GET /admin/stats`, `GET /admin/drivers?status=`, `GET/POST /admin/drivers/:id/approve|reject`, `GET /admin/dispatch`, `POST /admin/rides/:id/assign`, `GET/PUT /admin/pricing/:vehicle`, `GET /admin/tickets`, `GET /admin/analytics?range=`, `GET /admin/audit` |
| Realtime | Socket events: `driver.location`, `ride.status`, `offer.new`, `offer.expired`, `dispatch.update`, `sos.alert` |

## 6. State and Data Rules
- **Auth store:** tokens in `expo-secure-store`; refresh on 401 once, then logout.
- **Server state:** TanStack Query for lists and details; socket events invalidate queries.
- **Active ride:** persisted ID so the app resumes the correct screen after kill or restart (passenger: Tracking/Trip; driver: current trip step).
- **Ride status → screen mapping (passenger):** `driver_assigned`/`driver_arriving` → A9; `driver_arrived` → A9 with arrival banner; `in_progress` → A10; `completed` → A11.
- **Ride status → screen mapping (driver):** assigned → B5; arriving → B6; arrived → B7; in_progress → B8; ending → B9.
- Money in paise; distance in km with one decimal; duration as "1 hr 25 min"; times in IST.

## 7. Permissions (app.config.ts)
- Location when in use (passenger, driver) and background location (driver, only while online).
- Notifications (offers, ride updates).
- Camera and photo library (driver documents, profile photo).
- iOS usage strings must state the real purpose for each permission.
- Android: foreground service location, POST_NOTIFICATIONS.

## 8. Accessibility
- Minimum touch target 44×44.
- Text contrast ≥ 4.5:1: white on `#6969EF` passes for large/bold text only — use 16 px semi-bold on buttons; do not put `textSecondary` on `surface` for essential text.
- Do not rely on color alone for status: badges always include text.
- Screen reader labels on icon-only buttons (back, bell, call, message, share, SOS).
- Support large font scaling without clipping; test at 200 %.

## 9. Error, Empty, Loading States (apply to every screen)
Loading skeleton; empty state with message and action; inline field errors; full-screen error with Retry; offline banner; session-expired redirect.

## 10. Security
Server-side fare and state; token storage in SecureStore; certificate pinning optional; no OTP, token, or payment data in logs; masked calls; admin MFA and audit logging; rate limits on OTP and login; validate all inputs with Zod and again on server.

## 11. Testing
- Unit: formatters (paise → ₹, Indian grouping), fare display, OTP validation, countdown hooks.
- Component: each shared component in all states.
- Integration: mock API with MSW; run the full booking flow.
- E2E (Detox or Maestro): Passenger booking, Driver accept → complete, Admin approve driver.
- Device matrix: low-end Android, small iPhone, large Android, slow 3G.

## 12. Build and Release
- EAS profiles: `development`, `preview`, `production`; separate bundle IDs for variants.
- OTA updates (EAS Update) for JS-only fixes; store builds for native changes.
- Crash reporting (Sentry) and analytics events without personal data.
- Store requirements: privacy policy URL, data safety form, permission justifications, background-location review text for the driver app.

## 13. Build Order
1. Theme, fonts, shared components, auth shell.
2. Passenger A1–A8 with mocked API.
3. Realtime tracking A9–A11.
4. Driver B1–B11.
5. Admin C1–C10.
6. Real API, payments, push, hardening, tests, release.

## 14. Screen Checklist

| # | Screen | Built | Tested |
|---|--------|-------|--------|
| A1–A11 | Passenger (11) | ☐ | ☐ |
| B1–B11 | Driver (11) | ☐ | ☐ |
| C1–C10 | Admin (10) | ☐ | ☐ |

Done for a screen means: matches storyboard text and layout, all states handled, accessible labels, works offline-gracefully, unit and component tests pass.

---

## 15. Mismatches Found in the Storyboard (confirm before build)

1. **Fare math.** ₹1,494 for 65.2 km does not equal 65.2 × ₹14.90 (≈ ₹971) or 65.2 × ₹16.00 (≈ ₹1,043). The "(₹14.90 / km)" caption and the total cannot both come from one per-km rate. Likely extra components (batta, tolls, return, taxes) are included. Define the fare formula and show a breakdown in "Fare Details".
2. **Rate differences.** Vehicle list shows Hatchback ₹13.00 / km; Pricing screen shows the Sedan tab with Base Rate 1350 paise (₹13.50) while the Sedan row shows ₹16.00 / km. Clarify what "Base Rate Per Km" means versus the customer rate.
3. **Advance.** "Advance (25%)" shows ₹500, but 25 % of ₹1,494 is ₹373.50. Confirm the rule (for example a minimum of ₹500) and let the server return the value.
4. **Analytics.** Bookings 342 = Completed 310 + Cancelled 22 + 10 others; define the remaining category (active/pending). Completion rate 90.6 % = 310 / 342.
5. **Admin Booking Details** route text is blurred in the image; "Pollachi → Palani" is assumed from the timeline context and the other screens.
6. **Missing screens** implied but not drawn: OTP entry, notifications list, cancel ride, chat, ride OTP display for passenger, driver document upload, driver approval-pending state, Bookings list, Audit Logs, Settings, ticket detail.
7. **Admin on mobile.** The storyboard titles section "Admin Web App (Mobile View)". Build the same screens responsive so they also work on Expo Web.
8. **Date shown** on Admin Dashboard is "Today, 9 Oct 2026" — render the real current date, not a constant.
