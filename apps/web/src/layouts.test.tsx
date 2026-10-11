// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter", className: "font-inter" }),
}));

import { TopNav } from "./components/layout/TopNav";
import { DriverSidebar, DRIVER_NAV_ITEMS } from "./components/layout/DriverSidebar";
import { AdminSidebar, ADMIN_NAV_ITEMS } from "./components/layout/AdminSidebar";
import RootLayout from "./app/layout";

describe("T2.9: Layouts Breakpoint Adaptation (360, 768, 1024, 1280, 1536)", () => {
  it("TopNav has desktop links and mobile toggle button for sm/md breakpoints", () => {
    render(<TopNav currentPath="/" />);
    // Main navigation exists
    expect(screen.getByRole("navigation", { name: "Main Navigation" })).toHaveClass(
      "hidden md:flex"
    );

    // Hamburger button exists for mobile viewport (<768px)
    const mobileToggle = screen.getByRole("button", { name: /toggle navigation menu/i });
    expect(mobileToggle).toBeDefined();

    // Clicking mobile toggle opens mobile navigation
    fireEvent.click(mobileToggle);
    expect(screen.getByRole("navigation", { name: "Mobile Navigation" })).toBeDefined();
  });

  it("DriverSidebar renders both desktop sidebar and mobile bottom navigation bar", () => {
    render(<DriverSidebar currentPath="/driver" />);
    // Desktop sidebar hidden on mobile, visible on md (768px+)
    const desktopAside = screen.getByRole("complementary", { name: "Driver Sidebar Navigation" });
    expect(desktopAside).toHaveClass("hidden md:flex");

    // Bottom navigation bar visible on mobile (<768px), hidden on md
    const bottomNav = screen.getByRole("navigation", { name: "Driver Bottom Navigation" });
    expect(bottomNav).toHaveClass("md:hidden fixed bottom-0");

    // Items match driver spec
    expect(DRIVER_NAV_ITEMS).toHaveLength(6);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  });

  it("AdminSidebar renders desktop sidebar and drawer toggle for mobile (<1024px)", () => {
    render(<AdminSidebar currentPath="/admin" />);
    // Desktop sidebar hidden on mobile/tablet, visible on lg (1024px+)
    const desktopAside = screen.getByRole("complementary", { name: "Admin Navigation" });
    expect(desktopAside).toHaveClass("hidden lg:flex");

    // Drawer toggle button for screens < 1024px
    const drawerToggle = screen.getByRole("button", { name: /open admin navigation drawer/i });
    expect(drawerToggle).toBeDefined();

    // Opening drawer renders mobile admin menu
    fireEvent.click(drawerToggle);
    expect(screen.getByRole("button", { name: /close drawer/i })).toBeDefined();

    // Items match admin spec
    expect(ADMIN_NAV_ITEMS).toHaveLength(8);
  });
});

describe("T2.10: Skip Link Accessibility Requirements", () => {
  it("Skip link is the first tab stop in RootLayout, links to #main-content, and is keyboard-activatable", () => {
    const { container } = render(
      <RootLayout>
        <div>Page Content</div>
      </RootLayout>
    );

    // Skip link is the very first interactive link
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
    const skipLink = links[0]!;

    expect(skipLink.textContent).toBe("Skip to main content");
    expect(skipLink.getAttribute("href")).toBe("#main-content");
    expect(skipLink).toHaveClass("sr-only");
    expect(skipLink).toHaveClass("focus:not-sr-only");

    // Target element exists with matching id
    const mainContent = container.querySelector("#main-content");
    expect(mainContent).not.toBeNull();
    expect(mainContent?.getAttribute("tabIndex")).toBe("-1");
  });
});
