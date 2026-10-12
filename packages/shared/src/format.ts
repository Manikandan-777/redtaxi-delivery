import type { Paise } from "./domain";

/**
 * Format integer paise into Indian Rupee string with en-IN formatting.
 * Example:
 * inr(149400) -> "₹1,494"
 * inr(24850000) -> "₹2,48,500"
 */
export function inr(amountPaise: Paise | number, fractionDigits = 0): string {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rupees);
}

export const formatInr = inr;

/**
 * Formats distance in km.
 * Example: km(65.2) -> "65.2 km"
 */
export function km(distance: number): string {
  return `${distance.toFixed(1)} km`;
}

/**
 * Formats duration in minutes.
 * Omit 0 hr when duration < 60 min.
 * Example:
 * dur(85) -> "1 hr 25 min"
 * dur(45) -> "45 min"
 * dur(120) -> "2 hr"
 */
export function dur(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMin = rounded % 60;

  if (hours === 0) {
    return `${remainingMin} min`;
  }
  if (remainingMin === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMin} min`;
}

/**
 * Formats date into IST human readable format.
 * Never hardcode specific static dates.
 */
export function formatIST(date: Date | string, format: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: format === "long" ? "long" : "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
