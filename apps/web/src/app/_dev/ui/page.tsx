"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  PhoneInput,
  OtpInput,
  PlaceInput,
  Select,
  SegmentedControl,
  Tabs,
  Toggle,
  Badge,
  StatusBadge,
  Card,
  StatTile,
  DataTable,
  ConfirmDialog,
  Toast,
  Skeleton,
  EmptyState,
  ErrorState,
  VehicleCard,
  FareBreakdown,
  PaymentOptions,
  DriverCard,
  RatingStars,
  Timeline,
  MapView,
  BarChartWeek,
  RevenueLine,
} from "@/components/ui";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { paise, computeFare, calculateDepositOptions } from "@redtaxi/shared";

export default function DevUiGalleryPage() {
  const [toggleVal, setToggleVal] = useState(true);
  const [phoneVal, setPhoneVal] = useState("9876543210");
  const [otp4, setOtp4] = useState("1234");
  const [otp6, setOtp6] = useState("123456");
  const [tripMode, setTripMode] = useState<"one_way" | "round_trip" | "local">("one_way");
  const [activeTab, setActiveTab] = useState("all");
  const [rating, setRating] = useState(4);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payChoice, setPayChoice] = useState<"deposit" | "full">("deposit");

  const sampleFare = computeFare({
    distanceKm: 65.2,
    ratePerKm: paise(1600),
    batta: paise(30000),
    tollEstimate: paise(8000),
  });

  const sampleQuote = {
    ...sampleFare,
    id: "q-sample",
    vehicleId: "v-sedan",
    mode: "one_way" as const,
    distanceKm: 65.2,
    durationMin: 85,
    depositOptions: calculateDepositOptions(sampleFare.total),
    validUntil: "2026-10-10T14:30:00Z",
  };

  return (
    <div className="min-h-screen bg-background text-body pb-20">
      <OfflineBanner />
      <TopNav currentPath="/_dev/ui" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <PageHeader
          title="RedTaxi Design System & UI Gallery"
          description="Design tokens, interactive components, accessible states and layout shells for RedTaxi."
          badge={<Badge variant="accent">Phase 2 / Dev Only</Badge>}
        />

        {/* 1. BUTTONS */}
        <section className="my-8" aria-labelledby="section-buttons">
          <h2 id="section-buttons" className="text-xl font-bold text-ink mb-4">
            1. Buttons (Default, Outline, Danger, Ghost, Loading, Disabled)
          </h2>
          <div className="flex flex-wrap gap-4 items-center p-6 bg-white rounded-xl border border-muted/30">
            <Button variant="primary">Primary Action</Button>
            <Button variant="outline">Outline Action</Button>
            <Button variant="danger">Danger Action</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </section>

        {/* 2. FORM INPUTS */}
        <section className="my-8" aria-labelledby="section-inputs">
          <h2 id="section-inputs" className="text-xl font-bold text-ink mb-4">
            2. Form Inputs & Pickers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl border border-muted/30">
            <Input label="Full Name" placeholder="e.g. Selvam Kumar" hint="As shown on Aadhaar" />
            <Input
              label="Email with Error"
              defaultValue="invalid-email"
              error="Please enter a valid email address."
            />
            <PhoneInput label="Mobile Number" value={phoneVal} onChange={setPhoneVal} />
            <Select
              label="Vehicle Class Filter"
              options={[
                { value: "all", label: "All Vehicles" },
                { value: "hatchback", label: "Hatchback (₹14/km)" },
                { value: "sedan", label: "Sedan (₹16/km)" },
                { value: "suv", label: "Prime SUV (₹22/km)" },
                { value: "innova", label: "Innova Crysta (₹26/km)" },
              ]}
            />
            <PlaceInput
              label="Pickup Location"
              iconType="pickup"
              defaultValue="Pollachi Bus Stand"
            />
            <PlaceInput
              label="Drop Location"
              iconType="drop"
              defaultValue="Palani Temple, Palani"
            />
          </div>
        </section>

        {/* 3. OTP INPUTS */}
        <section className="my-8" aria-labelledby="section-otp">
          <h2 id="section-otp" className="text-xl font-bold text-ink mb-4">
            3. OTP Inputs (T2.6: 4-digit Ride Start & 6-digit Login OTP)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl border border-muted/30">
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-ink mb-3">4-Digit Ride Start OTP</span>
              <OtpInput length={4} value={otp4} onChange={setOtp4} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-ink mb-3">
                6-Digit Passenger/Driver Login OTP
              </span>
              <OtpInput length={6} value={otp6} onChange={setOtp6} />
            </div>
          </div>
        </section>

        {/* 4. CONTROLS, TABS & BADGES */}
        <section className="my-8" aria-labelledby="section-controls">
          <h2 id="section-controls" className="text-xl font-bold text-ink mb-4">
            4. Segmented Controls, Tabs, Toggles & Badges
          </h2>
          <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-muted/30">
            <div>
              <span className="text-sm font-semibold text-ink mb-2 block">
                Trip Mode Segmented Control:
              </span>
              <SegmentedControl
                options={[
                  { value: "one_way", label: "One Way" },
                  { value: "round_trip", label: "Round Trip" },
                  { value: "local", label: "Local Package" },
                ]}
                value={tripMode}
                onChange={setTripMode}
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-ink mb-2 block">Tabs:</span>
              <Tabs
                tabs={[
                  { id: "all", label: "All Rides", badge: 342 },
                  { id: "active", label: "Active", badge: 10 },
                  { id: "completed", label: "Completed", badge: 310 },
                  { id: "cancelled", label: "Cancelled", badge: 22 },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Toggle checked={toggleVal} onChange={setToggleVal} label="Driver Online Status" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">Rating:</span>
                <RatingStars value={rating} onChange={setRating} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-muted/20">
              <StatusBadge status="completed" />
              <StatusBadge status="searching" />
              <StatusBadge status="driver_assigned" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="pending" />
              <StatusBadge status="cancelled" />
              <StatusBadge status="rejected" />
            </div>
          </div>
        </section>

        {/* 5. STAT TILES & CARDS */}
        <section className="my-8" aria-labelledby="section-stats">
          <h2 id="section-stats" className="text-xl font-bold text-ink mb-4">
            5. Analytics & Dashboard Stat Tiles (DEC-6 Confirmed 5 Tiles)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatTile label="Total Bookings Today" value="342" subtext="Pollachi region" />
            <StatTile
              label="Active Rides"
              value="10"
              trend={{ value: "+2 live", isPositive: true }}
            />
            <StatTile label="Drivers Online" value="48" subtext="75 km radius" />
            <StatTile
              label="Pending Driver Approvals"
              value="4"
              trend={{ value: "Action req", isPositive: false }}
            />
            <StatTile label="Completed Today" value="310" subtext="90.6% completion" />
          </div>
        </section>

        {/* 6. DATA TABLE */}
        <section className="my-8" aria-labelledby="section-table">
          <h2 id="section-table" className="text-xl font-bold text-ink mb-4">
            6. DataTable (T2.7: Sort, Pagination, Keyboard Accessible)
          </h2>
          <DataTable
            columns={[
              { key: "code", header: "Booking Code", sortable: true },
              { key: "customer", header: "Customer", sortable: true },
              { key: "pickup", header: "Pickup" },
              { key: "drop", header: "Drop" },
              { key: "fare", header: "Fare", sortable: true },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={String(row.status)} />,
              },
            ]}
            data={[
              {
                code: "BK10234",
                customer: "Priya Raman",
                pickup: "Pollachi Bus Stand",
                drop: "Palani Temple",
                fare: "₹1,494",
                status: "completed",
              },
              {
                code: "BK10235",
                customer: "Karthik Raja",
                pickup: "Coimbatore Airport",
                drop: "Pollachi Market",
                fare: "₹1,250",
                status: "in_progress",
              },
              {
                code: "BK10236",
                customer: "Anand Natarajan",
                pickup: "Valparai Road",
                drop: "Pollachi Junction",
                fare: "₹850",
                status: "searching",
              },
              {
                code: "BK10237",
                customer: "Meena Sundaram",
                pickup: "Dindigul Bypass",
                drop: "Palani",
                fare: "₹920",
                status: "cancelled",
              },
            ]}
          />
        </section>

        {/* 7. FARE BREAKDOWN & PAYMENT OPTIONS */}
        <section className="my-8" aria-labelledby="section-fare">
          <h2 id="section-fare" className="text-xl font-bold text-ink mb-4">
            7. Fare Breakdown & Deposit Options (DEC-1, DEC-2, DEC-4)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FareBreakdown quote={sampleQuote} />
            <div className="flex flex-col gap-4">
              <VehicleCard
                vehicle={{
                  id: "v-sedan",
                  class: "sedan",
                  displayName: "Maruti Dzire or Equivalent",
                  passengers: 4,
                  bags: 2,
                  ratePerKm: paise(1600),
                  minKm: 100,
                  imageUrl: "",
                  popular: true,
                }}
                selected={true}
              />
              <PaymentOptions
                options={sampleQuote.depositOptions}
                selectedType={payChoice}
                onChange={setPayChoice}
              />
              <Button onClick={() => setDialogOpen(true)}>Open Confirmation Dialog</Button>
            </div>
          </div>
        </section>

        {/* 8. DRIVER CARD, TIMELINE & MAP */}
        <section className="my-8" aria-labelledby="section-tracking">
          <h2 id="section-tracking" className="text-xl font-bold text-ink mb-4">
            8. Driver Card, Timeline & Map View
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <DriverCard
                name="Selvam Kumar"
                rating={4.8}
                vehicleNo="TN 37 BY 1234"
                vehicleClass="Sedan"
                onCall={() => {}}
                onMessage={() => {}}
                onSos={() => {}}
              />
              <Card>
                <h3 className="text-sm font-bold text-ink mb-3">Live Trip Milestones</h3>
                <Timeline
                  items={[
                    {
                      status: "created",
                      title: "Booking Created",
                      time: "06:15 AM",
                      completed: true,
                    },
                    {
                      status: "driver_assigned",
                      title: "Driver Assigned",
                      time: "06:17 AM",
                      completed: true,
                    },
                    {
                      status: "driver_arrived",
                      title: "Driver Arrived at Pickup",
                      time: "06:28 AM",
                      current: true,
                    },
                    { status: "in_progress", title: "Trip in Progress" },
                    { status: "completed", title: "Trip Completed" },
                  ]}
                />
              </Card>
            </div>
            <div>
              <MapView
                pickup={{ label: "Pollachi Bus Stand", lat: 10.66, lng: 77.01 }}
                drop={{ label: "Palani Temple, Palani", lat: 10.45, lng: 77.52 }}
                driverLocation={{ lat: 10.65, lng: 77.02 }}
              />
            </div>
          </div>
        </section>

        {/* 9. CHARTS */}
        <section className="my-8" aria-labelledby="section-charts">
          <h2 id="section-charts" className="text-xl font-bold text-ink mb-4">
            9. Analytics Charts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BarChartWeek
              data={[
                { day: "Mon", trips: 42 },
                { day: "Tue", trips: 48 },
                { day: "Wed", trips: 55 },
                { day: "Thu", trips: 40 },
                { day: "Fri", trips: 62 },
                { day: "Sat", trips: 75 },
                { day: "Sun", trips: 68 },
              ]}
            />
            <RevenueLine
              data={[
                { label: "Mon", amount: 62000 },
                { label: "Tue", amount: 71000 },
                { label: "Wed", amount: 84000 },
                { label: "Thu", amount: 60000 },
                { label: "Fri", amount: 95000 },
                { label: "Sat", amount: 112000 },
                { label: "Sun", amount: 98000 },
              ]}
            />
          </div>
        </section>

        {/* 10. STATES & SKELETONS */}
        <section className="my-8" aria-labelledby="section-states">
          <h2 id="section-states" className="text-xl font-bold text-ink mb-4">
            10. System States (Empty, Error, Toast & Skeletons)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EmptyState
              title="No Trips Scheduled"
              description="You have no upcoming scheduled outstation trips."
              actionLabel="Book a Ride"
              onAction={() => {}}
            />
            <ErrorState
              title="Unable to Calculate Fare"
              message="Network timed out fetching route geometry. Please retry."
              onRetry={() => {}}
            />
            <div className="flex flex-col gap-3">
              <Toast
                id="t1"
                type="success"
                title="Payment Verified"
                message="Advance deposit ₹500 received."
              />
              <Toast
                id="t2"
                type="warning"
                title="Quote Expiring Soon"
                message="Fare expires in 2 minutes."
              />
              <div className="p-4 bg-white rounded-xl border border-muted/30 flex flex-col gap-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rectangular" height={36} />
              </div>
            </div>
          </div>
        </section>

        <ConfirmDialog
          open={dialogOpen}
          title="Confirm Ride Cancellation"
          description="Are you sure you want to cancel this booking? A cancellation fee may apply if the driver has already arrived."
          confirmLabel="Cancel Booking"
          variant="danger"
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />
      </div>
    </div>
  );
}
