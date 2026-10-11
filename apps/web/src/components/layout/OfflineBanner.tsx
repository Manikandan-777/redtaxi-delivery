"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const OfflineBanner: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "w-full bg-warning/20 border-b border-warning/40 text-ink px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 text-center",
        className
      )}
    >
      <span>⚠️</span>
      <span>
        You are currently offline. Live ride tracking and bookings will resume automatically when
        reconnected.
      </span>
    </div>
  );
};
