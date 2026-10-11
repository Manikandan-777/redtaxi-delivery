import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface TopNavProps {
  currentPath?: string;
  role?: "passenger" | "driver" | "admin" | null;
  onLogout?: () => void;
  className?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentPath = "/",
  role = null,
  onLogout,
  className,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicLinks = [
    { label: "Home", href: "/" },
    { label: "Outstation", href: "/outstation" },
    { label: "Local", href: "/local" },
    { label: "Tariff", href: "/tariff" },
    { label: "About", href: "/about" },
    { label: "Support", href: "/support" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-muted/30 shadow-sm",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        >
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white text-lg font-bold shadow-sm">
            🚖
          </div>
          <div>
            <span className="text-xl font-extrabold text-ink tracking-tight">RedTaxi</span>
            <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-surface text-ink">
              Pollachi
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {publicLinks.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors py-1 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded",
                  isActive ? "text-accent font-semibold" : "text-body"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {role ? (
            <div className="flex items-center gap-3">
              <Link href="/bookings">
                <Button variant="ghost" size="sm">
                  My Bookings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/driver/login">
                <Button variant="ghost" size="sm">
                  Driver Login
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Login / Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-md text-ink hover:bg-surface/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-muted/30 bg-white px-4 pt-2 pb-5 space-y-3">
          <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-md text-base font-medium",
                  currentPath === link.href
                    ? "bg-surface/50 text-accent font-semibold"
                    : "text-body hover:bg-surface/20"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-muted/20 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                Login
              </Button>
            </Link>
            <Link href="/driver/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Driver Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
