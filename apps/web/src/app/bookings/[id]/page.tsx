"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inr, type Booking, type BookingStatus } from "@redtaxi/shared";
import { TrackingClient } from "@/lib/trackingClient";
import { Button } from "@/components/ui/Button";
import { DriverCard } from "@/components/ui/DriverCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingTrackingPage({ params }: BookingPageProps) {
  const router = useRouter();

  const [bookingId, setBookingId] = useState<string>("");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionTransport, setConnectionTransport] = useState<string>("websocket");
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [sosMessage, setSosMessage] = useState<string | null>(null);
  const [sosLoading, setSosLoading] = useState(false);

  // Share link state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Cancel dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Resolve params asynchronously
  useEffect(() => {
    Promise.resolve(params).then((p) => {
      if (p?.id) setBookingId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;

    // Initial fetch of booking details
    async function loadBooking() {
      try {
        const res = await fetch(`http://localhost:4000/bookings/${bookingId}`);
        if (!res.ok) {
          throw new Error("Unable to load booking details");
        }
        const data = await res.json();
        setBooking(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load booking";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadBooking();

    // Initialize real-time tracking client with fallback polling
    const client = new TrackingClient({
      baseUrl: "http://localhost:4000",
      pollingIntervalMs: 5000,
    });

    const unsubscribe = client.subscribe((event, data) => {
      if (event === "connection.state") {
        const payload = data as { transport: string; connected: boolean };
        setConnectionTransport(payload.transport);
        setIsLiveConnected(payload.connected);
      } else if (event === "booking.status") {
        const payload = data as { status: BookingStatus };
        setBooking((prev) => (prev ? { ...prev, status: payload.status } : null));
      }
    });

    client.connect(bookingId);

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [bookingId]);

  // Handle SOS emergency action (T5.6 & SC-E4)
  const handleTriggerSos = async () => {
    setSosLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/bookings/${bookingId}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: booking?.pickup.lat, lng: booking?.pickup.lng }),
      });
      const data = await res.json();
      if (res.ok) {
        setSosActive(true);
        setSosMessage(data.message || "SOS alert triggered! Emergency support notified.");
      } else {
        alert(data.message || "Failed to trigger SOS alert");
      }
    } catch {
      alert("Network error triggering SOS. Please call emergency services directly.");
    } finally {
      setSosLoading(false);
    }
  };

  // Handle Share Trip Link (T5.7 & VR-6)
  const handleShareTrip = async () => {
    try {
      const res = await fetch(`http://localhost:4000/bookings/${bookingId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.shareUrl) {
        setShareUrl(data.shareUrl);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.shareUrl);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 4000);
        }
      }
    } catch {
      alert("Unable to generate share link at this time");
    }
  };

  // Handle Ride Cancellation (T5.8)
  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Please select or specify a cancellation reason");
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`http://localhost:4000/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCancelDialog(false);
        setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      } else {
        setCancelError(data.message || "Failed to cancel booking");
      }
    } catch {
      setCancelError("Network error while cancelling ride");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted font-medium">Connecting to live tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow text-center border border-danger/20">
          <h2 className="text-lg font-bold text-ink mb-2">Tracking Error</h2>
          <p className="text-sm text-muted mb-4">{error || "Booking not found"}</p>
          <Button onClick={() => router.push("/")} variant="primary">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const isDriverArrived = booking.status === "driver_arrived";
  const isInProgress = booking.status === "in_progress";
  const isCompleted = booking.status === "completed";
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="min-h-screen bg-surface pb-12">
      {/* Top Tracking Header */}
      <div className="bg-white border-b border-muted/20 py-4 px-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Trip Ref
              </span>
              <span className="font-mono text-sm font-bold text-ink">{booking.code}</span>
              <StatusBadge status={booking.status} />
            </div>
            <h1 className="text-lg font-bold text-ink mt-0.5">
              {isInProgress
                ? "Trip In Progress"
                : isCompleted
                  ? "Trip Completed"
                  : isCancelled
                    ? "Ride Cancelled"
                    : "Tracking Your Ride"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime / Fallback status pill (T5.1 & T5.2) */}
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                connectionTransport === "websocket" && isLiveConnected
                  ? "bg-success/10 text-success border border-success/30"
                  : "bg-warning/10 text-warning border border-warning/30"
              }`}
              title={
                connectionTransport === "websocket"
                  ? "Live WebSocket connection active"
                  : "Fallback polling active"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionTransport === "websocket" && isLiveConnected
                    ? "bg-success animate-pulse"
                    : "bg-warning"
                }`}
              />
              {connectionTransport === "websocket" ? "Live Socket" : "Polling"}
            </span>

            {/* Share Trip Link Button (T5.7) */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShareTrip}
              className="hidden sm:inline-flex"
            >
              Share Trip
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Arrival Banner (T5.3 & T5.4) */}
        {isDriverArrived && (
          <div
            role="alert"
            className="bg-accent/10 border-2 border-accent text-accent-ink rounded-xl p-4 flex items-center gap-3 animate-bounce"
          >
            <span className="text-2xl">🚖</span>
            <div className="flex-1">
              <h3 className="font-bold text-base text-ink">Driver has arrived!</h3>
              <p className="text-xs text-muted">
                Your driver is waiting at the pickup location. Share your 4-digit OTP below to start
                the trip.
              </p>
            </div>
          </div>
        )}

        {/* SOS Alert Banner */}
        {sosActive && (
          <div
            role="alert"
            className="bg-danger/10 border-2 border-danger rounded-xl p-4 flex items-center gap-3"
          >
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <h3 className="font-bold text-base text-danger">Emergency Alert Activated</h3>
              <p className="text-xs text-ink">{sosMessage}</p>
            </div>
          </div>
        )}

        {/* Share Link Banner */}
        {shareUrl && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted">
                Public Live Tracking Link (Privacy-Protected):
              </p>
              <p className="font-mono text-xs text-ink truncate max-w-md">{shareUrl}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 3000);
              }}
            >
              {shareCopied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        )}

        {/* Ride Start OTP Card - Strictly visible to Passenger Only (T5.4) */}
        {!isInProgress && !isCompleted && !isCancelled && booking.startOtp && (
          <div className="bg-gradient-to-r from-accent/15 via-accent/5 to-white border border-accent/40 rounded-2xl p-5 shadow-sm text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
              Passenger Start OTP
            </span>
            <div
              data-testid="start-otp"
              className="text-4xl font-black font-mono tracking-widest text-ink my-2 select-all"
            >
              {booking.startOtp}
            </div>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Share this 4-digit code with your driver only after meeting at the pickup location to
              begin the trip.
            </p>
          </div>
        )}

        {/* Driver Details Card (WP6) */}
        {booking.driver ? (
          <DriverCard
            name={booking.driver.name}
            rating={booking.driver.rating}
            vehicleNo={booking.driver.vehicleNo}
            vehicleClass={booking.driver.vehicleClass}
            onCall={() => alert(`Calling driver securely: +91 94444 00000 (Number Masked)`)}
            onMessage={() => alert("Opening secure chat...")}
            onSos={handleTriggerSos}
          />
        ) : (
          <div className="bg-white rounded-xl border border-muted/20 p-6 text-center shadow-sm">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <h3 className="font-bold text-ink">Assigning Nearest Driver...</h3>
            <p className="text-xs text-muted mt-1">
              Connecting you with certified drivers near {booking.pickup?.label || "your pickup"}
            </p>
          </div>
        )}

        {/* Route Details Card */}
        <div className="bg-white rounded-xl border border-muted/20 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            Route & Destination
          </h3>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted/30">
            <div>
              <span className="text-xs font-semibold text-muted uppercase">Pickup</span>
              <p className="text-sm font-bold text-ink">
                {booking.pickup?.label || "Pickup location"}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted uppercase">Drop Location</span>
              <p className="text-sm font-bold text-ink">{booking.drop?.label || "Drop location"}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-muted/15 flex justify-between text-xs text-muted">
            <span>Distance: ~{booking.quote?.distanceKm ?? 0} km</span>
            <span>Duration: ~{booking.quote?.durationMin ?? 0} mins</span>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl border border-muted/20 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Fare Summary</span>
            <span className="text-base font-bold text-ink">
              {booking.quote?.total != null ? inr(booking.quote.total) : "₹0"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block">
              {(booking.due ?? 0) > 0 ? "Balance Due at Drop" : "Paid Online"}
            </span>
            <span
              className={`text-sm font-bold ${(booking.due ?? 0) > 0 ? "text-warning" : "text-success"}`}
            >
              {(booking.due ?? 0) > 0 ? inr(booking.due) : "₹0 (Paid Full)"}
            </span>
          </div>
        </div>

        {/* Complete Trip Action / View Receipt */}
        {isCompleted && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-5 text-center space-y-3">
            <h3 className="font-bold text-base text-success">This ride has completed!</h3>
            <p className="text-xs text-muted">
              Please rate your ride and review your final trip receipt.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/bookings/${booking.id}/complete`)}
              className="w-full"
            >
              Rate Trip & View Receipt
            </Button>
          </div>
        )}

        {/* Bottom Actions: Cancel & SOS */}
        {!isCompleted && !isCancelled && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Ride
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleTriggerSos}
              disabled={sosLoading}
            >
              {sosLoading ? "Alerting..." : "🚨 SOS Emergency"}
            </Button>
          </div>
        )}

        {isCancelled && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-5 text-center">
            <h3 className="font-bold text-danger">This ride was cancelled</h3>
            <p className="text-xs text-muted mt-1">Need a new ride? Return home to book again.</p>
            <Button variant="primary" onClick={() => router.push("/")} className="mt-4">
              Book Another Ride
            </Button>
          </div>
        )}
      </div>

      {/* Cancellation Modal / Sheet (T5.8) */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Cancel Your Ride</h3>
            <p className="text-xs text-muted">
              Please let us know the reason for cancellation. This helps us maintain service
              quality.
            </p>

            <div className="space-y-2">
              {[
                "Driver requested cancellation",
                "Wait time is too long",
                "Changed my travel plans",
                "Booked another transport",
                "Other reason",
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-3 p-3 border border-muted/20 rounded-xl cursor-pointer hover:bg-surface/50 text-sm"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="accent-accent"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {cancelError && <p className="text-xs font-semibold text-danger">{cancelError}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelError(null);
                }}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
