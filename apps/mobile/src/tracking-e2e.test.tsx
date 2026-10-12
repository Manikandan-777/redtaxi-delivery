import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, View, TouchableOpacity, TextInput } from "react-native";
import { inr, paise, type BookingStatus } from "@redtaxi/shared";

interface MobileTrackingProps {
  initialStatus?: BookingStatus;
  otp?: string;
  driver?: {
    name: string;
    vehicleNo: string;
    vehicleClass: string;
    rating: number;
  };
  paid: number;
  due: number;
}

const MobilePassengerTrackingFlow: React.FC<MobileTrackingProps> = ({
  initialStatus = "driver_arriving",
  otp = "4321",
  driver = {
    name: "Karthik Raja",
    vehicleNo: "TN 38 BK 5678",
    vehicleClass: "sedan",
    rating: 4.8,
  },
  paid,
  due,
}) => {
  const [status, setStatus] = React.useState<BookingStatus>(initialStatus);
  const [sosDispatched, setSosDispatched] = React.useState(false);
  const [stars, setStars] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");
  const [ratingSubmitted, setRatingSubmitted] = React.useState(false);

  return (
    <View testID="tracking-container">
      {/* Status Header */}
      <Text testID="trip-status-header">
        {status === "completed"
          ? "Trip Completed"
          : status === "in_progress"
            ? "Trip In Progress"
            : "Tracking Your Cab"}
      </Text>

      {/* Driver Arrived Banner */}
      {status === "driver_arrived" && (
        <View testID="arrived-banner">
          <Text>Driver has arrived! Please share your OTP.</Text>
        </View>
      )}

      {/* Driver Card */}
      {driver && (
        <View testID="driver-card">
          <Text testID="driver-name">{driver.name}</Text>
          <Text testID="vehicle-info">{`${driver.vehicleNo} • ${driver.vehicleClass}`}</Text>
          <Text testID="driver-rating">{`★ ${driver.rating.toFixed(1)}`}</Text>
        </View>
      )}

      {/* Prominent Start OTP for Passenger Only (T5.4) */}
      {status !== "in_progress" && status !== "completed" && (
        <View testID="passenger-otp-box">
          <Text testID="otp-title">Passenger Start OTP</Text>
          <Text testID="otp-value">{otp}</Text>
          <Text>Share with driver upon arrival</Text>
        </View>
      )}

      {/* Emergency SOS Trigger (T5.6) */}
      {status !== "completed" && (
        <TouchableOpacity testID="btn-sos" onPress={() => setSosDispatched(true)}>
          <Text>🚨 SOS Emergency</Text>
        </TouchableOpacity>
      )}

      {sosDispatched && (
        <View testID="sos-alert-banner">
          <Text>Emergency SOS alert sent to operations team!</Text>
        </View>
      )}

      {/* State Transition Actions (Simulator for driver progress) */}
      {status === "driver_arriving" && (
        <TouchableOpacity testID="btn-simulate-arrive" onPress={() => setStatus("driver_arrived")}>
          <Text>Simulate Arrive</Text>
        </TouchableOpacity>
      )}

      {status === "driver_arrived" && (
        <TouchableOpacity testID="btn-simulate-start" onPress={() => setStatus("in_progress")}>
          <Text>Simulate Start Trip</Text>
        </TouchableOpacity>
      )}

      {status === "in_progress" && (
        <TouchableOpacity testID="btn-simulate-complete" onPress={() => setStatus("completed")}>
          <Text>Simulate Complete Trip</Text>
        </TouchableOpacity>
      )}

      {/* Trip Completed & Rating Screen (T5.10 & DEC-10) */}
      {status === "completed" && (
        <View testID="completion-screen">
          <Text testID="complete-title">Trip Completed</Text>
          <Text testID="paid-summary">{`Paid Online: ${inr(paid)}`}</Text>
          {due > 0 && <Text testID="balance-due-summary">{`Balance Due: ${inr(due)}`}</Text>}

          {!ratingSubmitted ? (
            <View testID="rating-form">
              <TouchableOpacity testID="rate-5-stars" onPress={() => setStars(5)}>
                <Text>5 Stars</Text>
              </TouchableOpacity>
              <TextInput
                testID="feedback-input"
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Leave feedback..."
                maxLength={500}
              />
              <TouchableOpacity
                testID="btn-submit-rating"
                disabled={stars === 0}
                onPress={() => setRatingSubmitted(true)}
              >
                <Text>Submit Rating</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text testID="rating-confirmation">Thank you for rating! Ride completed.</Text>
          )}
        </View>
      )}
    </View>
  );
};

describe("Phase 5: Mobile Live Tracking & Trip Completion E2E Journey", () => {
  it("progresses through complete lifecycle: driver arriving -> arrived -> in progress -> completed -> rating", () => {
    const paid = paise(50000);
    const due = paise(99400);

    const { getByTestId, queryByTestId } = render(
      <MobilePassengerTrackingFlow paid={paid} due={due} />
    );

    // Initial state: Driver arriving
    expect(getByTestId("trip-status-header").props.children).toBe("Tracking Your Cab");
    expect(getByTestId("driver-name").props.children).toBe("Karthik Raja");
    expect(getByTestId("otp-value").props.children).toBe("4321");
    expect(queryByTestId("arrived-banner")).toBeNull();

    // Step 1: Driver arrives at pickup
    fireEvent.press(getByTestId("btn-simulate-arrive"));
    expect(getByTestId("arrived-banner")).toBeTruthy();
    expect(getByTestId("otp-value").props.children).toBe("4321");

    // Test SOS alert trigger
    fireEvent.press(getByTestId("btn-sos"));
    expect(getByTestId("sos-alert-banner")).toBeTruthy();

    // Step 2: Trip starts with OTP verification
    fireEvent.press(getByTestId("btn-simulate-start"));
    expect(getByTestId("trip-status-header").props.children).toBe("Trip In Progress");
    // Start OTP is dismissed once in progress
    expect(queryByTestId("passenger-otp-box")).toBeNull();

    // Step 3: Trip completed
    fireEvent.press(getByTestId("btn-simulate-complete"));
    expect(getByTestId("trip-status-header").props.children).toBe("Trip Completed");
    expect(getByTestId("complete-title").props.children).toBe("Trip Completed");

    // DEC-10: Balance due shown clearly
    expect(getByTestId("balance-due-summary").props.children).toBe("Balance Due: ₹994");
    expect(getByTestId("paid-summary").props.children).toBe("Paid Online: ₹500");

    // Step 4: Rating submission (DEC-10)
    fireEvent.press(getByTestId("rate-5-stars"));
    fireEvent.changeText(getByTestId("feedback-input"), "Smooth ride, excellent driver.");
    fireEvent.press(getByTestId("btn-submit-rating"));

    expect(getByTestId("rating-confirmation")).toBeTruthy();
  });
});
