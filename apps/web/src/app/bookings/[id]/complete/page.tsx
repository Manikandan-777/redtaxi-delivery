"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inr, type Booking } from "@redtaxi/shared";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";

interface CompletePageProps {
  params: Promise<{ id: string }>;
}

export default function BookingCompletePage({ params }: CompletePageProps) {
  const router = useRouter();

  const [bookingId, setBookingId] = useState<string>("");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating form state (T5.10 & DEC-10)
  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      if (p?.id) setBookingId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;

    async function loadBooking() {
      try {
        const res = await fetch(`http://localhost:4000/bookings/${bookingId}`);
        if (!res.ok) {
          throw new Error("Unable to fetch booking details");
        }
        const data = await res.json();
        setBooking(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load booking details";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1 || stars > 5) {
      setFormError("Please select a star rating from 1 to 5");
      return;
    }
    if (comment.length > 500) {
      setFormError("Comment cannot exceed 500 characters");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/bookings/${bookingId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setRatingSubmitted(true);
      } else {
        setFormError(data.message || "Failed to submit rating");
      }
    } catch {
      setFormError("Network error while submitting rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow text-center">
          <p className="text-danger font-semibold mb-3">{error || "Trip not found"}</p>
          <Button onClick={() => router.push("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* DEC-10: Header copy reads "completed" explicitly */}
        <div className="bg-white rounded-2xl p-6 border border-muted/20 shadow-sm text-center">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            ✓
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-muted">
            Trip Summary
          </span>
          <h1 className="text-2xl font-bold text-ink mt-1">Trip Completed</h1>
          <p className="text-xs text-muted mt-1">
            Reference code: <span className="font-mono font-bold text-ink">{booking.code}</span>
          </p>
        </div>

        {/* Fare & Balance Due Receipt */}
        <div className="bg-white rounded-2xl p-6 border border-muted/20 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Fare Receipt</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>Total Trip Fare</span>
              <span className="font-semibold text-ink">
                {booking.quote?.total != null ? inr(booking.quote.total) : "₹0"}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Amount Paid Online</span>
              <span className="font-semibold text-success">{inr(booking.paid ?? 0)}</span>
            </div>

            {/* DEC-10: Balance due shown clearly when due > 0 */}
            {(booking.due ?? 0) > 0 ? (
              <div
                data-testid="balance-due-row"
                className="pt-3 border-t border-muted/20 flex justify-between items-center text-base font-bold text-warning"
              >
                <span>Balance Due at Drop</span>
                <span>{inr(booking.due)}</span>
              </div>
            ) : (
              <div className="pt-3 border-t border-muted/20 flex justify-between items-center text-sm font-bold text-success">
                <span>Payment Status</span>
                <span>Fully Paid Online</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating and Feedback Form (T5.10 & DEC-10) */}
        <div className="bg-white rounded-2xl p-6 border border-muted/20 shadow-sm">
          {ratingSubmitted ? (
            <div className="text-center py-4 space-y-3">
              <span className="text-3xl">🌟</span>
              <h3 className="text-lg font-bold text-ink">Thank you for your rating!</h3>
              <p className="text-xs text-muted">
                Your feedback helps us maintain the highest safety and service standards.
              </p>
              <Button onClick={() => router.push("/")} variant="primary" className="mt-4">
                Back to Home
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRating} className="space-y-5">
              <div className="text-center">
                <h2 className="text-base font-bold text-ink">Rate your ride experience</h2>
                <p className="text-xs text-muted mt-1">
                  How was your journey with {booking.driver?.name || "your driver"}?
                </p>
                <div className="mt-4 flex justify-center">
                  <RatingStars value={stars} onChange={setStars} size="lg" />
                </div>
                {stars > 0 && (
                  <p className="text-xs font-semibold text-accent mt-2">
                    {stars === 5
                      ? "Excellent!"
                      : stars === 4
                        ? "Good"
                        : stars === 3
                          ? "Average"
                          : stars === 2
                            ? "Poor"
                            : "Terrible"}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="comment" className="block text-xs font-semibold text-ink mb-1.5">
                  Comments & Feedback (Optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Share details about driver punctuality, vehicle cleanliness, driving..."
                  rows={3}
                  maxLength={500}
                  className="w-full text-sm rounded-xl border border-muted/30 p-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
                <div className="text-right text-[11px] text-muted mt-1">
                  {comment.length} / 500 characters
                </div>
              </div>

              {formError && <p className="text-xs font-semibold text-danger">{formError}</p>}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={submitting || stars === 0}
              >
                {submitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
