import type { BookingStatus } from "./domain";

/**
 * Valid transitions for Booking state machine.
 * DEC-8: 'ongoing' replaced by 'in_progress'. 'no_driver' added as terminal or reassigned state.
 */
export const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  created: ["searching", "scheduled", "cancelled"],
  scheduled: ["searching", "cancelled"],
  searching: ["driver_assigned", "cancelled", "no_driver"],
  driver_assigned: ["driver_arriving", "searching", "cancelled"],
  driver_arriving: ["driver_arrived", "cancelled"],
  driver_arrived: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  no_driver: ["searching", "cancelled"],
};

/**
 * Checks if transition from state A to state B is valid.
 */
export function canMove(from: BookingStatus, to: BookingStatus): boolean {
  return transitions[from].includes(to);
}

/**
 * Maps booking status to passenger screen/view ID
 */
export function getPassengerScreen(status: BookingStatus): string {
  switch (status) {
    case "created":
    case "scheduled":
      return "WP4_FareQuote";
    case "searching":
    case "driver_assigned":
    case "driver_arriving":
    case "driver_arrived":
      return "WP6_LiveTracking";
    case "in_progress":
      return "WP6_TripInProgress";
    case "completed":
      return "WP7_Complete";
    case "cancelled":
    case "no_driver":
      return "WP1_Home";
  }
}

/**
 * Maps booking status to driver screen/view ID
 */
export function getDriverScreen(status: BookingStatus): string {
  switch (status) {
    case "driver_assigned":
      return "WD4_TripAccepted";
    case "driver_arriving":
      return "WD4_NavigateToPickup";
    case "driver_arrived":
      return "WD5_ArrivedOtp";
    case "in_progress":
      return "WD6_InProgress";
    case "completed":
      return "WD7_Complete";
    default:
      return "WD2_Dashboard";
  }
}
