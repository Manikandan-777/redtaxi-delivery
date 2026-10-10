# Vulnerability Register

Process: [VULNERABILITY.md §8](../VULNERABILITY.md). Seeded with the pre-code findings from [§6](../VULNERABILITY.md) — they start **Open** and must be verified fixed.
**Gate 9 fails while any Critical or High row is `Open` or `In progress`.** Status values: `Open`, `In progress`, `Fixed - awaiting retest`, `Closed`, `Waived` (Medium/Low only, with approver).

| ID | Title | Source | Severity | Status | Owner | Found | Due | Fix commit | Retest by | Closed |
|----|-------|--------|----------|--------|-------|-------|-----|------------|-----------|--------|
| VR-1 | Open redirect via `next` after login | Spec review | Medium | Open | | pre-code | Phase 3 | | | |
| VR-2 | BFF proxy forwards client-supplied path (SSRF/traversal) | Spec review | High | Open | | pre-code | Phase 3 | | | |
| VR-3 | Cookie-auth socket without origin/room authorisation (CSWSH) | Spec review | High | Open | | pre-code | Phase 5 | | | |
| VR-4 | Start OTP carried in shared Booking type (leak risk) | Spec review | High | Open | | pre-code | Phase 1 | | | |
| VR-5 | Rupee-float fare maths vs paise model | Spec review | Medium | Open | | pre-code | Phase 1 | | | |
| VR-6 | Public share link vs auth-only `/bookings/*`; token in URL | Spec review | Medium | Open | | pre-code | Phase 5 | | | |
| VR-7 | Admin "Remember me" has no max lifetime | Spec review | Low | Open | | pre-code | Phase 3 | | | |
| VR-8 | `api()` header spread lets callers override Content-Type | Spec review | Low | Open | | pre-code | Phase 3 | | | |
| VR-9 | Client GPS spoofing; distance must be server-side | Spec review | Medium | Open | | pre-code | Phase 6 | | | |
| VR-10 | "Pay at Pickup" eligibility undefined (fraud) | Spec review | Medium | Open | | pre-code | Phase 4 | | | |
| VR-11 | SMS pumping / number enumeration on OTP | Spec review | Medium | Open | | pre-code | Phase 3 | | | |
| VR-12 | Single-person refund/phone-booking/reassign (insider risk) | Spec review | Medium | Open | | pre-code | Phase 7 | | | |
| VR-13 | Maps/Places proxy billing abuse | Spec review | Medium | Open | | pre-code | Phase 8 | | | |
| VR-14 | CSV/PDF export injection | Spec review | Medium | Open | | pre-code | Phase 7 | | | |
| VR-15 | Driver documents/bank data sensitivity (encryption, retention) | Spec review | High | Open | | pre-code | Phase 6 | | | |
