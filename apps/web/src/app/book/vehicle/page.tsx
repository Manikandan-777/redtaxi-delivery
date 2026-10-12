"use client";

import React, { useState } from "react";
import Link from "next/link";
import { paise, type Vehicle, type VehicleClass } from "@redtaxi/shared";
import { TopNav } from "@/components/layout/TopNav";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { bookingDraftStore } from "@/lib/bookingDraft";

const FLEET_CANDIDATES: Vehicle[] = [
  {
    id: "veh_hatch_1",
    displayName: "Tata Tiago / WagonR",
    class: "hatchback",
    passengers: 4,
    bags: 2,
    ratePerKm: paise(1400),
    minKm: 100,
    imageUrl: "",
    popular: false,
    available: true,
  },
  {
    id: "veh_sedan_1",
    displayName: "Swift Dzire / Etios",
    class: "sedan",
    passengers: 4,
    bags: 3,
    ratePerKm: paise(1600),
    minKm: 130,
    imageUrl: "",
    popular: true,
    available: true,
  },
  {
    id: "veh_suv_1",
    displayName: "Maruti Ertiga",
    class: "suv",
    passengers: 6,
    bags: 4,
    ratePerKm: paise(2000),
    minKm: 150,
    imageUrl: "",
    popular: false,
    available: true,
  },
  {
    id: "veh_innova_1",
    displayName: "Toyota Innova Crysta",
    class: "innova",
    passengers: 7,
    bags: 5,
    ratePerKm: paise(2400),
    minKm: 150,
    imageUrl: "",
    popular: false,
    available: true,
  },
  {
    id: "veh_innova_unavail",
    displayName: "Toyota Hycross",
    class: "innova",
    passengers: 7,
    bags: 5,
    ratePerKm: paise(2800),
    minKm: 150,
    imageUrl: "",
    popular: false,
    available: false, // T4.4: Unavailable vehicle test
  },
];

const FILTER_CHIPS = [
  { id: "all", label: "All Vehicles" },
  { id: "hatchback", label: "Hatchback" },
  { id: "sedan", label: "Sedan" },
  { id: "suv", label: "SUV" },
  { id: "innova", label: "Innova" },
  { id: "tempo", label: "Tempo Traveller" }, // T4.4: Tempo chip -> empty state
];

export default function BookVehiclePage() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("veh_sedan_1");

  const filteredVehicles = FLEET_CANDIDATES.filter((v) => {
    if (selectedFilter === "all") return true;
    return v.class === selectedFilter;
  });

  const handleSelect = (v: Vehicle) => {
    if (!v.available) return;
    setSelectedVehicleId(v.id);
    bookingDraftStore.setState({
      vehicleId: v.id,
      vehicleClass: v.class as VehicleClass,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted mb-2">
            <span>1. Select Vehicle</span>
            <span>→</span>
            <span>2. Route Details</span>
            <span>→</span>
            <span>3. Review Fare</span>
            <span>→</span>
            <span>4. Pay</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink">Choose Your Ride</h1>
          <p className="text-sm text-body mt-1">
            Standard AC vehicles with certified, professional drivers.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Vehicle categories">
          {FILTER_CHIPS.map((chip) => {
            const isSelected = selectedFilter === chip.id;
            return (
              <button
                key={chip.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedFilter(chip.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-white text-ink border-muted/30 hover:border-accent/40"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Vehicle Grid or Empty State */}
        {filteredVehicles.length === 0 ? (
          <div
            className="bg-white rounded-2xl border border-muted/20 p-12 text-center my-6"
            role="region"
            aria-label="No vehicles found"
          >
            <span className="text-4xl">🚐</span>
            <h2 className="text-lg font-bold text-ink mt-3">No Vehicles in this Category</h2>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Tempo Travellers (9-16 seaters) require advance booking via our 24/7 support line.
            </p>
            <button
              onClick={() => setSelectedFilter("all")}
              className="mt-5 px-5 py-2 bg-surface text-ink text-xs font-bold rounded-lg border border-muted/30"
            >
              View Available Fleet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((v) => (
              <div key={v.id} className="relative">
                <VehicleCard
                  vehicle={v}
                  selected={selectedVehicleId === v.id}
                  disabled={!v.available}
                  onSelect={handleSelect}
                />
                {!v.available && (
                  <span className="text-xs text-danger font-semibold mt-1 block">
                    Currently Unavailable in this zone
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Continue Action */}
        <div className="mt-10 p-4 bg-white rounded-xl border border-muted/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-muted block">Selected Vehicle</span>
            <span className="text-sm font-bold text-ink">
              {FLEET_CANDIDATES.find((v) => v.id === selectedVehicleId)?.displayName ||
                "Select a vehicle"}
            </span>
          </div>

          <Link
            href="/book/route"
            className="px-6 py-3 bg-accent hover:bg-accentLight text-white font-bold rounded-xl text-sm shadow transition-colors"
          >
            Continue to Route Details →
          </Link>
        </div>
      </main>
    </div>
  );
}
