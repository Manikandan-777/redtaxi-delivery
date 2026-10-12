"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { bookingDraftStore } from "@/lib/bookingDraft";
import type { TripMode } from "@redtaxi/shared";

export default function BookRoutePage() {
  const [mode, setMode] = useState<TripMode>("one_way");
  const [pickup, setPickup] = useState("Pollachi Bus Stand");
  const [drop, setDrop] = useState("Coimbatore Airport");
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    return tomorrow.toISOString().split("T")[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const afterTomorrow = new Date(Date.now() + 48 * 3600 * 1000);
    return afterTomorrow.toISOString().split("T")[0];
  });
  const [isPastDateError, setIsPastDateError] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0] || "";

  const handleDateChange = (val: string) => {
    if (val < todayStr) {
      setIsPastDateError(true);
      return;
    }
    setIsPastDateError(false);
    setPickupDate(val);
  };

  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  const handleModeChange = (newMode: TripMode) => {
    setMode(newMode);
    bookingDraftStore.setState({ mode: newMode });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted mb-2">
            <span>1. Select Vehicle</span>
            <span>→</span>
            <span className="text-accent font-bold">2. Route Details</span>
            <span>→</span>
            <span>3. Review Fare</span>
            <span>→</span>
            <span>4. Pay</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink">Trip Details</h1>
          <p className="text-sm text-body mt-1">
            Specify your route, trip mode, and travel schedule.
          </p>
        </div>

        {/* Mode Selector */}
        <div
          className="flex gap-2 p-1.5 bg-white rounded-xl border border-muted/20 mb-6"
          role="radiogroup"
          aria-label="Trip Mode"
        >
          {(["one_way", "round_trip", "local"] as TripMode[]).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                mode === m ? "bg-accent text-white shadow-sm" : "text-body hover:bg-surface/30"
              }`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Route Form */}
        <div className="bg-white rounded-2xl border border-muted/20 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-muted uppercase block mb-1">
                Pickup Location
              </label>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-muted/30 text-ink focus:border-accent outline-none font-medium text-sm"
                placeholder="Enter pickup address in India"
              />
            </div>

            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap pickup and drop"
              className="p-2.5 rounded-full border border-muted/30 hover:border-accent hover:bg-surface/20 transition-colors mt-4 sm:mt-5"
            >
              🔄
            </button>

            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-muted uppercase block mb-1">
                Drop Location
              </label>
              <input
                type="text"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-muted/30 text-ink focus:border-accent outline-none font-medium text-sm"
                placeholder="Enter destination in India"
              />
            </div>
          </div>

          {/* Schedule Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-muted/20 pt-4">
            <div>
              <label
                htmlFor="pickup-date"
                className="text-xs font-bold text-muted uppercase block mb-1"
              >
                Pickup Date
              </label>
              <input
                id="pickup-date"
                type="date"
                min={todayStr}
                value={pickupDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-muted/30 text-ink focus:border-accent outline-none font-medium text-sm"
              />
              {isPastDateError && (
                <span className="text-xs text-danger font-semibold mt-1 block">
                  Past date blocked. Please select today or a future date.
                </span>
              )}
            </div>

            {mode === "round_trip" && (
              <div>
                <label className="text-xs font-bold text-muted uppercase block mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  min={pickupDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-muted/30 text-ink focus:border-accent outline-none font-medium text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Map / Route Summary Preview */}
        <div className="mt-6 p-5 bg-white rounded-2xl border border-muted/20 shadow-sm">
          <div className="flex justify-between items-center text-sm font-bold text-ink">
            <span>Estimated Distance: 65.2 km</span>
            <span className="text-muted">Estimated Duration: 1 hr 25 min</span>
          </div>
          <div className="h-40 bg-surface/20 rounded-xl my-4 flex items-center justify-center text-muted font-medium text-sm border border-dashed border-muted/40">
            Interactive Route Map (Pollachi → Coimbatore Airport)
          </div>
        </div>

        {/* Navigation Action */}
        <div className="mt-8 flex justify-end">
          <Link
            href="/book/fare"
            className="px-6 py-3 bg-accent hover:bg-accentLight text-white font-bold rounded-xl text-sm shadow transition-colors"
          >
            Review Fare Quote →
          </Link>
        </div>
      </main>
    </div>
  );
}
