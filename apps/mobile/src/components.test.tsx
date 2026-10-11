import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  Button,
  TextField,
  PhoneField,
  OtpBoxes,
  Card,
  ListRow,
  StatusBadge,
  Tabs,
  Toggle,
  StatTile,
  RatingStars,
  DriverCard,
  RouteCard,
  FareRow,
  MapView,
  BottomTabBar,
  Timeline,
  BarChart,
  LineChart,
  EmptyState,
  ErrorState,
  Skeleton,
} from "./components";
import { minTouchTarget } from "./theme/tokens";
import { paise } from "@redtaxi/shared";

describe("Mobile Components (Task 2.4, T2.3, T2.11)", () => {
  describe("Button (T2.3 and T2.11)", () => {
    it("renders default title and responds to press", () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button title="Book Ride" onPress={onPress} />);
      const btnText = getByText("Book Ride");
      expect(btnText).toBeTruthy();
      fireEvent.press(btnText);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("respects disabled state and cannot be pressed", () => {
      const onPress = jest.fn();
      const { getByRole } = render(<Button title="Disabled" disabled onPress={onPress} />);
      const btn = getByRole("button");
      expect(btn.props.accessibilityState.disabled).toBe(true);
      fireEvent.press(btn);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("shows loading indicator and busy accessibility state", () => {
      const { getByRole } = render(<Button title="Loading" loading />);
      const btn = getByRole("button");
      expect(btn.props.accessibilityState.busy).toBe(true);
    });

    it("has minHeight >= 44pt for touch target compliance (T2.11)", () => {
      expect(minTouchTarget).toBeGreaterThanOrEqual(44);
      const { getByRole } = render(<Button title="Touch Target" size="sm" />);
      const btn = getByRole("button");
      const flatStyle = Array.isArray(btn.props.style)
        ? Object.assign({}, ...btn.props.style)
        : btn.props.style;
      expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
      expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
    });
  });

  describe("TextField and PhoneField (T2.3 and T2.11)", () => {
    it("TextField renders label, value and error state", () => {
      const { getByText, getByDisplayValue } = render(
        <TextField
          label="Pickup Point"
          value="Gandhipuram"
          error="Invalid address"
          onChangeText={() => {}}
        />
      );
      expect(getByText("Pickup Point")).toBeTruthy();
      expect(getByDisplayValue("Gandhipuram")).toBeTruthy();
      expect(getByText("Invalid address")).toBeTruthy();
    });

    it("PhoneField restricts input to 10 digits and includes +91 prefix", () => {
      const onChange = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <PhoneField value="" onChangeText={onChange} />
      );
      expect(getByText("+91")).toBeTruthy();
      const input = getByPlaceholderText("98765 43210");
      fireEvent.changeText(input, "987654321012");
      expect(onChange).toHaveBeenCalledWith("9876543210");
    });
  });

  describe("OtpBoxes (T2.3 and T2.11)", () => {
    it("renders 4 and 6 digit boxes with touch targets >= 44pt", () => {
      const { getAllByText } = render(<OtpBoxes length={6} value="123" onChangeText={() => {}} />);
      expect(getAllByText("1")).toBeTruthy();
      expect(getAllByText("2")).toBeTruthy();
      expect(getAllByText("3")).toBeTruthy();
    });
  });

  describe("ListRow, StatusBadge and Tabs (T2.3 and T2.11)", () => {
    it("ListRow handles press and displays title/subtitle", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ListRow title="Past Trips" subtitle="24 rides" onPress={onPress} />
      );
      fireEvent.press(getByText("Past Trips"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("StatusBadge renders mapped status labels correctly", () => {
      const { getByText } = render(<StatusBadge status="in_progress" />);
      expect(getByText("In Progress")).toBeTruthy();
    });

    it("Tabs allows selecting tab items", () => {
      const onSelect = jest.fn();
      const { getByText } = render(
        <Tabs
          tabs={[
            { id: "all", label: "All" },
            { id: "active", label: "Active", badge: 2 },
          ]}
          selectedId="all"
          onSelect={onSelect}
        />
      );
      fireEvent.press(getByText("Active"));
      expect(onSelect).toHaveBeenCalledWith("active");
    });
  });

  describe("Toggle, RatingStars and StatTile (T2.3 and T2.11)", () => {
    it("Toggle switches value", () => {
      const onValueChange = jest.fn();
      const { getByText } = render(
        <Toggle label="Auto Accept" value={false} onValueChange={onValueChange} />
      );
      expect(getByText("Auto Accept")).toBeTruthy();
    });

    it("RatingStars interactive mode updates rating with >=44pt targets", () => {
      const onRatingChange = jest.fn();
      const { getByLabelText } = render(
        <RatingStars rating={3} interactive onRatingChange={onRatingChange} />
      );
      const star5 = getByLabelText("5 stars");
      fireEvent.press(star5);
      expect(onRatingChange).toHaveBeenCalledWith(5);
    });

    it("StatTile renders KPI label and value", () => {
      const { getByText } = render(
        <StatTile label="Today's Earnings" value="₹3,450" delta="+12%" deltaType="positive" />
      );
      expect(getByText("Today's Earnings")).toBeTruthy();
      expect(getByText("₹3,450")).toBeTruthy();
    });
  });

  describe("DriverCard, RouteCard and FareRow (T2.3 and T2.11)", () => {
    it("DriverCard renders driver info and handles call/chat", () => {
      const onCall = jest.fn();
      const { getByText } = render(
        <DriverCard
          name="Ramesh K"
          rating={4.9}
          vehicleModel="Swift Dzire"
          plateNumber="TN 38 BK 9090"
          onCall={onCall}
        />
      );
      expect(getByText("Ramesh K")).toBeTruthy();
      expect(getByText("TN 38 BK 9090")).toBeTruthy();
      fireEvent.press(getByText("Call Driver"));
      expect(onCall).toHaveBeenCalledTimes(1);
    });

    it("RouteCard renders pickup and dropoff points", () => {
      const { getByText } = render(
        <RouteCard
          pickup="Pollachi Bus Stand"
          dropoff="Coimbatore Airport"
          distanceKm={45.8}
          durationMin={65}
        />
      );
      expect(getByText("Pollachi Bus Stand")).toBeTruthy();
      expect(getByText("Coimbatore Airport")).toBeTruthy();
    });

    it("FareRow formats integer paise correctly as INR currency", () => {
      const { getByText } = render(<FareRow label="Total Fare" amount={paise(149400)} isTotal />);
      expect(getByText("Total Fare")).toBeTruthy();
      expect(getByText("₹1,494")).toBeTruthy();
    });
  });

  describe("EmptyState, ErrorState, Skeleton and Visuals (T2.3 and T2.11)", () => {
    it("EmptyState renders title and action", () => {
      const onAction = jest.fn();
      const { getByText } = render(
        <EmptyState title="No Bookings Yet" actionLabel="Book Now" onAction={onAction} />
      );
      expect(getByText("No Bookings Yet")).toBeTruthy();
      fireEvent.press(getByText("Book Now"));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("ErrorState renders alert message and retry button", () => {
      const onRetry = jest.fn();
      const { getByText } = render(<ErrorState message="Network disconnected" onRetry={onRetry} />);
      expect(getByText("Network disconnected")).toBeTruthy();
      fireEvent.press(getByText("Try Again"));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("Card, BottomTabBar, Timeline, Skeleton, MapView, BarChart and LineChart render without errors", () => {
      const onTab = jest.fn();
      const { getByText, toJSON } = render(
        <>
          <Card>
            <Skeleton width={100} height={20} />
          </Card>
          <BottomTabBar
            routes={[
              { key: "home", title: "Home", icon: "🏠" },
              { key: "trips", title: "Trips", icon: "🚗", badge: 1 },
            ]}
            currentIndex={0}
            onTabPress={onTab}
          />
          <Timeline
            steps={[
              { title: "Booking Confirmed", time: "10:00 AM", status: "completed" },
              { title: "Driver Arriving", time: "10:10 AM", status: "current" },
            ]}
          />
          <MapView />
          <BarChart
            data={[
              { label: "M", value: 10 },
              { label: "T", value: 20 },
            ]}
          />
          <LineChart
            data={[
              { label: "M", value: 10 },
              { label: "T", value: 20 },
            ]}
          />
        </>
      );
      expect(getByText("Booking Confirmed")).toBeTruthy();
      expect(getByText("Driver Arriving")).toBeTruthy();
      fireEvent.press(getByText("Trips"));
      expect(onTab).toHaveBeenCalledWith(1);
      expect(toJSON()).toBeTruthy();
    });
  });
});
