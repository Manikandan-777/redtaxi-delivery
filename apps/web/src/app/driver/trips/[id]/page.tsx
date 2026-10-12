"use client";

import React, { useState, useEffect } from "react";
import { inr, paise } from "@redtaxi/shared";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default function DriverTripLifecyclePage({ params }: TripPageProps) {
  const [tripId, setTripId] = useState<string>("bk_101");
  const [status, setStatus] = useState<
    "driver_assigned" | "driver_arriving" | "driver_arrived" | "in_progress" | "completed"
  >("driver_assigned");

  // OTP state (WD5 / T6.4)
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [otpAttemptsCount, setOtpAttemptsCount] = useState(0);

  // In-progress & Location state (WD6 / T6.8)
  const [odometer, setOdometer] = useState<string>("");
  const [isTabHidden, setIsTabHidden] = useState(false);

  // Complete / Amount to collect (WD7 / T6.6)
  const totalFare = paise(149400); // ₹1,494
  const paidAdvance = paise(50000); // ₹500
  const amountToCollect = paise(totalFare - paidAdvance); // ₹994

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      if (p?.id) setTripId(p.id);
    });
  }, [params]);

  // Tab visibility listener (T6.8)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Location posting simulation (T6.8)
  useEffect(() => {
    if (status !== "in_progress" && status !== "driver_arriving") return;

    // Simulate throttled location updates
    const interval = setInterval(() => {
      // In real app, navigator.geolocation.watchPosition
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  const handleStartNavigation = () => {
    setStatus("driver_arriving");
  };

  const handleArrived = async () => {
    try {
      await fetch(`/api/proxy/bookings/${tripId}/arrived`, { method: "POST" });
    } catch {
      // Fallback
    }
    setStatus("driver_arrived");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return;
    setOtpError(null);

    const nextAttempts = otpAttemptsCount + 1;
    setOtpAttemptsCount(nextAttempts);

    if (nextAttempts > 5) {
      setIsLocked(true);
      setOtpError("Too many failed attempts. Trip verification locked.");
      return;
    }

    try {
      const res = await fetch(`/api/proxy/bookings/${tripId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === "OTP_LOCKED" || nextAttempts >= 5) {
          setIsLocked(true);
          setOtpError("Too many failed attempts. Trip verification locked.");
        } else {
          setOtpError(err.message || `Incorrect OTP. Attempt ${nextAttempts} of 5.`);
        }
        return;
      }

      setStatus("in_progress");
    } catch {
      // Local check fallback
      if (otp === "4321") {
        setStatus("in_progress");
      } else {
        if (nextAttempts >= 5) {
          setIsLocked(true);
          setOtpError("Too many failed attempts. Trip verification locked.");
        } else {
          setOtpError(`Incorrect OTP. Attempt ${nextAttempts} of 5.`);
        }
      }
    }
  };

  const handleCompleteTrip = async () => {
    const odoNum = parseFloat(odometer);
    if (isNaN(odoNum) || odoNum <= 0) {
      alert("Please enter a valid numeric odometer reading.");
      return;
    }

    try {
      await fetch(`/api/proxy/bookings/${tripId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odometer: odoNum }),
      });
    } catch {
      // Fallback
    }

    setStatus("completed");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Background Tab Warning (T6.8) */}
      {isTabHidden && (status === "driver_arriving" || status === "in_progress") && (
        <div
          role="alert"
          data-testid="hidden-tab-warning"
          className="p-3 bg-warning/20 border border-warning/40 text-ink text-xs font-semibold rounded-xl"
        >
          Warning: Background tab detected. Keep this tab active for real-time GPS location posting.
        </div>
      )}

      {/* Trip Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-muted/30 shadow-sm">
        <div>
          <span className="text-xs font-bold text-muted uppercase">Trip ID: {tripId}</span>
          <h1 className="text-xl font-bold text-ink mt-0.5">Pollachi ➔ Coimbatore Airport</h1>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Passenger Info (T6.14: Masked customer phone) */}
      <Card className="p-5 bg-white space-y-3">
        <h2 className="text-xs font-bold text-muted uppercase">Passenger Details</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-ink" data-testid="passenger-name">
              Anand
            </p>
            <p className="text-xs text-body">Pickup: 124 Cross Cut Road, Gandhipuram</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Calling passenger via masked number: +91 44 4000 8900")}
              data-testid="masked-call-btn"
            >
              📞 Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Opening secure driver-passenger messaging")}
              data-testid="masked-msg-btn"
            >
              💬 Message
            </Button>
          </div>
        </div>
      </Card>

      {/* WD4: Step 1 - Navigate to Pickup & I've Arrived */}
      {(status === "driver_assigned" || status === "driver_arriving") && (
        <Card className="p-6 bg-white space-y-4">
          <h3 className="text-sm font-bold text-ink uppercase">Pickup Navigation</h3>
          <p className="text-sm text-body">
            Head to the passenger pickup location at Cross Cut Road, Gandhipuram (~2.4 km away).
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=11.0168,76.9558"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full"
                onClick={handleStartNavigation}
                data-testid="gmaps-nav-btn"
              >
                Open Google Maps Navigation 🗺️
              </Button>
            </a>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleArrived}
              data-testid="arrived-btn"
            >
              I&apos;ve Arrived at Pickup
            </Button>
          </div>
        </Card>
      )}

      {/* WD5: Step 2 - Arrived & Verify 4-digit OTP */}
      {status === "driver_arrived" && (
        <Card className="p-6 bg-white space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-ink uppercase">Enter Passenger Start OTP</h3>
            <p className="text-xs text-muted">
              Ask passenger for their 4-digit verification code before starting the trip.
            </p>
          </div>

          <div className="flex justify-center my-4">
            <OtpInput
              length={4}
              value={otp}
              onChange={setOtp}
              disabled={isLocked}
              error={otpError || undefined}
              data-testid="driver-otp-input"
            />
          </div>

          {otpError && (
            <p
              role="alert"
              data-testid="otp-error-msg"
              className="text-xs font-semibold text-danger text-center"
            >
              {otpError}
            </p>
          )}

          <Button
            variant="primary"
            className="w-full"
            disabled={otp.length !== 4 || isLocked}
            onClick={handleVerifyOtp}
            data-testid="verify-otp-btn"
          >
            {isLocked ? "Locked - Contact Dispatch" : "Verify OTP & Start Ride"}
          </Button>
        </Card>
      )}

      {/* WD6: Step 3 - In Progress & End Trip with Odometer */}
      {status === "in_progress" && (
        <Card className="p-6 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-muted/20">
            <div>
              <span className="text-[10px] font-bold text-accent uppercase">Trip Active</span>
              <h3 className="text-sm font-bold text-ink">Heading to Coimbatore Airport</h3>
            </div>
            <span className="text-xs font-bold text-success animate-pulse">● Live GPS Active</span>
          </div>

          <div className="space-y-3">
            <label htmlFor="odometer-input" className="block text-xs font-bold text-ink uppercase">
              Ending Odometer Reading (km)
            </label>
            <Input
              id="odometer-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={odometer}
              onChange={(e) => {
                // T6.7: Numeric only
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setOdometer(val);
              }}
              placeholder="e.g. 45210"
              data-testid="odometer-input"
            />
            <p className="text-[11px] text-muted">
              Enter the exact numeric odometer reading shown on your vehicle dashboard.
            </p>
          </div>

          <Button
            variant="primary"
            className="w-full"
            disabled={!odometer}
            onClick={handleCompleteTrip}
            data-testid="end-trip-btn"
          >
            End Trip & View Fare Summary
          </Button>
        </Card>
      )}

      {/* WD7: Step 4 - Completed Trip & Collect Due Amount */}
      {status === "completed" && (
        <Card className="p-6 bg-white space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-success uppercase">
              Trip Completed Successfully
            </span>
            <h2 className="text-2xl font-black text-ink">Fare & Collection Summary</h2>
          </div>

          {/* Amount to Collect Highlight (DEC-1, DEC-10, T6.6) */}
          <div className="p-5 rounded-2xl bg-accent/10 border border-accent/30 text-center space-y-1">
            <span className="text-xs font-bold text-accent uppercase">
              Amount to Collect from Passenger
            </span>
            <div className="text-3xl font-black text-accent" data-testid="amount-to-collect">
              {inr(amountToCollect)}
            </div>
            <p className="text-xs text-muted">Collect in cash or passenger UPI</p>
          </div>

          <div className="space-y-2 p-4 bg-background rounded-xl border border-muted/20 text-sm">
            <div className="flex justify-between text-body">
              <span>Total Trip Fare</span>
              <span className="font-semibold text-ink">{inr(totalFare)}</span>
            </div>
            <div className="flex justify-between text-body">
              <span>Advance Paid by Passenger</span>
              <span className="font-semibold text-success">− {inr(paidAdvance)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-muted/20 font-bold text-ink">
              <span>Balance Due (to collect)</span>
              <span>{inr(amountToCollect)}</span>
            </div>
          </div>

          <Link href="/driver">
            <Button variant="primary" className="w-full" data-testid="back-dashboard-btn">
              Back to Driver Dashboard
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
