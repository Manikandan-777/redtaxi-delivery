"use client";

import React from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on admin login page, render full width without sidebar
  if (pathname?.startsWith("/admin/login")) {
    return <main className="min-h-screen bg-surface/30">{children}</main>;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-surface/20 text-body">
      {/* WA1 / T7.1: Sidebar on desktop, collapsible drawer on small screens */}
      <AdminSidebar currentPath={pathname || "/admin"} />
      <main
        className="flex-1 p-4 lg:p-8 overflow-y-auto"
        role="main"
        aria-label="Admin Operations Content"
      >
        {children}
      </main>
    </div>
  );
}
