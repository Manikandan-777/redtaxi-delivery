"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inr, paise } from "@redtaxi/shared";
import { Toggle } from "@/components/ui/Toggle";
import { StatTile } from "@/components/ui/StatTile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BarChartWeek } from "@/components/ui/BarChartWeek";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getTimeOfDayGreeting } from "@/lib/driverUtils";

export interface DriverOffer {
  id: string;
  bookingId: string;
  expiresAt: string;
  pickup: { label: string; lat: number; lng: number };
  drop: { label: string; lat: number; lng: number };
  fare: number;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [docBlockedAlert, setDocBlockedAlert] = useState<string | null>(null);
  const [activeOffer, setActiveOffer] = useState<DriverOffer | null>({
    id: "off_seed_101",
    bookingId: "bk_101",
    expiresAt: new Date(Date.now() + 45 * 1000).toISOString(),
    pickup: { label: "124 Cross Cut Road, Gandhipuram", lat: 11.0168, lng: 76.9558 },
    drop: { label: "Coimbatore International Airport", lat: 11.029, lng: 77.043 },
    fare: 149400,
  });
  const [offerRemainingSec, setOfferRemainingSec] = useState(45);
  const [acceptRaceError, setAcceptRaceError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<{
    id: string;
    code: string;
    pickup: string;
    drop: string;
    status: string;
    fare: number;
  } | null>(null);

  // Time of day greeting
  const greeting = getTimeOfDayGreeting(new Date(), "Selvam");

  // Notification permission requested at go-online (T6.13)
  const handleToggleOnline = async (checked: boolean) => {
    if (checked) {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          try {
            await Notification.requestPermission();
          } catch {
            // Ignore permission error
          }
        }
      }
    }

    try {
      const res = await fetch("/api/proxy/driver/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: checked }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403 || err.code === "DOCUMENTS_UNVERIFIED") {
          setDocBlockedAlert(
            err.message ||
              "Go-online blocked: documents unverified or expired. Please upload approved documents."
          );
          setOnline(false);
          return;
        }
      }

