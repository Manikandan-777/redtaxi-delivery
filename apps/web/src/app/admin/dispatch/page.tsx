"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { INITIAL_ADMIN_DRIVERS, type AdminDriverRecord } from "@/lib/adminData";

export default function AdminDispatchPage() {
  const [vehicleClassFilter, setVehicleClassFilter] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<AdminDriverRecord | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignedNotice, setAssignedNotice] = useState<string | null>(null);

  // T7.6: Nearby drivers sorted ascending by distance; offline drivers disabled
  const nearbyDrivers = INITIAL_ADMIN_DRIVERS.slice()
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .filter((d) => (vehicleClassFilter === "all" ? true : d.vehicleClass === vehicleClassFilter));

  const handleConfirmAssign = () => {
    if (!selectedDriver) return;
    setAssignedNotice(
      `Trip #BK10234 successfully assigned to ${selectedDriver.name} (${selectedDriver.vehicleNo}) via dispatch.update (audited).`
    );
    setIsAssignOpen(false);
    setSelectedDriver(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted/20">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Live Dispatch & Driver Radar
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time fleet locator, distance-sorted driver assignment, and vehicle updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="vehicle-filter" className="text-xs font-semibold text-ink">
            Filter Class:
          </label>
          <select
            id="vehicle-filter"
            value={vehicleClassFilter}
            onChange={(e) => setVehicleClassFilter(e.target.value)}
            className="p-2 border border-muted/30 rounded-lg text-sm bg-white font-medium"
            aria-label="Filter Vehicle Class"
          >
            <option value="all">All Vehicles</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="innova">Innova</option>
            <option value="hatchback">Hatchback</option>
          </select>
        </div>
      </div>

      {assignedNotice && (
        <div
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex justify-between items-center"
          role="status"
        >
          <span>{assignedNotice}</span>
          <button
            type="button"
            onClick={() => setAssignedNotice(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Map left, distance-sorted drivers right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview */}
        <Card
          className="lg:col-span-2 p-5 flex flex-col justify-between"
          data-testid="dispatch-map-view"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-ink">Unassigned Trip: #BK10234</h2>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                Searching Driver
              </span>
            </div>
            <p className="text-xs text-muted mb-4">
              Pickup: <span className="font-semibold text-ink">Pollachi Bus Stand</span> • Drop:{" "}
              <span className="font-semibold text-ink">Palani Temple</span>
            </p>
          </div>

          <div className="relative w-full h-96 rounded-xl bg-slate-900 border border-muted/30 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="text-center p-4">
              <span className="text-5xl">📍</span>
              <p className="text-white font-bold mt-2">Pickup: Pollachi Bus Stand</p>
              <p className="text-xs text-slate-300">Matching with nearest online drivers</p>
            </div>
            {/* Markers */}
            <div className="absolute top-1/3 left-1/4 bg-success text-white text-xs px-2 py-0.5 rounded shadow">
              🟢 Selvam (1.2 km)
            </div>
            <div className="absolute top-1/2 right-1/3 bg-success text-white text-xs px-2 py-0.5 rounded shadow">
              🟢 Arun (3.5 km)
            </div>
            <div className="absolute bottom-1/4 left-1/2 bg-slate-600 text-slate-200 text-xs px-2 py-0.5 rounded shadow">
              ⚪ Dinesh (Offline)
            </div>
          </div>
        </Card>

        {/* Nearby Drivers sorted ascending by distance (WA6 / T7.6) */}
        <Card className="p-5 flex flex-col" data-testid="nearby-drivers-panel">
          <div className="border-b border-muted/20 pb-3 mb-3">
            <h2 className="text-lg font-bold text-ink">Nearby Drivers</h2>
            <p className="text-xs text-muted">Sorted ascending by distance to pickup</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {nearbyDrivers.map((driver) => {
              const isOffline = !driver.online;
              return (
                <div
                  key={driver.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOffline
                      ? "bg-surface/30 border-muted/30 opacity-60"
                      : "bg-white border-muted/40 shadow-sm hover:border-accent"
                  }`}
                  data-testid={`driver-card-${driver.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink text-sm">{driver.name}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${isOffline ? "bg-muted/30 text-muted" : "bg-emerald-100 text-emerald-800"}`}
                    >
                      {driver.distanceKm?.toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted mb-3">
                    <span className="font-mono">
                      {driver.vehicleNo} • {driver.vehicleClass}
                    </span>
                    <span>★ {driver.rating}</span>
                  </div>

                  <Button
                    size="sm"
                    variant={isOffline ? "outline" : "primary"}
                    className="w-full"
                    disabled={isOffline}
                    onClick={() => {
                      setSelectedDriver(driver);
                      setIsAssignOpen(true);
                    }}
                    data-testid={`assign-btn-${driver.id}`}
                  >
                    {isOffline ? "Unavailable (Offline)" : "Assign to Trip"}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog on Assign (T7.6) */}
      <ConfirmDialog
        isOpen={isAssignOpen}
        title={`Assign trip to ${selectedDriver?.name}?`}
        description={`This will dispatch trip #BK10234 to driver ${selectedDriver?.name} (${selectedDriver?.vehicleNo}, ${selectedDriver?.distanceKm} km away) and broadcast dispatch.update.`}
        confirmLabel="Confirm Assignment"
        cancelLabel="Cancel"
        onConfirm={handleConfirmAssign}
        onCancel={() => {
          setIsAssignOpen(false);
          setSelectedDriver(null);
        }}
      />
    </div>
  );
}
