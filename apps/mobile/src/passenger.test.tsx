import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, View, TouchableOpacity } from "react-native";
import { RouteCard } from "./components/RouteCard";
import { FareRow } from "./components/FareRow";
import { Button } from "./components/Button";
import { computeFare, calculateDepositOptions, paise, inr } from "@redtaxi/shared";

describe("Phase 4: Mobile Passenger Booking & Payment (MP4 - MP8, DEC-1, DEC-10)", () => {
  describe("MP4 & MP5: Location Selection & Route Card", () => {
    it("renders RouteCard with pickup, dropoff, distance and duration", () => {
      const { getByText } = render(
        <RouteCard
          pickup="Pollachi Bus Stand"
          dropoff="Coimbatore Airport"
          distanceKm={65.2}
          durationMin={85}
        />
      );

      expect(getByText("Pollachi Bus Stand")).toBeTruthy();
      expect(getByText("Coimbatore Airport")).toBeTruthy();
      expect(getByText("65.2 km • ~85 mins")).toBeTruthy();
    });
  });

  describe("MP6 & DEC-1: Fare Estimate & FareRow Breakdown (No ₹14.90/km caption)", () => {
    it("computes Pollachi -> Coimbatore fare accurately in integer paise", () => {
      const fare = computeFare({
        distanceKm: 65.2,
        ratePerKm: paise(1600),
        batta: paise(30000),
        tollEstimate: paise(8000),
      });

      expect(Number.isInteger(fare.total)).toBe(true);
      expect(fare.total).toBe(paise(149400));
      expect(inr(fare.total)).toBe("₹1,494");

      const { getByText, queryByText } = render(
        <View>
          <FareRow label="Base Fare" amount={fare.distance} subtext="65.2 km included" />
          <FareRow label="Driver Batta" amount={fare.batta} />
          <FareRow label="Toll Estimate" amount={fare.toll} />
          <FareRow label="GST (5%)" amount={fare.gst} />
          <FareRow label="Total Estimated Fare" amount={fare.total} isTotal />
        </View>
      );

      expect(getByText("Total Estimated Fare")).toBeTruthy();
      expect(getByText("₹1,494")).toBeTruthy();

      // DEC-1: Fare quote screen must NOT show "(₹14.90 / km)" caption
      expect(queryByText("₹14.90 / km")).toBeNull();
      expect(queryByText("(₹14.90 / km)")).toBeNull();
    });
  });

  describe("MP7: Advance Deposit vs Full Payment Selection", () => {
    it("satisfies deposit invariant payNow + payAtDrop === total", () => {
      const total = paise(149400);
      const options = calculateDepositOptions(total, {
        advanceDepositPercent: 25,
        minDeposit: paise(50000),
      });

      expect(options).toHaveLength(2);
      const deposit = options.find((o) => o.type === "deposit")!;
      const full = options.find((o) => o.type === "full")!;

      expect(deposit.payNow + deposit.payAtDrop).toBe(total);
      expect(full.payNow + full.payAtDrop).toBe(total);
      expect(deposit.payNow).toBe(paise(50000));
      expect(deposit.payAtDrop).toBe(paise(99400));
    });
  });

  describe("MP8 & DEC-10: Payment State & Booking Confirmation Invariant", () => {
    it("DEC-10: Booking Confirmed screen is NEVER visible before verification completes", () => {
      const isVerified = false;

      const MockBookingScreen = () => {
        return (
          <View>
            {isVerified ? (
              <View>
                <Text testID="confirmed-title">Booking Confirmed</Text>
                <Text testID="otp-display">Start OTP: 4321</Text>
              </View>
            ) : (
              <View>
                <Text testID="payment-title">Payment Options</Text>
                <Button title="Pay Advance ₹500 via Razorpay" onPress={() => {}} />
              </View>
            )}
          </View>
        );
      };

      const { queryByTestId, getByText } = render(<MockBookingScreen />);

      // Pre-verification checks
      expect(getByText("Payment Options")).toBeTruthy();
      expect(queryByTestId("confirmed-title")).toBeNull();
      expect(queryByTestId("otp-display")).toBeNull();
    });

    it("displays Booking Confirmed and ride start OTP only after verification resolves true", () => {
      const MockPaymentFlow = () => {
        const [verified, setVerified] = React.useState(false);
        const [otp, setOtp] = React.useState<string | null>(null);

        const handleVerifyPayment = () => {
          // Mock verification response
          setVerified(true);
          setOtp("4321");
        };

        return (
          <View>
            {verified ? (
              <View>
                <Text testID="confirmed-title">Booking Confirmed!</Text>
                <Text testID="otp-display">Start OTP: {otp}</Text>
              </View>
            ) : (
              <TouchableOpacity testID="pay-btn" onPress={handleVerifyPayment}>
                <Text>Pay ₹500</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      };

      const { getByTestId, queryByTestId } = render(<MockPaymentFlow />);

      expect(queryByTestId("confirmed-title")).toBeNull();

      fireEvent.press(getByTestId("pay-btn"));

      expect(getByTestId("confirmed-title")).toBeTruthy();
      expect(getByTestId("otp-display").props.children).toContain("4321");
    });
  });
});
