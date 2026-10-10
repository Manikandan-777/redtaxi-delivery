/**
 * @redtaxi/mock-api — Phase 0 scaffold
 *
 * Phase 1 builds:
 * - MSW (msw) request handlers for all unified API endpoints (Appendix B)
 * - A local Express/Node server that wraps the MSW handlers
 * - Seed data from the designs (Selvam Kumar, TN 37 BY 1234, ₹1,494, etc.)
 * - Server-side fare re-computation (ignores client amounts)
 * - rideMachine enforcement (rejects illegal state transitions)
 * - Quote expiry (15 min with fake-timer support in tests)
 * - OTP generation, attempt limits, lockout
 * - 45 s offer countdown
 *
 * TARIFF SEED DATA (DEC-3 — PLACEHOLDER, to be confirmed by finance):
 *   Hatchback: ₹14/km | Sedan: ₹16/km | SUV: ₹22/km | Innova: ₹26/km
 *
 * SERVICE AREA (DEC-15):
 *   Local radius: 75 km from Pollachi city centre
 *   Outstation: Coimbatore, Palani, Dindigul, Madurai, Ooty (Udhagamandalam),
 *               Kodaikanal, Munnar, Trichy (Tiruchirappalli), Tirunelveli, Chennai
 *
 * @see IMPLEMENTATION.md §Phase 1 (tasks 1.8, 1.9)
 */

export const MOCK_API_VERSION = "0.0.0" as const;
