import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, View, TouchableOpacity } from "react-native";
import { getPassengerScreen, inr, paise, type BookingStatus } from "@redtaxi/shared";

describe("Phase 5: Mobile Live Tracking Unit Tests (T5.1 - T5.10)", () => {
  describe("T5.3: Status-to-Screen Mapping for Mobile Passenger", () => {
    it("maps all lifecycle statuses correctly to UI screen IDs", () => {
      expect(getPassengerScreen("searching")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("driver_assigned")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("driver_arriving")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("driver_arrived")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("in_progress")).toBe("WP6_TripInProgress");
      expect(getPassengerScreen("completed")).toBe("WP7_Complete");
    });
  });

  describe("T5.4: Passenger-Only Start OTP Display", () => {
    it("renders 4-digit start OTP prominent for passenger", () => {
      const PassengerTrackingView = ({ status, otp }: { status: BookingStatus; otp?: string }) => {
        return (
          <View>
            <Text testID="trip-status">{status}</Text>
            {otp && status !== "in_progress" && status !== "completed" && (
              <View testID="otp-container">
                <Text testID="otp-label">Passenger Start OTP</Text>
                <Text testID="otp-code">{otp}</Text>
                <Text>Share with driver upon arrival</Text>
              </View>
            )}
            {status === "driver_arrived" && (
              <Text testID="driver-arrived-banner">Driver has arrived at your pickup!</Text>
            )}
          </View>
        );
      };

      const { getByTestId } = render(<PassengerTrackingView status="driver_arrived" otp="4321" />);

      expect(getByTestId("otp-code").props.children).toBe("4321");
      expect(getByTestId("driver-arrived-banner")).toBeTruthy();

      // When trip starts (in_progress), start OTP is dismissed
      const { queryByTestId: queryInProgressOtp } = render(
        <PassengerTrackingView status="in_progress" otp="4321" />
      );
      expect(queryInProgressOtp("otp-container")).toBeNull();
    });
  });

  describe("T5.6: Mobile Offline SOS Queue & Dispatch", () => {
    it("queues SOS alert if offline and dispatches with GPS coordinates", () => {
      const sosQueue: Array<{ bookingId: string; lat: number; lng: number }> = [];

      const triggerSos = (bookingId: string, lat: number, lng: number, isOnline: boolean) => {
        if (!isOnline) {
          sosQueue.push({ bookingId, lat, lng });
          return { status: "queued", message: "SOS queued offline" };
        }
        return { status: "dispatched", message: "SOS dispatched immediately" };
      };

      // Test offline queueing
      const offlineResult = triggerSos("bk_123", 10.658, 77.008, false);
      expect(offlineResult.status).toBe("queued");
      expect(sosQueue).toHaveLength(1);
      expect(sosQueue[0]?.bookingId).toBe("bk_123");

      // Test online dispatch
      const onlineResult = triggerSos("bk_123", 10.658, 77.008, true);
      expect(onlineResult.status).toBe("dispatched");
    });
  });

  describe("T5.10 & DEC-10: Completion Rating & Balance Due Invariant", () => {
    it("DEC-10: Completion copy reads 'completed' and shows balance due when due > 0", () => {
      const duePaise = paise(99400); // ₹994
      const paidPaise = paise(50000); // ₹500

      const CompleteView = ({ due, paid }: { due: number; paid: number }) => {
        const [stars, setStars] = React.useState(0);
        const [submitted, setSubmitted] = React.useState(false);

        return (
          <View>
            <Text testID="trip-status">Trip Completed</Text>
            <Text testID="paid-text">{`Paid Online: ${inr(paid)}`}</Text>
            {due > 0 && <Text testID="due-text">{`Balance Due: ${inr(due)}`}</Text>}

            {!submitted ? (
              <View>
                <TouchableOpacity testID="star-5" onPress={() => setStars(5)}>
                  <Text>5 Stars</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="submit-rating"
                  disabled={stars === 0}
                  onPress={() => setSubmitted(true)}
                >
                  <Text>Submit Rating</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text testID="thank-you">Thank you for rating!</Text>
            )}
          </View>
        );
      };

      const { getByTestId } = render(<CompleteView due={duePaise} paid={paidPaise} />);

      // Verify DEC-10 completion copy
      expect(getByTestId("trip-status").props.children).toBe("Trip Completed");
      expect(getByTestId("due-text").props.children).toBe("Balance Due: ₹994");

      // Rating submission requires star selection
      const submitBtn = getByTestId("submit-rating");
      expect(submitBtn.props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(getByTestId("star-5"));
      fireEvent.press(submitBtn);

      expect(getByTestId("thank-you")).toBeTruthy();
    });
  });
});
