"use client";

import React, { useState } from "react";
import Link from "next/link";
import { inr, paise, type Booking } from "@redtaxi/shared";
import { TopNav } from "@/components/layout/TopNav";
import { bookingDraftStore } from "@/lib/bookingDraft";

type PaymentMethod = "upi" | "card" | "netbanking" | "pickup";

export default function BookPaymentPage() {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const draft = bookingDraftStore.getState();
  const payNowPaise = draft.paymentOption === "deposit" ? paise(50000) : paise(149436);

  const handlePay = async () => {
    if (!agreedTerms || isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Step 1: Create payment order with idempotency key (T4.11, T4.13)
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const resOrder = await fetch("http://localhost:4000/payments/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: "qt_pollachi_coimbatore_1",
          paymentOption: draft.paymentOption,
          idempotencyKey,
        }),
      });

      if (!resOrder.ok) {
        throw new Error("Unable to create payment order. Please retry.");
      }

      const orderData = await resOrder.json();

      // Step 2: Simulate Razorpay checkout verification (T4.11, DEC-10)
      const resVerify = await fetch("http://localhost:4000/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: `pay_${Date.now()}`,
          signature: "sig_razorpay_valid_checksum",
          quoteId: "qt_pollachi_coimbatore_1",
        }),
      });

      if (!resVerify.ok) {
        throw new Error("Payment signature verification failed. Please try again.");
      }

      const verifyData = await resVerify.json();
      // DEC-10 & T4.12: Booking Confirmed state is NEVER visible before verification completes
      setConfirmedBooking(verifyData.booking);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Payment failed. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmed Screen View (WP5 Confirmed)
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNav />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 w-full text-center">
          <div className="bg-white rounded-3xl border border-muted/20 p-8 shadow-md">
            <div className="w-16 h-16 bg-success/20 text-success text-3xl rounded-full flex items-center justify-center mx-auto mb-4">
              ✔
            </div>
            <h1 className="text-3xl font-extrabold text-ink">Booking Confirmed!</h1>
            <p className="text-sm text-body mt-2">
              Your ride has been scheduled. A driver will be assigned shortly.
            </p>

            <div className="bg-surface/20 rounded-2xl p-5 my-6 text-left border border-muted/20">
              <div className="flex justify-between items-center pb-3 border-b border-muted/20">
                <span className="text-xs font-bold text-muted uppercase">Booking Code</span>
                <span className="text-lg font-extrabold text-accent">{confirmedBooking.code}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm text-body">
                <span>Start Ride OTP</span>
                <span className="font-bold text-ink">{confirmedBooking.startOtp}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm text-body">
                <span>Amount Paid</span>
                <span className="font-bold text-ink">{inr(confirmedBooking.paid)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm text-body">
                <span>Balance Due at Drop</span>
                <span className="font-bold text-ink">{inr(confirmedBooking.due)}</span>
              </div>
            </div>

            <Link
              href="/bookings"
              className="w-full py-4 bg-accent hover:bg-accentLight text-white font-bold rounded-xl text-base shadow block transition-colors"
            >
              Track Ride in My Bookings →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted mb-2">
            <span>1. Select Vehicle</span>
            <span>→</span>
            <span>2. Route Details</span>
            <span>→</span>
            <span>3. Review Fare</span>
            <span>→</span>
            <span className="text-accent font-bold">4. Pay</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink">Payment</h1>
          <p className="text-sm text-body mt-1">Complete your booking securely via Razorpay.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={handlePay} className="underline text-xs ml-4">
              Retry
            </button>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-muted/20 p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-ink">Select Payment Method</h3>

          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment Method">
            {[
              { id: "upi", label: "UPI (Google Pay, PhonePe, Paytm)", icon: "📱" },
              { id: "card", label: "Credit / Debit Cards (Visa, MasterCard, RuPay)", icon: "💳" },
              { id: "netbanking", label: "Net Banking (All Major Indian Banks)", icon: "🏦" },
              { id: "pickup", label: "Pay at Pickup (Cash / UPI to Driver)", icon: "💵" },
            ].map((m) => (
              <label
                key={m.id}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                  method === m.id
                    ? "border-accent ring-2 ring-accent/30 bg-surface/10"
                    : "border-muted/30 hover:border-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm font-semibold text-ink">{m.label}</span>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id as PaymentMethod)}
                  className="accent-accent"
                />
              </label>
            ))}
          </div>

          {/* Terms & Conditions (T4.10) */}
          <div className="border-t border-muted/20 pt-4 mt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="agree-terms"
                type="checkbox"
                aria-label="Terms and Conditions"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-1 accent-accent"
              />
              <span className="text-xs text-body leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-accent underline font-semibold">
                  Terms and Conditions
                </Link>
                , standard toll and night charges, and fare calculation policies.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Payment Action */}
        <div className="mt-8">
          <button
            onClick={handlePay}
            disabled={!agreedTerms || isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-base shadow transition-all ${
              agreedTerms && !isProcessing
                ? "bg-accent hover:bg-accentLight text-white cursor-pointer"
                : "bg-muted/60 text-white cursor-not-allowed opacity-60"
            }`}
          >
            {isProcessing
              ? "Processing Secure Payment..."
              : `Pay ${inr(payNowPaise)} & Confirm Booking`}
          </button>
          <p className="text-center text-xs text-muted mt-3">
            🔒 256-Bit SSL Encrypted • Powered by Razorpay
          </p>
        </div>
      </main>
    </div>
  );
}
