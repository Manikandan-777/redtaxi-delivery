import type { FareLine, Paise } from "./domain";
import { paise } from "./domain";

export interface FareInput {
  distanceKm: number;
  /** Rate per km in integer paise (e.g. ₹16/km = 1600 paise) */
  ratePerKm: Paise;
  /** Driver Daily Batta in integer paise */
  batta: Paise;
  /** Toll / State tax estimate in integer paise */
  tollEstimate: Paise;
  /** Night allowance in integer paise (optional) */
  nightAllowance?: Paise;
  /** Minimum km threshold (applied to outstation only per DEC-5) */
  minKm?: number;
  /** GST rate, default 0.05 (5%) */
  gstRate?: number;
}

export interface FareResult {
  distance: Paise;
  batta: Paise;
  toll: Paise;
  night: Paise;
  gst: Paise;
  total: Paise;
  lines: FareLine[];
}

/**
 * Computes fare entirely in integer paise with each line rounded to whole rupees (100 paise).
 *
 * Reconciles with the storyboard sample:
 * 65.2 km @ ₹16/km (1600 paise), batta ₹300 (30000 paise), toll ₹80 (8000 paise)
 * -> Distance: 104300 paise (₹1,043.00)
 * -> Batta:    30000 paise (₹300.00)
 * -> Toll:     8000 paise (₹80.00)
 * -> GST 5%:   7100 paise (₹71.00)
 * -> Total:    149400 paise (₹1,494.00)
 */
export function computeFare(input: FareInput): FareResult {
  if (input.distanceKm < 0) {
    throw new RangeError("Distance cannot be negative");
  }
  if (input.ratePerKm < 0) {
    throw new RangeError("Rate per km cannot be negative");
  }
  if (input.batta < 0) {
    throw new RangeError("Driver batta cannot be negative");
  }
  if (input.tollEstimate < 0) {
    throw new RangeError("Toll estimate cannot be negative");
  }
  const nightAllowance = input.nightAllowance ?? paise(0);
  if (nightAllowance < 0) {
    throw new RangeError("Night allowance cannot be negative");
  }

  const billableKm = Math.max(input.distanceKm, input.minKm ?? 0);

  // Each line is rounded to whole rupees (multiples of 100 paise) to match the spec & design displays
  const rawDistancePaise = billableKm * input.ratePerKm;
  const distance = paise(Math.round(rawDistancePaise / 100) * 100);

  const batta = paise(Math.round(input.batta / 100) * 100);
  const toll = paise(Math.round(input.tollEstimate / 100) * 100);
  const night = paise(Math.round(nightAllowance / 100) * 100);

  const subtotal = distance + batta + toll + night;
  const gstRate = input.gstRate ?? 0.05;
  const gst = paise(Math.round((subtotal * gstRate) / 100) * 100);

  const total = paise(subtotal + gst);

  const lines: FareLine[] = [
    { key: "distance", label: `Distance (${input.distanceKm} km)`, amount: distance },
    { key: "batta", label: "Driver Daily Batta", amount: batta },
    { key: "toll", label: "Toll / State Tax (est.)", amount: toll },
  ];

  if (night > 0) {
    lines.push({ key: "night", label: "Night Allowance", amount: night });
  }

  lines.push({ key: "gst", label: `GST (${Math.round(gstRate * 100)}%)`, amount: gst });

  return {
    distance,
    batta,
    toll,
    night,
    gst,
    total,
    lines,
  };
}
