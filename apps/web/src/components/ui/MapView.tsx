import React from "react";
import { cn } from "@/lib/utils";
import type { Place } from "@redtaxi/shared";

export interface MapViewProps {
  pickup?: Place;
  drop?: Place;
  driverLocation?: { lat: number; lng: number };
  apiKey?: string;
  className?: string;
  fallbackText?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  pickup,
  drop,
  driverLocation,
  apiKey: _apiKey,
  className,
  fallbackText,
}) => {
  // If no Google Maps API key or offline, render clean interactive SVG/canvas route representation
  return (
    <div
      role="region"
      aria-label="Route map view"
      className={cn(
        "relative w-full h-64 sm:h-80 md:h-96 rounded-xl bg-surface/20 border border-muted/30 overflow-hidden flex flex-col items-center justify-center p-4",
        className
      )}
    >
      {/* Route vector representation */}
      <svg
        className="w-full h-full max-w-lg max-h-72 opacity-90"
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background road network lines */}
        <path d="M20 180 Q140 160 220 200 T380 180" stroke="#D3D3FF" strokeWidth="4" />
        <path d="M50 40 Q180 80 260 40 T370 70" stroke="#D3D3FF" strokeWidth="3" />
        <path d="M80 220 Q120 120 160 40" stroke="#D3D3FF" strokeWidth="3" />

        {/* Active route polyline */}
        <path
          d="M60 160 C120 120, 200 190, 320 80"
          stroke="#6969EF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="8 0"
        />

        {/* Pickup Pin */}
        <g transform="translate(60, 160)">
          <circle r="12" fill="#6969EF" />
          <circle r="5" fill="#FFFFFF" />
          <text x="18" y="5" fill="#000344" fontSize="12" fontWeight="bold">
            {pickup?.label || "Pickup"}
          </text>
        </g>

        {/* Drop Pin */}
        <g transform="translate(320, 80)">
          <circle r="12" fill="#E5484D" />
          <circle r="5" fill="#FFFFFF" />
          <text x="-15" y="-18" fill="#000344" fontSize="12" fontWeight="bold" textAnchor="end">
            {drop?.label || "Drop"}
          </text>
        </g>

        {/* Driver car position */}
        {driverLocation && (
          <g transform="translate(180, 150)">
            <circle r="14" fill="#50FF97" />
            <text x="0" y="5" fontSize="12" textAnchor="middle">
              🚖
            </text>
          </g>
        )}
      </svg>

      {/* Floating route badge */}
      {(pickup || drop) && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-white/95 backdrop-blur-sm border border-muted/30 rounded-lg p-3 shadow-md text-xs flex flex-col gap-1 max-w-sm">
          {pickup && (
            <div className="flex items-center gap-2 text-ink font-medium">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="truncate">{pickup.label}</span>
            </div>
          )}
          {drop && (
            <div className="flex items-center gap-2 text-ink font-medium">
              <span className="w-2 h-2 rounded-full bg-danger" />
              <span className="truncate">{drop.label}</span>
            </div>
          )}
        </div>
      )}

      {fallbackText && (
        <div className="absolute top-3 left-3 bg-white/80 text-muted px-2 py-1 rounded text-xs">
          {fallbackText}
        </div>
      )}
    </div>
  );
};
