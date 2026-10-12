"use client";

import React, { useState } from "react";
import Link from "next/link";
import { inr, paise } from "@redtaxi/shared";
import { BarChartWeek } from "@/components/ui/BarChartWeek";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Select } from "@/components/ui/Select";

export default function DriverEarningsPage() {
  const [range, setRange] = useState<"today" | "week" | "month">("week");

  // Sample data mapped to selection (T6.10)
  const earningsData = {
    today: {
      total: paise(245000),
      trips: 4,
      hours: "6.5h",
      chart: [{ day: "Today", trips: 4 }],
      history: [
        { id: "e1", code: "BK10234", time: "10:30 AM", type: "Outstation", fare: paise(149400) },
        { id: "e2", code: "BK10230", time: "08:15 AM", type: "Local Transfer", fare: paise(95600) },
      ],
    },
    week: {
      total: paise(1245000),
      trips: 22,
      hours: "34.5h",
      chart: [
        { day: "Mon", trips: 4 },
        { day: "Tue", trips: 3 },
        { day: "Wed", trips: 5 },
        { day: "Thu", trips: 4 },
        { day: "Fri", trips: 6 },
        { day: "Sat", trips: 3 },
        { day: "Sun", trips: 2 },
      ],
      history: [
        {
          id: "e1",
          code: "BK10234",
          time: "Friday, 10:30 AM",
          type: "Outstation",
          fare: paise(149400),
        },
        {
          id: "e2",
          code: "BK10228",
          time: "Friday, 02:15 PM",
          type: "Outstation",
          fare: paise(165000),
        },
        {
          id: "e3",
          code: "BK10211",
          time: "Thursday, 06:40 PM",
          type: "Round Trip",
          fare: paise(240000),
        },
        {
          id: "e4",
          code: "BK10190",
          time: "Wednesday, 11:20 AM",
          type: "Local Transfer",
          fare: paise(85000),
        },
      ],
    },
    month: {
      total: paise(4850000),
      trips: 92,
      hours: "148h",
      chart: [
        { day: "W1", trips: 20 },
        { day: "W2", trips: 24 },
        { day: "W3", trips: 26 },
        { day: "W4", trips: 22 },
      ],
      history: [
        {
          id: "m1",
          code: "Week 4 Summary",
          time: "22 Trips",
          type: "Monthly aggregate",
          fare: paise(1200000),
        },
        {
          id: "m2",
          code: "Week 3 Summary",
          time: "26 Trips",
          type: "Monthly aggregate",
          fare: paise(1350000),
        },
        {
          id: "m3",
          code: "Week 2 Summary",
          time: "24 Trips",
          type: "Monthly aggregate",
          fare: paise(1150000),
        },
        {
          id: "m4",
          code: "Week 1 Summary",
          time: "20 Trips",
          type: "Monthly aggregate",
          fare: paise(1150000),
        },
      ],
    },
  };

  const current = earningsData[range];

  return (
    <div className="space-y-6">
      {/* Header & Range Selector (WD8 / T6.10) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-muted/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/driver" className="text-xs font-bold text-accent hover:underline">
              ← Driver Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-ink mt-1">Driver Earnings</h1>
          <p className="text-xs text-muted">Track your payout amounts and daily driving activity</p>
        </div>

        <div className="w-48">
          <label htmlFor="range-select" className="sr-only">
            Select Earnings Period
          </label>
          <Select
            id="range-select"
            value={range}
            onChange={(e) => setRange(e.target.value as "today" | "week" | "month")}
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ]}
            data-testid="earnings-range-select"
          />
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatTile
          label="Total Earnings"
          value={inr(current.total)}
          trend="Net driver payout"
          data-testid="earnings-total"
        />
        <StatTile
          label="Trips Completed"
          value={String(current.trips)}
          trend="Finished rides"
          data-testid="earnings-trips"
        />
        <StatTile
          label="Hours Online"
          value={current.hours}
          trend="Logged in time"
          data-testid="earnings-hours"
        />
      </div>

      {/* Chart with Accessible Table Fallback (WD8 / T6.10) */}
      <Card className="p-6 bg-white space-y-4">
        <h2 className="text-base font-bold text-ink">Trips Activity Chart</h2>
        {current.chart.length > 0 ? (
          <BarChartWeek
            title={`Completed Trips (${range})`}
            data={current.chart}
            data-testid="earnings-barchart"
          />
        ) : (
          <div className="p-8 text-center text-muted" data-testid="earnings-empty-state">
            No trips this week
          </div>
        )}
      </Card>

      {/* History Breakdown Table */}
      <Card className="p-6 bg-white space-y-4">
        <h2 className="text-base font-bold text-ink">Earnings Activity Log</h2>
        <div className="divide-y divide-muted/20">
          {current.history.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-center text-sm">
              <div>
                <span className="font-bold text-ink">{item.code}</span>
                <span className="text-xs text-muted ml-2">{item.time}</span>
                <p className="text-xs text-body">{item.type}</p>
              </div>
              <span className="font-extrabold text-accent">{inr(item.fare)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
