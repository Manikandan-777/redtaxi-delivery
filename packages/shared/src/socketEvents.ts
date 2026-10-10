/**
 * Unified WebSocket Real-time event names & payload interfaces
 * DEC-9: booking.status throughout
 */

export const SocketEvents = {
  // Driver events
  DRIVER_LOCATION: "driver.location",

  // Booking events
  BOOKING_STATUS: "booking.status",

  // Driver offers
  OFFER_NEW: "offer.new",
  OFFER_EXPIRED: "offer.expired",

  // Admin / Dispatch
  DISPATCH_UPDATE: "dispatch.update",

  // Safety
  SOS_ALERT: "sos.alert",
} as const;

export interface DriverLocationPayload {
  driverId: string;
  bookingId?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface BookingStatusPayload {
  bookingId: string;
  status: string;
  updatedAt: string;
}

export interface OfferNewPayload {
  offerId: string;
  bookingId: string;
  pickupLabel: string;
  dropLabel: string;
  distanceKm: number;
  estimatedEarnings: number; // paise
  expiresAt: string; // ISO string 45s countdown
}

export interface DispatchUpdatePayload {
  unassignedBookingsCount: number;
  onlineDriversCount: number;
  updatedAt: string;
}

export interface SosAlertPayload {
  bookingId: string;
  passengerId: string;
  passengerPhone: string;
  driverId?: string;
  driverPhone?: string;
  lat: number;
  lng: number;
  triggeredAt: string;
}
