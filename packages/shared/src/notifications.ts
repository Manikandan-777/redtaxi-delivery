/**
 * RedTaxi Push Notification Templates & Helpers (T8.5 / Task 8.4)
 * Standard message templates for Offer, Assignment, Arrival, Completion
 */

export type PushNotificationType = "offer" | "assignment" | "arrival" | "completion";

export interface PushNotificationPayload {
  to: string; // Expo push token or FCM token
  title: string;
  body: string;
  data: {
    type: PushNotificationType;
    bookingId: string;
    [key: string]: unknown;
  };
  sound?: "default" | null;
  priority?: "default" | "high";
}

export const NotificationTemplates = {
  offer: (params: {
    bookingId: string;
    pickup: string;
    earnings: string;
  }): PushNotificationPayload => ({
    to: "",
    title: "🚕 New Ride Offer",
    body: `New ride from ${params.pickup}. Est. earnings ${params.earnings}. Tap to view offer!`,
    data: {
      type: "offer",
      bookingId: params.bookingId,
      pickup: params.pickup,
    },
    sound: "default",
    priority: "high",
  }),

  assignment: (params: {
    bookingId: string;
    driverName: string;
    vehicleNo: string;
  }): PushNotificationPayload => ({
    to: "",
    title: "Driver Assigned",
    body: `${params.driverName} (${params.vehicleNo}) has accepted your booking.`,
    data: {
      type: "assignment",
      bookingId: params.bookingId,
      driverName: params.driverName,
      vehicleNo: params.vehicleNo,
    },
    sound: "default",
    priority: "high",
  }),

  arrival: (params: {
    bookingId: string;
    driverName: string;
    otp: string;
  }): PushNotificationPayload => ({
    to: "",
    title: "Driver Arrived!",
    body: `${params.driverName} has arrived at pickup. Share OTP ${params.otp} to start ride.`,
    data: {
      type: "arrival",
      bookingId: params.bookingId,
      otp: params.otp,
    },
    sound: "default",
    priority: "high",
  }),

  completion: (params: {
    bookingId: string;
    amountCollected: string;
  }): PushNotificationPayload => ({
    to: "",
    title: "Ride Completed",
    body: `Your ride has been completed. Amount: ${params.amountCollected}. Thank you for riding RedTaxi!`,
    data: {
      type: "completion",
      bookingId: params.bookingId,
      amount: params.amountCollected,
    },
    sound: "default",
    priority: "default",
  }),
};
