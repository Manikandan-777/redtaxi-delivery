import React from "react";
import { cn } from "@/lib/utils";
import { RatingStars } from "./RatingStars";
import { Button } from "./Button";

export interface DriverCardProps {
  name: string;
  rating: number;
  vehicleNo: string;
  vehicleClass: string;
  photoUrl?: string;
  onCall?: () => void;
  onMessage?: () => void;
  onSos?: () => void;
  className?: string;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  name,
  rating,
  vehicleNo,
  vehicleClass,
  photoUrl,
  onCall,
  onMessage,
  onSos,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl bg-white border border-muted/30 p-5 shadow-sm flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface/50 border border-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0 text-xl font-bold text-accent">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-ink">{name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <RatingStars value={Math.round(rating)} readonly size="sm" />
            <span className="text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted mt-1 uppercase font-medium">
            {vehicleNo} • {vehicleClass}
          </p>
        </div>
      </div>

      {(onCall || onMessage || onSos) && (
        <div className="flex gap-2 pt-2 border-t border-muted/20">
          {onCall && (
            <Button variant="secondary" size="sm" className="flex-1 gap-1.5" onClick={onCall}>
              <span>📞</span> Call
            </Button>
          )}
          {onMessage && (
            <Button variant="secondary" size="sm" className="flex-1 gap-1.5" onClick={onMessage}>
              <span>💬</span> Message
            </Button>
          )}
          {onSos && (
            <Button variant="danger" size="sm" className="gap-1.5" onClick={onSos}>
              <span>🚨</span> SOS
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
