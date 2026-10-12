/**
 * @redtaxi/shared domain models
 * Strict branded integer paise, unified enums, domain entities
 */

export const SHARED_VERSION = "1.0.0" as const;

/**
 * Branded type for integer money in paise.
 * Rupee floats are forbidden in domain core.
 */
export type Paise = number & { readonly __brand: "paise" };

/**
 * Safe constructor for Paise. Asserts/rounds to integer paise.
 */
export function paise(amount: number): Paise {
  if (!Number.isFinite(amount)) {
    throw new TypeError(`Invalid money amount: ${amount}`);
  }
  return Math.round(amount) as Paise;
}

export type Role = "passenger" | "driver" | "admin";

export type VehicleClass = "hatchback" | "sedan" | "suv" | "innova" | "tempo";

export type TripMode = "one_way" | "round_trip" | "local";

export interface Place {
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface Vehicle {
  id: string;
  class: VehicleClass;
  displayName: string;
  passengers: number;
  bags: number;
  ratePerKm: Paise;
  minKm: number;
  imageUrl: string;
  popular?: boolean;
  available?: boolean;
}

export interface FareLine {
  key: "distance" | "batta" | "toll" | "night" | "gst";
  label: string;
  amount: Paise;
}

export interface DepositOption {
  type: "deposit" | "full";
  payNow: Paise;
  payAtDrop: Paise;
  recommended?: boolean;
}

export interface FareQuote {
  id: string;
  vehicleId: string;
  mode: TripMode;
  distanceKm: number;
  durationMin: number;
  lines: FareLine[];
  total: Paise;
  depositOptions: DepositOption[];
  validUntil: string; // ISO-8601 string
}

/**
 * DEC-8: Single unified booking status enum throughout system.
 * "ongoing" is removed; in_progress is the canonical active trip status.
 */
export type BookingStatus =
  | "created"
  | "scheduled"
  | "searching"
  | "driver_assigned"
  | "driver_arriving"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_driver";

export interface BookingCustomer {
  id: string;
  name: string;
  phone?: string;
}

export interface BookingDriver {
  id: string;
  name: string;
  phone?: string;
  rating: number;
  vehicleNo: string;
  vehicleClass: VehicleClass;
}

export interface TimelineEntry {
  status: BookingStatus;
  at: string; // ISO-8601 string
}

export interface Booking {
  id: string;
  code: string; // e.g., "BK10234"
  customer: BookingCustomer;
  pickup: Place;
  drop: Place;
  startsAt: string; // ISO-8601
  status: BookingStatus;
  quote: FareQuote;
  driver?: BookingDriver;
  /** Start OTP (4 digits), returned exclusively to passenger */
  startOtp?: string;
  paid: Paise;
  due: Paise;
  timeline: TimelineEntry[];
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface DriverRow {
  id: string;
  name: string;
  vehicleNo: string;
  vehicleClass: VehicleClass;
  status: ApprovalStatus;
  rating: number;
  online: boolean;
}

export interface PricingRule {
  vehicleClass: VehicleClass;
  baseRatePerKm: Paise;
  dailyBatta: Paise;
  nightAllowance: Paise;
  minOutstationKm: number;
  advanceDepositPercent: number;
  minDeposit: Paise;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  reporter: "customer" | "driver";
  priority: "low" | "medium" | "high";
  status: "open" | "resolved";
  createdAt: string;
}
