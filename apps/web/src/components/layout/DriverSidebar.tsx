import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface DriverNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export const DRIVER_NAV_ITEMS: DriverNavItem[] = [
  { label: "Dashboard", href: "/driver", icon: "📊" },
  { label: "Trip Offers", href: "/driver/offers", icon: "🔔" },
  { label: "My Trips", href: "/driver/trips", icon: "🚗" },
  { label: "Earnings", href: "/driver/earnings", icon: "💰" },
  { label: "Documents", href: "/driver/documents", icon: "📄" },
  { label: "Profile", href: "/driver/profile", icon: "👤" },
];

export interface DriverSidebarProps {
  currentPath?: string;
  className?: string;
}

export const DriverSidebar: React.FC<DriverSidebarProps> = ({
  currentPath = "/driver",
  className,
}) => {
  return (
    <>
      {/* Desktop & Tablet Sidebar (>= 768px) */}
      <aside
        className={cn(
          "hidden md:flex flex-col w-64 bg-white border-r border-muted/30 min-h-screen p-4 flex-shrink-0",
          className
        )}
        aria-label="Driver Sidebar Navigation"
      >
        <div className="flex items-center gap-2.5 px-3 py-4 mb-4 border-b border-muted/20">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-base">
            🚖
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">RedTaxi Driver</h2>
            <p className="text-xs text-muted">Pollachi Fleet</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1" aria-label="Driver Menu">
          {DRIVER_NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-body hover:bg-surface/30 hover:text-ink"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      isActive ? "bg-white text-accent" : "bg-accent/15 text-accent"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-muted/30 shadow-lg px-2 py-1.5 flex justify-around items-center"
        aria-label="Driver Bottom Navigation"
      >
        {DRIVER_NAV_ITEMS.slice(0, 4).map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] min-w-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isActive ? "text-accent font-bold" : "text-muted hover:text-ink"
              )}
            >
              <span className="text-lg leading-tight" aria-hidden="true">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
