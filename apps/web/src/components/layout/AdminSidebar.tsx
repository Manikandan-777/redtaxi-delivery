import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Driver Approvals", href: "/admin/drivers", icon: "📋" },
  { label: "Live Dispatch", href: "/admin/dispatch", icon: "🗺️" },
  { label: "All Bookings", href: "/admin/bookings", icon: "🚕" },
  { label: "Pricing Rules", href: "/admin/pricing", icon: "🏷️" },
  { label: "Support Tickets", href: "/admin/tickets", icon: "🎫" },
  { label: "Analytics", href: "/admin/analytics", icon: "📈" },
  { label: "Audit Logs", href: "/admin/audit", icon: "🛡️" },
];

export interface AdminSidebarProps {
  currentPath?: string;
  className?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath = "/admin",
  className,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile Drawer Toggle Button (< 1024px) */}
      <div className="lg:hidden p-3 bg-white border-b border-muted/30 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Admin navigation drawer"
            className="p-2 rounded-lg border border-muted/40 hover:bg-surface/30 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            ☰
          </button>
          <span className="font-bold text-ink text-sm">Admin Control Center</span>
        </div>
        <span className="text-xs bg-surface px-2 py-0.5 rounded text-ink font-semibold">
          Operations
        </span>
      </div>

      {/* Drawer Overlay for Mobile */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-72 bg-white h-full p-4 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-muted/20 mb-3">
              <span className="font-bold text-ink">RedTaxi Admin</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
                className="p-1 text-muted hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto">
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                      isActive
                        ? "bg-accent text-white font-semibold"
                        : "text-body hover:bg-surface/30"
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col w-64 bg-white border-r border-muted/30 min-h-screen p-4 flex-shrink-0",
          className
        )}
        aria-label="Admin Navigation"
      >
        <div className="flex items-center gap-2.5 px-3 py-4 mb-4 border-b border-muted/20">
          <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center text-base">
            🛡️
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">RedTaxi Admin</h2>
            <p className="text-xs text-muted">Operations Center</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1" aria-label="Admin Menu">
          {ADMIN_NAV_ITEMS.map((item) => {
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
                      isActive ? "bg-white text-accent" : "bg-warning/20 text-ink"
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
    </>
  );
};
