"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatIST } from "@redtaxi/shared";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { INITIAL_ADMIN_STATS, type AdminStats } from "@/lib/adminData";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);
  const [todayDateStr, setTodayDateStr] = useState<string>("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set real today date in IST (DEC-6 & T7.2: Real current date, never static)
  useEffect(() => {
    const now = new Date();
    setTodayDateStr(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    );
    setLastRefreshedAt(formatIST(now));
  }, []);

  // 30 s auto-refresh (T7.2)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/proxy/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({
          ...prev,
          totalBookingsToday: data.totalBookingsToday ?? prev.totalBookingsToday,
          activeRides: data.activeRides ?? prev.activeRides,
          driversOnline: data.driversOnline ?? prev.driversOnline,
          pendingDrivers: data.pendingDrivers ?? prev.pendingDrivers,
          completedToday: data.completedToday ?? prev.completedToday,
        }));
      }
    } catch {
      // Keep state on proxy fetch error
    } finally {
      setIsRefreshing(false);
      setLastRefreshedAt(formatIST(new Date()));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted/20">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-muted mt-1" data-testid="admin-current-date">
            Today: <span className="font-semibold text-ink">{todayDateStr}</span> (IST) • 30s live
            refresh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            Last updated: <span className="font-mono text-ink">{lastRefreshedAt}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            loading={isRefreshing}
            aria-label="Refresh Dashboard Metrics"
          >
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* DEC-6 & T7.2: Stat Tiles linked to filtered lists */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        data-testid="dashboard-stat-tiles"
      >
        {/* 1. Total Bookings Today (342) */}
        <Link
          href="/admin/bookings?status=all"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <StatTile
            label="Total Bookings Today"
            value={stats.totalBookingsToday}
            subtext="+12% vs yesterday"
            data-testid="tile-total-bookings"
          />
        </Link>

        {/* 2. Active Rides (14) */}
        <Link
          href="/admin/bookings?status=in_progress"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <StatTile
            label="Active Rides"
            value={stats.activeRides}
            subtext="Live on road"
            data-testid="tile-active-rides"
          />
        </Link>

        {/* 3. Drivers Online (58) */}
        <Link
          href="/admin/dispatch"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <StatTile
            label="Drivers Online"
            value={stats.driversOnline}
            subtext="Available for dispatch"
            data-testid="tile-drivers-online"
          />
        </Link>

        {/* 4. Pending Drivers (3) */}
        <Link
          href="/admin/drivers?status=pending"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <StatTile
            label="Pending Drivers"
            value={stats.pendingDrivers}
            subtext="Awaiting doc verification"
            data-testid="tile-pending-drivers"
          />
        </Link>

        {/* 5. Completed Today (310) */}
        <Link
          href="/admin/bookings?status=completed"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <StatTile
            label="Completed Today"
            value={stats.completedToday}
            subtext="90.6% completion rate"
            data-testid="tile-completed-today"
          />
        </Link>
      </div>

      {/* Live Active Rides Section & Live Map Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5" data-testid="live-map-section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Live Map - Active Rides & Fleet</h2>
              <p className="text-xs text-muted">
                Real-time driver positions across Pollachi & Coimbatore Region
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span> Online Driver
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent"></span> Active Ride
              </span>
            </div>
          </div>
          <div className="relative w-full h-80 rounded-xl bg-slate-900 border border-muted/30 overflow-hidden flex items-center justify-center">
            {/* Map Background representation */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative text-center p-4">
              <span className="text-4xl">🗺️</span>
              <p className="text-white font-semibold mt-2">Pollachi Live Dispatch Zone</p>
              <p className="text-xs text-slate-400 mt-1">14 active trips • 58 drivers online</p>
            </div>

            {/* Active markers overlay */}
            <div className="absolute top-1/4 left-1/3 bg-accent text-white text-xs px-2 py-0.5 rounded shadow">
              🚖 BK10234 (Selvam)
            </div>
            <div className="absolute bottom-1/3 right-1/4 bg-success text-white text-xs px-2 py-0.5 rounded shadow">
              🟢 Arun (SUV)
            </div>
          </div>
        </Card>

        {/* Quick Operations & Urgent Items */}
        <Card className="p-5 flex flex-col justify-between" data-testid="quick-actions-panel">
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Attention Required</h2>
            <p className="text-xs text-muted mb-4">
              Pending actions requiring operations intervention
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-900">3 Driver Verification Requests</p>
                  <p className="text-xs text-amber-700">Commercial License & RC pending</p>
                </div>
                <Link href="/admin/drivers?status=pending">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-red-900">1 Urgent Support Ticket</p>
                  <p className="text-xs text-red-700">#STK1001: Fare dispute</p>
                </div>
                <Link href="/admin/tickets">
                  <Button size="sm" variant="outline">
                    Resolve
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-900">Live Dispatch</p>
                  <p className="text-xs text-blue-700">5 Nearby drivers ready</p>
                </div>
                <Link href="/admin/dispatch">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-muted/20 mt-4">
            <Link href="/admin/analytics">
              <Button variant="primary" className="w-full">
                View Weekly Analytics (90.6%) →
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
