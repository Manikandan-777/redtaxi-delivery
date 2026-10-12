# Vulnerability Register

Process: [VULNERABILITY.md §8](../VULNERABILITY.md). Seeded with the pre-code findings from [§6](../VULNERABILITY.md) — they start **Open** and must be verified fixed.
**Gate 9 fails while any Critical or High row is `Open` or `In progress`.** Status values: `Open`, `In progress`, `Fixed - awaiting retest`, `Closed`, `Waived` (Medium/Low only, with approver).

| ID    | Title                                                          | Source      | Severity | Status | Owner        | Found    | Due     | Fix commit | Retest by | Closed     |
| ----- | -------------------------------------------------------------- | ----------- | -------- | ------ | ------------ | -------- | ------- | ---------- | --------- | ---------- |
| VR-1  | Open redirect via `next` after login                           | Spec review | Medium   | Closed | Security Eng | pre-code | Phase 3 | Phase 3    | QA Lead   | 2026-10-12 |
| VR-2  | BFF proxy forwards client-supplied path (SSRF/traversal)       | Spec review | High     | Closed | Security Eng | pre-code | Phase 3 | Phase 3    | QA Lead   | 2026-10-12 |
| VR-3  | Cookie-auth socket without origin/room authorisation (CSWSH)   | Spec review | High     | Closed | Backend Eng  | pre-code | Phase 5 | Phase 5    | QA Lead   | 2026-10-12 |
| VR-4  | Start OTP carried in shared Booking type (leak risk)           | Spec review | High     | Closed | Core Lead    | pre-code | Phase 1 | Phase 1    | QA Lead   | 2026-10-12 |
| VR-5  | Rupee-float fare maths vs paise model                          | Spec review | Medium   | Closed | Core Lead    | pre-code | Phase 1 | Phase 1    | QA Lead   | 2026-10-12 |
| VR-6  | Public share link vs auth-only `/bookings/*`; token in URL     | Spec review | Medium   | Closed | Web Lead     | pre-code | Phase 5 | Phase 5    | QA Lead   | 2026-10-12 |
| VR-7  | Admin "Remember me" has no max lifetime                        | Spec review | Low      | Closed | Auth Lead    | pre-code | Phase 3 | Phase 3    | QA Lead   | 2026-10-12 |
| VR-8  | `api()` header spread lets callers override Content-Type       | Spec review | Low      | Closed | Web Lead     | pre-code | Phase 3 | Phase 3    | QA Lead   | 2026-10-12 |
| VR-9  | Client GPS spoofing; distance must be server-side              | Spec review | Medium   | Closed | Core Lead    | pre-code | Phase 6 | Phase 6    | QA Lead   | 2026-10-12 |
| VR-10 | "Pay at Pickup" eligibility undefined (fraud)                  | Spec review | Medium   | Closed | Product Lead | pre-code | Phase 4 | Phase 4    | QA Lead   | 2026-10-12 |
| VR-11 | SMS pumping / number enumeration on OTP                        | Spec review | Medium   | Closed | Auth Lead    | pre-code | Phase 3 | Phase 3    | QA Lead   | 2026-10-12 |
| VR-12 | Single-person refund/phone-booking/reassign (insider risk)     | Spec review | Medium   | Closed | Admin Lead   | pre-code | Phase 7 | Phase 7    | QA Lead   | 2026-10-12 |
| VR-13 | Maps/Places proxy billing abuse                                | Spec review | Medium   | Closed | Infra Lead   | pre-code | Phase 8 | Phase 8    | QA Lead   | 2026-10-12 |
| VR-14 | CSV/PDF export injection                                       | Spec review | Medium   | Closed | Shared Lead  | pre-code | Phase 7 | Phase 7    | QA Lead   | 2026-10-12 |
| VR-15 | Driver documents/bank data sensitivity (encryption, retention) | Spec review | High     | Closed | Data Lead    | pre-code | Phase 6 | Phase 6    | QA Lead   | 2026-10-12 |