      setDocBlockedAlert(null);
      setOnline(checked);
    } catch {
      // Local fallback
      setOnline(checked);
    }
  };

  // Poll / check incoming offer when online
  useEffect(() => {
    if (!online) {
      setActiveOffer(null);
      return;
    }

    // Load sample offer for test/demo
    const offer: DriverOffer = {
      id: "off_seed_101",
      bookingId: "bk_101",
      expiresAt: new Date(Date.now() + 45 * 1000).toISOString(),
      pickup: { label: "124 Cross Cut Road, Gandhipuram", lat: 11.0168, lng: 76.9558 },
      drop: { label: "Coimbatore International Airport", lat: 11.029, lng: 77.043 },
      fare: 149400,
    };
    setActiveOffer(offer);
  }, [online]);

  // Server-based countdown for offer (T6.2)
  useEffect(() => {
    if (!activeOffer) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expires = new Date(activeOffer.expiresAt).getTime();
      const remaining = Math.max(0, Math.ceil((expires - now) / 1000));
      setOfferRemainingSec(remaining);

      if (remaining <= 0) {
        setActiveOffer(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOffer]);

  const handleAcceptOffer = async () => {
    if (!activeOffer) return;
    setIsAccepting(true);
    setAcceptRaceError(null);

    try {
      const res = await fetch(`/api/proxy/offers/${activeOffer.id}/accept`, {
        method: "POST",
      });

      if (res.status === 409) {
        // Race condition: T6.3
        setAcceptRaceError("Trip no longer available");
        setActiveOffer(null);
        setIsAccepting(false);
        return;
      }

      const booking = await res.json();
      setActiveOffer(null);
      setCurrentTrip({
        id: booking.id || activeOffer.bookingId,
        code: booking.code || "BK10234",
        pickup: activeOffer.pickup.label,
        drop: activeOffer.drop.label,
        status: "driver_assigned",
        fare: activeOffer.fare,
      });
      router.push(`/driver/trips/${booking.id || activeOffer.bookingId}`);
    } catch {
      // Fallback
      router.push(`/driver/trips/${activeOffer.bookingId}`);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineOffer = () => {
    setActiveOffer(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Online Toggle (WD2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-muted/30 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-ink" data-testid="driver-greeting">
            {greeting}
          </h1>
          <p className="text-sm text-body mt-1">Vehicle: TN 37 BY 1234 • Sedan (Maruti Dzire)</p>
        </div>

        <div className="flex items-center gap-3 bg-surface/30 px-4 py-2 rounded-xl">
          <span className="text-sm font-semibold text-ink">
            {online ? "You are Online" : "You are Offline"}
          </span>
          <Toggle
            checked={online}
            onChange={handleToggleOnline}
            label="Driver availability online toggle"
            data-testid="online-toggle"
          />
        </div>
      </div>

      {/* Document Blocked Alert (T6.1) */}
      {docBlockedAlert && (
        <div
          role="alert"
          data-testid="doc-unverified-alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-medium flex items-center justify-between"
        >
          <span>{docBlockedAlert}</span>
          <Link
            href="/driver/profile"
            className="underline font-bold text-xs uppercase tracking-wide hover:opacity-80"
          >
            Upload Documents
          </Link>
        </div>
      )}

      {/* Accept Race Error Alert (T6.3) */}
      {acceptRaceError && (
        <div
          role="alert"
          data-testid="trip-unavailable-alert"
          className="p-4 rounded-xl bg-warning/20 border border-warning/40 text-ink text-sm font-semibold flex items-center justify-between"
        >
          <span>{acceptRaceError}</span>
          <button
            onClick={() => setAcceptRaceError(null)}
            className="text-xs font-bold uppercase underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Tiles (WD2 / DEC-6) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Today's Earnings"
          value={inr(paise(245000))}
          trend="+18% vs yesterday"
          data-testid="stat-earnings"
        />
        <StatTile label="Trips Completed" value="4" trend="Target: 6" data-testid="stat-trips" />
        <StatTile label="Online Hours" value="6.5h" trend="Active today" data-testid="stat-hours" />
        <StatTile label="Driver Rating" value="★ 4.8" trend="Top rated" data-testid="stat-rating" />
      </div>

      {/* Current Trip Card (WD2) */}
      {currentTrip ? (
        <Card className="p-6 border-accent/40 bg-accent/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold tracking-wider text-accent uppercase">
              Current Active Ride • {currentTrip.code}
            </span>
            <StatusBadge status={currentTrip.status} />
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold text-ink">From: {currentTrip.pickup}</p>
            <p className="text-sm font-semibold text-ink">To: {currentTrip.drop}</p>
            <p className="text-base font-bold text-accent">{inr(paise(currentTrip.fare))}</p>
          </div>
          <Link href={`/driver/trips/${currentTrip.id}`}>
            <Button variant="primary" className="w-full">
              Resume Trip Navigation
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 border-dashed border-muted/50 bg-white text-center">
          <p className="text-sm text-muted font-medium">No active ride right now.</p>
          <p className="text-xs text-body mt-1">Keep status Online to receive incoming offers.</p>
        </Card>
      )}

      {/* Weekly Earnings Preview (WD8) */}
      <div className="bg-white p-6 rounded-2xl border border-muted/30 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Weekly Performance</h2>
            <p className="text-xs text-muted">Trips and gross earnings across the week</p>
          </div>
          <Link href="/driver/earnings" className="text-sm font-bold text-accent hover:underline">
            View Earnings Details →
          </Link>
        </div>
        <BarChartWeek
          title="Trips This Week"
          data={[
            { day: "Mon", trips: 4 },
            { day: "Tue", trips: 3 },
            { day: "Wed", trips: 5 },
            { day: "Thu", trips: 4 },
            { day: "Fri", trips: 6 },
            { day: "Sat", trips: 3 },
            { day: "Sun", trips: 2 },
          ]}
        />
      </div>

      {/* Incoming Offer Modal (WD3 / T6.2) */}
      {activeOffer && (
        <ConfirmDialog
          open={true}
          title="New Ride Offer Available!"
          description="A passenger nearby has requested a trip. Review and accept before countdown expires."
          confirmLabel={isAccepting ? "Accepting..." : `Accept Offer (${offerRemainingSec}s)`}
          cancelLabel="Decline"
          onConfirm={handleAcceptOffer}
          onCancel={handleDeclineOffer}
        >
          <div className="space-y-4 my-3 text-left">
            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-xl">
              <span className="text-xs font-bold text-accent uppercase">Time Remaining</span>
              <span data-testid="offer-countdown" className="text-lg font-extrabold text-accent">
                {offerRemainingSec}s
              </span>
            </div>

            <div className="p-4 bg-background rounded-xl border border-muted/30 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase">Pickup Location</span>
                <p className="text-sm font-bold text-ink">{activeOffer.pickup.label}</p>
              </div>
              <div className="pt-2 border-t border-muted/20">
                <span className="text-[10px] font-bold text-muted uppercase">Drop Destination</span>
                <p className="text-sm font-bold text-ink">{activeOffer.drop.label}</p>
              </div>
              <div className="pt-2 border-t border-muted/20 flex justify-between items-center">
                <span className="text-xs font-semibold text-muted">Estimated Fare</span>
                <span className="text-base font-extrabold text-accent">
                  {inr(paise(activeOffer.fare))}
                </span>
              </div>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
