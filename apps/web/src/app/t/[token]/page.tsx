"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface PublicTrackingData {
  status: string;
  pickup: { label: string };
  drop: { label: string };
  driver: {
    name: string;
    vehicleNo: string;
    vehicleClass: string;
    rating: number;
  } | null;
  etaMinutes: number;
}

interface PublicTrackingProps {
  params: Promise<{ token: string }>;
}

export default function PublicTrackingPage({ params }: PublicTrackingProps) {
  const [tokenStr, setTokenStr] = useState<string>("");

  const [data, setData] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      if (p?.token) setTokenStr(p.token);
    });
  }, [params]);

  useEffect(() => {
    if (!tokenStr) return;

    async function loadPublicTracking() {
      try {
        const res = await fetch(`http://localhost:4000/public/tracking/${tokenStr}`);
        if (!res.ok) {
          if (res.status === 410) {
            throw new Error("This tracking link has expired.");
          }
          throw new Error("Unable to locate live tracking session.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load public tracking data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadPublicTracking();
  }, [tokenStr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow text-center border border-muted/20">
          <span className="text-3xl block mb-2">🔒</span>
          <h2 className="text-lg font-bold text-ink mb-1">Tracking Unavailable</h2>
          <p className="text-xs text-muted mb-4">{error || "Link invalid or expired"}</p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* Privacy notice banner (VR-6) */}
        <div className="bg-white rounded-2xl p-4 border border-muted/20 shadow-sm flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="text-xs font-bold text-ink">RedTaxi Live Ride Share</h3>
            <p className="text-[11px] text-muted">
              Privacy-protected view. Personal contact and payment details are hidden.
            </p>
          </div>
        </div>

        {/* Live Status and ETA */}
        <div className="bg-white rounded-2xl p-6 border border-muted/20 shadow-sm text-center">
          <span className="inline-block px-3 py-1 bg-accent/10 text-accent font-bold text-xs uppercase tracking-wider rounded-full mb-3">
            {data.status ? data.status.replace("_", " ") : "TRACKING"}
          </span>
          <div className="text-3xl font-extrabold text-ink mb-1">~{data.etaMinutes} mins</div>
          <p className="text-xs text-muted">Estimated arrival time</p>
        </div>

        {/* Driver & Vehicle Details (No passenger details) */}
        {data.driver && (
          <div className="bg-white rounded-2xl p-5 border border-muted/20 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-lg">
              {data.driver.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-ink text-sm">{data.driver.name}</h3>
              <p className="text-xs font-mono font-semibold text-muted uppercase">
                {data.driver.vehicleNo} • {data.driver.vehicleClass}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-star">★ {data.driver.rating.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Route info */}
        <div className="bg-white rounded-2xl p-5 border border-muted/20 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Trip Route</h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-semibold text-muted block">Pickup</span>
              <span className="text-ink font-medium">{data.pickup.label}</span>
            </div>
            <div>
              <span className="font-semibold text-muted block">Drop</span>
              <span className="text-ink font-medium">{data.drop.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
