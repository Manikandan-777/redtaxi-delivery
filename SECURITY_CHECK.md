# RedTaxi — Security Check (run after the demo is built)

> Part of the RedTaxi delivery pack. Start at [README.md](README.md).
> Related: [IMPLEMENTATION.md](IMPLEMENTATION.md) (phases that introduce each control) · [TESTING.md](TESTING.md) (gates that require this file) · [VULNERABILITY.md](VULNERABILITY.md) (hunts for what this file might miss) · [PIPELINE.md](PIPELINE.md)

## 1. Purpose

[VULNERABILITY.md](VULNERABILITY.md) asks *"can an attacker break it?"*
This file asks the opposite: ***"is every protection the specs promised actually switched on and working?"***

It turns the security statements in the specs (web §12, mobile §10, plus auth/payment/realtime rules) into **checks you can run**. Each has a command or procedure and a clear pass criterion.

## 2. When it runs

| Run | When | Which items | Required by |
|-----|------|-------------|-------------|
| **Demo Security Run** | When Phase 7 finishes (demo exists on the mock API / demo environment) | every item tagged **D** | [Gate 7](TESTING.md#gate-7-admin-operations-and-demo-security-run) |
| **Full Security Run** | Phase 9, against staging with the real backend | every item (**D** and **R**) | [Gate 9](TESTING.md#gate-9-hardening) |
| **Phase subset** | At the gate of Phases 3–6 | items tagged with that Gate | Gates 3, 4, 5, 6 |
| **Production smoke** | After each release | `scripts/security-smoke.sh` | [Gate 10](TESTING.md#gate-10-release) |

`D` = can be verified on the demo; `R` = needs the real backend/infrastructure; `D,R` = run at both.

**Any ✘ on a Must item blocks the gate.** Log every run in [`docs/SECURITY_RUN_LOG.md`](docs/SECURITY_RUN_LOG.md). A failed check that reveals an exploitable weakness is also registered in [`docs/VULN_REGISTER.md`](docs/VULN_REGISTER.md).

## 3. Setup for the run

```bash
export WEB=https://staging.redtaxi.example        # or http://localhost:3000 for demo
export API=https://api-staging.redtaxi.example    # or the mock API URL
export PASSENGER_A_COOKIE='session=...'           # two different passengers,
export PASSENGER_B_COOKIE='session=...'           # one driver, one admin
export DRIVER_COOKIE='session=...'
export ADMIN_COOKIE='session=...'
export BOOKING_A=<id of a booking owned by passenger A>
```

Create test users per role, plus a booking owned by A. Never run these against production data except the explicit production smoke.

Automatable subset: `scripts/security-smoke.sh` (headers, redirects, cookie flags, role walls, rate limit, CORS). The rest are procedures.

---

## SC-A: Authentication and Session

### SC-A1 OTP send is rate limited — `D,R` · Gate 3
```bash
for i in $(seq 1 8); do curl -s -o /dev/null -w "%{http_code}\n" -X POST "$WEB/api/auth/otp/send" \
  -H 'content-type: application/json' -H "origin: $WEB" -d '{"phone":"9876543210"}'; done
```
**Pass:** the first few return 200; later requests return **429** with `Retry-After`. Limit applies per phone **and** per IP. Changing `X-Forwarded-For` does not bypass it.

### SC-A2 OTP verification is bounded and never logged — `D,R` · Gate 3
Send 6 wrong codes for one phone; then try the correct code. Wait past expiry and retry.
**Pass:** 5th wrong attempt locks the phone (correct code now refused until cooldown); expired OTP refused; server and app logs contain **no OTP values** (`grep` the log output for the code).

### SC-A3 Session cookies are hardened — `D,R` · Gate 3
```bash
curl -si -X POST "$WEB/api/auth/otp/verify" -H 'content-type: application/json' -d '{"phone":"9876543210","otp":"123456"}' | grep -i set-cookie
```
**Pass:** cookie has `HttpOnly; Secure; SameSite=Lax` (Secure requires HTTPS); in the browser console `document.cookie` shows no token; `localStorage`/`sessionStorage` contain no tokens; the JSON body does not contain a token.

### SC-A4 Admin login resists guessing — `D,R` · Gate 3
Try a wrong password for a real admin email and for a non-existent email; repeat past the lockout threshold; log in correctly and check MFA.
**Pass:** identical message and similar timing for both ("Invalid email or password"); lockout after N failures; MFA step required before admin pages load.

### SC-A5 Refresh and logout behave — `D` · Gate 3
Expire the access token. Make a call. Make it again with a revoked refresh token. Log out.
**Pass:** one silent refresh; second 401 clears the session and redirects to the correct login; logout clears cookies (web) / SecureStore (mobile), closes sockets, and the old refresh token no longer works.

### SC-A6 Admin idle timeout — `D,R` · Gate 3
Leave an admin session idle past the configured timeout, then act.
**Pass:** redirected to `/admin/login`; "Remember me" extends only as documented (max lifetime defined and enforced).

---

## SC-B: Authorization

### SC-B1 Role walls hold on both client and server — `D,R` · Gate 3, 7
```bash
curl -si "$WEB/admin"  | head -n 5                              # anonymous → redirect to /admin/login
curl -si "$WEB/driver" -H "cookie: $PASSENGER_A_COOKIE" | head   # wrong role → redirect
curl -si "$API/admin/stats"   -H "cookie: $DRIVER_COOKIE"        # → 403
curl -si "$API/admin/drivers" -H "cookie: $PASSENGER_A_COOKIE"   # → 403
```
**Pass:** pages redirect; every `/admin/*`, `/driver/*` API refuses the wrong role with **403/401**. The check is on the **server**, not only in `middleware.ts`.

### SC-B2 No access to someone else's booking (IDOR) — `D,R` · Gate 5
```bash
curl -si "$API/bookings/$BOOKING_A" -H "cookie: $PASSENGER_B_COOKIE"          # → 403/404
curl -si -X POST "$API/bookings/$BOOKING_A/cancel" -H "cookie: $PASSENGER_B_COOKIE"
curl -si -X POST "$API/bookings/$BOOKING_A/rating" -H "cookie: $PASSENGER_B_COOKIE" -d '{}'
```
**Pass:** passenger B can read, cancel, rate, or pay nothing of A's. Also try with quote IDs, ticket IDs, payment order IDs and driver document IDs.

### SC-B3 Drivers see only their own work — `D,R` · Gate 6
A driver requests another driver's offer, trip, earnings, profile, documents.
**Pass:** refused. A driver never receives a passenger's real phone number or a trip that is not theirs.

### SC-B4 Start OTP goes to the passenger only — `D,R` · Gate 5
Fetch the same booking as passenger, driver and admin; inspect JSON and socket payloads.
**Pass:** `startOtp` exists **only** in the passenger projection (and the socket room of that passenger). Absent for driver and admin; absent in logs.

### SC-B5 Unapproved/expired drivers cannot go online — `D` · Gate 6
```bash
curl -si -X POST "$API/driver/online" -H "cookie: $DRIVER_COOKIE" -d '{"online":true}'
```
with (a) pending approval, (b) expired document, (c) rejected driver.
**Pass:** refused by the **server** with a clear code; the toggle also cannot be forced via direct call.

### SC-B6 No open redirect via `next` — `D` · Gate 3
The redirect happens **after login**, when the login page sends the user back to `?next=`. So test the flow, not just a GET:
1. Open each payload in a browser or Playwright: `$WEB/login?next=//evil.com`, `?next=https://evil.com`, `?next=/%5Cevil.com`, `?next=javascript:alert(1)`, and a good one `?next=/driver`.
2. Complete a normal login.
3. Check the final URL.

**Pass:** the final URL is always on the same origin; bad payloads fall back to the default home page; only a same-origin relative path (such as `/driver`) is honoured. The same applies to `/driver/login` and `/admin/login`. The web spec §7.2 does not say the login pages validate `next` — see VR-1 in [VULNERABILITY.md](VULNERABILITY.md). Automate it as a Playwright test (`next-param.spec.ts`).

---

## SC-C: Payments and Money

### SC-C1 Fare and amounts are decided by the server — `D,R` · Gate 4
```bash
curl -s -X POST "$API/quotes" -H "cookie: $PASSENGER_A_COOKIE" -H 'content-type: application/json' \
  -d '{"vehicleId":"sedan","distanceKm":1,"total":100,"fare":1}'
curl -s -X POST "$API/payments/orders" -H "cookie: $PASSENGER_A_COOKIE" -d '{"quoteId":"<id>","amount":1}'
```
**Pass:** extra/tampered fields ignored; the order amount equals the stored quote's `payNow` (₹500 for the sample); the response never trusts a client amount, distance or vehicle price.

### SC-C2 Payment signature is verified server-side — `D,R` · Gate 4, 8
```bash
curl -si -X POST "$API/payments/verify" -H "cookie: $PASSENGER_A_COOKIE" \
  -d '{"orderId":"<id>","paymentId":"pay_fake","signature":"deadbeef"}'
```
**Pass:** rejected; booking stays unconfirmed; only a genuine Razorpay signature (HMAC with the secret) confirms.

### SC-C3 Webhook is authenticated and idempotent — `R` · Gate 8
Send the same signed webhook twice; send one with a bad signature.
**Pass:** bad signature → 400/401 and no change; replay → exactly one state transition and one ledger entry.

### SC-C4 Double-submit is safe — `D,R` · Gate 4
Click Pay twice quickly; replay the same `Idempotency-Key`; then use a new key.
**Pass:** same key → same result, one charge; new attempt → new key.

### SC-C5 Expired quote cannot be booked — `D` · Gate 4
Wait past `validUntil` (15 min; shorten in test config) and call booking/payment with that quote.
**Pass:** refused with a quote-expired code; UI shows Refresh.

### SC-C6 Booking is confirmed only after verified payment — `D,R` · Gate 4
Create an order, do not pay, query the booking. Try to jump to the confirmed/tracking screens by URL.
**Pass:** status not confirmed; "Booking Confirmed" UI never shown; "Pay at Pickup" only for eligible users (server check).

### SC-C7 Money-affecting admin actions are controlled and audited — `D,R` · Gate 7
Change a price, refund, cancel and reassign as admin; then read the audit log; then try as non-admin.
**Pass:** each action requires confirm, writes an audit entry (actor, target, old → new, time, IP); pricing applies to **new quotes only**; a non-admin gets 403.

---

## SC-D: Transport and Web Hardening

### SC-D1 HTTPS everywhere and HSTS — `R` · Gate 9
```bash
curl -sI "http://${WEB#https://}" | head -n 3
curl -sI "$WEB" | grep -i strict-transport-security
```
**Pass:** HTTP redirects to HTTPS; `Strict-Transport-Security` with a long `max-age` (and `includeSubDomains` once all subdomains are ready). TLS 1.2+ only.

### SC-D2 CSP and security headers — `D,R` · Gate 9
```bash
curl -sI "$WEB" | grep -iE 'content-security-policy|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|x-powered-by'
```
**Pass:** strict CSP (no `unsafe-eval`; `unsafe-inline` only if nonce/hash strategy requires), `frame-ancestors 'none'` (or explicit), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` limiting camera/mic, **no** `X-Powered-By`. CSP in **enforce** mode with 0 violations in the E2E run. Google Maps and Razorpay origins allow-listed explicitly.

### SC-D3 CSRF protection on mutating BFF routes — `D,R` · Gate 8
```bash
curl -si -X POST "$WEB/api/auth/logout" -H "cookie: $PASSENGER_A_COOKIE" -H 'origin: https://evil.example'
```
**Pass:** refused (origin mismatch); cookies are `SameSite`; no state change happens on **GET**.

### SC-D4 CORS is an allow-list — `D,R` · Gate 8
```bash
curl -sI "$API/vehicles" -H 'origin: https://evil.example' | grep -i access-control
```
**Pass:** no `Access-Control-Allow-Origin` for unknown origins; never `*` together with credentials.

### SC-D5 BFF proxy only forwards allowed paths — `D` · Gate 4
```bash
curl -si --path-as-is "$WEB/api/proxy/../../admin/stats" -H "cookie: $PASSENGER_A_COOKIE"
curl -si --path-as-is "$WEB/api/proxy/%2e%2e/%2e%2e/etc/passwd"
curl -si "$WEB/api/proxy/http://169.254.169.254/latest/meta-data/"
```
**Pass:** 404/400/403 — traversal, absolute URLs and internal addresses are never forwarded; only allow-listed backend paths work; inbound auth headers are not blindly passed through.

### SC-D6 No secrets in the client; keys are restricted — `D,R` · Phase 0, Gate 9
```bash
grep -rEn "SESSION_SECRET|API_INTERNAL_URL|key_secret|rzp_.*secret" .next/static apps/web/.next 2>/dev/null
```
**Pass:** nothing server-only appears in the browser bundle or `NEXT_PUBLIC_*`. Maps key is restricted by **referrer and API** (verify in console, and test the key from another origin → denied). Razorpay secret only on the server.

---

## SC-E: Realtime

### SC-E1 Sockets require auth and enforce rooms — `D,R` · Gate 5
- Connect without a cookie/token → refused.
- Connect as passenger B, try to join A's booking room → refused.
- Connect from `Origin: https://evil.example` → refused (cross-site WebSocket hijacking).

**Pass:** all three refused; events for a booking reach only its passenger, assigned driver and admins.

### SC-E2 Location input is validated and rate-limited — `D,R` · Gate 6
Post 100 driver locations per second; post impossible jumps (e.g., 500 km in 1 s); post as a driver with no active trip.
**Pass:** throttled, implausible points flagged/rejected, no broadcast without an active trip.

### SC-E3 SOS works and is tolerant — `D` · Gate 5
Trigger SOS online, then offline on mobile and reconnect.
**Pass:** confirmation shown; admin receives `sos.alert` with live location; offline trigger is queued and delivered on reconnect; haptic fired; repeated SOS does not spam beyond a rate cap.

### SC-E4 Share links are scoped and expire — `D,R` · Gate 5
Open the public tracking link; remove one character from the token; wait until the trip ends and reopen.
**Pass:** valid token shows only status/ETA/map and first name or none — no phone, payment or full identity; wrong token → 404 with no hint; token **dies at trip end**; tokens are long and random.

---

## SC-F: Data and Privacy

### SC-F1 Phone numbers are masked between users — `D,R` · Gate 5
Inspect booking JSON for driver and passenger, and perform a Call action.
**Pass:** no raw counterpart phone number anywhere in payloads, DOM, or deep links (`tel:` uses the masked number from the server).

### SC-F2 Logs contain no secrets or personal data — `D,R` · Gate 8
Run a full flow with debug on; search web, API and mobile (`adb logcat` / Xcode console) logs for OTPs, tokens, card data, phone numbers.
**Pass:** none present; Sentry events scrubbed; analytics events contain no personal data.

### SC-F3 Uploads are validated and stored privately — `D,R` · Gate 6
Upload: a 50 MB file; `.html` renamed `.pdf`; an SVG with script; a path like `../../x`; a valid JPG.
**Pass:** type checked by content (magic bytes), size capped, filenames regenerated, files in **private** storage served via **short-lived signed URLs**; direct URL without signature → 403.

### SC-F4 Bank details are masked — `D` · Gate 6
**Pass:** only the last 4 digits appear in UI **and** API responses; full numbers never returned after submission.

### SC-F5 Consent, privacy policy and data deletion (DPDP) — `D,R` · Gate 4, 9
**Pass:** Terms checkbox required before payment; privacy policy and Terms pages exist; a data-deletion request can be filed and is tracked; cookie banner present; analytics respect consent.

### SC-F6 Audit log is complete and tamper-resistant — `D,R` · Gate 7
Perform: driver approve/reject, price change, refund, cancel, reassign, admin login/logout, role/setting change.
**Pass:** each yields an entry; entries cannot be edited or deleted through any API; admin cannot erase their own actions.

---

## SC-G: Mobile

### SC-G1 Tokens live only in SecureStore — `D` · Gate 3
**Pass:** inspect AsyncStorage and app files on a debug device — no tokens/OTPs; Android backups disabled or exclude secrets (`allowBackup`).

### SC-G2 Permissions are minimal and truthful — `D` · Gate 6
**Pass:** passenger: location when-in-use, notifications; driver: background location **only while online**, camera/photos for documents; iOS usage strings explain the real purpose; no unused permissions in the final manifest/Info.plist.

### SC-G3 No keys in the bundle; release build is clean — `D,R` · Gate 9
**Pass:** keys come from `app.config.ts` env at build time; unpack the release build and search for secrets → none (public Maps key allowed if restricted); no debug menus or dev client in production.

### SC-G4 Deep links are validated — `D` · Gate 6
Fire `redtaxi://` links with unexpected paths/params (`adb shell am start`, `xcrun simctl openurl`).
**Pass:** unknown routes land on a safe screen; no auth bypass or action triggered by a link alone.

### SC-G5 TLS only; pinning decision recorded — `R` · Gate 9
**Pass:** cleartext traffic disabled (`usesCleartextTraffic=false`, ATS on); certificate pinning either implemented or consciously declined in `DECISIONS.md` (mobile spec says optional).

---

## SC-H: Input and Output

### SC-H1 Server re-validates everything — `D,R` · Gate 4
Send wrong types, huge strings, negative amounts, extra fields to 10 representative endpoints.
**Pass:** 400 with `{code,message,fields}`; extra fields ignored (no mass assignment — e.g. `PUT /driver/profile` with `"approval":"approved"` is refused).

### SC-H2 No stored/reflected XSS — `D` · Gate 7
Put `<img src=x onerror=alert(1)>` and `"><script>` into: ticket title/body, rating comment, names, addresses, driver profile; view in every role's UI and in PDF receipts/CSV.
**Pass:** rendered inert everywhere; CSV cells starting with `=+-@` neutralised.

### SC-H3 Errors do not leak internals — `D,R` · Gate 3
Force a 500 and a validation error.
**Pass:** generic message and a correlation ID; no stack traces, SQL, file paths or library versions in the response.

---

## 4. Run Report (copy into `docs/SECURITY_RUN_LOG.md`)

```
Run: Demo            (write exactly one of: Demo | Full | Phase-N | Production-smoke)
Date:        Commit:
Environment:                                          Tester:
| ID     | Result (PASS / FAIL / N-A) | Evidence (link/log) | Notes / Finding ID |
|--------|----------------------------|---------------------|--------------------|
Totals: passed __ / failed __ / N-A __ (N-A needs a written reason)
Decision: PASS → proceed | FAIL → fix, register in VULN_REGISTER, re-run the whole run
(Gate 7/9 scripts look for a line starting "Run: Demo" / "Run: Full" and for any table cell "| FAIL |")
Approver:
```

## 5. Pass / Fail Rule

| Outcome | Result |
|---------|--------|
| Any ✘ on SC-A, B, C, E1, F1–F3, G1, H1 | **Block.** Sev-1/2 by default |
| Any other ✘ | **Block** the gate unless a documented waiver is signed (Medium only) |
| N-A without a reason | Treated as ✘ |
| All ✔ | PASS; attach the report to the gate sign-off |

## 6. Traceability: where each check is introduced and verified

| Check group | Built in | Verified at |
|-------------|----------|-------------|
| SC-A Auth/session | [Phase 3](IMPLEMENTATION.md#phase-3-authentication-and-roles) | Gate 3, Demo, Full |
| SC-B Authorization | Phases 3, 5, 6 | Gates 3, 5, 6, Demo, Full |
| SC-C Payments | [Phase 4](IMPLEMENTATION.md#phase-4-passenger-booking-and-payment), 8 | Gates 4, 8, Demo, Full |
| SC-D Web hardening | Phases 0, 2, 3, 9 | Gates 4, 9, Full |
| SC-E Realtime | [Phase 5](IMPLEMENTATION.md#phase-5-live-tracking-and-trip-completion) | Gate 5, Demo, Full |
| SC-F Data/privacy | Phases 5, 6, 7, 9 | Gates 5, 6, 7, 9 |
| SC-G Mobile | Phases 3, 6, 9 | Gates 3, 6, 9 |
| SC-H Input/output | Phases 1, 7 | Gates 4, 7, Demo, Full |
