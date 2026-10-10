import type { PricingRule, Vehicle } from "@redtaxi/shared";
import { paise } from "@redtaxi/shared";

/**
 * Seed pricing rules per DEC-3 and DEC-15
 * NOTE: Marked as placeholder, to be confirmed by finance.
 */
export const SEED_PRICING_RULES: PricingRule[] = [
  {
    vehicleClass: "hatchback",
    baseRatePerKm: paise(1400), // ₹14.00
    dailyBatta: paise(30000), // ₹300.00
    nightAllowance: paise(20000), // ₹200.00
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDeposit: paise(50000), // ₹500.00
  },
  {
    vehicleClass: "sedan",
    baseRatePerKm: paise(1600), // ₹16.00 (from storyboard sample)
    dailyBatta: paise(30000), // ₹300.00
    nightAllowance: paise(20000), // ₹200.00
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDeposit: paise(50000), // ₹500.00
  },
  {
    vehicleClass: "suv",
    baseRatePerKm: paise(2200), // ₹22.00
    dailyBatta: paise(35000), // ₹350.00
    nightAllowance: paise(25000), // ₹250.00
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDeposit: paise(50000), // ₹500.00
  },
  {
    vehicleClass: "innova",
    baseRatePerKm: paise(2600), // ₹26.00
    dailyBatta: paise(40000), // ₹400.00
    nightAllowance: paise(30000), // ₹300.00
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDeposit: paise(50000), // ₹500.00
  },
  {
    vehicleClass: "tempo",
    baseRatePerKm: paise(3200), // ₹32.00
    dailyBatta: paise(50000), // ₹500.00
    nightAllowance: paise(35000), // ₹350.00
    minOutstationKm: 150,
    advanceDepositPercent: 25,
    minDeposit: paise(75000), // ₹750.00
  },
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: "veh_hatchback_1",
    class: "hatchback",
    displayName: "Maruti Wagon R or Equivalent",
    passengers: 4,
    bags: 2,
    ratePerKm: paise(1400),
    minKm: 100,
    imageUrl: "/images/fleet/hatchback.png",
  },
  {
    id: "veh_sedan_1",
    class: "sedan",
    displayName: "Maruti Dzire or Equivalent",
    passengers: 4,
    bags: 3,
    ratePerKm: paise(1600),
    minKm: 100,
    imageUrl: "/images/fleet/sedan.png",
    popular: true,
  },
  {
    id: "veh_suv_1",
    class: "suv",
    displayName: "Maruti Ertiga or Equivalent",
    passengers: 6,
    bags: 4,
    ratePerKm: paise(2200),
    minKm: 100,
    imageUrl: "/images/fleet/suv.png",
  },
  {
    id: "veh_innova_1",
    class: "innova",
    displayName: "Toyota Innova Crysta",
    passengers: 7,
    bags: 5,
    ratePerKm: paise(2600),
    minKm: 100,
    imageUrl: "/images/fleet/innova.png",
  },
];

export const SEED_DRIVER = {
  id: "drv_selvam_1",
  name: "Selvam Kumar",
  phone: "9876543210",
  rating: 4.8,
  vehicleNo: "TN 37 BY 1234",
  vehicleClass: "sedan" as const,
  online: true,
  status: "approved" as const,
};
