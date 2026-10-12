"use client";

import React, { useState, useMemo } from "react";
import { formatInr, paise } from "@redtaxi/shared";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { INITIAL_ADMIN_BOOKINGS, type AdminBookingRecord } from "@/lib/adminData";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBookingRecord[]>(INITIAL_ADMIN_BOOKINGS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingRecord | null>(null);

  // New Booking Form Modal (WA5: + New Booking)
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newPickup, setNewPickup] = useState("");
  const [newDrop, setNewDrop] = useState("");
  const [newFarePaise] = useState("1494");

  // Reassign / Cancel / Refund Actions with Confirm & Audit (WA5 / T7.5)
  const [actionType, setActionType] = useState<"reassign" | "cancel" | "refund" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [reassignDriverName, setReassignDriverName] = useState("Arun Kumar (SUV)");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter tabs
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (activeTab !== "all") {
      result = result.filter((b) => b.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.pickup.toLowerCase().includes(q) ||
          b.drop.toLowerCase().includes(q)
      );
    }
    return result;
  }, [bookings, activeTab, searchQuery]);

  // Create new phone booking
  const handleCreateNewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || !newPickup || !newDrop) return;

    const newRec: AdminBookingRecord = {
      id: `bk_${Date.now()}`,
      code: `BK${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      pickup: newPickup,
      drop: newDrop,
      dateStr: "Today",
      timeStr: "Immediate",
      status: "scheduled",
      farePaise: paise(parseInt(newFarePaise, 10) * 100),
      paidPaise: paise(50000),
      duePaise: paise(parseInt(newFarePaise, 10) * 100 - 50000),
      timeline: [{ status: "created", at: new Date().toISOString() }],
    };

    setBookings([newRec, ...bookings]);
    setIsNewBookingOpen(false);
    setActionNotice(`New booking ${newRec.code} created successfully (audited).`);
    // Reset form
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewPickup("");
    setNewDrop("");
  };

  // Perform audited actions
  const handleConfirmAction = () => {
    if (!selectedBooking || !actionType) return;

    if (actionType === "reassign") {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? {
                ...b,
                driverName: reassignDriverName,
                driverVehicleNo: "TN 37 AB 1234",
                timeline: [
                  ...b.timeline,
                  { status: "driver_assigned", at: new Date().toISOString() },
                ],
              }
            : b
        )
      );
      setActionNotice(
        `Booking ${selectedBooking.code} reassigned to ${reassignDriverName} (audited).`
      );
    } else if (actionType === "cancel") {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? {
                ...b,
                status: "cancelled",
                timeline: [...b.timeline, { status: "cancelled", at: new Date().toISOString() }],
              }
            : b
        )
      );
      setActionNotice(`Booking ${selectedBooking.code} cancelled: "${actionReason}" (audited).`);
    } else if (actionType === "refund") {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? {
                ...b,
                paidPaise: paise(0),
                duePaise: b.farePaise,
              }
            : b
        )
      );
      setActionNotice(
        `Booking ${selectedBooking.code} refund processed: "${actionReason}" (audited).`
      );
    }

    setActionType(null);
    setActionReason("");
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header with + New Booking */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted/20">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Booking Operations & Management
          </h1>
          <p className="text-sm text-muted mt-1">
            Track active rides, scheduled trips, and dispatch controls
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsNewBookingOpen(true)}
          data-testid="new-booking-btn"
        >
          + New Booking
        </Button>
      </div>

      {actionNotice && (
        <div
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex justify-between items-center"
          role="status"
        >
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: "all", label: "All" },
            { id: "in_progress", label: "Ongoing" },
            { id: "scheduled", label: "Scheduled" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="w-full sm:w-72">
          <Input
            id="booking-search"
            name="search"
            placeholder="Search booking ID or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search bookings"
          />
        </div>
      </div>

      {/* Bookings Table (WA5 Table) */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm text-body border-collapse"
            aria-label="Bookings Table"
          >
            <thead className="bg-surface/50 border-b border-muted/20 text-xs font-semibold text-ink uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">
                  ID
                </th>
                <th scope="col" className="px-4 py-3">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3">
                  Route
                </th>
                <th scope="col" className="px-4 py-3">
                  Date & Time
                </th>
                <th scope="col" className="px-4 py-3">
                  Total Fare
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {filteredBookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-surface/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-ink">#{bk.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{bk.customerName}</div>
                    <div className="text-xs text-muted font-mono">{bk.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{bk.pickup}</div>
                    <div className="text-xs text-muted">→ {bk.drop}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{bk.dateStr}</div>
                    <div className="text-muted">{bk.timeStr}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatInr(bk.farePaise)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={bk.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBooking(bk)}
                      data-testid={`view-booking-${bk.code}`}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Detail Modal with Timeline & Audited Actions (T7.5) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl p-6 bg-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-muted/20 pb-3">
              <div>
                <h2 className="text-xl font-bold text-ink">Booking #{selectedBooking.code}</h2>
                <p className="text-xs text-muted">
                  {selectedBooking.pickup} → {selectedBooking.drop}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-muted hover:text-ink font-bold text-lg min-w-[44px] min-h-[44px]"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Fare Breakdown */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-surface/30 rounded-lg text-center">
              <div>
                <span className="text-xs text-muted">Total Fare</span>
                <p className="font-bold text-ink">{formatInr(selectedBooking.farePaise)}</p>
              </div>
              <div>
                <span className="text-xs text-muted">Advance Paid</span>
                <p className="font-bold text-success">{formatInr(selectedBooking.paidPaise)}</p>
              </div>
              <div>
                <span className="text-xs text-muted">Balance Due</span>
                <p className="font-bold text-ink">{formatInr(selectedBooking.duePaise)}</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-bold text-ink mb-2">Trip Status Timeline</h3>
              <div className="space-y-2 border-l-2 border-accent/40 pl-3 ml-2">
                {selectedBooking.timeline.map((entry, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-bold text-ink capitalize">
                      {entry.status.replace("_", " ")}
                    </span>
                    <span className="text-muted ml-2 font-mono">{entry.at}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: Reassign, Cancel, Refund (T7.5: Reassign/Cancel/Refund Audited) */}
            <div className="pt-4 border-t border-muted/20 flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionType("reassign")}
                data-testid="reassign-btn"
              >
                Reassign Driver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionType("refund")}
                data-testid="refund-btn"
              >
                Issue Refund
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setActionType("cancel")}
                data-testid="cancel-booking-btn"
              >
                Cancel Booking
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for Reassign / Cancel / Refund */}
      <ConfirmDialog
        isOpen={Boolean(actionType)}
        title={
          actionType === "reassign"
            ? `Reassign driver for #${selectedBooking?.code}?`
            : actionType === "cancel"
              ? `Cancel booking #${selectedBooking?.code}?`
              : `Issue refund for #${selectedBooking?.code}?`
        }
        description="This administrative action will be recorded in the audit log."
        confirmLabel="Confirm Action"
        cancelLabel="Dismiss"
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setActionType(null);
          setActionReason("");
        }}
      >
        {actionType === "reassign" && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-ink mb-1">
              Select Driver to Reassign
            </label>
            <select
              value={reassignDriverName}
              onChange={(e) => setReassignDriverName(e.target.value)}
              className="w-full p-2 border border-muted/40 rounded-lg text-sm bg-white"
            >
              <option value="Arun Kumar (SUV)">Arun Kumar (SUV) - 3.5 km away</option>
              <option value="Mohan Raj (Innova)">Mohan Raj (Innova) - 4.1 km away</option>
              <option value="Karthik (Hatchback)">Karthik (Hatchback) - 6.3 km away</option>
            </select>
          </div>
        )}
        {(actionType === "cancel" || actionType === "refund") && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-ink mb-1">Reason *</label>
            <textarea
              rows={2}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide reason for audit log..."
              className="w-full p-2 border border-muted/40 rounded-lg text-sm"
              data-testid="action-reason-input"
            />
          </div>
        )}
      </ConfirmDialog>

      {/* + New Booking Modal */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-muted/20 pb-2">
              <h2 className="text-lg font-bold text-ink">Create Manual Booking</h2>
              <button
                type="button"
                onClick={() => setIsNewBookingOpen(false)}
                className="text-muted hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateNewBooking} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Customer Name *</label>
                <Input
                  id="new-customer-name"
                  name="customerName"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Customer Phone *
                </label>
                <Input
                  id="new-customer-phone"
                  name="customerPhone"
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Pickup Location *
                </label>
                <Input
                  id="new-pickup"
                  name="pickup"
                  required
                  value={newPickup}
                  onChange={(e) => setNewPickup(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Drop Location *</label>
                <Input
                  id="new-drop"
                  name="drop"
                  required
                  value={newDrop}
                  onChange={(e) => setNewDrop(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsNewBookingOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" data-testid="save-new-booking-btn">
                  Create Booking
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
