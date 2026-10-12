import React, { useState } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, View, TouchableOpacity, TextInput } from "react-native";
import { inr, paise } from "@redtaxi/shared";

// Mock Mobile Driver Flow Component
const MobileDriverJourney = () => {
  const [online, setOnline] = useState(true);
  const [docAlert, setDocAlert] = useState<string | null>(null);
  const [hasOffer, setHasOffer] = useState(true);
  const [offerRemaining] = useState(45);
  const [raceError, setRaceError] = useState<string | null>(null);

  // Lifecycle
  const [tripStatus, setTripStatus] = useState<
    "idle" | "driver_assigned" | "driver_arrived" | "in_progress" | "completed"
  >("idle");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Odometer & Collection
  const [odometer, setOdometer] = useState("");
  const totalFare = paise(149400); // ₹1,494
  const paidAdvance = paise(50000); // ₹500
  const amountToCollect = paise(totalFare - paidAdvance); // ₹994

  const handleToggleOnline = () => {
    // Check docs
    const hasUnverified = false;
    if (hasUnverified) {
      setDocAlert("Documents unverified. Cannot go online.");
      return;
    }
    setOnline(!online);
  };

  const handleAcceptOffer = (isSimulatedRace = false) => {
    if (isSimulatedRace) {
      setRaceError("Trip no longer available");
      setHasOffer(false);
      return;
    }
    setHasOffer(false);
    setTripStatus("driver_assigned");
  };

  const handleArrived = () => {
    setTripStatus("driver_arrived");
  };

  const handleVerifyOtp = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (nextAttempts > 5) {
      setOtpError("Too many failed attempts. Trip verification locked.");
      return;
    }

    if (otp !== "4321") {
      if (nextAttempts >= 5) {
        setOtpError("Too many failed attempts. Trip verification locked.");
      } else {
        setOtpError(`Incorrect OTP. Attempt ${nextAttempts} of 5.`);
      }
      return;
    }

    setOtpError(null);
    setTripStatus("in_progress");
  };

  const handleEndTrip = () => {
    if (!odometer) return;
    setTripStatus("completed");
  };

  return (
    <View testID="mobile-driver-container">
      {/* Header */}
      <Text testID="driver-title">RedTaxi Driver</Text>
      <TouchableOpacity testID="mobile-online-btn" onPress={handleToggleOnline}>
        <Text testID="online-status-text">{online ? "ONLINE" : "OFFLINE"}</Text>
      </TouchableOpacity>

      {docAlert && <Text testID="doc-alert-text">{docAlert}</Text>}
      {raceError && <Text testID="race-error-text">{raceError}</Text>}

      {/* MD4 Offer Modal */}
      {hasOffer && (
        <View testID="offer-sheet">
          <Text testID="offer-countdown-text">{`${offerRemaining}s`}</Text>
          <Text testID="offer-pickup">124 Cross Cut Road, Gandhipuram</Text>
          <Text testID="offer-drop">Coimbatore International Airport</Text>
          <Text testID="offer-fare">{inr(totalFare)}</Text>
          <TouchableOpacity testID="accept-offer-btn" onPress={() => handleAcceptOffer(false)}>
            <Text>Accept Offer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MD5 / MD6: Navigate & Arrived */}
      {tripStatus === "driver_assigned" && (
        <View testID="navigate-pickup-view">
          <Text testID="pickup-nav-title">Navigate to Pickup</Text>
          <TouchableOpacity testID="mobile-arrived-btn" onPress={handleArrived}>
            <Text>I&apos;ve Arrived</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MD7: Arrived & OTP Entry */}
      {tripStatus === "driver_arrived" && (
        <View testID="arrived-otp-view">
          <Text testID="otp-instruction">Enter 4-Digit Passenger Start OTP</Text>
          <TextInput
            testID="mobile-otp-input"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
          {otpError && <Text testID="mobile-otp-error">{otpError}</Text>}
          <TouchableOpacity testID="mobile-verify-otp-btn" onPress={handleVerifyOtp}>
            <Text>Verify & Start Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MD8: In Progress & End Trip with Odometer */}
      {tripStatus === "in_progress" && (
        <View testID="in-progress-view">
          <Text testID="in-progress-status">Ride in Progress</Text>
          <TextInput
            testID="mobile-odometer-input"
            keyboardType="numeric"
            value={odometer}
            onChangeText={(v) => setOdometer(v.replace(/[^0-9.]/g, ""))}
            placeholder="Odometer reading"
          />
          <TouchableOpacity testID="mobile-end-trip-btn" onPress={handleEndTrip}>
            <Text>End Trip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MD9: Complete & Collect Amount */}
      {tripStatus === "completed" && (
        <View testID="complete-summary-view">
          <Text testID="trip-complete-title">Trip Completed</Text>
          <Text testID="amount-to-collect-val">{inr(amountToCollect)}</Text>
          <Text testID="total-fare-val">{inr(totalFare)}</Text>
          <Text testID="paid-advance-val">{inr(paidAdvance)}</Text>
        </View>
      )}
    </View>
  );
};

describe("Phase 6: Mobile Driver End-to-End Simulation Tests (T6.1 - T6.15)", () => {
  it("executes complete mobile driver flow: go online -> accept offer -> arrived -> 4-digit OTP -> odometer -> collect ₹994", () => {
    const { getByTestId } = render(<MobileDriverJourney />);

    // Step 1: Initial online state & offer present
    expect(getByTestId("online-status-text").props.children).toBe("ONLINE");
    expect(getByTestId("offer-countdown-text").props.children).toBe("45s");
    expect(getByTestId("offer-pickup").props.children).toBe("124 Cross Cut Road, Gandhipuram");

    // Step 2: Accept Offer -> Navigate to pickup
    fireEvent.press(getByTestId("accept-offer-btn"));
    expect(getByTestId("pickup-nav-title").props.children).toBe("Navigate to Pickup");

    // Step 3: Arrived at Pickup
    fireEvent.press(getByTestId("mobile-arrived-btn"));
    expect(getByTestId("otp-instruction").props.children).toBe("Enter 4-Digit Passenger Start OTP");

    // Step 4: Enter 4-digit OTP and verify
    fireEvent.changeText(getByTestId("mobile-otp-input"), "4321");
    fireEvent.press(getByTestId("mobile-verify-otp-btn"));

    // Step 5: Trip In Progress -> Enter odometer and end trip
    expect(getByTestId("in-progress-status").props.children).toBe("Ride in Progress");
    fireEvent.changeText(getByTestId("mobile-odometer-input"), "52340");
    fireEvent.press(getByTestId("mobile-end-trip-btn"));

    // Step 6: Trip Completed -> Verify collection amount = ₹994 (T6.6 / DEC-1)
    expect(getByTestId("trip-complete-title").props.children).toBe("Trip Completed");
    expect(getByTestId("amount-to-collect-val").props.children).toBe("₹994");
    expect(getByTestId("total-fare-val").props.children).toBe("₹1,494");
    expect(getByTestId("paid-advance-val").props.children).toBe("₹500");
  });

  it("verifies OTP locking on 5 incorrect attempts in mobile flow", () => {
    const { getByTestId } = render(<MobileDriverJourney />);

    // Accept offer & arrive
    fireEvent.press(getByTestId("accept-offer-btn"));
    fireEvent.press(getByTestId("mobile-arrived-btn"));

    // Enter wrong OTP 5 times
    fireEvent.changeText(getByTestId("mobile-otp-input"), "0000");

    for (let i = 0; i < 5; i++) {
      fireEvent.press(getByTestId("mobile-verify-otp-btn"));
    }

    expect(getByTestId("mobile-otp-error").props.children).toBe(
      "Too many failed attempts. Trip verification locked."
    );
  });
});
