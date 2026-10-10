/**
 * WP1 — Landing page (Phase 0 placeholder)
 * Phase 4 builds the real hero, vehicle fleet grid, JSON-LD, OG tags, ISR.
 * @see IMPLEMENTATION.md §Phase 4, task 4.1
 */
import { inr, SHARED_VERSION } from "@redtaxi/shared";

export default function HomePage() {
  return (
    <main>
      <h1>RedTaxi Pollachi</h1>
      <p>Phase 1 core loaded: {SHARED_VERSION}</p>
      <p>Starting fare from {inr(149400)}</p>
    </main>
  );
}
