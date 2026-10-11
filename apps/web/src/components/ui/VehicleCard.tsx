import React from "react";
import { cn } from "@/lib/utils";
import { inr, type Vehicle } from "@redtaxi/shared";
import { Button } from "./Button";

export interface VehicleCardProps {
  vehicle: Vehicle;
  selected?: boolean;
  onSelect?: (vehicle: Vehicle) => void;
  disabled?: boolean;
  className?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  selected = false,
  onSelect,
  disabled = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl bg-white border p-5 transition-all shadow-sm",
        selected
          ? "border-accent ring-2 ring-accent/30 shadow-md"
          : "border-muted/30 hover:border-accent/40 hover:shadow-md",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {vehicle.popular && (
        <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-bold bg-accent text-white shadow-sm select-none">
          Popular
        </span>
      )}

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {vehicle.class}
          </span>
          <span className="text-sm font-bold text-ink">{inr(vehicle.ratePerKm)} / km</span>
        </div>

        <div className="my-4 flex items-center justify-center h-28 bg-surface/20 rounded-lg overflow-hidden">
          {vehicle.imageUrl ? (
            <img
              src={vehicle.imageUrl}
              alt={vehicle.displayName}
              className="max-h-24 object-contain"
            />
          ) : (
            <div className="text-4xl text-muted" aria-hidden="true">
              🚗
            </div>
          )}
        </div>

        <h3 className="text-base font-bold text-ink">{vehicle.displayName}</h3>
        <p className="mt-1 text-xs text-muted flex items-center gap-3">
          <span>👥 {vehicle.passengers} Passengers</span>
          <span>🧳 {vehicle.bags} Bags</span>
        </p>
        <p className="mt-1 text-xs text-muted">Min {vehicle.minKm} km</p>
      </div>

      <div className="mt-5">
        <Button
          type="button"
          variant={selected ? "primary" : "outline"}
          className="w-full"
          disabled={disabled}
          onClick={() => onSelect?.(vehicle)}
        >
          {selected ? "Selected" : "Select"}
        </Button>
      </div>
    </div>
  );
};
