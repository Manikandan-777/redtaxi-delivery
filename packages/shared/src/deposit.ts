import type { DepositOption, Paise } from "./domain";
import { paise } from "./domain";

export interface DepositConfig {
  advanceDepositPercent?: number; // e.g. 25 for 25%
  minDeposit?: Paise; // e.g. 50000 paise (₹500)
}

/**
 * Calculates advance deposit and full payment options per DEC-2:
 * deposit = max(percent * total, minDeposit)
 * Property invariant: payNow + payAtDrop === total always.
 */
export function calculateDepositOptions(total: Paise, config?: DepositConfig): DepositOption[] {
  if (total < 0) {
    throw new RangeError("Total cannot be negative");
  }

  const percent = config?.advanceDepositPercent ?? 25;
  const minDeposit = config?.minDeposit ?? paise(50000); // ₹500 default

  const calculatedDeposit = paise(Math.round((total * percent) / 100));

  // deposit = max(percent * total, minDeposit)
  // If total is smaller than minDeposit, deposit cannot exceed total
  const payNow = paise(Math.min(total, Math.max(calculatedDeposit, minDeposit)));
  const payAtDrop = paise(total - payNow);

  return [
    {
      type: "deposit",
      payNow,
      payAtDrop,
      recommended: true,
    },
    {
      type: "full",
      payNow: total,
      payAtDrop: paise(0),
      recommended: false,
    },
  ];
}
