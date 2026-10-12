"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { inr, paise, type FareQuote } from "@redtaxi/shared";
import { TopNav } from "@/components/layout/TopNav";
import { FareBreakdown } from "@/components/ui/FareBreakdown";
import { PaymentOptions } from "@/components/ui/PaymentOptions";
import { bookingDraftStore } from "@/lib/bookingDraft";

const SAMPLE_QUOTE: FareQuote = {
  id: "qt_pollachi_coimbatore_1",
  vehicleId: "veh_sedan_1",
  mode: "one_way",
  distanceKm: 65.2,
  durationMin: 85,
  lines: [
    { key: "distance", label: "Base Fare (65.2 km)", amount: paise(104320) },
    { key: "batta", label: "Driver Batta", amount: paise(30000) },
    { key: "toll", label: "Toll & Parking Estimate", amount: paise(8000) },
    { key: "gst", label: "GST (5%)", amount: paise(7116) },
  ],
  total: paise(149436), // Exact integer paise ₹1,494.36
  depositOptions: [
    { type: "deposit", payNow: paise(50000), payAtDrop: paise(99436), recommended: true },
    { type: "full", payNow: paise(149436), payAtDrop: paise(0), recommended: false },
  ],
  validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
};

export default function BookFarePage() {
  const [quote, setQuote] = useState<FareQuote>(SAMPLE_QUOTE);
  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("deposit");
  const [timeLeftSec, setTimeLeftSec] = useState(900); // 15 minutes countdown (T4.8)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setTimeLeftSec(900);
    setQuote({
      ...SAMPLE_QUOTE,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  };

  const handlePaymentOptionChange = (opt: "deposit" | "full") => {
    setPaymentOption(opt);
    bookingDraftStore.setState({ paymentOption: opt });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isExpired = timeLeftSec === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted mb-2">
            <span>1. Select Vehicle</span>
            <span>→</span>
            <span>2. Route Details</span>
            <span>→</span>
            <span className="text-accent font-bold">3. Review Fare</span>
            <span>→</span>
            <span>4. Pay</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink">Fare Breakdown</h1>
          <p className="text-sm text-body mt-1">
            Standard honest fare based on Tamil Nadu state transport rules.
          </p>
        </div>

        {/* Validity countdown banner (T4.8) */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between mb-6 ${
            isExpired
              ? "bg-danger/10 border-danger/30 text-danger"
              : "bg-surface/30 border-muted/30 text-ink"
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              {isExpired ? "Quote Expired" : "Quote Guaranteed For"}
            </span>
            <span className="text-base font-extrabold">
              {isExpired ? "Prices may have changed" : formatTimer(timeLeftSec)}
            </span>
          </div>

          {isExpired && (
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-accent text-white font-bold rounded-lg text-xs shadow-sm"
            >
              Refresh Quote
            </button>
          )}
        </div>

        {/* Fare Breakdown Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FareBreakdown quote={quote} />

          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-ink">Select Payment Option</h3>
            <PaymentOptions
              options={quote.depositOptions}
              selectedType={paymentOption}
              onChange={handlePaymentOptionChange}
              disabled={isExpired}
            />
          </div>
        </div>

        {/* Navigation Action */}
        <div className="mt-8 flex justify-between items-center bg-white p-5 rounded-2xl border border-muted/20">
          <div>
            <span className="text-xs text-muted block">Amount Due Now</span>
            <span className="text-xl font-extrabold text-accent">
              {inr(paymentOption === "deposit" ? paise(50000) : quote.total)}
            </span>
          </div>

          <Link
            href="/book/payment"
            className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow transition-colors ${
              isExpired
                ? "bg-muted text-body cursor-not-allowed pointer-events-none"
                : "bg-accent hover:bg-accentLight text-white"
            }`}
          >
            Proceed to Payment →
          </Link>
        </div>
      </main>
    </div>
  );
}
